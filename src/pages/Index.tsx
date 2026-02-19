import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";
import { useWebsitePages } from "@/hooks/useWebsitePages";
import { PageSectionRenderer } from "@/components/home/PageSectionRenderer";

const Index = () => {
  const { data: pagesConfig } = useWebsitePages();
  const homePage = pagesConfig?.pages.find(p => p.id === 'home');

  return (
    <Layout>
      <SEO 
        title="Premier Hair Salon in Mesa & Gilbert, Arizona"
        description="Drop Dead Salon is the Phoenix Valley's premier destination for expert hair color, extensions, cutting & styling. Serving Mesa, Gilbert, Chandler, Scottsdale, and the entire East Valley. Book your transformation today."
        type="local_business"
      />
      <PageSectionRenderer sections={homePage?.sections ?? []} />
    </Layout>
  );
};

export default Index;
