import { Badge } from '@/components/ui/badge';
import { 
  Globe, 
  MessageCircle, 
  Phone, 
  Users, 
  Instagram, 
  Building2,
  HelpCircle,
  Footprints
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { InquirySource, formatSourceName } from '@/hooks/useLeadAnalytics';

interface LeadSourceBadgeProps {
  source: InquirySource;
  className?: string;
  showIcon?: boolean;
}

const SOURCE_CONFIG: Record<InquirySource, { icon: React.ElementType; className: string }> = {
  website_form: { 
    icon: Globe, 
    className: 'bg-primary/10 text-primary border-primary/20' 
  },
  google_business: { 
    icon: Building2, 
    className: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400' 
  },
  facebook_lead: { 
    icon: MessageCircle, 
    className: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400' 
  },
  instagram_lead: { 
    icon: Instagram, 
    className: 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400' 
  },
  phone_call: { 
    icon: Phone, 
    className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400' 
  },
  walk_in: { 
    icon: Footprints, 
    className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400' 
  },
  referral: { 
    icon: Users, 
    className: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400' 
  },
  other: { 
    icon: HelpCircle, 
    className: 'bg-muted text-muted-foreground' 
  },
};

export function LeadSourceBadge({ source, className, showIcon = true }: LeadSourceBadgeProps) {
  const config = SOURCE_CONFIG[source] || SOURCE_CONFIG.other;
  const Icon = config.icon;
  
  return (
    <Badge 
      variant="outline" 
      className={cn("text-xs font-medium gap-1", config.className, className)}
    >
      {showIcon && <Icon className="w-3 h-3" />}
      {formatSourceName(source)}
    </Badge>
  );
}
