import { useState } from 'react';
import { Lightbulb, Bug } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { PlatformFeedbackDialog } from './PlatformFeedbackDialog';

type FeedbackType = 'feature_request' | 'bug_report';

interface SidebarFeedbackButtonsProps {
  isCollapsed?: boolean;
}

export function SidebarFeedbackButtons({ isCollapsed = false }: SidebarFeedbackButtonsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<FeedbackType>('feature_request');

  const openDialog = (type: FeedbackType) => {
    setDialogType(type);
    setDialogOpen(true);
  };

  const ButtonContent = ({ icon: Icon, label, type }: { icon: typeof Lightbulb; label: string; type: FeedbackType }) => {
    const content = (
      <button
        onClick={() => openDialog(type)}
        className={cn(
          "flex items-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium transition-all",
          "text-muted-foreground hover:text-foreground hover:bg-muted/60",
          isCollapsed && "justify-center px-2"
        )}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {!isCollapsed && <span className="truncate">{label}</span>}
      </button>
    );

    if (isCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="font-sans">{label}</TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <>
      <div className={cn(
        "border-b border-border/30 pb-1 mb-1",
        isCollapsed ? "space-y-1" : "grid grid-cols-2 gap-1"
      )}>
        <ButtonContent icon={Lightbulb} label="Request a Feature" type="feature_request" />
        <ButtonContent icon={Bug} label="Report a Bug" type="bug_report" />
      </div>

      <PlatformFeedbackDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultType={dialogType}
      />
    </>
  );
}
