import { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useTeamMembers } from '@/hooks/team-chat/useTeamMembers';

interface MentionAutocompleteProps {
  query: string;
  position: { top: number; left: number };
  onSelect: (userId: string, displayName: string) => void;
  onClose: () => void;
}

export function MentionAutocomplete({ query, position, onSelect, onClose }: MentionAutocompleteProps) {
  const { members, isLoading } = useTeamMembers(query);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, members.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (members[selectedIndex]) {
          const member = members[selectedIndex];
          onSelect(member.userId, member.displayName || member.fullName || 'Unknown');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [members, selectedIndex, onSelect, onClose]);

  if (members.length === 0 && !isLoading) return null;

  return (
    <div
      ref={containerRef}
      className="absolute bottom-full left-0 mb-2 z-50 bg-popover text-popover-foreground border rounded-md shadow-lg overflow-hidden min-w-[200px]"
    >
      {isLoading ? (
        <div className="px-3 py-2 text-sm text-muted-foreground">Loading...</div>
      ) : (
        <div className="max-h-48 overflow-y-auto">
          {members.slice(0, 8).map((member, index) => {
            const name = member.displayName || member.fullName || 'Unknown';
            const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

            return (
              <button
                key={member.userId}
                onClick={() => onSelect(member.userId, name)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-left',
                  'hover:bg-accent hover:text-accent-foreground transition-colors',
                  index === selectedIndex && 'bg-accent text-accent-foreground'
                )}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={member.photoUrl || undefined} />
                  <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                </Avatar>
                <span className="text-sm">{name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Helper to render mentions in message content
export function renderContentWithMentions(content: string): React.ReactNode {
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    parts.push(
      <span 
        key={match.index} 
        className="inline-flex items-center bg-primary/15 text-primary rounded px-1.5 py-0.5 text-sm font-medium mx-0.5"
      >
        @{match[1]}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts.length > 0 ? <>{parts}</> : content;
}
