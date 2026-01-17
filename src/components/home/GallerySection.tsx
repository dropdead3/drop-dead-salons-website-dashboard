import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Section } from "@/components/ui/section";

// Placeholder images - will be replaced with real salon work
const galleryImages = [
  { id: 1, aspect: "portrait" },
  { id: 2, aspect: "portrait" },
  { id: 3, aspect: "portrait" },
  { id: 4, aspect: "portrait" },
];

export function GallerySection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <Section>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="font-serif text-3xl md:text-4xl lg:text-5xl font-normal text-foreground"
        >
          Work That Speaks
          <br />
          <span className="italic font-light">for Itself.</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-sm text-muted-foreground font-sans max-w-xs"
        >
          Real clients. Real transformations. See our artistry in action.
        </motion.p>
      </div>

      <div
        ref={ref}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {galleryImages.map((image, index) => (
          <motion.div
            key={image.id}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="relative aspect-[3/4] overflow-hidden group cursor-pointer"
          >
            {/* Placeholder with gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-muted to-secondary" />
            
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-500" />
            
            {/* Placeholder text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground/60 font-sans">
                Image {image.id}
              </span>
            </div>

            {/* Hover reveal */}
            <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <span className="text-xs uppercase tracking-[0.15em] text-foreground font-sans">
                View
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
