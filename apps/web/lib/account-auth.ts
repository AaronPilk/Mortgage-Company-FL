/** Only private account destinations may be carried through an Auth callback. */
export function safeAccountNextPath(value: string | null): string {
  if (value === "/account" || value?.startsWith("/account/") === true) return value;
  return "/account";
}
