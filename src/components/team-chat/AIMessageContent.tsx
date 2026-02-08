import ReactMarkdown from 'react-markdown';
import { Bot, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { AIActionPreview } from './AIActionPreview';
import type { AIMessage, AIAction } from '@/hooks/team-chat/useAIAgentChat';

interface AIMessageContentProps {
  message: AIMessage;
  pendingAction?: AIAction | null;
  onConfirmAction?: () => void;
  onCancelAction?: () => void;
  isExecuting?: boolean;
}

export function AIMessageContent({
  message,
  pendingAction,
  onConfirmAction,
  onCancelAction,
  isExecuting,
}: AIMessageContentProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn(
      "flex gap-3 py-3",
      isUser ? "flex-row-reverse" : "flex-row"
    )}>
      {/* Avatar */}
      {!isUser && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}

      {/* Message content */}
      <div className={cn(
        "flex flex-col gap-2 max-w-[85%]",
        isUser ? "items-end" : "items-start"
      )}>
        {/* Message bubble */}
        <div className={cn(
          "px-4 py-2 rounded-2xl",
          isUser 
            ? "bg-primary text-primary-foreground rounded-tr-sm" 
            : "bg-muted rounded-tl-sm"
        )}>
          {message.isLoading ? (
            <div className="flex items-center gap-2 py-1">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-0 text-sm">{children}</p>,
                  ul: ({ children }) => <ul className="mb-0 mt-1 text-sm">{children}</ul>,
                  ol: ({ children }) => <ol className="mb-0 mt-1 text-sm">{children}</ol>,
                  li: ({ children }) => <li className="mb-0.5">{children}</li>,
                  code: ({ children }) => (
                    <code className="bg-background/50 px-1 py-0.5 rounded text-xs">
                      {children}
                    </code>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Action preview card - show after the message */}
        {message.action?.status === 'pending_confirmation' && pendingAction && onConfirmAction && onCancelAction && (
          <AIActionPreview
            action={message.action}
            onConfirm={onConfirmAction}
            onCancel={onCancelAction}
            isExecuting={isExecuting}
          />
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-muted-foreground px-1">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}
