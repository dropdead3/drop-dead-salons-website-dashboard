import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";
import { HeroSection } from "@/components/home/HeroSection";
import { BrandStatement } from "@/components/home/BrandStatement";
import { ServicesPreview } from "@/components/home/ServicesPreview";
import { PopularServices } from "@/components/home/PopularServices";
import { NewClientSection } from "@/components/home/NewClientSection";
import { LocationsSection } from "@/components/home/LocationsSection";
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
        title="Luxury Hair Salon in Los Angeles"
        description="Drop Dead Salon offers expert hair color, extensions, cutting & styling in Los Angeles. Experience transformative hair artistry where science meets beauty."
        type="local_business"
      />
      <HeroSection />
      <BrandStatement />
      <ServicesPreview />
      <PopularServices />
      <BrandsSection />
      <NewClientSection />
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
      <CTASection />
      <StylistsSection />
      <DrinkMenuSection />
    </Layout>
  );
};

export default Index;
