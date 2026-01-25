import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { InquiryStatus } from '@/hooks/useLeadAnalytics';

interface LeadStatusBadgeProps {
  status: InquiryStatus;
  className?: string;
}

const STATUS_CONFIG: Record<InquiryStatus, { label: string; className: string }> = {
  new: { 
    label: 'New', 
    className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' 
  },
  contacted: { 
    label: 'Contacted', 
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800' 
  },
  assigned: { 
    label: 'Assigned', 
    className: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800' 
  },
  consultation_booked: { 
    label: 'Consult Booked', 
    className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' 
  },
  converted: { 
    label: 'Converted', 
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' 
  },
  lost: { 
    label: 'Lost', 
    className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' 
  },
};

export function LeadStatusBadge({ status, className }: LeadStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.new;
  
  return (
    <Badge 
      variant="outline" 
      className={cn("text-xs font-medium", config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
