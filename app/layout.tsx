import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
import type { ReactNode } from "react";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-geist",
  display: "swap",
});

const siteUrl = "https://antoniosifov.com";
const title = "Anton Iosifov | Full-Stack Software Engineer";
const description =
  "Full-Stack Software Engineer building production-ready web, mobile, cloud, and AI-enabled systems from architecture through deployment.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  authors: [{ name: "Anton Iosifov", url: siteUrl }],
  creator: "Anton Iosifov",
  alternates: { canonical: "/" },
  icons: { icon: "/favicon.svg" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Anton Iosifov — Software Engineering Portfolio",
    title,
    description,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Anton Iosifov — Full-Stack Software Engineer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0c0d0f",
  colorScheme: "dark",
};

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Anton Iosifov",
  url: siteUrl,
  image: `${siteUrl}/img/anton-iosifov.webp`,
  jobTitle: "Full-Stack Software Engineer",
  alumniOf: {
    "@type": "CollegeOrUniversity",
    name: "Holon Institute of Technology",
  },
  knowsLanguage: ["Russian", "Hebrew", "English"],
  sameAs: ["https://www.linkedin.com/in/anton-iosifov/", "https://github.com/antoniosifov"],
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const plausibleScript = process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL || "https://plausible.io/js/script.js";

  return (
    <html lang="en" className={geist.variable}>
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />
        {plausibleDomain ? (
          <Script defer data-domain={plausibleDomain} src={plausibleScript} strategy="afterInteractive" />
        ) : null}
      </body>
    </html>
  );
}
