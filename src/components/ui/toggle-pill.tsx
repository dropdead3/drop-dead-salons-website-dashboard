import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TogglePillOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  tooltip?: string;
}

interface TogglePillProps {
  options: TogglePillOption[];
  value: string;
  onChange: (value: string) => void;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "solid" | "glass";
  className?: string;
  id?: string;
}

const sizeClasses = {
  sm: "text-xs px-3 py-1.5",
  default: "text-sm px-4 py-2",
  lg: "text-base px-5 py-2.5",
};

const containerSizeClasses = {
  sm: "p-1 gap-0.5",
  default: "p-1 gap-1",
  lg: "p-1.5 gap-1",
};

const variantClasses = {
  default: "bg-muted/50 backdrop-blur-sm",
  solid: "bg-muted",
  glass: "bg-foreground/10 backdrop-blur-md",
};

export function TogglePill({
  options,
  value,
  onChange,
  size = "default",
  variant = "solid",
  className,
  id,
}: TogglePillProps) {
  // Generate a stable unique ID for this instance
  const instanceId = React.useId();
  const layoutId = id || instanceId;

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "inline-flex items-center rounded-full relative",
          containerSizeClasses[size],
          variantClasses[variant],
          className
        )}
      >
        {options.map((option) => {
          const isSelected = option.value === value;
          
          const buttonContent = (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={cn(
                "relative z-10 flex items-center justify-center gap-1.5 rounded-full font-medium transition-colors duration-200",
                sizeClasses[size],
                isSelected
                  ? "text-background"
                  : "text-foreground/60 hover:text-foreground/80"
              )}
            >
              {isSelected && (
                <motion.div
                  layoutId={`toggle-pill-active-${layoutId}`}
                  className="absolute inset-0 bg-foreground rounded-full"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 35,
                  }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {option.icon}
                {option.label}
              </span>
            </button>
          );

          if (option.tooltip) {
            return (
              <Tooltip key={option.value}>
                <TooltipTrigger asChild>
                  {buttonContent}
                </TooltipTrigger>
                <TooltipContent className="text-center">
                  {option.tooltip.split('\n').map((line, i) => (
                    <p key={i} className={i > 0 ? "text-muted-foreground text-xs mt-0.5" : "font-medium"}>{line}</p>
                  ))}
                </TooltipContent>
              </Tooltip>
            );
          }

          return buttonContent;
        })}
      </div>
    </TooltipProvider>
  );
}
