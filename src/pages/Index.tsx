import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";
import { useWebsiteSections } from "@/hooks/useWebsiteSections";
import { PageSectionRenderer } from "@/components/home/PageSectionRenderer";

const Index = () => {
  const { data: sectionsConfig } = useWebsiteSections();

  return (
    <Layout>
      <SEO 
        title="Premier Hair Salon in Mesa & Gilbert, Arizona"
        description="Drop Dead Salon is the Phoenix Valley's premier destination for expert hair color, extensions, cutting & styling. Serving Mesa, Gilbert, Chandler, Scottsdale, and the entire East Valley. Book your transformation today."
        type="local_business"
      />
      <PageSectionRenderer sections={sectionsConfig?.homepage ?? []} />
    </Layout>
  );
};

export default Index;
