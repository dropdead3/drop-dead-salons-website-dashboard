import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Star, ArrowRight } from "lucide-react";

const reviews = [
  {
    title: "Love this place!",
    author: "Lexi V.",
    text: "I love Drop Dead! The owner picks literally THE BEST hair stylist and lash and brow artists. You really can't go wrong with going to anyone inside the studio, everyone is so welcoming and friendly.",
  },
  {
    title: "You won't be disappointed",
    author: "Melissa C.",
    text: "The salon itself is beautiful and so unique. The atmosphere is comforting and fun!! Never have I loved my hair this much!! Definitely recommend to anyone wanting to a new salon!! You won't be disappointed.",
  },
  {
    title: "Best wefts ever!!",
    author: "Lexi K.",
    text: "I have loved every product from Drop Dead so far. I wear them myself and I also use them on my clients. My clients love everything too!! These new SuperWefts are amazing. So comfortable, flat, customizable and easy to color!",
  },
  {
    title: "Best extensions",
    author: "Darian F.",
    text: "These extensions were so easily filled my clients hair long. It took very little cutting with the hair and I'm obsessed with the product.",
  },
  {
    title: "Absolutely stunning results",
    author: "Morgan S.",
    text: "I've been going to Drop Dead for over a year now and every single visit has been incredible. The attention to detail and care they put into every service is unmatched.",
  },
  {
    title: "Hair transformation goals",
    author: "Jamie L.",
    text: "Went from damaged, over-processed hair to the healthiest it's ever been. The team really knows their stuff and takes the time to educate you on proper hair care.",
  },
];

const StarRating = () => (
  <div className="flex gap-0.5">
    {[...Array(5)].map((_, i) => (
      <Star key={i} className="w-4 h-4 fill-oat text-oat" />
    ))}
  </div>
);

const ReviewCard = ({ review }: { review: typeof reviews[0] }) => (
  <div className="flex-shrink-0 w-[320px] md:w-[380px] bg-background border border-border p-6 md:p-8">
    <h3 className="text-xl md:text-2xl font-display mb-4">{review.title}</h3>
    
    <div className="flex items-center gap-3 mb-3">
      <span className="text-sm font-medium">{review.author}</span>
      <span className="text-xs text-muted-foreground">Verified Customer</span>
    </div>
    
    <div className="mb-4">
      <StarRating />
    </div>
    
    <p className="text-sm text-foreground/80 leading-relaxed">
      {review.text}
    </p>
  </div>
);

export function TestimonialSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const [isPaused, setIsPaused] = useState(false);

  // Duplicate reviews for seamless infinite scroll
  const duplicatedReviews = [...reviews, ...reviews];

  return (
    <section 
      ref={sectionRef} 
      className="py-20 lg:py-32 overflow-hidden"
    >
      {/* Header */}
      <div className="container mx-auto px-6 mb-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-3xl md:text-4xl lg:text-5xl font-display"
          >
            Hundreds of happy<br />5-star reviews
          </motion.h2>
          
          <motion.a
            href="https://g.page/r/YOUR_GOOGLE_REVIEW_LINK"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 text-sm font-medium link-underline group"
          >
            Leave a review
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </motion.a>
        </div>
      </div>

      {/* Infinite Scrolling Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Left fade gradient */}
        <div className="absolute left-0 top-0 bottom-0 w-32 md:w-64 lg:w-80 bg-gradient-to-r from-background via-background/80 to-transparent z-10 pointer-events-none" />
        
        {/* Right fade gradient */}
        <div className="absolute right-0 top-0 bottom-0 w-32 md:w-64 lg:w-80 bg-gradient-to-l from-background via-background/80 to-transparent z-10 pointer-events-none" />
        
        <div 
          className="flex gap-4"
          style={{
            animation: `scroll 60s linear infinite`,
            animationPlayState: isPaused ? 'paused' : 'running',
            width: 'max-content',
          }}
        >
          {duplicatedReviews.map((review, index) => (
            <ReviewCard key={index} review={review} />
          ))}
        </div>
      </motion.div>

      <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </section>
  );
}
