import { business } from "./business";

/**
 * LocalBusiness JSON-LD for a service-area business: no street address,
 * just the waters and towns it serves. Phone and email are only included
 * once they're filled in, in business.ts.
 */
export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${business.url}/#business`,
    name: business.name,
    url: business.url,
    description: `${business.description} Trips by appointment.`,
    logo: `${business.url}/logo-full.png`,
    image: `${business.url}/opengraph-image.png`,
    founder: {
      "@type": "Person",
      name: business.captain.name,
      jobTitle: business.captain.credential,
    },
    areaServed: [
      ...business.serviceArea.map((name) => ({ "@type": "Place", name })),
      ...business.launchPoints.map((name) => ({
        "@type": "City",
        name: `${name}, ${business.state}`,
      })),
    ],
    // schema.org has no "by appointment" value for opening hours, so this
    // stays in the description and the hours field is left out.
    ...(business.phone && { telephone: business.phone }),
    ...(business.email && { email: business.email }),
  };
}
