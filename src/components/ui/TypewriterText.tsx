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
    const interval = setInterval(() => {
      if (currentIndex <= text.length) {
        setDisplayedText(text.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [hasStarted, text, speed]);

  return (
    <span className={`inline-block ${className}`}>
      {displayedText}
    </span>
  );
}
