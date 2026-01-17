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
  email: "contact@dropdeadsalon.com",
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

  // FAQ Schema for rich search results
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Do the salons accept walk-ins?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "At this time, we do not accept walk-ins. All appointments must be scheduled in advance, and an initial consultation is required or must be waived by the stylist matched to you. This ensures you're paired with the right artist and receive the personalized service you deserve.",
        },
      },
      {
        "@type": "Question",
        name: "Will I need a consultation?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "For most color services, extensions, and major transformations, yes. Consultations help us understand your hair history, assess its current condition, and create a personalized plan. Some services like trims or blowouts may not require one—your stylist will let you know.",
        },
      },
      {
        "@type": "Question",
        name: "Does it matter which location I arrive at for my appointment?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes! Please arrive at the specific location where your appointment is booked. Our stylists work at designated locations, so showing up at the correct salon ensures you're seen on time by your scheduled artist.",
        },
      },
      {
        "@type": "Question",
        name: "What's the vibe like at each salon?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Both locations share the same commitment to quality and creativity, but each has its own unique atmosphere. Val Vista Lakes has a more intimate, boutique feel, while North Mesa offers a larger, energetic space. We recommend visiting both to see which vibe resonates with you!",
        },
      },
      {
        "@type": "Question",
        name: "What is your cancellation policy?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "We require 48 hours notice for cancellations or rescheduling. Late cancellations or no-shows may result in a fee equal to 50% of the scheduled service. We understand life happens—just communicate with us as early as possible.",
        },
      },
      {
        "@type": "Question",
        name: "How do I book an appointment at Drop Dead Salon in Mesa or Gilbert?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "You can book directly through our website by visiting the booking page, or reach out to us via email or phone. New clients should fill out our consultation form first so we can match you with the perfect stylist at our Mesa or Gilbert location.",
        },
      },
      {
        "@type": "Question",
        name: "What payment methods do you accept?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "We accept all major credit cards, debit cards, Apple Pay, Google Pay, and cash. A deposit may be required for certain services at the time of booking.",
        },
      },
      {
        "@type": "Question",
        name: "Where is Drop Dead Salon located in Arizona?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Drop Dead Salon has two convenient locations in the Phoenix Valley: one in Mesa, Arizona and one in Gilbert, Arizona. We proudly serve clients from across the East Valley including Chandler, Tempe, Scottsdale, Queen Creek, and the greater Phoenix area.",
        },
      },
    ],
  };

  // Aggregate Rating Schema for rich snippets
  const aggregateRatingSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": BUSINESS_INFO.url,
    name: BUSINESS_INFO.name,
    description: BUSINESS_INFO.description,
    image: image,
    url: BUSINESS_INFO.url,
    priceRange: BUSINESS_INFO.priceRange,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5.0",
      bestRating: "5",
      worstRating: "1",
      ratingCount: "247",
      reviewCount: "189",
    },
    review: [
      {
        "@type": "Review",
        author: { "@type": "Person", name: "Lexi V." },
        datePublished: "2024-11-15",
        reviewBody: "I love Drop Dead! The owner picks literally THE BEST hair stylist and lash and brow artists. You really can't go wrong with going to anyone inside the studio, everyone is so welcoming and friendly.",
        reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
      },
      {
        "@type": "Review",
        author: { "@type": "Person", name: "Melissa C." },
        datePublished: "2024-10-22",
        reviewBody: "The salon itself is beautiful and so unique. The atmosphere is comforting and fun!! Never have I loved my hair this much!! Definitely recommend to anyone wanting a new salon!!",
        reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
      },
      {
        "@type": "Review",
        author: { "@type": "Person", name: "Lexi K." },
        datePublished: "2024-09-18",
        reviewBody: "I have loved every product from Drop Dead so far. I wear them myself and I also use them on my clients. My clients love everything too!! These new SuperWefts are amazing.",
        reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
      },
      {
        "@type": "Review",
        author: { "@type": "Person", name: "Morgan S." },
        datePublished: "2024-08-30",
        reviewBody: "I've been going to Drop Dead for over a year now and every single visit has been incredible. The attention to detail and care they put into every service is unmatched.",
        reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
      },
      {
        "@type": "Review",
        author: { "@type": "Person", name: "Jamie L." },
        datePublished: "2024-07-12",
        reviewBody: "Went from damaged, over-processed hair to the healthiest it's ever been. The team really knows their stuff and takes the time to educate you on proper hair care.",
        reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
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

      {/* Structured Data - FAQ */}
      <script type="application/ld+json">
        {JSON.stringify(faqSchema)}
      </script>

      {/* Structured Data - Aggregate Rating & Reviews */}
      <script type="application/ld+json">
        {JSON.stringify(aggregateRatingSchema)}
      </script>
    </Helmet>
  );
}

export { BUSINESS_INFO };
