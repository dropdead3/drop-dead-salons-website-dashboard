import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Lightbulb, Sparkles } from 'lucide-react';

interface GuidancePanelProps {
  title: string;
  type: 'insight' | 'action';
  guidance: string | null;
  isLoading: boolean;
  onBack: () => void;
}

export function GuidancePanel({ title, type, guidance, isLoading, onBack }: GuidancePanelProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-3 pb-2 border-b border-border/40 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="h-7 px-2 -ml-2 gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Insights
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
          </div>
          <span className="text-xs font-display tracking-wide">
            {type === 'insight' ? 'How to Improve' : 'What You Should Do'}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1 leading-snug line-clamp-2">{title}</p>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="px-4 py-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="w-full h-3.5 rounded" />
                  <Skeleton className="w-4/5 h-3.5 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed">
              <ReactMarkdown>{guidance || ''}</ReactMarkdown>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="px-4 py-2.5 border-t border-border/40 flex items-center justify-center gap-1.5 flex-shrink-0">
        <Sparkles className="w-3 h-3 text-muted-foreground/40" />
        <span className="text-[10px] text-muted-foreground/50">AI-generated guidance · Based on your data</span>
      </div>
    </div>
  );
}
