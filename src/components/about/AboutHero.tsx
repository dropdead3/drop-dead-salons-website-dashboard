import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const rotatingWords = [
  "A Movement",
  "A Community",
  "A Support System",
  "A Space to Grow",
  "Your Path to Success"
];

export function AboutHero() {
  const [displayText, setDisplayText] = useState("");
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = rotatingWords[currentWordIndex];
    
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (displayText.length < currentWord.length) {
          setDisplayText(currentWord.slice(0, displayText.length + 1));
        } else {
          // Pause before deleting
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        if (displayText.length > 0) {
          setDisplayText(displayText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setCurrentWordIndex((prev) => (prev + 1) % rotatingWords.length);
        }
      }
    }, isDeleting ? 50 : 80);

    return () => clearTimeout(timeout);
  }, [displayText, currentWordIndex, isDeleting]);

  return (
    <section className="pt-32 pb-16 md:pt-40 md:pb-24 bg-background">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="max-w-4xl mx-auto text-center"
        >
          <span className="inline-block text-xs uppercase tracking-[0.25em] text-muted-foreground mb-6 font-display">
            Our Story
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display leading-tight">
            More Than a Salon
          </h1>
          <div className="flex justify-center my-6">
            <div className="w-16 h-[2px] bg-foreground/40"></div>
          </div>
          <div className="min-h-[5.5rem] md:min-h-[7.5rem] lg:min-h-[9rem] flex items-start justify-center mb-6">
            <span className="text-4xl md:text-5xl lg:text-6xl font-display text-foreground text-center">
              {displayText}
            </span>
          </div>
          <p className="text-lg md:text-xl text-foreground/60 max-w-2xl mx-auto leading-relaxed">
            Drop Dead was born from a belief that great hair should come with an 
            unforgettable experience. We're redefining what it means to feel beautiful.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
