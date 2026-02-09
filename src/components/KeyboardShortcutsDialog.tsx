import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useKeyboardShortcuts, getShortcutsByCategory } from '@/hooks/useKeyboardShortcuts';
import { Keyboard } from 'lucide-react';

export function KeyboardShortcutsDialog() {
  const { shortcuts, isHelpOpen, closeHelp } = useKeyboardShortcuts();
  const groupedShortcuts = getShortcutsByCategory(shortcuts);

  return (
    <Dialog open={isHelpOpen} onOpenChange={(open) => !open && closeHelp()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category}>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {categoryShortcuts.map((shortcut) => (
                  <div
                    key={shortcut.key}
                    className="flex items-center justify-between py-1.5"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <kbd className="inline-flex items-center gap-1 rounded border bg-muted px-2 py-0.5 text-xs font-mono">
                      {shortcut.key.split(' ').map((key, idx) => (
                        <span key={idx}>
                          {idx > 0 && <span className="text-muted-foreground mx-1">then</span>}
                          <span className="bg-background px-1 py-0.5 rounded border">
                            {key === '?' ? '?' : key.toUpperCase()}
                          </span>
                        </span>
                      ))}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Press <kbd className="px-1.5 py-0.5 bg-muted rounded border text-xs">?</kbd> anytime to show this dialog
        </div>
      </DialogContent>
    </Dialog>
  );
}
