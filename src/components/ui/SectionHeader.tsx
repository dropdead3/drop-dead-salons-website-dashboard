import { cn } from "@/lib/utils";
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
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        align === "center" && "text-center",
        className
      )}
    >
      {eyebrow && (
        <Eyebrow className={cn("text-muted-foreground mb-4", eyebrowClassName)}>
          {eyebrow}
        </Eyebrow>
      )}
      <h2
        className={cn(
          "font-display text-3xl md:text-4xl lg:text-5xl font-normal tracking-tight leading-[1.1]",
          titleClassName
        )}
      >
        {title}
        {titleHighlight && (
          <>
            {" "}
            <span className="italic font-light">{titleHighlight}</span>
          </>
        )}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-6 text-base md:text-lg text-muted-foreground font-sans font-light leading-relaxed max-w-2xl",
            align === "center" && "mx-auto",
            descriptionClassName
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
