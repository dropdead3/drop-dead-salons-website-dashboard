import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "local_business";
}

// Salon business info - update with real details
const BUSINESS_INFO = {
  name: "Drop Dead Salon",
  description: "Luxury hair salon specializing in color, extensions, cutting & styling. Expert artistry meets science for transformative hair experiences.",
  address: {
    street: "123 Main Street",
    city: "Los Angeles",
    state: "CA",
    zip: "90001",
    country: "US",
  },
  phone: "(555) 123-4567",
  email: "hello@dropdeadsalon.com",
  url: "https://dropdeadsalon.com",
  image: "/og-image.jpg",
  priceRange: "$$$",
  openingHours: [
    "Mo-Fr 09:00-19:00",
    "Sa 09:00-17:00",
  ],
};

export function SEO({
  title,
  description = BUSINESS_INFO.description,
  image = BUSINESS_INFO.image,
  url = BUSINESS_INFO.url,
  type = "website",
}: SEOProps) {
  const fullTitle = title 
    ? `${title} | ${BUSINESS_INFO.name}` 
    : `${BUSINESS_INFO.name} | Luxury Hair Salon`;

  // Local Business JSON-LD structured data
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    name: BUSINESS_INFO.name,
    description: BUSINESS_INFO.description,
    image: image,
    url: url,
    telephone: BUSINESS_INFO.phone,
    email: BUSINESS_INFO.email,
    priceRange: BUSINESS_INFO.priceRange,
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS_INFO.address.street,
      addressLocality: BUSINESS_INFO.address.city,
      addressRegion: BUSINESS_INFO.address.state,
      postalCode: BUSINESS_INFO.address.zip,
      addressCountry: BUSINESS_INFO.address.country,
    },
    openingHoursSpecification: BUSINESS_INFO.openingHours.map((hours) => {
      const [days, time] = hours.split(" ");
      const [open, close] = time.split("-");
      return {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: days,
        opens: open,
        closes: close,
      };
    }),
    sameAs: [
      "https://instagram.com/dropdeadsalon",
      // Add other social media URLs
    ],
  };

  // Services offered schema
  const servicesSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Hair Services",
    itemListElement: [
      {
        "@type": "Service",
        name: "Color & Blonding",
        description: "Expert color work from subtle dimension to bold transformation.",
        provider: { "@type": "HairSalon", name: BUSINESS_INFO.name },
      },
      {
        "@type": "Service",
        name: "Hair Extensions",
        description: "Seamless, high-quality extensions installed with precision.",
        provider: { "@type": "HairSalon", name: BUSINESS_INFO.name },
      },
      {
        "@type": "Service",
        name: "Cutting & Styling",
        description: "Modern cuts and styling that complement your unique features.",
        provider: { "@type": "HairSalon", name: BUSINESS_INFO.name },
      },
      {
        "@type": "Service",
        name: "Hair Treatments",
        description: "Restorative treatments for healthy, vibrant hair.",
        provider: { "@type": "HairSalon", name: BUSINESS_INFO.name },
      },
    ],
  };

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content="hair salon, hair color, balayage, extensions, cutting, styling, luxury salon, Los Angeles salon, hair treatments, bridal hair" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type === "local_business" ? "business.business" : type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={BUSINESS_INFO.name} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Additional SEO */}
      <meta name="robots" content="index, follow" />
      <meta name="author" content={BUSINESS_INFO.name} />
      <meta name="geo.region" content={`${BUSINESS_INFO.address.country}-${BUSINESS_INFO.address.state}`} />
      <meta name="geo.placename" content={BUSINESS_INFO.address.city} />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(localBusinessSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(servicesSchema)}
      </script>
    </Helmet>
  );
}

export { BUSINESS_INFO };
