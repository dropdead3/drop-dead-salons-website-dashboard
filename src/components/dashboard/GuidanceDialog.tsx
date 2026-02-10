import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Lightbulb, Loader2, Sparkles } from 'lucide-react';

interface GuidanceButtonProps {
  type: 'insight' | 'action';
  title: string;
  description: string;
  category?: string;
  priority?: string;
  label?: string;
}

export function GuidanceButton({ type, title, description, category, priority, label }: GuidanceButtonProps) {
  const [open, setOpen] = useState(false);
  const [guidance, setGuidance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchGuidance = async () => {
    setOpen(true);
    if (guidance) return; // already fetched
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-insight-guidance', {
        body: { type, title, description, category, priority },
      });
      if (error) throw error;
      setGuidance(data.guidance);
    } catch (err) {
      console.error('Failed to fetch guidance:', err);
      toast.error('Failed to get guidance. Please try again.');
      setOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const buttonLabel = label || (type === 'insight' ? 'How to improve' : 'What you should do');

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={fetchGuidance}
        className="h-6 px-2 mt-1.5 text-[11px] gap-1 text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300"
      >
        <Lightbulb className="w-3 h-3" />
        {buttonLabel}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
                <Lightbulb className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
              </div>
              <DialogTitle className="text-sm font-display tracking-wide">
                {type === 'insight' ? 'How to Improve' : 'What You Should Do'}
              </DialogTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 leading-snug">{title}</p>
          </DialogHeader>

          <ScrollArea className="flex-1 min-h-0">
            <div className="px-5 py-4">
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

          <div className="px-5 py-3 border-t border-border/40 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3 h-3 text-muted-foreground/40" />
            <span className="text-[10px] text-muted-foreground/50">AI-generated guidance · Based on your data</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
