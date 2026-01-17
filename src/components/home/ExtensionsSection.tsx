import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Section } from "@/components/ui/section";
import { ArrowRight, Star, Award, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

export function ExtensionsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const features = [
    {
      icon: Star,
      title: "Hidden & Seamless",
      description: "Invisible beaded rows that lay completely flat against your scalp"
    },
    {
      icon: Award,
      title: "Maximum Comfort",
      description: "No tension, no damage—designed for all-day wearability"
    },
    {
      icon: MapPin,
      title: "Nationwide Education",
      description: "We train salons across the country who proudly showcase our method"
    }
  ];

  return (
    <Section className="bg-foreground text-background overflow-hidden">
      <div ref={ref} className="relative">
        {/* Background accent */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={isInView ? { opacity: 0.03, scale: 1 } : {}}
          transition={{ duration: 1.2 }}
          className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-oat blur-3xl pointer-events-none"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center relative">
          {/* Left side - Content */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-oat/20 border border-oat/30"
            >
              <Star className="w-4 h-4 fill-oat text-oat" />
              <span className="text-sm font-medium tracking-wide text-oat">OUR SIGNATURE</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="font-serif text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight leading-[1.1]"
            >
              The Drop Dead
              <br />
              <span className="italic font-light text-oat">Method</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg md:text-xl font-sans font-light leading-relaxed text-background/80 max-w-xl"
            >
              The most versatile and comfortable hidden beaded row method available. 
              Our proprietary technique delivers flawless, natural-looking extensions 
              that move and feel like your own hair.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="space-y-4"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-oat/20 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-oat" />
                  </div>
                  <div>
                    <h3 className="font-medium text-background mb-1">{feature.title}</h3>
                    <p className="text-sm text-background/60">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="flex flex-wrap gap-4 pt-4"
            >
              <Link
                to="/booking"
                className="group inline-flex items-center gap-3 bg-oat text-oat-foreground px-6 py-3.5 text-sm font-medium tracking-wide hover:bg-oat/90 transition-all duration-300"
              >
                <span>BOOK EXTENSION CONSULT</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                to="/services"
                className="group inline-flex items-center gap-3 border border-background/30 text-background px-6 py-3.5 text-sm font-medium tracking-wide hover:bg-background/10 transition-all duration-300"
              >
                <span>LEARN MORE</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </div>

          {/* Right side - Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 1, delay: 0.3 }}
            className="relative"
          >
            <div className="relative aspect-[4/5] overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=1000&fit=crop"
                alt="Beautiful hair extensions by Drop Dead Salon"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 via-transparent to-transparent" />
              
              {/* Floating badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="absolute bottom-6 left-6 right-6 bg-background/95 backdrop-blur-sm p-5"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Award className="w-5 h-5 text-oat-foreground" />
                  <span className="text-xs tracking-[0.2em] text-muted-foreground uppercase">Nationwide Educators</span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  Salons across the country travel to learn and proudly showcase the Drop Dead Method.
                </p>
              </motion.div>
            </div>

            {/* Decorative element */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={isInView ? { opacity: 0.6, x: 0 } : {}}
              transition={{ duration: 1, delay: 0.5 }}
              className="absolute -top-4 -right-4 w-24 h-24 border border-oat/40"
            />
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 0.6, x: 0 } : {}}
              transition={{ duration: 1, delay: 0.6 }}
              className="absolute -bottom-4 -left-4 w-32 h-32 border border-oat/40"
            />
          </motion.div>
        </div>
      </div>
    </Section>
  );
}
