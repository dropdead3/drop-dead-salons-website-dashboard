import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { Section } from "@/components/ui/section";
import { BeforeAfterSlider } from "./BeforeAfterSlider";
import { ImageWithSkeleton } from "@/components/ui/image-skeleton";
import { Images, ArrowRight } from "lucide-react";

// Gallery images - replace with real salon work
const galleryImages = [
  { 
    id: 1, 
    src: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&h=800&fit=crop",
    alt: "Blonde balayage transformation"
  },
  { 
    id: 2, 
    src: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=600&h=800&fit=crop",
    alt: "Creative color work"
  },
  { 
    id: 3, 
    src: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=800&fit=crop",
    alt: "Styled hair finish"
  },
];

// Before/after transformations
const transformations = [
  { 
    id: 1, 
    beforeImage: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=800&fit=crop",
    afterImage: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&h=800&fit=crop",
    beforeLabel: "Before", 
    afterLabel: "Balayage" 
  },
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-col gap-4"
        >
          <p className="text-sm text-muted-foreground font-sans max-w-xs">
            Real clients. Real transformations. See our artistry in action.
          </p>
          <Link
            to="/gallery"
            className="inline-flex items-center gap-2 text-sm font-sans font-medium text-foreground hover:text-foreground/70 transition-colors group w-fit"
          >
            <Images className="w-4 h-4" />
            <span>View gallery</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>

      <div
        ref={ref}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {/* Before/After Slider - Featured */}
        {transformations.map((transform, index) => (
          <motion.div
            key={`transform-${transform.id}`}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: index * 0.1 }}
          >
            <BeforeAfterSlider
              beforeImage={transform.beforeImage}
              afterImage={transform.afterImage}
              beforeLabel={transform.beforeLabel}
              afterLabel={transform.afterLabel}
              hoverMode={true}
            />
          </motion.div>
        ))}

        {/* Regular Gallery Images with Skeleton */}
        {galleryImages.map((image, index) => (
          <motion.div
            key={image.id}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: (index + transformations.length) * 0.1 }}
            className="relative aspect-[3/4] overflow-hidden group cursor-pointer"
          >
            <ImageWithSkeleton
              src={image.src}
              alt={image.alt}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              wrapperClassName="absolute inset-0"
            />
            
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-500" />

            {/* Hover reveal */}
            <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <span className="text-xs uppercase tracking-[0.15em] text-background font-sans bg-foreground px-2 py-1">
                View
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
