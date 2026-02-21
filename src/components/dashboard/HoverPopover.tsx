import * as React from "react";
import { useRef, useState, useCallback, createContext, useContext } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

const CLOSE_DELAY = 150;

interface HoverHandlers {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const HoverPopoverContext = createContext<HoverHandlers | null>(null);

/** Hook for portal content to stay open on hover */
export function useHoverPopoverHandlers() {
  return useContext(HoverPopoverContext);
}

interface HoverPopoverProps {
  children: React.ReactNode;
  onClose?: () => void;
}

/**
 * A Popover that opens on hover instead of click.
 * The trigger area uses a wrapper div with mouse handlers.
 * Portal content (SidebarPopoverContent) should consume useHoverPopoverHandlers()
 * to keep the popover open while the cursor is over the flyout.
 */
export function HoverPopover({ children, onClose }: HoverPopoverProps) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const handleEnter = useCallback(() => {
    clearCloseTimer();
    setOpen(true);
  }, [clearCloseTimer]);

  const handleLeave = useCallback(() => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => {
      setOpen(false);
      onClose?.();
    }, CLOSE_DELAY);
  }, [clearCloseTimer, onClose]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        clearCloseTimer();
        setOpen(false);
        onClose?.();
      }
    },
    [clearCloseTimer, onClose],
  );

  const handlers: HoverHandlers = { onMouseEnter: handleEnter, onMouseLeave: handleLeave };

  return (
    <HoverPopoverContext.Provider value={handlers}>
      <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange}>
        <div onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
          {children}
        </div>
      </PopoverPrimitive.Root>
    </HoverPopoverContext.Provider>
  );
}
