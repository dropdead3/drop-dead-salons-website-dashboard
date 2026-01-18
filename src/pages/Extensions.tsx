import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Search, X, ChevronLeft, ChevronRight, Star, Award, Users, Clock, Check, Sparkles } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";
import { Section } from "@/components/ui/section";
import { BeforeAfterSlider } from "@/components/home/BeforeAfterSlider";
import { ExtensionReviewsSection } from "@/components/home/ExtensionReviewsSection";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Transformation gallery data
const transformations = [
  {
    id: 1,
    beforeImage: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=600&h=750&fit=crop",
    afterImage: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=750&fit=crop",
    title: "Volume & Length",
    description: "Added 18 inches of seamless extensions for dramatic length and volume"
  },
  {
    id: 2,
    beforeImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=750&fit=crop",
    afterImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=750&fit=crop",
    title: "Natural Blending",
    description: "Subtle extensions for thickness without added length"
  },
  {
    id: 3,
    beforeImage: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=750&fit=crop",
    afterImage: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600&h=750&fit=crop",
    title: "Color & Extensions",
    description: "Custom color matching with dimensional highlights"
  },
  {
    id: 4,
    beforeImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&h=750&fit=crop",
    afterImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=750&fit=crop",
    title: "Full Transformation",
    description: "Complete length transformation with balayage"
  }
];

// Extension benefit cards
const extensionBenefits = [
  {
    title: "Instant Volume",
    description: "Increase volume with seamless, lightweight extensions that blend naturally and boost your hair's fullness in just one appointment.",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=500&fit=crop"
  },
  {
    title: "Instant Length",
    description: "Get the hair of your dreams by achieving instant length with our custom extensions—designed to add inches and impact without the wait.",
    image: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400&h=500&fit=crop"
  },
  {
    title: "Damage-Free",
    description: "Enjoy damage-free extensions with our signature Drop Dead Method, designed to protect your natural hair while enhancing your look.",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop"
  }
];

// Extension-specific FAQs
const extensionFaqs = [
  {
    question: "How long do hair extensions last?",
    answer: "With proper care and regular maintenance appointments every 6-8 weeks, our extensions typically last 6-12 months. The longevity depends on your hair type, lifestyle, and how well you follow our care instructions."
  },
  {
    question: "Will extensions damage my natural hair?",
    answer: "When installed and maintained properly by our certified stylists, the Drop Dead Method is designed to be completely damage-free. Our hidden beaded row technique distributes weight evenly and doesn't use heat, glue, or harsh chemicals."
  },
  {
    question: "How long does the installation process take?",
    answer: "A full extension installation typically takes 2-3 hours. This includes custom color matching, sectioning, and precise placement to ensure the most natural-looking results."
  },
  {
    question: "Can I color my extensions?",
    answer: "Yes! Our premium human hair extensions can be colored, but we recommend having this done at the salon by one of our stylists to ensure the best results and maintain the integrity of the hair."
  },
  {
    question: "What maintenance is required?",
    answer: "We recommend maintenance appointments every 6-8 weeks to move up the rows as your natural hair grows. Daily care includes gentle brushing with a loop brush, using sulfate-free products, and braiding hair before bed."
  },
  {
    question: "Do I need a consultation before getting extensions?",
    answer: "Yes, a consultation is required for all new extension clients. This allows us to assess your hair health, discuss your goals, color match, and create a customized plan for your perfect look."
  },
  {
    question: "What is the Drop Dead Method?",
    answer: "The Drop Dead Method is our proprietary hidden beaded row technique. It's the most versatile and comfortable extension method available, featuring invisible rows that lay completely flat against your scalp with zero tension or damage."
  },
  {
    question: "How much do extensions cost?",
    answer: "Extension pricing varies based on the amount of hair needed, desired length, and your specific goals. After your consultation, we'll provide a detailed quote. Investment typically ranges from $800-$2500 for a full install."
  }
];

