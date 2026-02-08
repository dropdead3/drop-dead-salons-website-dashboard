import { useState, useEffect } from 'react';
import { X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface MessageEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: string;
  createdAt: string;
  onSave: (content: string) => void;
}

const EDIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

function getEditTimeRemaining(createdAt: string): { remaining: number; text: string } {
  const messageTime = new Date(createdAt).getTime();
  const deadline = messageTime + EDIT_WINDOW_MS;
  const remaining = deadline - Date.now();

  if (remaining <= 0) return { remaining: 0, text: 'Expired' };

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  if (minutes > 0) {
    return { remaining, text: `${minutes}m ${seconds}s left` };
  }
  return { remaining, text: `${seconds}s left` };
}

export function MessageEditDialog({
  open,
  onOpenChange,
  content,
  createdAt,
  onSave,
}: MessageEditDialogProps) {
  const [editedContent, setEditedContent] = useState(content);
  const [timeInfo, setTimeInfo] = useState(() => getEditTimeRemaining(createdAt));

  // Update timer every second
  useEffect(() => {
    if (!open) return;

    const interval = setInterval(() => {
      const info = getEditTimeRemaining(createdAt);
      setTimeInfo(info);

      // Auto-close if time expired
      if (info.remaining <= 0) {
        onOpenChange(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [open, createdAt, onOpenChange]);

  // Reset content when dialog opens
  useEffect(() => {
    if (open) {
      setEditedContent(content);
    }
  }, [open, content]);

  const handleSave = () => {
    if (editedContent.trim() && timeInfo.remaining > 0) {
      onSave(editedContent.trim());
      onOpenChange(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Edit Message</span>
            <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground">
              <Clock className="h-3 w-3" />
              {timeInfo.text}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Edit your message..."
            className="min-h-[100px] resize-none"
            autoFocus
          />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!editedContent.trim() || editedContent === content || timeInfo.remaining <= 0}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper to check if message can still be edited
export function canEditMessage(createdAt: string): boolean {
  const messageTime = new Date(createdAt).getTime();
  const deadline = messageTime + EDIT_WINDOW_MS;
  return Date.now() < deadline;
}

// Helper to get time remaining text for menu item
export function getEditTimeRemainingText(createdAt: string): string {
  const { text } = getEditTimeRemaining(createdAt);
  return text;
}
