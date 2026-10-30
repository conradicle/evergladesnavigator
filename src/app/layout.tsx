import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { business, launchPointsLabel } from "@/lib/business";
import { localBusinessJsonLd } from "@/lib/structured-data";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const DEFAULT_TITLE = `Everglades Fishing Charters & Ecotours | ${launchPointsLabel}, ${business.stateCode}`;

export const metadata: Metadata = {
  metadataBase: new URL(business.url),
  title: DEFAULT_TITLE,
  description: business.description,
  alternates: { canonical: "./" },
  // og/twitter title and description fall back to each page's own.
  openGraph: {
    type: "website",
    siteName: business.name,
    url: "./",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(localBusinessJsonLd()).replace(/</g, "\\u003c"),
          }}
        />
        <a
          href="#main"
          className="sr-only rounded-full bg-swamp-800 px-4 py-2 text-sm font-semibold text-sand-100 focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60]"
        >
          Skip to content
        </a>
        <Header />
        <main id="main" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
