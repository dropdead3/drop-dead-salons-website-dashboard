import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ChangelogFABProps {
  onClick: () => void;
}

export function ChangelogFAB({ onClick }: ChangelogFABProps) {
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      onClick={onClick}
      className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
      style={{
        boxShadow: '0 4px 14px 0 rgba(0, 0, 0, 0.25)',
      }}
    >
      <Plus className="h-6 w-6" />
    </motion.button>
  );
}
