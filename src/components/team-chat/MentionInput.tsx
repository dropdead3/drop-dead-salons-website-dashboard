import { useRef, useCallback, useState, KeyboardEvent, useImperativeHandle, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { MentionAutocomplete } from './MentionAutocomplete';
import { useTeamChatContext } from '@/contexts/TeamChatContext';

interface MentionInputProps {
  placeholder?: string;
  disabled?: boolean;
  onSend: (content: string) => void;
  className?: string;
}

export interface MentionInputRef {
  triggerMention: () => void;
  insertEmoji: (emoji: string) => void;
}

export const MentionInput = forwardRef<MentionInputRef, MentionInputProps>(
  function MentionInput({ placeholder, disabled, onSend, className }, ref) {
    const { activeChannel } = useTeamChatContext();
    const editorRef = useRef<HTMLDivElement>(null);
    const [isEmpty, setIsEmpty] = useState(true);
    
    // Mention state
    const [showMentions, setShowMentions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionRange, setMentionRange] = useState<Range | null>(null);

    // Check if editor is empty (only whitespace or empty)
    const checkEmpty = useCallback(() => {
      if (!editorRef.current) return true;
      const text = editorRef.current.textContent || '';
      return text.trim().length === 0;
    }, []);

    // Extract content and convert mention chips to markdown format
    const getFormattedContent = useCallback((): string => {
      if (!editorRef.current) return '';
      
      let result = '';
      const walk = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          result += node.textContent || '';
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          
          // Check if this is a mention chip
          if (el.dataset.mentionId) {
            const id = el.dataset.mentionId;
            const name = el.dataset.mentionName || el.textContent?.replace('@', '') || '';
            result += `@[${name}](${id})`;
          } else if (el.tagName === 'BR') {
            result += '\n';
          } else {
            // Recurse into children
            el.childNodes.forEach(walk);
          }
        }
      };
      
      editorRef.current.childNodes.forEach(walk);
      return result.trim();
    }, []);

    // Clear the editor
    const clearEditor = useCallback(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
        setIsEmpty(true);
      }
    }, []);

    // Handle send
    const handleSend = useCallback(() => {
      const content = getFormattedContent();
      if (!content || disabled) return;
      
      onSend(content);
      clearEditor();
      setShowMentions(false);
    }, [getFormattedContent, disabled, onSend, clearEditor]);

    // Handle keyboard events
    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      // Don't send if mention autocomplete is open
      if (showMentions) return;
      
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    };

    // Check for @ trigger on input
    const handleInput = useCallback(() => {
      setIsEmpty(checkEmpty());
      
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        setShowMentions(false);
        return;
      }
      
      const range = selection.getRangeAt(0);
      const textNode = range.startContainer;
      
      if (textNode.nodeType !== Node.TEXT_NODE) {
        setShowMentions(false);
        return;
      }
      
      const text = textNode.textContent || '';
      const cursorPos = range.startOffset;
      const textBeforeCursor = text.slice(0, cursorPos);
      
      // Find the last @ symbol
      const lastAtIndex = textBeforeCursor.lastIndexOf('@');
      
      if (lastAtIndex === -1) {
        setShowMentions(false);
        return;
      }
      
      // Check if @ is at start or preceded by whitespace
      const charBeforeAt = lastAtIndex > 0 ? text[lastAtIndex - 1] : ' ';
      const isValidStart = charBeforeAt === ' ' || charBeforeAt === '\n' || lastAtIndex === 0;
      
      // Get the query after @
      const query = textBeforeCursor.slice(lastAtIndex + 1);
      const hasNoSpaces = !query.includes(' ') && !query.includes('\n');
      
      if (isValidStart && hasNoSpaces && query.length < 30) {
        setMentionQuery(query);
        
        // Save the range for insertion later
        const mentionStartRange = document.createRange();
        mentionStartRange.setStart(textNode, lastAtIndex);
        mentionStartRange.setEnd(textNode, cursorPos);
        setMentionRange(mentionStartRange);
        
        setShowMentions(true);
      } else {
        setShowMentions(false);
      }
    }, [checkEmpty]);

    // Insert mention chip at the saved range
    const handleMentionSelect = useCallback((userId: string, displayName: string) => {
      if (!mentionRange || !editorRef.current) return;
      
      const selection = window.getSelection();
      if (!selection) return;
      
      // Delete the @query text
      mentionRange.deleteContents();
      
      // Create the mention chip
      const chip = document.createElement('span');
      chip.contentEditable = 'false';
      chip.dataset.mentionId = userId;
      chip.dataset.mentionName = displayName;
      chip.className = 'inline-flex items-center bg-primary/10 text-primary rounded px-1 mx-0.5 text-sm font-medium select-none';
      chip.textContent = `@${displayName}`;
      
      // Insert the chip
      mentionRange.insertNode(chip);
      
      // Add a space after and move cursor there
      const space = document.createTextNode('\u00A0'); // Non-breaking space
      chip.after(space);
      
      // Move cursor after the space
      const newRange = document.createRange();
      newRange.setStartAfter(space);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
      
      setShowMentions(false);
      setMentionQuery('');
      setMentionRange(null);
      setIsEmpty(false);
      
      editorRef.current.focus();
    }, [mentionRange]);

    const handleMentionClose = useCallback(() => {
      setShowMentions(false);
      setMentionQuery('');
      setMentionRange(null);
    }, []);

    // Trigger @ mention manually (from button)
    const triggerMention = useCallback(() => {
      if (!editorRef.current || disabled) return;
      
      const selection = window.getSelection();
      if (!selection) return;
      
      // Focus the editor
      editorRef.current.focus();
      
      // Get or create selection at end
      let range: Range;
      if (selection.rangeCount > 0) {
        range = selection.getRangeAt(0);
      } else {
        range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
      }
      
      // Check if we need a space before @
      const textBefore = range.startContainer.textContent?.slice(0, range.startOffset) || '';
      const needsSpace = textBefore.length > 0 && !textBefore.endsWith(' ') && !textBefore.endsWith('\n');
      
      // Insert @ (with space if needed)
      const textToInsert = needsSpace ? ' @' : '@';
      const textNode = document.createTextNode(textToInsert);
      range.insertNode(textNode);
      
      // Move cursor after @
      range.setStartAfter(textNode);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      
      // Trigger input handling
      setTimeout(() => {
        handleInput();
      }, 0);
    }, [disabled, handleInput]);

    // Insert emoji at cursor position
    const insertEmoji = useCallback((emoji: string) => {
      if (!editorRef.current || disabled) return;
      
      editorRef.current.focus();
      const selection = window.getSelection();
      if (!selection) return;
      
      // Get current range or create one at end
      let range: Range;
      if (selection.rangeCount > 0 && editorRef.current.contains(selection.anchorNode)) {
        range = selection.getRangeAt(0);
      } else {
        range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
      }
      
      // Insert emoji
      const textNode = document.createTextNode(emoji);
      range.insertNode(textNode);
      
      // Move cursor after emoji
      range.setStartAfter(textNode);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      
      setIsEmpty(false);
    }, [disabled]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      triggerMention,
      insertEmoji,
    }), [triggerMention, insertEmoji]);

    // Prevent formatting paste - only allow plain text
    const handlePaste = useCallback((e: React.ClipboardEvent) => {
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');
      document.execCommand('insertText', false, text);
    }, []);

    return (
      <div className="relative flex-1 min-w-0">
        {/* Mention Autocomplete */}
        {showMentions && (
          <MentionAutocomplete
            query={mentionQuery}
            position={{ top: -8, left: 0 }}
            onSelect={handleMentionSelect}
            onClose={handleMentionClose}
          />
        )}
        
        {/* Placeholder */}
        {isEmpty && placeholder && (
          <div className="absolute top-2 left-2 text-muted-foreground pointer-events-none text-sm">
            {placeholder}
          </div>
        )}
        
        {/* Contenteditable editor */}
        <div
          ref={editorRef}
          contentEditable={!disabled}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          className={cn(
            'min-h-[40px] max-h-[200px] overflow-y-auto resize-none border-0 focus-visible:outline-none p-2 text-sm',
            'whitespace-pre-wrap break-words',
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
          role="textbox"
          aria-multiline="true"
          aria-placeholder={placeholder}
          suppressContentEditableWarning
        />
      </div>
    );
  }
);
