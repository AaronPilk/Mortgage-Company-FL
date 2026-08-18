/**
 * Upload policy.
 *
 * There is deliberately no unauthenticated upload endpoint. An open PUT target
 * is free storage for whoever finds it, and "we'll add auth later" has never
 * once happened. The shape here is: an authenticated owner asks a server route
 * for permission, this module decides, and only then does the route mint a
 * short-lived signed URL with the credential the browser never sees.
 *
 * The browser uploads straight to object storage. It does not stream bytes
 * through a Worker — a request handler is not a file transfer, and a
 * gigabyte-scale walkthrough would exceed the CPU budget long before it landed.
 *
 * Every limit below is duplicated as a CHECK constraint on
 * `rendprop_media_assets`. That is on purpose: this copy produces a good error
 * message, the database copy is the one that is actually enforced.
 */

export const RENDPROP_ALLOWED_CONTENT_TYPES = [
  "video/mp4",
  "video/quicktime",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif"
] as const;

export type RendPropContentType = (typeof RENDPROP_ALLOWED_CONTENT_TYPES)[number];

export const RENDPROP_UPLOAD_POLICY = {
  /** One walkthrough clip. Above this, ask for a shorter pass per floor. */
  maxVideoBytes: 1_073_741_824,
  maxImageBytes: 33_554_432,
  maxAssetsPerProject: 120,
  maxTotalProjectBytes: 4_294_967_296,
  /** Long enough for a large upload on a phone, short enough to be worthless if leaked. */
  signedUrlTtlSeconds: 900,
  allowedContentTypes: RENDPROP_ALLOWED_CONTENT_TYPES
} as const;

export type UploadRejectionReason =
  | "unsupported_media_type"
  | "asset_too_large"
  | "project_asset_limit"
  | "project_size_limit"
  | "rights_not_confirmed"
  | "not_project_owner";

export type SignedUploadPlan =
  | {
      readonly ok: true;
      readonly storageKey: string;
      readonly contentType: RendPropContentType;
      readonly maxBytes: number;
      readonly method: "PUT";
      readonly expiresInSeconds: number;
    }
  | { readonly ok: false; readonly reason: UploadRejectionReason };

export function isAllowedContentType(value: string): value is RendPropContentType {
  return (RENDPROP_ALLOWED_CONTENT_TYPES as readonly string[]).includes(value);
}

function maxBytesFor(contentType: RendPropContentType): number {
  return contentType.startsWith("video/")
    ? RENDPROP_UPLOAD_POLICY.maxVideoBytes
    : RENDPROP_UPLOAD_POLICY.maxImageBytes;
}

const EXTENSIONS: Readonly<Record<RendPropContentType, string>> = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif"
};

/**
 * Where an original lands. Derived entirely from ids the server generated, never
 * from a client-supplied filename — a caller cannot choose a path, so it cannot
 * traverse out of its own project or collide with someone else's asset.
 */
export function originalStorageKey(
  projectId: string,
  assetId: string,
  contentType: RendPropContentType
): string {
  return `rendprop/${projectId}/originals/${assetId}.${EXTENSIONS[contentType]}`;
}

/** Derivatives live beside the original they came from, never on top of it. */
export function derivedStorageKey(
  projectId: string,
  generatedAssetId: string,
  extension: "jpg" | "png" | "webp" | "pdf" | "json"
): string {
  return `rendprop/${projectId}/generated/${generatedAssetId}.${extension}`;
}

export function planSignedUpload(input: {
  readonly projectId: string;
  readonly assetId: string;
  readonly requestingUserId: string;
  readonly projectOwnerUserId: string;
  readonly rightsConfirmed: boolean;
  readonly contentType: string;
  readonly byteSize: number;
  readonly existingAssetCount: number;
  readonly existingTotalBytes: number;
}): SignedUploadPlan {
  if (input.requestingUserId !== input.projectOwnerUserId) {
    return { ok: false, reason: "not_project_owner" };
  }
  // Rights are asserted before any bytes are accepted, not before they are
  // processed. Storing media somebody had no right to capture is already the
  // problem; the processing step is downstream of it.
  if (!input.rightsConfirmed) {
    return { ok: false, reason: "rights_not_confirmed" };
  }
  if (!isAllowedContentType(input.contentType)) {
    return { ok: false, reason: "unsupported_media_type" };
  }
  const maxBytes = maxBytesFor(input.contentType);
  if (input.byteSize <= 0 || input.byteSize > maxBytes) {
    return { ok: false, reason: "asset_too_large" };
  }
  if (input.existingAssetCount >= RENDPROP_UPLOAD_POLICY.maxAssetsPerProject) {
    return { ok: false, reason: "project_asset_limit" };
  }
  if (input.existingTotalBytes + input.byteSize > RENDPROP_UPLOAD_POLICY.maxTotalProjectBytes) {
    return { ok: false, reason: "project_size_limit" };
  }

  return {
    ok: true,
    storageKey: originalStorageKey(input.projectId, input.assetId, input.contentType),
    contentType: input.contentType,
    maxBytes,
    method: "PUT",
    expiresInSeconds: RENDPROP_UPLOAD_POLICY.signedUrlTtlSeconds
  };
}

export const UPLOAD_REJECTION_COPY: Readonly<Record<UploadRejectionReason, string>> = {
  unsupported_media_type: "That file type is not accepted. Use MP4, MOV, JPEG, PNG, WebP, or HEIC.",
  asset_too_large: "That file is larger than the per-file limit for its type.",
  project_asset_limit: "This project already holds the maximum number of clips and photos.",
  project_size_limit: "This project has reached its total storage limit.",
  rights_not_confirmed: "Confirm you have the right to capture and publish this property first.",
  not_project_owner: "This project belongs to someone else."
};
