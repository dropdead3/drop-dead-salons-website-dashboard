import { useState, useEffect } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import type { NewClientConfig } from '@/hooks/useSectionConfig';

interface NewClientPreviewProps {
  config: NewClientConfig;
}

export function NewClientPreview({ config }: NewClientPreviewProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (config.rotating_words.length === 0) return;

    const currentWord = config.rotating_words[currentWordIndex];
    const baseTypingSpeed = 100;
    const baseDeletingSpeed = 60;
    const pauseDuration = 2500;

    let timeout: NodeJS.Timeout;

    if (!isDeleting) {
      if (displayText.length < currentWord.length) {
        timeout = setTimeout(() => {
          setDisplayText(currentWord.slice(0, displayText.length + 1));
        }, baseTypingSpeed);
      } else {
        timeout = setTimeout(() => {
          setIsDeleting(true);
        }, pauseDuration);
      }
    } else {
      if (displayText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, baseDeletingSpeed);
      } else {
        setIsDeleting(false);
        setCurrentWordIndex((prev) => (prev + 1) % config.rotating_words.length);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentWordIndex, config.rotating_words]);

  useEffect(() => {
    setCurrentWordIndex(0);
    setDisplayText("");
    setIsDeleting(false);
  }, [config.rotating_words]);

  return (
    <section 
      className="py-12 md:py-16 pb-16 md:pb-20 lg:pb-24 relative z-10"
      style={{ 
        background: 'linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--secondary)) 100%)' 
      }}
    >
      <div className="container mx-auto px-6">
        <div 
          data-theme="light"
          className="relative rounded-t-2xl p-12 md:p-16 lg:p-20 pb-20 md:pb-28 lg:pb-36 overflow-visible"
          style={{ 
            background: 'linear-gradient(180deg, hsl(var(--secondary)) 0%, hsl(var(--secondary)) 70%, transparent 100%)'
          }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10 lg:gap-16">
            {/* Content */}
            <div className="flex-1 max-w-2xl">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-display mb-6">
                <span className="whitespace-nowrap">{config.headline_prefix}</span>{" "}
                <span className="inline-block min-w-[180px] md:min-w-[220px]">{displayText}</span>
              </h2>
              
              <p className="text-foreground/80 text-base md:text-lg leading-relaxed mb-8">
                {config.description}
              </p>

              {/* Benefits */}
              <div className="flex flex-wrap gap-3">
                {config.benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-background border border-oat/60 rounded-full px-4 py-2.5 text-sm"
                  >
                    <Check className="w-4 h-4 text-green-600" />
                    {benefit}
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="lg:flex-shrink-0">
              <button className="group w-full lg:w-auto inline-flex items-center justify-center gap-3 bg-foreground text-background px-8 py-4 rounded-full text-base font-medium transition-all duration-300">
                {config.cta_text}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
