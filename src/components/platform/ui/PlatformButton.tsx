import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const platformButtonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/25 hover:from-violet-500 hover:to-purple-500 hover:shadow-violet-500/40',
        secondary:
          'bg-slate-700/60 text-slate-100 hover:bg-slate-600/60 border border-slate-600/50',
        outline:
          'border border-slate-600/50 bg-transparent text-slate-300 hover:bg-slate-800/50 hover:text-white hover:border-slate-500/50',
        ghost:
          'text-slate-400 hover:text-white hover:bg-slate-800/50',
        destructive:
          'bg-red-600/80 text-white hover:bg-red-500/80 shadow-lg shadow-red-500/20',
        link:
          'text-violet-400 underline-offset-4 hover:underline hover:text-violet-300',
        glow:
          'bg-gradient-to-r from-violet-600 to-purple-600 text-white platform-button-glow hover:from-violet-500 hover:to-purple-500',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-8 text-base',
        xl: 'h-14 px-10 text-lg',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface PlatformButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof platformButtonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const PlatformButton = React.forwardRef<HTMLButtonElement, PlatformButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(platformButtonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
PlatformButton.displayName = 'PlatformButton';

export { PlatformButton, platformButtonVariants };
