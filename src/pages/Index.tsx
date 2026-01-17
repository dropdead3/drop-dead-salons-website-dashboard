import { Layout } from "@/components/layout/Layout";
import { HeroSection } from "@/components/home/HeroSection";
import { BrandStatement } from "@/components/home/BrandStatement";
import { ServicesPreview } from "@/components/home/ServicesPreview";
import { GallerySection } from "@/components/home/GallerySection";
import { TestimonialSection } from "@/components/home/TestimonialSection";
import { CTASection } from "@/components/home/CTASection";

const Index = () => {
  return (
    <Layout>
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
