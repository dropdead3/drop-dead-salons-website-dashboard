import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BadgePosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
export type BadgeStyle = 'glass' | 'solid' | 'outline';

interface KioskLocationBadgeProps {
  locationName: string;
  position: BadgePosition;
  style: BadgeStyle;
  textColor: string;
  accentColor: string;
}

function getBadgeStyle(
  style: BadgeStyle,
  textColor: string,
  accentColor: string
) {
  switch (style) {
    case 'solid':
      return {
        backgroundColor: accentColor,
        color: textColor,
      };
    case 'outline':
      return {
        backgroundColor: 'transparent',
        border: `1.5px solid ${textColor}40`,
        color: textColor,
      };
    case 'glass':
    default:
      return {
        backgroundColor: `${textColor}10`,
        backdropFilter: 'blur(12px)',
        border: `1px solid ${textColor}20`,
        color: textColor,
      };
  }
}

// Get horizontal alignment classes based on position
function getAlignmentClasses(position: BadgePosition) {
  if (position.includes('left')) return 'justify-start';
  if (position.includes('right')) return 'justify-end';
  return 'justify-center';
}

export function KioskLocationBadge({
  locationName,
  position,
  style,
  textColor,
  accentColor,
}: KioskLocationBadgeProps) {
  return (
    <div className={cn('flex w-full px-6', getAlignmentClasses(position))}>
      <motion.div
        className="px-4 py-2 rounded-xl"
        style={getBadgeStyle(style, textColor, accentColor)}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          <span className="text-sm font-medium">{locationName}</span>
        </div>
      </motion.div>
    </div>
  );
}

// Hook to determine content padding based on badge position
export function useBadgeContentPadding(
  showBadge: boolean,
  position: BadgePosition
): { topPadding: string; bottomPadding: string } {
  if (!showBadge) {
    return { topPadding: '', bottomPadding: '' };
  }

  const isTop = position.startsWith('top');
  const isBottom = position.startsWith('bottom');

  return {
    topPadding: isTop ? 'pt-16' : '',
    bottomPadding: isBottom ? 'pb-16' : '',
  };
}

// Check if badge is at top or bottom
export function isBadgeAtTop(position: BadgePosition): boolean {
  return position.startsWith('top');
}

export function isBadgeAtBottom(position: BadgePosition): boolean {
  return position.startsWith('bottom');
}
