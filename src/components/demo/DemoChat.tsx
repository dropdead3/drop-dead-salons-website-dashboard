import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Sparkles, User, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { FeatureCard } from './FeatureCard';
import type { DemoMessage } from '@/hooks/useProductDemo';

interface DemoChatProps {
  messages: DemoMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onClearChat: () => void;
  onFeatureClick?: (featureKey: string) => void;
}

const suggestedQuestions = [
  "I spend hours calculating payroll each week",
  "My team never sees important updates",
  "I can't track which clients belong to which stylist",
  "What can your software do?",
];

export function DemoChat({
  messages,
  isLoading,
  onSendMessage,
  onClearChat,
  onFeatureClick,
}: DemoChatProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSuggestionClick = (question: string) => {
    if (isLoading) return;
    onSendMessage(question);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat messages area */}
      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        <div className="py-6 space-y-6">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-medium mb-2">
                What challenges are you facing?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Tell me about your salon management pain points, and I'll show you exactly how we can help.
              </p>
              
              <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
                {suggestedQuestions.map((question, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleSuggestionClick(question)}
                    disabled={isLoading}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                )}
                
                <div
                  className={cn(
                    'max-w-[80%] space-y-4',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-3'
                      : ''
                  )}
                >
                  {message.role === 'user' ? (
                    <p className="text-sm">{message.content}</p>
                  ) : (
                    <>
                      {message.isLoading && !message.content ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <div className="animate-pulse flex gap-1">
                            <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                          <span className="text-sm">Thinking...</span>
                        </div>
                      ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                      )}
                      
                      {/* Feature cards */}
                      {message.features && message.features.length > 0 && (
                        <div className="space-y-3 mt-4">
                          {/* Primary feature */}
                          <FeatureCard
                            feature={message.features[0]}
                            isPrimary
                            onLearnMore={onFeatureClick}
                          />
                          
                          {/* Related features */}
                          {message.features.length > 1 && (
                            <div className="pt-2">
                              <p className="text-xs font-medium text-muted-foreground mb-2">
                                Related Features
                              </p>
                              <div className="space-y-2">
                                {message.features.slice(1).map((feature) => (
                                  <FeatureCard
                                    key={feature.id}
                                    feature={feature}
                                    onLearnMore={onFeatureClick}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="border-t p-4 bg-background">
        {messages.length > 0 && (
          <div className="flex justify-end mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearChat}
              className="text-xs text-muted-foreground"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Start over
            </Button>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your salon management challenge..."
            className="min-h-[44px] max-h-32 resize-none"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
