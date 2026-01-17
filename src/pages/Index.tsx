import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";
import { HeroSection } from "@/components/home/HeroSection";
import { BrandStatement } from "@/components/home/BrandStatement";
import { ServicesPreview } from "@/components/home/ServicesPreview";
import { GallerySection } from "@/components/home/GallerySection";
import { TestimonialSection } from "@/components/home/TestimonialSection";
import { CTASection } from "@/components/home/CTASection";

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
      <GallerySection />
      <TestimonialSection />
      <CTASection />
    </Layout>
  );
};

export default Index;
