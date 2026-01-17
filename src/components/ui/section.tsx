import { ReactNode, RefObject } from "react";
import { cn } from "@/lib/utils";

interface SectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
  sectionRef?: RefObject<HTMLElement>;
}

export function Section({ children, className, id, sectionRef }: SectionProps) {
  return (
    <section
      ref={sectionRef}
      id={id}
      className={cn("py-20 lg:py-32", className)}
    >
      <div className="container mx-auto px-6 lg:px-12">
        {children}
      </div>
    </section>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  align = "center",
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "mb-12 lg:mb-16",
        align === "center" && "text-center",
        className
      )}
    >
      <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium tracking-tight text-foreground">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-muted-foreground font-sans text-base lg:text-lg max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
}
