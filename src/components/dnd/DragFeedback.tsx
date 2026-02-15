import * as React from 'react';
import { cn } from '@/lib/utils';

export type DragFeedbackProps = React.HTMLAttributes<HTMLDivElement> & {
  isDragging?: boolean;
  isOver?: boolean;
  children: React.ReactNode;
};

export const DragFeedback = React.forwardRef<HTMLDivElement, DragFeedbackProps>(
  ({ isDragging, isOver, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        {...props}
        className={cn(
          'transition-[transform,opacity,box-shadow] duration-150 ease-out',
          isDragging && 'scale-[1.02] opacity-90 shadow-[0_18px_40px_-22px_hsl(var(--foreground)/0.35)]',
          isOver && 'ring-2 ring-primary/30',
          className
        )}
      >
        {children}
      </div>
    );
  }
);
DragFeedback.displayName = 'DragFeedback';

