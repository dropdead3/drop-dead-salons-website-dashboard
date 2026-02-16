import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function PixelZMark({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  const cells = [
    '1111111',
    '0000011',
    '0000110',
    '0001100',
    '0011000',
    '0110000',
    '1111111',
  ];

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
      className={cn('grid grid-cols-7 gap-1.5', className)}
      aria-hidden="true"
    >
      {cells.flatMap((row, r) =>
        row.split('').map((c, i) => (
          <motion.span
            key={`${r}-${i}`}
            className={cn(
              'h-3.5 w-3.5 rounded-[4px] border',
              c === '1'
                ? 'bg-foreground/90 border-foreground/15 shadow-[0_1px_0_rgba(0,0,0,0.25)]'
                : 'bg-transparent border-border/40'
            )}
            animate={
              reduceMotion || c !== '1'
                ? undefined
                : { y: [0, -2, 0], opacity: [0.9, 1, 0.9] }
            }
            transition={
              reduceMotion || c !== '1'
                ? undefined
                : { duration: 3.2, repeat: Infinity, delay: (r * 7 + i) * 0.03 }
            }
          />
        ))
      )}
    </motion.div>
  );
}
