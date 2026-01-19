import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";
import { FounderWelcome } from "@/components/home/FounderWelcome";
import { AboutHero } from "@/components/about/AboutHero";
import { ValuesSection } from "@/components/about/ValuesSection";
import { StatsSection } from "@/components/about/StatsSection";
import { StorySection } from "@/components/about/StorySection";
import { JoinTeamSection } from "@/components/about/JoinTeamSection";

const About = () => {
  return (
    <Layout>
      <SEO 
        title="About Us | Drop Dead Salon"
        description="Learn about Drop Dead Salon, our story, and founder Kristi Day. Discover what makes us the Phoenix Valley's premier destination for expert hair color, extensions, and styling."
      />
      <AboutHero />
      <FounderWelcome />
      <ValuesSection />
      <StatsSection />
      <StorySection />
      <JoinTeamSection />
    </Layout>
  );
};

export default About;
