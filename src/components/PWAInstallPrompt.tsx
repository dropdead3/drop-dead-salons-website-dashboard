import { useState } from 'react';
import { X, Share, Plus, Smartphone, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { cn } from '@/lib/utils';

interface PWAInstallPromptProps {
  className?: string;
}

export function PWAInstallPrompt({ className }: PWAInstallPromptProps) {
  const { isInstallable, isIOS, isAndroid, install, isInstalled, isStandalone } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem('pwa-prompt-dismissed') === 'true';
  });

  // Don't show if already installed, dismissed, or running in standalone mode
  if (isInstalled || isStandalone || isDismissed) {
    return null;
  }

  // Don't show on desktop or if not installable (and not iOS)
  if (!isInstallable && !isIOS) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      setIsDismissed(true);
    }
  };

  // iOS-specific instructions
  if (isIOS) {
    return (
      <Card className={cn(
        'fixed bottom-4 left-4 right-4 z-50 p-4 bg-background/95 backdrop-blur-sm border shadow-lg',
        'sm:left-auto sm:right-4 sm:w-80',
        className
      )}>
        <button 
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
        
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
            <Smartphone className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-sm">Install App</h3>
            <p className="text-xs text-muted-foreground">
              Install this app on your iPhone for quick access:
            </p>
            <ol className="text-xs text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <span className="bg-muted rounded px-1">1</span>
                Tap <Share className="h-3 w-3 inline" /> Share
              </li>
              <li className="flex items-center gap-2">
                <span className="bg-muted rounded px-1">2</span>
                Tap <Plus className="h-3 w-3 inline" /> Add to Home Screen
              </li>
            </ol>
          </div>
        </div>
      </Card>
    );
  }

  // Android/Desktop prompt
  return (
    <Card className={cn(
      'fixed bottom-4 left-4 right-4 z-50 p-4 bg-background/95 backdrop-blur-sm border shadow-lg',
      'sm:left-auto sm:right-4 sm:w-80',
      className
    )}>
      <button 
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted"
      >
        <X className="h-4 w-4" />
      </button>
      
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
          <Download className="h-5 w-5 text-primary" />
        </div>
        <div className="space-y-3">
          <div>
            <h3 className="font-medium text-sm">Install App</h3>
            <p className="text-xs text-muted-foreground">
              Add to your home screen for quick access and offline support.
            </p>
          </div>
          <Button size="sm" onClick={handleInstall} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Install
          </Button>
        </div>
      </div>
    </Card>
  );
}
