import { useState, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import type { FAQConfig } from '@/hooks/useSectionConfig';

interface FAQPreviewProps {
  config: FAQConfig;
}

export function FAQPreview({ config }: FAQPreviewProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  useEffect(() => {
    if (config.rotating_words.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % config.rotating_words.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [config.rotating_words.length]);

  useEffect(() => {
    setCurrentWordIndex(0);
  }, [config.rotating_words]);

  const currentWord = config.rotating_words[currentWordIndex] || 'Asked';

  // Sample FAQ items for preview
  const sampleFAQs = [
    { question: 'How do I book an appointment?', answer: 'Sample answer...' },
    { question: 'What services do you offer?', answer: 'Sample answer...' },
    { question: 'What is your cancellation policy?', answer: 'Sample answer...' },
  ];

  return (
    <section data-theme="light" className="bg-background py-20 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Animated Headline */}
        <h2 className="font-display text-4xl md:text-5xl text-center text-foreground leading-tight mb-8">
          <span className="block">Frequently</span>
          <span className="block text-muted-foreground">{currentWord}</span>
        </h2>

        {/* Intro Paragraphs */}
        <div className="space-y-4 text-center max-w-2xl mx-auto mb-10">
          {config.intro_paragraphs.map((paragraph, index) => (
            <p key={index} className="text-sm text-muted-foreground leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Search Bar (if enabled) */}
        {config.show_search_bar && (
          <div className="relative max-w-md mx-auto mb-10">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={config.search_placeholder || "Search FAQs..."}
              className="w-full pl-10 pr-4 py-3 bg-muted/50 border border-border rounded-full text-sm"
              disabled
            />
          </div>
        )}

        {/* Sample FAQ Accordions */}
        <div className="space-y-3 mb-10">
          {sampleFAQs.map((faq, index) => (
            <div key={index} className="border border-border rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{faq.question}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button className="px-6 py-3 bg-foreground text-background rounded-full text-sm font-medium">
            {config.cta_primary_text}
          </button>
          <button className="px-6 py-3 border border-foreground text-foreground rounded-full text-sm font-medium">
            {config.cta_secondary_text}
          </button>
        </div>
      </div>
    </section>
  );
}
