import { cn } from "@/lib/utils";

interface EyebrowProps {
  children: React.ReactNode;
  className?: string;
}

export function Eyebrow({ children, className }: EyebrowProps) {
  return (
    <span
      className={cn(
        "text-xs uppercase tracking-[0.2em] block",
        className
      )}
      style={{ fontFamily: "'Termina', sans-serif" }}
    >
      {children}
    </span>
  );
}
