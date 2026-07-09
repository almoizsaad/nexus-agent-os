import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Paperclip, User, Bot, Loader2 } from 'lucide-react';
import type { ChatMessage } from '@/lib/types/intent';
import ThinkingIndicator from './ThinkingIndicator';
import ConfidenceBadge from './ConfidenceBadge';

interface ChatPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSend: (message: string) => void;
  confidence?: number;
  reasoning?: string;
}

export default function ChatPanel({ messages, isLoading, onSend, confidence, reasoning }: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSend(input.trim());
      setInput('');
    }
  }, [input, isLoading, onSend]);

  const handleVoice = useCallback(() => {
    setIsListening(true);
    setTimeout(() => setIsListening(false), 3000);
  }, []);

  return (
    <div className="flex flex-col h-full" style={{ borderLeft: '1px solid #E7E5E4', background: '#FFFFFF' }}>
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3" style={{ color: '#A8A29E' }}>
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(190, 18, 60, 0.06)' }}
            >
              <Bot className="w-8 h-8" style={{ color: '#BE123C' }} />
            </div>
            <div>
              <div className="text-sm font-medium" style={{ color: '#292524' }}>Nexus Assistant</div>
              <div className="text-xs mt-1 max-w-[240px]" style={{ color: '#78716C' }}>
                Describe what you need and I'll generate the perfect interface for you.
              </div>
            </div>
            <div className="space-y-2 w-full max-w-[280px] mt-2">
              {[
                'Plan a business trip to Paris next week',
                'Compare flights to Tokyo',
                'Create a travel budget breakdown',
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => onSend(suggestion)}
                  className="w-full text-left px-3 py-2 text-xs rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BE123C]"
                  style={{ background: '#FAF9F6', color: '#78716C', border: '1px solid #E7E5E4' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#292524'; e.currentTarget.style.borderColor = '#D6D3D1'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#78716C'; e.currentTarget.style.borderColor = '#E7E5E4'; }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-1"
                  style={{ background: 'rgba(190, 18, 60, 0.08)' }}
                >
                  <Bot className="w-4 h-4" style={{ color: '#BE123C' }} />
                </div>
              )}
              <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                <div
                  className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'rounded-tr-md'
                      : 'rounded-tl-md'
                  }`}
                  style={
                    msg.role === 'user'
                      ? { background: '#1C1917', color: '#FAF9F6' }
                      : { background: '#FAF9F6', color: '#292524', border: '1px solid #E7E5E4' }
                  }
                >
                  {msg.content}
                </div>
                {msg.role === 'assistant' && msg.metadata?.confidence && (
                  <div className="mt-1.5">
                    <ConfidenceBadge score={msg.metadata.confidence} size="sm" />
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-1"
                  style={{ background: 'rgba(15, 118, 110, 0.08)' }}
                >
                  <User className="w-4 h-4" style={{ color: '#0F766E' }} />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(190, 18, 60, 0.08)' }}
            >
              <Bot className="w-4 h-4" style={{ color: '#BE123C' }} />
            </div>
            <div
              className="px-4 py-2 rounded-2xl rounded-tl-md"
              style={{ background: '#FAF9F6', border: '1px solid #E7E5E4' }}
            >
              <ThinkingIndicator />
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="p-3" style={{ borderTop: '1px solid #E7E5E4' }}>
        <form onSubmit={handleSubmit} className="relative">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: '#FAF9F6', border: '1px solid #E7E5E4' }}
          >
            <button
              type="button"
              onClick={handleVoice}
              className={`flex-shrink-0 p-1.5 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BE123C] ${
                isListening ? 'animate-pulse' : ''
              }`}
              style={isListening ? { background: 'rgba(153, 27, 27, 0.1)', color: '#991B1B' } : { color: '#A8A29E' }}
              onMouseEnter={(e) => { if (!isListening) e.currentTarget.style.color = '#292524'; }}
              onMouseLeave={(e) => { if (!isListening) e.currentTarget.style.color = '#A8A29E'; }}
              aria-label={isListening ? 'Listening' : 'Voice input'}
            >
              <Mic className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="flex-shrink-0 p-1.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BE123C]"
              style={{ color: '#A8A29E' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#292524'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#A8A29E'; }}
              aria-label="Attach file"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? 'Listening...' : 'Describe your intent...'}
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: '#292524' }}
              disabled={isLoading || isListening}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 p-2 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BE123C]"
              style={{
                background: input.trim() && !isLoading ? '#1C1917' : '#E7E5E4',
                color: input.trim() && !isLoading ? '#FAF9F6' : '#A8A29E',
              }}
              aria-label="Send message"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </form>
        {confidence && confidence > 0 && (
          <div className="mt-2 flex items-center justify-between">
            <ConfidenceBadge score={confidence} size="sm" />
            {reasoning && (
              <span className="text-[10px] truncate max-w-[200px]" style={{ color: '#A8A29E' }}>{reasoning}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
