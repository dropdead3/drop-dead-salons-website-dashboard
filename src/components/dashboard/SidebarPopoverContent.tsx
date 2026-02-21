import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";

const SidebarPopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "start", sideOffset = 16, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      side="right"
      align={align}
      sideOffset={sideOffset}
      className={cn(
        // Base popover
        "z-50 w-56 rounded-lg p-1 outline-none",
        "bg-card/95 backdrop-blur-xl",
        "border border-border/50",
        // Shadow that bleeds leftward toward sidebar
        "shadow-[−8px_4px_24px_-4px_hsl(var(--foreground)/0.08),0_8px_20px_-6px_hsl(var(--foreground)/0.12)]",
        // Arrow connector via ::before pseudo-element
        "before:absolute before:-left-[6px] before:top-[14px]",
        "before:w-[6px] before:h-[12px]",
        "before:bg-card/95 before:backdrop-blur-xl",
        "before:[clip-path:polygon(100%_0,100%_100%,0_50%)]",
        // Animate in
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[side=right]:slide-in-from-left-2",
        className,
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
SidebarPopoverContent.displayName = "SidebarPopoverContent";

export { SidebarPopoverContent };
