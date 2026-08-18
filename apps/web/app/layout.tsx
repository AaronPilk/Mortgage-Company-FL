import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

/**
 * Self-hosted by next/font: no request to a third party, no entry in the CSP,
 * and no layout shift while the face loads.
 */
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter"
});
import { PreLaunchNotice, SiteFooter, SiteHeader } from "@/components/site-chrome";
import { MobileCta } from "@/components/mobile-cta";
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
    <html lang="en-US" suppressHydrationWarning className={inter.variable}>
      <head>
        {/*
          Applies the stored theme before first paint. Without this the page
          renders light and then snaps to dark, which is worse than not
          offering the choice at all. Kept tiny and dependency-free on purpose.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('tract.theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches&&false)){document.documentElement.classList.add('dark')}}catch(e){}"
          }}
        />
      </head>
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
        {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY !== undefined && (
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            strategy="afterInteractive"
          />
        )}
        <MobileCta />
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
