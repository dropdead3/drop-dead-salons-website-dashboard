import { useState, useEffect } from "react";

interface TypewriterTextProps {
  text: string;
  isInView: boolean;
  delay?: number;
  speed?: number;
  className?: string;
}

export function TypewriterText({ 
  text, 
  isInView, 
  delay = 0, 
  speed = 120, 
  className = ""
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (isInView && !hasStarted) {
      const startTimeout = setTimeout(() => {
        setHasStarted(true);
      }, delay);
      return () => clearTimeout(startTimeout);
    }
  }, [isInView, delay, hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    let currentIndex = 0;
    
    const typeNextChar = () => {
      if (currentIndex <= text.length) {
        setDisplayedText(text.slice(0, currentIndex));
        currentIndex++;
        // Vary speed by ±30% for natural feel
        const variance = speed * 0.3;
        const nextDelay = speed + (Math.random() * variance * 2 - variance);
        setTimeout(typeNextChar, nextDelay);
      }
    };
    
    typeNextChar();
  }, [hasStarted, text, speed]);

  return (
    <span className={`inline-block ${className}`}>
      {displayedText}
    </span>
  );
}
