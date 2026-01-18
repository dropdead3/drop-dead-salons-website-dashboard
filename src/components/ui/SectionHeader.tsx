import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Eyebrow } from "./Eyebrow";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  titleHighlight?: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
  eyebrowClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  animate?: boolean;
  isInView?: boolean;
}

export function SectionHeader({
  eyebrow,
  title,
  titleHighlight,
  description,
  align = "left",
  className,
  eyebrowClassName,
  titleClassName,
  descriptionClassName,
  animate = false,
  isInView = true,
}: SectionHeaderProps) {
  const MotionWrapper = animate ? motion.div : "div";
  
  const editorialEasing = [0.25, 0.1, 0.25, 1] as const;
  
  const baseAnimation = animate ? {
    initial: { opacity: 0, y: 20 },
    animate: isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 },
    transition: { duration: 0.8, ease: editorialEasing }
  } : {};

  return (
    <div
      className={cn(
        align === "center" && "text-center",
        className
      )}
    >
      {eyebrow && (
        <MotionWrapper {...baseAnimation}>
          <Eyebrow className={cn("text-muted-foreground mb-4", eyebrowClassName)}>
            {eyebrow}
          </Eyebrow>
        </MotionWrapper>
      )}
      <MotionWrapper 
        {...(animate ? {
          ...baseAnimation,
          transition: { duration: 0.8, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }
        } : {})}
      >
        <h2
          className={cn(
            "font-display text-3xl md:text-4xl lg:text-5xl font-normal tracking-tight leading-[1.1]",
            titleClassName
          )}
        >
          {title}
          {titleHighlight && (
            <>
              <br />
              <span className="italic font-light">{titleHighlight}</span>
            </>
          )}
        </h2>
      </MotionWrapper>
      {description && (
        <MotionWrapper 
          {...(animate ? {
            ...baseAnimation,
            transition: { duration: 0.8, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }
          } : {})}
        >
          <p
            className={cn(
              "mt-6 text-base md:text-lg text-muted-foreground font-sans font-light leading-relaxed max-w-2xl",
              align === "center" && "mx-auto",
              descriptionClassName
            )}
          >
            {description}
          </p>
        </MotionWrapper>
      )}
    </div>
  );
}
