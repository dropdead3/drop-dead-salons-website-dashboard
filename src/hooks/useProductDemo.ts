import { useState, useCallback } from 'react';

export interface ProductFeature {
  id: string;
  feature_key: string;
  name: string;
  tagline: string;
  description: string;
  problem_keywords: string[];
  category: string;
  screenshot_url: string | null;
  demo_video_url: string | null;
  related_features: string[];
  is_highlighted: boolean;
  display_order: number;
}

export interface DemoMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  features?: ProductFeature[];
  isLoading?: boolean;
}

interface UseProductDemoReturn {
  messages: DemoMessage[];
  isLoading: boolean;
  error: string | null;
  sendQuestion: (question: string) => Promise<void>;
  clearChat: () => void;
}

const DEMO_ASSISTANT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/demo-assistant`;

export function useProductDemo(): UseProductDemoReturn {
  const [messages, setMessages] = useState<DemoMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const sendQuestion = useCallback(async (question: string) => {
    if (!question.trim()) return;

    const userMessage: DemoMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question.trim(),
    };

    const loadingMessage: DemoMessage = {
      id: `loading-${Date.now()}`,
      role: 'assistant',
      content: '',
      isLoading: true,
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Build conversation history
      const history = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));
      history.push({ role: 'user', content: question.trim() });

      const resp = await fetch(DEMO_ASSISTANT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: history }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(errorData.error || `Request failed with status ${resp.status}`);
      }

      if (!resp.body) {
        throw new Error('No response body');
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let fullResponse = '';
      let matchedFeatures: ProductFeature[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            
            // Check for features metadata
            if (parsed.type === 'features' && parsed.features) {
              matchedFeatures = parsed.features;
              continue;
            }

            // Regular content streaming
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullResponse += content;
              setMessages(prev => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                if (updated[lastIdx]?.isLoading) {
                  updated[lastIdx] = {
                    ...updated[lastIdx],
                    content: fullResponse,
                    features: matchedFeatures.length > 0 ? matchedFeatures : undefined,
                  };
                }
                return updated;
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.type === 'features' && parsed.features) {
              matchedFeatures = parsed.features;
              continue;
            }
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullResponse += content;
            }
          } catch { /* ignore partial leftovers */ }
        }
      }

      // Finalize the assistant message
      setMessages(prev => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (updated[lastIdx]?.isLoading) {
          updated[lastIdx] = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: fullResponse || "I'd be happy to help! What specific challenges are you facing in your salon?",
            features: matchedFeatures.length > 0 ? matchedFeatures : undefined,
            isLoading: false,
          };
        }
        return updated;
      });

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An error occurred';
      setError(errorMessage);
      console.error('Product demo error:', e);
      
      // Replace loading with error message
      setMessages(prev => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (updated[lastIdx]?.isLoading) {
          updated[lastIdx] = {
            id: `error-${Date.now()}`,
            role: 'assistant',
            content: "I'm sorry, I encountered an error. Please try again.",
            isLoading: false,
          };
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  return {
    messages,
    isLoading,
    error,
    sendQuestion,
    clearChat,
  };
}
