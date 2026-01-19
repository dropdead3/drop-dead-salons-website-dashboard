import { lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";
import { HeroSection } from "@/components/home/HeroSection";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load all sections below the fold
const BrandStatement = lazy(() => import("@/components/home/BrandStatement").then(m => ({ default: m.BrandStatement })));
const TestimonialSection = lazy(() => import("@/components/home/TestimonialSection").then(m => ({ default: m.TestimonialSection })));
const ServicesPreview = lazy(() => import("@/components/home/ServicesPreview").then(m => ({ default: m.ServicesPreview })));
const PopularServices = lazy(() => import("@/components/home/PopularServices").then(m => ({ default: m.PopularServices })));
const GallerySection = lazy(() => import("@/components/home/GallerySection").then(m => ({ default: m.GallerySection })));
const NewClientSection = lazy(() => import("@/components/home/NewClientSection").then(m => ({ default: m.NewClientSection })));
const StylistsSection = lazy(() => import("@/components/home/StylistsSection").then(m => ({ default: m.StylistsSection })));
const LocationsSection = lazy(() => import("@/components/home/LocationsSection").then(m => ({ default: m.LocationsSection })));
const FAQSection = lazy(() => import("@/components/home/FAQSection").then(m => ({ default: m.FAQSection })));
const ExtensionsSection = lazy(() => import("@/components/home/ExtensionsSection").then(m => ({ default: m.ExtensionsSection })));
const BrandsSection = lazy(() => import("@/components/home/BrandsSection").then(m => ({ default: m.BrandsSection })));
const DrinkMenuSection = lazy(() => import("@/components/home/DrinkMenuSection").then(m => ({ default: m.DrinkMenuSection })));

// Staggered animation variants
const sectionVariants = {
  hidden: { 
    opacity: 0, 
    y: 40 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
};

// Section wrapper with entrance animation
const AnimatedSection = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-100px" }}
    variants={{
      hidden: { opacity: 0, y: 40 },
      visible: { 
        opacity: 1, 
        y: 0,
        transition: {
          duration: 0.8,
          delay,
          ease: [0.25, 0.1, 0.25, 1]
        }
      }
    }}
  >
    {children}
  </motion.div>
);

// Loading fallback
const SectionLoader = () => (
  <div className="w-full py-20 px-6">
    <div className="container mx-auto space-y-6">
      <Skeleton className="h-8 w-48 mx-auto" />
      <Skeleton className="h-4 w-96 mx-auto" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  </div>
);

const Index = () => {
  return (
    <Layout>
      <SEO 
        title="Premier Hair Salon in Mesa & Gilbert, Arizona"
        description="Drop Dead Salon is the Phoenix Valley's premier destination for expert hair color, extensions, cutting & styling. Serving Mesa, Gilbert, Chandler, Scottsdale, and the entire East Valley. Book your transformation today."
        type="local_business"
      />
      
      {/* Hero loads immediately - above the fold */}
      <HeroSection />
      
      {/* Lazy loaded sections with staggered animations */}
      <Suspense fallback={<SectionLoader />}>
        <AnimatedSection>
          <BrandStatement />
        </AnimatedSection>
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <AnimatedSection delay={0.1}>
          <TestimonialSection />
        </AnimatedSection>
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <AnimatedSection delay={0.1}>
          <ServicesPreview />
        </AnimatedSection>
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <AnimatedSection delay={0.1}>
          <PopularServices />
        </AnimatedSection>
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <AnimatedSection delay={0.1}>
          <GallerySection />
        </AnimatedSection>
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <AnimatedSection delay={0.1}>
          <NewClientSection />
        </AnimatedSection>
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <AnimatedSection delay={0.1}>
          <StylistsSection />
        </AnimatedSection>
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <AnimatedSection delay={0.1}>
          <LocationsSection />
        </AnimatedSection>
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <AnimatedSection delay={0.1}>
          <FAQSection />
        </AnimatedSection>
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <AnimatedSection delay={0.1}>
          <ExtensionsSection />
        </AnimatedSection>
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <AnimatedSection delay={0.1}>
          <BrandsSection />
        </AnimatedSection>
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <AnimatedSection delay={0.1}>
          <DrinkMenuSection />
        </AnimatedSection>
      </Suspense>
    </Layout>
  );
};

export default Index;
