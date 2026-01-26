import { useState, useEffect } from 'react';
import { Monitor, Smartphone, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LivePreviewPanelProps {
  onClose: () => void;
}

export function LivePreviewPanel({ onClose }: LivePreviewPanelProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Auto-refresh the preview every time database changes are saved
  // This is achieved by listening to storage events or using a refresh interval
  useEffect(() => {
    const handleStorageChange = () => {
      setRefreshKey(prev => prev + 1);
      setIsLoading(true);
    };

    // Listen for custom refresh events
    window.addEventListener('website-preview-refresh', handleStorageChange);
    
    return () => {
      window.removeEventListener('website-preview-refresh', handleStorageChange);
    };
  }, []);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    setIsLoading(true);
  };

  return (
    <div className="flex flex-col h-full bg-muted/30 border-l border-border">
      {/* Preview Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Live Preview</span>
          {isLoading && (
            <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Device Toggle */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 px-2",
                viewMode === 'desktop' && "bg-background shadow-sm"
              )}
              onClick={() => setViewMode('desktop')}
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 px-2",
                viewMode === 'mobile' && "bg-background shadow-sm"
              )}
              onClick={() => setViewMode('mobile')}
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>

          {/* Refresh Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="h-7 w-7 p-0"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>

          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-7 w-7 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Preview Container */}
      <div className="flex-1 overflow-hidden p-4">
        <div 
          className={cn(
            "mx-auto h-full transition-all duration-300 rounded-lg overflow-hidden border border-border shadow-lg bg-background",
            viewMode === 'mobile' ? "max-w-[390px]" : "w-full"
          )}
        >
          <iframe
            key={refreshKey}
            src="/"
            className="w-full h-full border-0"
            title="Website Preview"
            onLoad={() => setIsLoading(false)}
          />
        </div>
      </div>
    </div>
  );
}

// Helper function to trigger preview refresh from anywhere
export function triggerPreviewRefresh() {
  window.dispatchEvent(new CustomEvent('website-preview-refresh'));
}
