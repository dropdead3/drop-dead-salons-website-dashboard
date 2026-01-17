import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Section, SectionHeader } from "@/components/ui/section";

// Placeholder images - will be replaced with real salon work
const galleryImages = [
  { id: 1, aspect: "portrait" },
  { id: 2, aspect: "portrait" },
  { id: 3, aspect: "landscape" },
  { id: 4, aspect: "portrait" },
  { id: 5, aspect: "landscape" },
  { id: 6, aspect: "portrait" },
];

export function GallerySection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <Section className="bg-secondary">
      <SectionHeader
        title="Work That Speaks for Itself"
        subtitle="Real clients. Real transformations."
      />

      <div
        ref={ref}
        className="grid grid-cols-2 md:grid-cols-3 gap-3 lg:gap-4"
      >
        {galleryImages.map((image, index) => (
          <motion.div
            key={image.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: index * 0.08 }}
            className={`relative overflow-hidden group ${
              image.aspect === "landscape"
                ? "col-span-2 aspect-[16/9]"
                : "aspect-[3/4]"
            }`}
          >
            {/* Placeholder with gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-muted to-background" />
            
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-500" />
            
            {/* Placeholder text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground/40 font-sans">
                Image {image.id}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
