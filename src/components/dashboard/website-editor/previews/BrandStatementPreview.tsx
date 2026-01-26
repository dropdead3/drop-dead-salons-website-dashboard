import { useState, useEffect } from 'react';
import { Eyebrow } from '@/components/ui/Eyebrow';
import type { BrandStatementConfig } from '@/hooks/useSectionConfig';

interface BrandStatementPreviewProps {
  config: BrandStatementConfig;
}

export function BrandStatementPreview({ config }: BrandStatementPreviewProps) {
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

  // Reset on words change
  useEffect(() => {
    setCurrentWordIndex(0);
    setDisplayText("");
    setIsDeleting(false);
  }, [config.rotating_words]);

  return (
    <section className="py-20 bg-background" data-theme="light">
      <div className="container mx-auto px-6">
        <div 
          data-theme="dark"
          className="bg-foreground text-background rounded-2xl p-12 md:p-20 lg:p-24"
        >
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-8 lg:gap-12 items-center">
            {/* Left side - Title */}
            <div>
              <Eyebrow className="text-background/60 mb-4">
                {config.eyebrow}
              </Eyebrow>
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-normal tracking-tight leading-[1.1]">
                {config.headline_prefix}
                <br />
                <span className="font-light">{displayText}</span>
                <br />
                <span className="font-light">{config.headline_suffix}</span>
              </h2>
            </div>

            {/* Right side - Description */}
            <div className="space-y-6">
              {config.paragraphs.map((paragraph, index) => (
                <p 
                  key={index}
                  className="text-base md:text-lg font-sans font-light leading-relaxed text-background/80"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
