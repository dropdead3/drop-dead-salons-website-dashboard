import * as React from 'react';
import { cn } from '@/lib/utils';

interface PlatformCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'elevated' | 'interactive';
  glow?: boolean;
}

const PlatformCard = React.forwardRef<HTMLDivElement, PlatformCardProps>(
  ({ className, variant = 'default', glow = false, children, ...props }, ref) => {
    const variants = {
      default: 'bg-slate-800/50 border-slate-700/50',
      glass: 'platform-glass',
      elevated: 'bg-slate-800/70 border-slate-600/50 shadow-xl',
      interactive: 'bg-slate-800/50 border-slate-700/50 platform-card-hover transition-all duration-300',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl border backdrop-blur-xl',
          variants[variant],
          glow && 'platform-glow-sm',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
PlatformCard.displayName = 'PlatformCard';

interface PlatformCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const PlatformCardHeader = React.forwardRef<HTMLDivElement, PlatformCardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  )
);
PlatformCardHeader.displayName = 'PlatformCardHeader';

interface PlatformCardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const PlatformCardTitle = React.forwardRef<HTMLHeadingElement, PlatformCardTitleProps>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        'text-xl font-semibold leading-none tracking-tight text-white',
        className
      )}
      {...props}
    />
  )
);
PlatformCardTitle.displayName = 'PlatformCardTitle';

interface PlatformCardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const PlatformCardDescription = React.forwardRef<HTMLParagraphElement, PlatformCardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-slate-400', className)}
      {...props}
    />
  )
);
PlatformCardDescription.displayName = 'PlatformCardDescription';

interface PlatformCardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const PlatformCardContent = React.forwardRef<HTMLDivElement, PlatformCardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
PlatformCardContent.displayName = 'PlatformCardContent';

interface PlatformCardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const PlatformCardFooter = React.forwardRef<HTMLDivElement, PlatformCardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  )
);
PlatformCardFooter.displayName = 'PlatformCardFooter';

export {
  PlatformCard,
  PlatformCardHeader,
  PlatformCardTitle,
  PlatformCardDescription,
  PlatformCardContent,
  PlatformCardFooter,
};
