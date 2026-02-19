import { useState } from 'react';
import { Lightbulb, Bug } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PlatformFeedbackDialog } from './PlatformFeedbackDialog';
import { cn } from '@/lib/utils';

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

  return (
    <>
      <div className={cn("flex gap-1", isCollapsed && "flex-col")}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => openDialog('feature_request')}
              className="flex-1 flex items-center justify-center rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-background/80 transition-all"
            >
              <Lightbulb className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="font-sans">Request a Feature</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => openDialog('bug_report')}
              className="flex-1 flex items-center justify-center rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-background/80 transition-all"
            >
              <Bug className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="font-sans">Report a Bug</TooltipContent>
        </Tooltip>
      </div>

      <PlatformFeedbackDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultType={dialogType}
      />
    </>
  );
}
