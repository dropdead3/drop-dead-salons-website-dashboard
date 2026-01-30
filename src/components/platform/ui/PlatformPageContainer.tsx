import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Platform Page Container
 * 
 * Design Rule: All platform dashboard pages use consistent padding:
 * - Desktop: px-8 py-8 (32px all sides)
 * - Mobile: px-4 py-6 (16px horizontal, 24px vertical)
 * - Max width: 1600px centered
 * 
 * This creates breathing room and visual consistency across all platform pages.
 */

interface PlatformPageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional max-width constraint. Defaults to 'default' (1600px) */
  maxWidth?: 'default' | 'narrow' | 'wide' | 'full';
}

const maxWidthClasses = {
  default: 'max-w-[1600px]',
  narrow: 'max-w-4xl',
  wide: 'max-w-[1800px]',
  full: 'max-w-none',
};

const PlatformPageContainer = React.forwardRef<HTMLDivElement, PlatformPageContainerProps>(
  ({ className, maxWidth = 'default', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Consistent padding: mobile-first responsive
          'px-4 py-6 sm:px-6 sm:py-8 lg:px-8',
          // Max width with centering
          maxWidthClasses[maxWidth],
          'mx-auto w-full',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
PlatformPageContainer.displayName = 'PlatformPageContainer';

export { PlatformPageContainer };
