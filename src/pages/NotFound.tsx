import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function PixelZMark({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  const cells = [
    // 7x7 "Z"
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

export default function NotFound() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-8 rounded-2xl border border-border/50 bg-card/40 px-8 py-7">
          <PixelZMark className="mx-auto" />
        </div>

        <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground">404</p>
        <h1 className="mt-3 font-display text-xl tracking-[0.16em] uppercase">
          Page not found
        </h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          The route <span className="text-foreground/80">{location.pathname}</span> does not exist.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => {
              if (window.history.length > 1) navigate(-1);
              else navigate('/dashboard');
            }}
          >
            Go back
          </Button>
          <Button onClick={() => navigate('/dashboard')}>Go home</Button>
        </div>
      </div>
    </div>
  );
}
