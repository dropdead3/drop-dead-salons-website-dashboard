import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type FormSuccessProps = {
  title?: string;
  description?: string;
  className?: string;
  action?: React.ReactNode;
};

export function FormSuccess({
  title = 'Complete',
  description,
  className,
  action,
}: FormSuccessProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className={cn('py-2', className)}>
      <div className="mx-auto flex max-w-sm flex-col items-center text-center">
        <motion.div
          initial={reduceMotion ? false : { scale: 0.92, opacity: 0 }}
          animate={reduceMotion ? undefined : { scale: 1, opacity: 1 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-border/60 bg-muted/30"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <motion.path
              d="M20 6L9 17l-5-5"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
              animate={reduceMotion ? undefined : { pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.28, ease: 'easeOut', delay: 0.05 }}
              className="text-primary"
            />
          </svg>
        </motion.div>

        <h3 className="font-display text-sm tracking-[0.14em] uppercase text-foreground">{title}</h3>
        {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
        {action && <div className="mt-5">{action}</div>}
      </div>
    </div>
  );
}

