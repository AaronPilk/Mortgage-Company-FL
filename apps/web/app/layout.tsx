import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PreLaunchNotice, SiteFooter, SiteHeader } from "@/components/site-chrome";
import { AttributionCapture } from "@/components/attribution-capture";
import { JsonLd } from "@/components/json-ld";
import { businessIdentity, SITE_URL } from "@/lib/site";
import { graph, organizationNode, webSiteNode } from "@tract/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "TRACT Mortgage — A Florida mortgage brokerage",
    template: "%s | TRACT Mortgage"
  },
  description:
    "A Florida mortgage brokerage. Compare financing paths with clear calculators, plain-language guides, and direct help from a licensed professional.",
  applicationName: "TRACT Mortgage",
  formatDetection: { telephone: false, address: false, email: false },
  manifest: "/manifest.webmanifest"
};

export const viewport: Viewport = {
  themeColor: "#45217a",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-US">
      <body className="flex min-h-dvh flex-col">
        <a className="skip-link" href="#main">
          Skip to main content
        </a>
        <PreLaunchNotice />
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <AttributionCapture />
        <JsonLd
          value={graph(
            [organizationNode(businessIdentity), webSiteNode(businessIdentity)],
            businessIdentity
          )}
        />
      </body>
    </html>
  );
}
