import { useState } from 'react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { useDashboardTheme } from '@/contexts/DashboardThemeContext';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface EmojiPickerPopoverProps {
  children: React.ReactNode;
  onEmojiSelect: (emoji: string) => void;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
}

export function EmojiPickerPopover({ 
  children, 
  onEmojiSelect, 
  side = 'top',
  align = 'end'
}: EmojiPickerPopoverProps) {
  const { resolvedTheme } = useDashboardTheme();
  const [open, setOpen] = useState(false);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 border-0" 
        align={align} 
        side={side}
        sideOffset={8}
      >
        <EmojiPicker
          onEmojiClick={handleEmojiClick}
          theme={resolvedTheme === 'dark' ? Theme.DARK : Theme.LIGHT}
          lazyLoadEmojis
          skinTonesDisabled
          searchPlaceholder="Search emojis..."
          previewConfig={{ showPreview: false }}
          height={350}
          width={320}
        />
      </PopoverContent>
    </Popover>
  );
}
