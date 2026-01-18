import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";
import { FounderWelcome } from "@/components/home/FounderWelcome";

const About = () => {
  return (
    <Layout>
      <SEO 
        title="About Us | Drop Dead Salon"
        description="Learn about Drop Dead Salon, our story, and founder Kristi Day. Discover what makes us the Phoenix Valley's premier destination for expert hair color, extensions, and styling."
      />
      <div className="pt-24 md:pt-32">
        <FounderWelcome />
      </div>
    </Layout>
  );
};

export default About;
