import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface TypewriterTextProps {
  text: string;
  isInView: boolean;
  delay?: number;
  speed?: number;
  cursorDuration?: number;
  className?: string;
}

export function TypewriterText({ 
  text, 
  isInView, 
  delay = 0, 
  speed = 120, 
  cursorDuration = 3000,
  className = ""
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showCursor, setShowCursor] = useState(false);

  useEffect(() => {
    if (isInView && !hasStarted) {
      const startTimeout = setTimeout(() => {
        setHasStarted(true);
        setShowCursor(true);
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
        setIsComplete(true);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [hasStarted, text, speed]);

  // Hide cursor after cursorDuration once typing is complete
  useEffect(() => {
    if (isComplete && showCursor) {
      const cursorTimeout = setTimeout(() => {
        setShowCursor(false);
      }, cursorDuration);
      return () => clearTimeout(cursorTimeout);
    }
  }, [isComplete, showCursor, cursorDuration]);

  return (
    <span className={`inline-block ${className}`}>
      {displayedText}
      {showCursor && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="inline-block w-[3px] h-[0.9em] bg-current ml-0.5 align-middle"
        />
      )}
    </span>
  );
}
