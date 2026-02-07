import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Sparkles, 
  Navigation, 
  BookOpen, 
  Users, 
  X,
  Loader2,
  Command
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { useTeamDirectory } from '@/hooks/useEmployeeProfile';
import ReactMarkdown from 'react-markdown';

interface SearchResult {
  type: 'navigation' | 'help' | 'team';
  title: string;
  subtitle?: string;
  path?: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: SearchResult[] = [
  { type: 'navigation', title: 'Command Center', path: '/dashboard', icon: <Navigation className="w-4 h-4" /> },
  { type: 'navigation', title: 'Schedule', path: '/dashboard/schedule', icon: <Navigation className="w-4 h-4" /> },
  { type: 'navigation', title: 'Team Directory', path: '/dashboard/directory', icon: <Navigation className="w-4 h-4" /> },
  { type: 'navigation', title: 'Client Directory', path: '/dashboard/clients', icon: <Navigation className="w-4 h-4" /> },
  { type: 'navigation', title: 'Analytics Hub', path: '/dashboard/admin/analytics', icon: <Navigation className="w-4 h-4" /> },
  { type: 'navigation', title: 'Management Hub', path: '/dashboard/admin/management', icon: <Navigation className="w-4 h-4" /> },
  { type: 'navigation', title: 'Payroll Hub', path: '/dashboard/admin/payroll', icon: <Navigation className="w-4 h-4" /> },
  { type: 'navigation', title: 'Renter Hub', path: '/dashboard/admin/renters', icon: <Navigation className="w-4 h-4" /> },
  { type: 'navigation', title: 'Help Center', path: '/dashboard/help', icon: <BookOpen className="w-4 h-4" /> },
  { type: 'navigation', title: 'Profile', path: '/dashboard/profile', icon: <Navigation className="w-4 h-4" /> },
];

export function TopBarSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [aiMode, setAiMode] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  const { response: aiResponse, isLoading: aiLoading, error: aiError, sendMessage, reset: resetAI } = useAIAssistant();
  const { data: teamMembers } = useTeamDirectory();

  // Filter results based on query
  const filteredResults = React.useMemo(() => {
    if (!query.trim() || aiMode) return [];
    
    const lowerQuery = query.toLowerCase();
    const results: SearchResult[] = [];
    
    // Filter navigation items
    NAV_ITEMS.forEach(item => {
      if (item.title.toLowerCase().includes(lowerQuery)) {
        results.push(item);
      }
    });
    
    // Filter team members
    teamMembers?.slice(0, 5).forEach(member => {
      const name = member.full_name || member.display_name || '';
      if (name.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'team',
          title: name,
          subtitle: member.roles?.[0] || 'Team Member',
          path: `/dashboard/directory?search=${encodeURIComponent(name)}`,
          icon: <Users className="w-4 h-4" />,
        });
      }
    });
    
    return results.slice(0, 8);
  }, [query, aiMode, teamMembers]);

  // Keyboard shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
      resetAI();
    } else if (e.key === 'Tab' && !e.shiftKey && query === '') {
      e.preventDefault();
      setAiMode(!aiMode);
      resetAI();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filteredResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (aiMode && query.trim()) {
        sendMessage(query);
      } else if (filteredResults[selectedIndex]) {
        const result = filteredResults[selectedIndex];
        if (result.path) {
          navigate(result.path);
          setIsOpen(false);
          setQuery('');
        }
      }
    }
  }, [aiMode, query, filteredResults, selectedIndex, navigate, resetAI, sendMessage]);

  const handleResultClick = (result: SearchResult) => {
    if (result.path) {
      navigate(result.path);
      setIsOpen(false);
      setQuery('');
    }
  };

  const handleSubmitAI = () => {
    if (query.trim()) {
      sendMessage(query);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Search Trigger */}
      <button
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full border border-border",
          "bg-muted/50 hover:bg-muted transition-colors text-muted-foreground",
          "text-sm min-w-[200px] justify-between"
        )}
      >
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4" />
          <span>Search...</span>
        </div>
        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <Command className="w-3 h-3" />K
        </kbd>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-[400px] bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50">
          {/* Search Input */}
          <div className="flex items-center gap-2 p-3 border-b border-border">
            {aiMode ? (
              <Sparkles className="w-4 h-4 text-primary" />
            ) : (
              <Search className="w-4 h-4 text-muted-foreground" />
            )}
            <input
              ref={inputRef}
              type="text"
              placeholder={aiMode ? "Ask me anything..." : "Search navigation, team..."}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
              autoCapitalize="off"
            />
            <Button
              variant={aiMode ? "default" : "ghost"}
              size="sm"
              className="h-7 px-2 gap-1"
              onClick={() => {
                setAiMode(!aiMode);
                resetAI();
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-xs">AI</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                setIsOpen(false);
                setQuery('');
                resetAI();
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Results / AI Response */}
          <div className="max-h-[400px] overflow-y-auto">
            {aiMode ? (
              <div className="p-4">
                {aiLoading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                )}
                {aiError && (
                  <div className="text-sm text-destructive p-2 bg-destructive/10 rounded">
                    {aiError}
                  </div>
                )}
                {aiResponse && (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{aiResponse}</ReactMarkdown>
                  </div>
                )}
                {!aiLoading && !aiResponse && !aiError && (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 text-primary/50" />
                    <p>Ask me anything about the dashboard!</p>
                    <p className="text-xs mt-1">Press Enter to send your question</p>
                  </div>
                )}
                {query.trim() && !aiLoading && (
                  <Button 
                    onClick={handleSubmitAI} 
                    className="mt-3 w-full"
                    size="sm"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Ask AI
                  </Button>
                )}
              </div>
            ) : (
              <>
                {filteredResults.length > 0 ? (
                  <div className="py-2">
                    {filteredResults.map((result, index) => (
                      <button
                        key={`${result.type}-${result.title}-${index}`}
                        onClick={() => handleResultClick(result)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2 text-left transition-colors",
                          selectedIndex === index 
                            ? "bg-accent text-accent-foreground" 
                            : "hover:bg-muted"
                        )}
                      >
                        <span className="text-muted-foreground">{result.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{result.title}</p>
                          {result.subtitle && (
                            <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs capitalize">
                          {result.type}
                        </Badge>
                      </button>
                    ))}
                  </div>
                ) : query.trim() ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    <p>No results found</p>
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="mt-1"
                      onClick={() => setAiMode(true)}
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      Try asking AI instead
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    <p>Start typing to search...</p>
                    <p className="text-xs mt-1">
                      Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Tab</kbd> to toggle AI mode
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
