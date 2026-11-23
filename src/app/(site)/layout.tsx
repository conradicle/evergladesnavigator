import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { localBusinessJsonLd } from "@/lib/structured-data";

/**
 * Chrome for the public marketing site (header, footer, business schema).
 * Lives in a route group so private tools like /snook can render without
 * the public nav. URLs are unchanged: "(site)" never appears in a path.
 */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
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
    </>
  );
}
