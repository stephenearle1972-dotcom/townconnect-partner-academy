import { useState, useRef, useEffect } from 'react';
import { GraduationCap, RotateCcw } from 'lucide-react';
import MessageBubble from './MessageBubble';
import VoiceInput from './VoiceInput';
import { sendMessage, ChatMessage } from '../services/geminiService';

export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await sendMessage(text, messages);
      const assistantMessage: ChatMessage = { role: 'assistant', content: response };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to get a response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <header className="bg-forest text-white px-4 py-4 shadow-lg flex-shrink-0">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Partner Academy</h1>
              <p className="text-white/70 text-xs">TownConnect Training Assistant</p>
            </div>
          </div>

          {messages.length > 0 && (
            <button
              onClick={handleReset}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Start new conversation"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-forest/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <GraduationCap className="w-10 h-10 text-forest" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Welcome to Partner Academy
              </h2>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                Ask me anything about TownConnect operations, sales techniques,
                payments, compliance, or any other partner questions.
              </p>

              {/* Quick start suggestions */}
              <div className="grid gap-3 max-w-md mx-auto">
                <button
                  onClick={() => handleSubmit("What's the 30-second pitch?")}
                  className="text-left p-4 bg-white rounded-xl border border-gray-200 hover:border-forest hover:shadow-md transition-all"
                >
                  <span className="text-forest font-medium">"What's the 30-second pitch?"</span>
                </button>
                <button
                  onClick={() => handleSubmit("How does the revenue split work?")}
                  className="text-left p-4 bg-white rounded-xl border border-gray-200 hover:border-forest hover:shadow-md transition-all"
                >
                  <span className="text-forest font-medium">"How does the revenue split work?"</span>
                </button>
                <button
                  onClick={() => handleSubmit("What's the 48-hour rule?")}
                  className="text-left p-4 bg-white rounded-xl border border-gray-200 hover:border-forest hover:shadow-md transition-all"
                >
                  <span className="text-forest font-medium">"What's the 48-hour rule?"</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <MessageBubble
                  key={index}
                  role={message.role}
                  content={message.content}
                />
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start mb-4">
                  <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-md border border-gray-100">
                    <div className="flex items-center gap-1">
                      <div className="typing-dot w-2 h-2 bg-forest rounded-full" />
                      <div className="typing-dot w-2 h-2 bg-forest rounded-full" />
                      <div className="typing-dot w-2 h-2 bg-forest rounded-full" />
                    </div>
                  </div>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {error}
                  <button
                    onClick={() => setError(null)}
                    className="ml-2 underline hover:no-underline"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="flex-shrink-0">
        <VoiceInput onSubmit={handleSubmit} disabled={isLoading} />
      </div>
    </div>
  );
}