export default function Extensions() {
  const heroRef = useRef(null);
  const benefitsRef = useRef(null);
  const specialtyRef = useRef(null);
  const faqRef = useRef(null);
  
  const heroInView = useInView(heroRef, { once: true, margin: "-100px" });
  const benefitsInView = useInView(benefitsRef, { once: true, margin: "-100px" });
  const specialtyInView = useInView(specialtyRef, { once: true, margin: "-100px" });
  const faqInView = useInView(faqRef, { once: true, margin: "-100px" });
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return extensionFaqs;
    const query = searchQuery.toLowerCase();
    return extensionFaqs.filter(
      faq => 
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-oat/50 text-foreground px-0.5 rounded-sm">
          {part}
        </mark>
      ) : part
    );
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % transformations.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + transformations.length) % transformations.length);
  };

  return (
    <Layout>
      <SEO 
        title="Hair Extensions - Luxury Extension Services"
        description="Experience luxury hair extensions with the Drop Dead Method. Instant volume, instant length, damage-free extensions. Book your consultation today."
      />

      {/* Hero Section - Full Width Parallax */}
      <section ref={heroRef} className="relative h-screen min-h-[600px] max-h-[900px] overflow-hidden">
        {/* Parallax Background Image */}
        <motion.div 
          className="absolute inset-0 w-full h-[120%] -top-[10%]"
          style={{
            y: useTransform(useScroll().scrollY, [0, 1000], [0, 300])
          }}
        >
          <img 
            src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1920&h=1200&fit=crop"
            alt="Luxury hair extensions"
            className="w-full h-full object-cover"
          />
        </motion.div>
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Centered Content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="container mx-auto px-6 lg:px-12 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="font-serif text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-normal tracking-tight text-white leading-[1.1] max-w-4xl mx-auto"
            >
              <span className="italic font-light">Luxury</span> extension services
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="mt-6 text-base md:text-lg text-white/80 font-sans font-light max-w-xl mx-auto leading-relaxed"
            >
              Drop Dead Salon built it's foundations upon our hair extension knowledge and sister brand, Drop Dead Extensions. We use all our own proprietary extension products in our salons to deliver incredible results with a quality guarantee.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                to="/booking"
                className="group inline-flex items-center gap-3 bg-white text-foreground px-8 py-4 text-sm uppercase tracking-[0.15em] font-sans font-normal hover:bg-white/90 transition-all duration-300"
              >
                <span>Book Your Consultation</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                to="#packages"
                className="group inline-flex items-center gap-3 border border-white text-white px-8 py-4 text-sm uppercase tracking-[0.15em] font-sans font-normal hover:bg-white hover:text-foreground transition-all duration-300"
              >
                <span>View Packages</span>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social Proof / Trust Badges Section */}
      <section className="py-12 bg-secondary/30">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
            {/* Rating */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-oat text-oat" />
                ))}
              </div>
              <p className="text-2xl font-serif font-medium text-foreground">4.9</p>
              <p className="text-sm text-muted-foreground mt-1">500+ Reviews</p>
            </motion.div>

            {/* Certified */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-center"
            >
              <div className="flex items-center justify-center mb-2">
                <Award className="w-8 h-8 text-foreground" />
              </div>
              <p className="text-2xl font-serif font-medium text-foreground">Certified</p>
              <p className="text-sm text-muted-foreground mt-1">Drop Dead Method</p>
            </motion.div>

            {/* Clients Served */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center"
            >
              <div className="flex items-center justify-center mb-2">
                <Users className="w-8 h-8 text-foreground" />
              </div>
              <p className="text-2xl font-serif font-medium text-foreground">2,000+</p>
              <p className="text-sm text-muted-foreground mt-1">Transformations</p>
            </motion.div>

            {/* Experience */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-center"
            >
              <div className="flex items-center justify-center mb-2">
                <Sparkles className="w-8 h-8 text-foreground" />
              </div>
              <p className="text-2xl font-serif font-medium text-foreground">10+ Years</p>
              <p className="text-sm text-muted-foreground mt-1">Expert Experience</p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-5 border-y border-border">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
            <p className="text-foreground font-medium text-center">
              New clients can save 15% off the first service!
            </p>
            <Link
              to="/booking"
              className="inline-flex items-center px-6 py-2.5 border border-foreground text-foreground text-sm uppercase tracking-[0.15em] font-sans font-normal hover:bg-foreground hover:text-background transition-all duration-300"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Cards Section */}
      <Section sectionRef={benefitsRef} className="bg-background">
        {/* Header - moved from We Specialize section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={benefitsInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 lg:mb-16"
        >
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-normal tracking-tight text-foreground leading-[1.1] mb-6">
            We specialize in dream hair...
          </h2>
          <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Looking for the best hair extensions in Mesa or Gilbert, AZ? Our certified stylists use the Drop Dead Method to deliver seamless results that look and feel 100% natural.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {extensionBenefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 40 }}
              animate={benefitsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: index * 0.15, ease: [0.25, 0.1, 0.25, 1] }}
              className="group relative overflow-hidden cursor-pointer"
            >
              {/* Full Background Image */}
              <div className="aspect-[16/9] relative">
                <img 
                  src={benefit.image}
                  alt={benefit.title}
                  className="absolute inset-0 w-full h-full object-cover object-right transition-transform duration-700 ease-out group-hover:scale-105"
                />
                
                {/* Gradient Overlay - stronger on left for text readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent transition-opacity duration-500" />
                
                {/* Content - aligned to top for consistent positioning */}
                <div className="absolute inset-0 p-6 flex flex-col justify-start text-white">
                  {/* Number + Title - full width */}
                  <motion.div 
                    className="flex items-center gap-3 mb-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={benefitsInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.15 }}
                  >
                    <div className="w-8 h-8 rounded-full border border-white/50 flex items-center justify-center flex-shrink-0 backdrop-blur-sm bg-white/10">
                      <span className="text-sm font-medium">{index + 1}</span>
                    </div>
                    <h3 className="font-serif text-xl md:text-2xl font-medium">
                      {benefit.title}
                    </h3>
                  </motion.div>
                  
                  {/* Description - left side weighted */}
                  <motion.p 
                    className="text-sm text-white/80 leading-relaxed w-[55%]"
                    initial={{ opacity: 0, y: 20 }}
                    animate={benefitsInView ? { opacity: 0.8, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.4 + index * 0.15 }}
                  >
                    {benefit.description}
                  </motion.p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>


      {/* Gallery Section - 4 Before/After Sliders */}
      <Section sectionRef={specialtyRef} className="bg-background">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={specialtyInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 lg:mb-16"
        >
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-normal tracking-tight text-foreground leading-[1.1] mb-6">
            You'll have to see it to believe it
          </h2>
          <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Real transformations from our salon. Hover over each image to compare the before and after results of our signature extension work.
          </p>
        </motion.div>

        {/* Gallery Grid - 4 Before/After Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {transformations.map((transformation, index) => (
            <motion.div
              key={transformation.id}
              initial={{ opacity: 0, y: 40 }}
              animate={specialtyInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: index * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
              className="group"
            >
              <BeforeAfterSlider
                beforeImage={transformation.beforeImage}
                afterImage={transformation.afterImage}
                beforeLabel="BEFORE"
                afterLabel="AFTER"
                className="aspect-[3/4]"
                hideDefaultVideoButton={true}
                hoverMode={true}
              />
              <div className="mt-3 text-center">
                <h3 className="font-serif text-lg font-medium text-foreground">
                  {transformation.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {transformation.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Extension Pricing Section */}
      <Section className="bg-secondary/30">
        <div className="text-center mb-12">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-sans block mb-4"
          >
            Investment
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-serif text-3xl md:text-4xl lg:text-5xl font-normal tracking-tight text-foreground"
          >
            Extension <span className="italic font-light">Packages</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 text-muted-foreground max-w-xl mx-auto"
          >
            Pricing varies based on desired length, volume, and hair type. A consultation is required for an accurate quote.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Volume Package */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-background border border-border p-8 flex flex-col"
          >
            <div className="mb-6">
              <h3 className="font-serif text-2xl mb-2">Volume</h3>
              <p className="text-sm text-muted-foreground">Perfect for adding thickness and body without extra length</p>
            </div>
            <div className="mb-6">
              <span className="text-3xl font-serif">$800</span>
              <span className="text-muted-foreground"> - $1,200</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-start gap-3 text-sm">
                <span className="w-1.5 h-1.5 bg-foreground rounded-full mt-1.5 flex-shrink-0" />
                <span>1-2 rows of extensions</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <span className="w-1.5 h-1.5 bg-foreground rounded-full mt-1.5 flex-shrink-0" />
                <span>Adds fullness & density</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <span className="w-1.5 h-1.5 bg-foreground rounded-full mt-1.5 flex-shrink-0" />
                <span>Custom color matching</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <span className="w-1.5 h-1.5 bg-foreground rounded-full mt-1.5 flex-shrink-0" />
                <span>2-hour appointment</span>
              </li>
            </ul>
            <Link
              to="/booking"
              className="w-full py-3.5 border border-foreground text-foreground text-sm uppercase tracking-[0.15em] font-sans text-center hover:bg-foreground hover:text-background transition-all duration-300"
            >
              Book Consultation
            </Link>
          </motion.div>

          {/* Length + Volume Package - Featured */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-foreground text-background p-8 flex flex-col relative"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-oat text-oat-foreground px-4 py-1.5 text-xs uppercase tracking-[0.15em]">
              Most Popular
            </div>
            <div className="mb-6">
              <h3 className="font-serif text-2xl mb-2">Length + Volume</h3>
              <p className="text-sm text-background/70">Our most requested package for dramatic transformations</p>
            </div>
            <div className="mb-6">
              <span className="text-3xl font-serif">$1,400</span>
              <span className="text-background/70"> - $2,000</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-start gap-3 text-sm">
                <span className="w-1.5 h-1.5 bg-oat rounded-full mt-1.5 flex-shrink-0" />
                <span>2-3 rows of extensions</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <span className="w-1.5 h-1.5 bg-oat rounded-full mt-1.5 flex-shrink-0" />
                <span>Up to 18" added length</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <span className="w-1.5 h-1.5 bg-oat rounded-full mt-1.5 flex-shrink-0" />
                <span>Maximum volume & fullness</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <span className="w-1.5 h-1.5 bg-oat rounded-full mt-1.5 flex-shrink-0" />
                <span>Custom color matching & blending</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <span className="w-1.5 h-1.5 bg-oat rounded-full mt-1.5 flex-shrink-0" />
                <span>3-hour appointment</span>
              </li>
            </ul>
            <Link
              to="/booking"
              className="w-full py-3.5 bg-oat text-oat-foreground text-sm uppercase tracking-[0.15em] font-sans text-center hover:bg-oat/90 transition-all duration-300"
            >
              Book Consultation
            </Link>
          </motion.div>

          {/* Full Transformation Package */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-background border border-border p-8 flex flex-col"
          >
            <div className="mb-6">
              <h3 className="font-serif text-2xl mb-2">Full Transformation</h3>
              <p className="text-sm text-muted-foreground">Complete hair makeover with color and extensions</p>
            </div>
            <div className="mb-6">
              <span className="text-3xl font-serif">$2,000</span>
              <span className="text-muted-foreground"> - $3,000+</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-start gap-3 text-sm">
                <span className="w-1.5 h-1.5 bg-foreground rounded-full mt-1.5 flex-shrink-0" />
                <span>3-4 rows of extensions</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <span className="w-1.5 h-1.5 bg-foreground rounded-full mt-1.5 flex-shrink-0" />
                <span>Up to 22" added length</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <span className="w-1.5 h-1.5 bg-foreground rounded-full mt-1.5 flex-shrink-0" />
                <span>Includes color service</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <span className="w-1.5 h-1.5 bg-foreground rounded-full mt-1.5 flex-shrink-0" />
                <span>Custom blending & styling</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <span className="w-1.5 h-1.5 bg-foreground rounded-full mt-1.5 flex-shrink-0" />
                <span>4-5 hour appointment</span>
              </li>
            </ul>
            <Link
              to="/booking"
              className="w-full py-3.5 border border-foreground text-foreground text-sm uppercase tracking-[0.15em] font-sans text-center hover:bg-foreground hover:text-background transition-all duration-300"
            >
              Book Consultation
            </Link>
          </motion.div>
        </div>

        {/* Maintenance Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-6 flex-wrap justify-center text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-oat rounded-full" />
              <span>Maintenance: $150-$300 every 6-8 weeks</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-oat rounded-full" />
              <span>Hair lasts 6-12 months with proper care</span>
            </div>
          </div>
        </motion.div>
      </Section>

      {/* Method Comparison Section */}
      <Section className="bg-background">
        <div className="text-center mb-12">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-sans block mb-4"
          >
            Why Choose Us
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-serif text-3xl md:text-4xl lg:text-5xl font-normal tracking-tight text-foreground"
          >
            The Drop Dead <span className="italic font-light">Difference</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 text-muted-foreground max-w-2xl mx-auto"
          >
            See how our signature Drop Dead Method compares to other popular extension techniques.
          </motion.p>
        </div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="overflow-x-auto"
        >
          <table className="w-full border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-border">
                <th className="py-4 px-4 text-left font-serif text-lg font-normal">Feature</th>
                <th className="py-4 px-4 text-center font-serif text-lg font-normal bg-oat/10">Drop Dead Method</th>
                <th className="py-4 px-4 text-center font-serif text-lg font-normal">Tape-Ins</th>
                <th className="py-4 px-4 text-center font-serif text-lg font-normal">Keratin Bonds</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50">
                <td className="py-4 px-4 text-sm text-muted-foreground">Damage to natural hair</td>
                <td className="py-4 px-4 text-center bg-oat/10"><Check className="w-5 h-5 text-green-600 mx-auto" /><span className="text-xs block mt-1">None</span></td>
                <td className="py-4 px-4 text-center"><span className="text-xs text-muted-foreground">Minimal</span></td>
                <td className="py-4 px-4 text-center"><X className="w-5 h-5 text-red-500 mx-auto" /><span className="text-xs block mt-1">Possible</span></td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-4 px-4 text-sm text-muted-foreground">Completely invisible</td>
                <td className="py-4 px-4 text-center bg-oat/10"><Check className="w-5 h-5 text-green-600 mx-auto" /></td>
                <td className="py-4 px-4 text-center"><X className="w-5 h-5 text-red-500 mx-auto" /></td>
                <td className="py-4 px-4 text-center"><span className="text-xs text-muted-foreground">Varies</span></td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-4 px-4 text-sm text-muted-foreground">Heat-free application</td>
                <td className="py-4 px-4 text-center bg-oat/10"><Check className="w-5 h-5 text-green-600 mx-auto" /></td>
                <td className="py-4 px-4 text-center"><Check className="w-5 h-5 text-green-600 mx-auto" /></td>
                <td className="py-4 px-4 text-center"><X className="w-5 h-5 text-red-500 mx-auto" /></td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-4 px-4 text-sm text-muted-foreground">Wear hair up freely</td>
                <td className="py-4 px-4 text-center bg-oat/10"><Check className="w-5 h-5 text-green-600 mx-auto" /></td>
                <td className="py-4 px-4 text-center"><X className="w-5 h-5 text-red-500 mx-auto" /></td>
                <td className="py-4 px-4 text-center"><span className="text-xs text-muted-foreground">Limited</span></td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-4 px-4 text-sm text-muted-foreground">Time between maintenance</td>
                <td className="py-4 px-4 text-center bg-oat/10"><span className="font-medium">6-8 weeks</span></td>
                <td className="py-4 px-4 text-center"><span className="text-sm">4-6 weeks</span></td>
                <td className="py-4 px-4 text-center"><span className="text-sm">3-4 months</span></td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-4 px-4 text-sm text-muted-foreground">Hair lifespan</td>
                <td className="py-4 px-4 text-center bg-oat/10"><span className="font-medium">6-12 months</span></td>
                <td className="py-4 px-4 text-center"><span className="text-sm">4-8 weeks per set</span></td>
                <td className="py-4 px-4 text-center"><span className="text-sm">3-6 months</span></td>
              </tr>
              <tr>
                <td className="py-4 px-4 text-sm text-muted-foreground">Comfort level</td>
                <td className="py-4 px-4 text-center bg-oat/10"><span className="font-medium text-green-600">Excellent</span></td>
                <td className="py-4 px-4 text-center"><span className="text-sm">Good</span></td>
                <td className="py-4 px-4 text-center"><span className="text-sm">Fair</span></td>
              </tr>
            </tbody>
          </table>
        </motion.div>
      </Section>

      <Section className="bg-foreground text-background">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Left - Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-xs uppercase tracking-[0.3em] text-background/60 font-sans block mb-4">
              The Process
            </span>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-normal tracking-tight leading-[1.1] mb-6">
              What's <span className="italic font-light text-oat">Included</span>
            </h2>
            <p className="text-background/70 leading-relaxed mb-8">
              Every extension journey begins with a complimentary consultation. Here's what you can expect when you book with us.
            </p>
            <Link
              to="/booking"
              className="group inline-flex items-center gap-3 bg-oat text-oat-foreground px-8 py-4 text-sm uppercase tracking-[0.15em] font-sans font-normal hover:bg-oat/90 transition-all duration-300"
            >
              <span>Schedule Consultation</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </motion.div>

          {/* Right - Process Steps */}
          <div className="space-y-0">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="border-b border-background/20 py-6 first:pt-0"
            >
              <div className="flex gap-6">
                <span className="text-oat font-serif text-2xl">01</span>
                <div>
                  <h3 className="font-medium text-lg mb-2">Hair Assessment</h3>
                  <p className="text-sm text-background/70 leading-relaxed">
                    We evaluate your hair's health, texture, and current condition to ensure extensions are right for you and determine the best method.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="border-b border-background/20 py-6"
            >
              <div className="flex gap-6">
                <span className="text-oat font-serif text-2xl">02</span>
                <div>
                  <h3 className="font-medium text-lg mb-2">Color Matching</h3>
                  <p className="text-sm text-background/70 leading-relaxed">
                    Our stylists custom match your hair color using our premium Drop Dead Hair swatches, ensuring a seamless, natural blend.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="border-b border-background/20 py-6"
            >
              <div className="flex gap-6">
                <span className="text-oat font-serif text-2xl">03</span>
                <div>
                  <h3 className="font-medium text-lg mb-2">Goal Setting</h3>
                  <p className="text-sm text-background/70 leading-relaxed">
                    We discuss your desired length, volume, and overall look. Together, we'll create a customized plan tailored to your lifestyle.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Step 4 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="border-b border-background/20 py-6"
            >
              <div className="flex gap-6">
                <span className="text-oat font-serif text-2xl">04</span>
                <div>
                  <h3 className="font-medium text-lg mb-2">Investment Quote</h3>
                  <p className="text-sm text-background/70 leading-relaxed">
                    You'll receive a detailed quote based on your specific needs, including hair cost, installation, and recommended maintenance schedule.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Step 5 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="py-6"
            >
              <div className="flex gap-6">
                <span className="text-oat font-serif text-2xl">05</span>
                <div>
                  <h3 className="font-medium text-lg mb-2">Care Education</h3>
                  <p className="text-sm text-background/70 leading-relaxed">
                    Before you leave, we'll walk you through proper care techniques, recommended products, and what to expect during your extension journey.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* Maintenance Timeline Section */}
      <Section className="bg-secondary/30 overflow-hidden">
        <div className="text-center mb-16 lg:mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-serif text-3xl md:text-4xl lg:text-5xl font-normal tracking-tight text-foreground"
          >
            Your Extension <span className="italic font-light">Journey</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-4 text-muted-foreground max-w-xl mx-auto"
          >
            From installation to maintenance, here's what to expect.
          </motion.p>
        </div>

        {/* Timeline */}
        <div className="relative max-w-5xl mx-auto">
          {/* Connecting line - desktop */}
          <div className="hidden lg:block absolute top-6 left-[10%] right-[10%] h-px bg-border" />
          
          {/* Connecting line - mobile/tablet vertical */}
          <div className="lg:hidden absolute top-0 bottom-0 left-6 w-px bg-border" />
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-0">
            {/* Day 1 - Consultation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative pl-16 lg:pl-0 py-8 lg:py-0 lg:text-center"
            >
              {/* Timeline dot */}
              <div className="absolute left-4 lg:left-1/2 lg:-translate-x-1/2 top-8 lg:top-0 w-5 h-5 rounded-full bg-foreground border-4 border-background shadow-sm z-10" />
              
              <div className="lg:pt-12">
                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1 block">Day 1</span>
                <h3 className="font-serif text-lg mb-2">Consultation</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Initial extension consultation to assess your hair and discuss your goals.
                </p>
              </div>
            </motion.div>

            {/* Next Week - Installation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative pl-16 lg:pl-0 py-8 lg:py-0 lg:text-center"
            >
              {/* Timeline dot */}
              <div className="absolute left-4 lg:left-1/2 lg:-translate-x-1/2 top-8 lg:top-0 w-5 h-5 rounded-full bg-foreground border-4 border-background shadow-sm z-10" />
              
              <div className="lg:pt-12">
                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1 block">Next Week</span>
                <h3 className="font-serif text-lg mb-2">Installation</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Full installation with custom color matching, toning, and blending.
                </p>
              </div>
            </motion.div>

            {/* Week 6 - First Maintenance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative pl-16 lg:pl-0 py-8 lg:py-0 lg:text-center"
            >
              {/* Timeline dot - highlighted */}
              <div className="absolute left-4 lg:left-1/2 lg:-translate-x-1/2 top-8 lg:top-0 w-5 h-5 rounded-full bg-foreground border-4 border-background shadow-sm z-10 ring-4 ring-foreground/10" />
              
              <div className="lg:pt-12">
                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1 block">Week 6</span>
                <h3 className="font-serif text-lg mb-2">First Maintenance</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                  We move up your rows as your natural hair grows.
                </p>
                <span className="text-xs font-medium text-foreground bg-oat/40 px-3 py-1 inline-block">
                  $150 – $300
                </span>
              </div>
            </motion.div>

            {/* 12+ Months - Fresh Set */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="relative pl-16 lg:pl-0 py-8 lg:py-0 lg:text-center"
            >
              {/* Timeline dot */}
              <div className="absolute left-4 lg:left-1/2 lg:-translate-x-1/2 top-8 lg:top-0 w-5 h-5 rounded-full bg-oat border-4 border-background shadow-sm z-10" />
              
              <div className="lg:pt-12">
                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1 block">12+ Months</span>
                <h3 className="font-serif text-lg mb-2">Fresh Set</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Time for new hair. Start fresh with a brand new set of extensions.
                </p>
              </div>
            </motion.div>
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-center mt-16"
          >
            <Link
              to="/booking"
              className="group inline-flex items-center gap-3 border border-foreground text-foreground px-8 py-4 text-sm uppercase tracking-[0.15em] font-sans font-normal hover:bg-foreground hover:text-background transition-all duration-300"
            >
              <span>Book Maintenance</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </Section>

      {/* Extension Care Section */}
      <Section className="bg-background">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Left - Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:sticky lg:top-32"
          >
            <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-sans block mb-4">
              Aftercare
            </span>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-normal tracking-tight text-foreground leading-[1.1] mb-6">
              Extension <span className="italic font-light">Care</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Proper care ensures your extensions last longer and look beautiful every day. Follow these essential tips to maintain your investment.
            </p>
            <div className="bg-oat/30 p-6">
              <h4 className="font-medium mb-3">Recommended Products</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We carry a curated selection of extension-safe products in our salon, including sulfate-free shampoos, nourishing conditioners, and heat protectants specifically formulated for extensions.
              </p>
            </div>
          </motion.div>

          {/* Right - Care Tips Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Tip 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-secondary/50 p-6"
            >
              <div className="w-10 h-10 bg-foreground text-background flex items-center justify-center mb-4">
                <span className="font-serif text-lg">1</span>
              </div>
              <h3 className="font-medium mb-2">Brush Daily</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Use a loop brush or wide-tooth comb, starting from the ends and working up. Brush 2-3 times daily to prevent tangling.
              </p>
            </motion.div>

            {/* Tip 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="bg-secondary/50 p-6"
            >
              <div className="w-10 h-10 bg-foreground text-background flex items-center justify-center mb-4">
                <span className="font-serif text-lg">2</span>
              </div>
              <h3 className="font-medium mb-2">Sulfate-Free Products</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Always use sulfate-free shampoo and conditioner. Sulfates strip the hair of moisture and can cause extensions to dry out and tangle.
              </p>
            </motion.div>

            {/* Tip 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-secondary/50 p-6"
            >
              <div className="w-10 h-10 bg-foreground text-background flex items-center justify-center mb-4">
                <span className="font-serif text-lg">3</span>
              </div>
              <h3 className="font-medium mb-2">Braid Before Bed</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sleep with your hair in a loose braid or silk bonnet to prevent matting and tangling while you sleep.
              </p>
            </motion.div>

            {/* Tip 4 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="bg-secondary/50 p-6"
            >
              <div className="w-10 h-10 bg-foreground text-background flex items-center justify-center mb-4">
                <span className="font-serif text-lg">4</span>
              </div>
              <h3 className="font-medium mb-2">Heat Protection</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Always apply heat protectant before styling. Keep heat tools below 350°F to preserve the integrity of your extensions.
              </p>
            </motion.div>

            {/* Tip 5 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-secondary/50 p-6"
            >
              <div className="w-10 h-10 bg-foreground text-background flex items-center justify-center mb-4">
                <span className="font-serif text-lg">5</span>
              </div>
              <h3 className="font-medium mb-2">Wash Properly</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Wash in a downward motion, never scrubbing. Focus shampoo on the scalp and conditioner on the mid-lengths to ends.
              </p>
            </motion.div>

            {/* Tip 6 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="bg-secondary/50 p-6"
            >
              <div className="w-10 h-10 bg-foreground text-background flex items-center justify-center mb-4">
                <span className="font-serif text-lg">6</span>
              </div>
              <h3 className="font-medium mb-2">Regular Maintenance</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Book move-up appointments every 6-8 weeks. This keeps extensions secure and your natural hair healthy.
              </p>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* Extension Reviews Section */}
      <ExtensionReviewsSection />

      {/* FAQ Section */}
      <Section sectionRef={faqRef} className="bg-secondary/30">
        {/* Header Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 mb-12">
          {/* Left Column - Intro */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={faqInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-sans block mb-4">
              Questions
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif mb-6">
              Extension<br />
              <em className="not-italic italic">FAQ</em>
            </h2>
            
            <div className="space-y-4 text-foreground/80 mb-8">
              <p>
                Everything you need to know about hair extensions and the Drop Dead Method. 
                Have more questions? Book a consultation and we'll answer them all.
              </p>
            </div>

            <Link
              to="/booking"
              className="group inline-flex items-center gap-3 bg-foreground text-background px-8 py-4 text-sm uppercase tracking-[0.15em] font-sans font-normal hover:bg-foreground/90 transition-all duration-300"
            >
              <span>Book A Consultation</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </motion.div>

          {/* Right Column - Search */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={faqInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 }}
            className="flex items-start"
          >
            <div className="w-full">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search extension questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Results count */}
              {searchQuery && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-muted-foreground mt-4"
                >
                  {filteredFaqs.length} {filteredFaqs.length === 1 ? 'result' : 'results'} found
                </motion.p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Full Width FAQ Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={faqInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1], delay: 0.3 }}
        >
          <Accordion type="single" collapsible className="space-y-3">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, index) => (
                <motion.div
                  key={faq.question}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <AccordionItem
                    value={`item-${index}`}
                    className="bg-background border border-border px-6 data-[state=open]:border-foreground/20 transition-all duration-300 hover:bg-secondary hover:border-foreground/20"
                  >
                    <AccordionTrigger className="text-left text-base md:text-lg font-medium py-5 hover:no-underline">
                      {highlightText(faq.question, searchQuery)}
                    </AccordionTrigger>
                    <AccordionContent className="text-foreground/80 pb-5 leading-relaxed">
                      {highlightText(faq.answer, searchQuery)}
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 text-muted-foreground"
              >
                <p className="text-lg mb-2">No matching questions found</p>
                <p className="text-sm">Try adjusting your search terms</p>
              </motion.div>
            )}
          </Accordion>
        </motion.div>
      </Section>
    </Layout>
  );
}
