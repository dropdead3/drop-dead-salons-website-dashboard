import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isGrabbing, setIsGrabbing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only enable on devices with fine pointer (desktop)
    const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (!hasFinePointer) return;

    setIsVisible(true);

    const updatePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const isInteractiveElement = (target: HTMLElement) => {
      return (
        target.tagName === "A" ||
        target.tagName === "BUTTON" ||
        target.closest("a") ||
        target.closest("button") ||
        target.closest("[role='button']") ||
        target.classList.contains("cursor-pointer") ||
        target.classList.contains("cursor-grab") ||
        target.closest(".cursor-grab")
      );
    };

    const isGrabbableElement = (target: HTMLElement) => {
      return (
        target.classList.contains("cursor-grab") ||
        target.closest(".cursor-grab")
      );
    };

    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (isInteractiveElement(target)) {
        setIsHovering(true);
      }
    };

    const handleMouseLeave = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (isInteractiveElement(target)) {
        setIsHovering(false);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (isGrabbableElement(target)) {
        setIsGrabbing(true);
      }
    };

    const handleMouseUp = () => {
      setIsGrabbing(false);
    };

    window.addEventListener("mousemove", updatePosition);
    document.addEventListener("mouseover", handleMouseEnter);
    document.addEventListener("mouseout", handleMouseLeave);
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", updatePosition);
      document.removeEventListener("mouseover", handleMouseEnter);
      document.removeEventListener("mouseout", handleMouseLeave);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  if (!isVisible) return null;

  // Determine cursor size based on state
  const cursorSize = isGrabbing ? 16 : isHovering ? 24 : 20;
  const cursorOffset = cursorSize / 2;

  return (
    <motion.div
      className="fixed pointer-events-none z-[9999] mix-blend-difference"
      animate={{
        x: position.x - cursorOffset,
        y: position.y - cursorOffset,
      }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 28,
        mass: 0.5,
      }}
    >
      {isGrabbing ? (
        // Grabbing state - compressed/squeezed indicator
        <motion.div
          className="relative"
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.1 }}
        >
          {/* Grabbing indicator - 4 dots in a grip pattern */}
          <svg width="16" height="16" viewBox="0 0 16 16" className="text-white">
            <circle cx="5" cy="5" r="2" fill="currentColor" />
            <circle cx="11" cy="5" r="2" fill="currentColor" />
            <circle cx="5" cy="11" r="2" fill="currentColor" />
            <circle cx="11" cy="11" r="2" fill="currentColor" />
          </svg>
        </motion.div>
      ) : isHovering ? (
        // Pulsating dot on hover
        <motion.div
          className="relative"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.15 }}
        >
          {/* Pulsating ring */}
          <motion.div
            className="absolute inset-0 rounded-full bg-white"
            animate={{
              scale: [1, 1.8, 1],
              opacity: [0.6, 0, 0.6],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ width: 24, height: 24 }}
          />
          {/* Center dot */}
          <motion.div
            className="w-6 h-6 rounded-full bg-white"
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      ) : (
        // X cursor for default state
        <svg width="20" height="20" viewBox="0 0 20 20" className="text-white">
          <line
            x1="4"
            y1="4"
            x2="16"
            y2="16"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1="16"
            y1="4"
            x2="4"
            y2="16"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      )}
    </motion.div>
  );
}
