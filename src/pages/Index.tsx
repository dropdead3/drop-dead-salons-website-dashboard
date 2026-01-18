import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";
import { HeroSection } from "@/components/home/HeroSection";
import { BrandStatement } from "@/components/home/BrandStatement";
import { ExtensionsSection } from "@/components/home/ExtensionsSection";
import { ServicesPreview } from "@/components/home/ServicesPreview";
import { PopularServices } from "@/components/home/PopularServices";
import { NewClientSection } from "@/components/home/NewClientSection";
import { LocationsSection } from "@/components/home/LocationsSection";
import { FounderWelcome } from "@/components/home/FounderWelcome";
import { StylistsSection } from "@/components/home/StylistsSection";
import { GallerySection } from "@/components/home/GallerySection";
import { TestimonialSection } from "@/components/home/TestimonialSection";
import { FAQSection } from "@/components/home/FAQSection";
import { CTASection } from "@/components/home/CTASection";
import { BrandsSection } from "@/components/home/BrandsSection";
import { DrinkMenuSection } from "@/components/home/DrinkMenuSection";

const Index = () => {
  return (
    <Layout>
      <SEO 
        title="Premier Hair Salon in Mesa & Gilbert, Arizona"
        description="Drop Dead Salon is the Phoenix Valley's premier destination for expert hair color, extensions, cutting & styling. Serving Mesa, Gilbert, Chandler, Scottsdale, and the entire East Valley. Book your transformation today."
        type="local_business"
      />
      <HeroSection />
      <BrandStatement />
      <ServicesPreview />
      <PopularServices />
      <BrandsSection />
      <NewClientSection />
      <FounderWelcome />
      <LocationsSection />
      <GallerySection />
      {/* Combined Reviews & FAQ Section with Gradient */}
      <div 
        className="relative"
        style={{ 
          background: 'linear-gradient(to bottom, hsl(0 0% 100%) 0%, hsl(40 25% 95%) 30%, hsl(40 30% 94%) 70%, hsl(40 20% 92%) 100%)' 
        }}
      >
        <TestimonialSection />
        <FAQSection />
      </div>
      <ExtensionsSection />
      <StylistsSection />
      <CTASection />
      <DrinkMenuSection />
    </Layout>
  );
};

export default Index;
