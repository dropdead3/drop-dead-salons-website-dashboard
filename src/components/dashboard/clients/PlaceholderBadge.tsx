import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface PlaceholderBadgeProps {
  className?: string;
}

export function PlaceholderBadge({ className }: PlaceholderBadgeProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className={`gap-1 text-xs text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700 ${className}`}
        >
          <AlertCircle className="w-3 h-3" />
          Unverified
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs max-w-[200px]">
          This client has no email or phone on file. Automated messaging, review requests, and receipts are restricted.
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
