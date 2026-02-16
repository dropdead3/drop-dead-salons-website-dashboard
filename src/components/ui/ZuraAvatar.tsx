import { cn } from '@/lib/utils';

const sizeStyles = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-10 w-10 text-base',
  lg: 'h-12 w-12 text-lg',
};

interface ZuraAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ZuraAvatar({ size = 'md', className }: ZuraAvatarProps) {
  return (
    <div
      className={cn(
        'rounded-full bg-primary/10 flex items-center justify-center',
        sizeStyles[size],
        className
      )}
    >
      <span className="font-medium text-primary leading-none">Z</span>
    </div>
  );
}
