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
  description: "Premier hair salon in Mesa & Gilbert, Arizona serving the entire Phoenix Valley. Specializing in color, extensions, cutting & styling with expert artistry.",
  email: "hello@dropdeadsalon.com",
  url: "https://dropdeadsalon.com",
  image: "/og-image.jpg",
  priceRange: "$$$",
  openingHours: [
    "Mo-Fr 09:00-19:00",
    "Sa 09:00-17:00",
  ],
  areaServed: ["Mesa", "Gilbert", "Chandler", "Tempe", "Scottsdale", "Phoenix", "Queen Creek", "Apache Junction"],
  locations: [
    {
      name: "Drop Dead Salon - Mesa",
      street: "1234 E Main Street",
      city: "Mesa",
      state: "AZ",
      zip: "85201",
      country: "US",
      phone: "(480) 555-1234",
      geo: { latitude: 33.4152, longitude: -111.8315 },
    },
    {
      name: "Drop Dead Salon - Gilbert",
      street: "5678 S Gilbert Road",
      city: "Gilbert",
      state: "AZ",
      zip: "85296",
      country: "US",
      phone: "(480) 555-5678",
      geo: { latitude: 33.3528, longitude: -111.7890 },
    },
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

  // Generate opening hours specification
  const openingHoursSpec = BUSINESS_INFO.openingHours.map((hours) => {
    const [days, time] = hours.split(" ");
    const [open, close] = time.split("-");
    return {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: days,
      opens: open,
      closes: close,
    };
  });

  // Multi-location schema - each location as separate HairSalon
  const locationsSchema = BUSINESS_INFO.locations.map((location) => ({
    "@context": "https://schema.org",
    "@type": "HairSalon",
    name: location.name,
    description: BUSINESS_INFO.description,
    image: image,
    url: url,
    telephone: location.phone,
    email: BUSINESS_INFO.email,
    priceRange: BUSINESS_INFO.priceRange,
    address: {
      "@type": "PostalAddress",
      streetAddress: location.street,
      addressLocality: location.city,
      addressRegion: location.state,
      postalCode: location.zip,
      addressCountry: location.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: location.geo.latitude,
      longitude: location.geo.longitude,
    },
    openingHoursSpecification: openingHoursSpec,
    areaServed: BUSINESS_INFO.areaServed.map((area) => ({
      "@type": "City",
      name: area,
      "@id": `https://en.wikipedia.org/wiki/${area},_Arizona`,
    })),
    sameAs: [
      "https://instagram.com/dropdeadsalon",
      "https://facebook.com/dropdeadsalon",
      "https://tiktok.com/@dropdeadsalon",
    ],
  }));

  // Organization schema linking all locations
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BUSINESS_INFO.name,
    description: BUSINESS_INFO.description,
    url: BUSINESS_INFO.url,
    logo: image,
    email: BUSINESS_INFO.email,
    areaServed: {
      "@type": "State",
      name: "Arizona",
      containsPlace: BUSINESS_INFO.areaServed.map((area) => ({
        "@type": "City",
        name: area,
      })),
    },
    location: BUSINESS_INFO.locations.map((location) => ({
      "@type": "Place",
      name: location.name,
      address: {
        "@type": "PostalAddress",
        streetAddress: location.street,
        addressLocality: location.city,
        addressRegion: location.state,
        postalCode: location.zip,
        addressCountry: location.country,
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: location.geo.latitude,
        longitude: location.geo.longitude,
      },
      telephone: location.phone,
    })),
    sameAs: [
      "https://instagram.com/dropdeadsalon",
      "https://facebook.com/dropdeadsalon",
      "https://tiktok.com/@dropdeadsalon",
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
      <meta name="keywords" content="hair salon Mesa AZ, hair salon Gilbert Arizona, Phoenix Valley hair stylist, balayage Mesa, hair extensions Gilbert, hair color Chandler, Scottsdale hair salon, luxury salon Arizona, bridal hair Phoenix, Tempe hair stylist" />
      
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
      <meta name="geo.region" content="US-AZ" />
      <meta name="geo.placename" content="Mesa, Gilbert, Arizona" />

      {/* Structured Data - Organization */}
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>

      {/* Structured Data - Individual Locations */}
      {locationsSchema.map((locationSchema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(locationSchema)}
        </script>
      ))}

      {/* Structured Data - Services */}
      <script type="application/ld+json">
        {JSON.stringify(servicesSchema)}
      </script>
    </Helmet>
  );
}

export { BUSINESS_INFO };
