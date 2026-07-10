import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hexagon, Send, Mic, Paperclip, Sparkles, User, Bot,
  Loader2, Terminal, X, Maximize2, ChevronRight, ArrowDown
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import DynamicLayout from '@/components/generative-ui/DynamicLayout';
import PredictiveChips from '@/components/generative-ui/PredictiveChips';
import ConfidenceBadge from '@/components/generative-ui/ConfidenceBadge';
import MetricsDashboard from '@/components/generative-ui/MetricsDashboard';
import { useIntent } from '@/hooks/useIntent';
import { useLogStore, addLog } from '@/stores/logStore';
import { streamChatCompletion } from '@/lib/agents/intentAnalyzer';
import type { ChatMessage, PredictiveSuggestion } from '@/lib/types/intent';
import { useWorkspaceAgent } from '@/hooks/useWorkspaceAgent';
import { useWorkspaceStore } from '@/workspace/state/workspaceStore';

export default function Workspace() {
  const { result, isAnalyzing, progress, analyzeIntent, getPredictions } = useIntent();
  const { metrics, recommendations } = useWorkspaceAgent();
  const setWorkspaceComponents = useWorkspaceStore(s => s.setComponents);

  const { getFilteredEntries, clearEntries, filterLevel, setFilterLevel } = useLogStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [chatOpen, setChatOpen] = useState(true);
  const [activeModule, setActiveModule] = useState('travel');
  const [showConfetti, setShowConfetti] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [confettiParticles, setConfettiParticles] = useState<{
    x: number;
    y: number;
    scale: number[];
    rotate: number;
    duration: number;
    colorIndex: number;
  }[]>([]);

  useEffect(() => {
    if (showConfetti) {
      setConfettiParticles(Array.from({ length: 30 }).map(() => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        scale: [0, 1, 0.5],
        rotate: Math.random() * 720,
        duration: 2 + Math.random() * 2,
        colorIndex: Math.floor(Math.random() * 5)
      })));
    }
  }, [showConfetti]);

  // Sync useIntent result to workspace store (Migration Bridge)
  useEffect(() => {
    if (result?.components) {
      setWorkspaceComponents(result.components.map(c => ({
        id: c.id,
        type: c.type === 'list' && (c.id === 'flight-search' || c.title === 'Flight Options') ? 'flight-card' : 
              c.type === 'gallery' ? 'hotel-card' :
              c.type === 'chart' ? 'budget-chart' :
              c.type === 'timeline' ? 'timeline' :
              c.type === 'card' && c.id === 'trip-overview' ? 'overview' :
              c.type === 'card' && c.id === 'weather' ? 'weather' :
              c.type, // Map old types to new registry types
        props: c.data || {},
        status: 'ready',
        metadata: { position: c.position }
      })));
    }
  }, [result, setWorkspaceComponents]);
  const predictions = getPredictions();
  const filteredLogs = getFilteredEntries();

  // Auto-scroll chat with user override detection
  useEffect(() => {
    if (chatContainerRef.current && !userScrolledUp) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, userScrolledUp]);

  // Detect user scroll
  const handleChatScroll = useCallback(() => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
      setUserScrolledUp(!isNearBottom);
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      setUserScrolledUp(false);
    }
  }, []);

  const handleSend = useCallback(async (text: string) => {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    addLog('info', 'UserInput', `Received: "${text.slice(0, 60)}${text.length > 60 ? '...' : ''}"`);

    // Intent analysis
    addLog('debug', 'IntentAnalyzer', 'Starting intent analysis...', { input: text.slice(0, 100) });
    const intentResult = await analyzeIntent(text);
    addLog('info', 'IntentAnalyzer', `Intent detected: ${intentResult.intent} (${intentResult.confidence}%)`, {
      intent: intentResult.intent,
      confidence: intentResult.confidence,
      layout: intentResult.layout,
    });
    addLog('debug', 'UIGenerator', `Generated ${intentResult.components.length} components`, {
      componentTypes: intentResult.components.map(c => c.type),
    });

    // Set streaming state
    setIsStreaming(true);

    // Build AI response with streaming
    const assistantMsgId = crypto.randomUUID();
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      metadata: {
        confidence: intentResult.confidence,
        reasoning: intentResult.reasoning,
        intent: intentResult.intent,
      },
    };
    setMessages(prev => [...prev, assistantMsg]);

    // Stream AI response
    let streamedContent = '';
    try {
      const streamMessages: ChatMessage[] = [
        {
          id: 'system',
          role: 'system',
          content: `You are Nexus, an AI workspace assistant. You just analyzed the user's intent and detected: "${intentResult.intent}" with ${intentResult.confidence}% confidence. Respond naturally and helpfully about what you've set up for them. Keep it brief (2-3 sentences).`,
          timestamp: Date.now(),
        },
        { ...userMsg, id: 'user' },
      ];

      for await (const chunk of streamChatCompletion(streamMessages)) {
        streamedContent += chunk;
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMsgId
              ? { ...m, content: streamedContent }
              : m
          )
        );
      }

      // If streaming returned empty or API not configured, use intelligent fallback
      if (!streamedContent.trim()) {
        const fallbackResponses: Record<string, string> = {
          planning: `I've set up a complete trip planning interface for ${intentResult.context.location || 'your destination'}. You'll find flight options, hotel recommendations, a day-by-day itinerary, and a budget breakdown — all ready for you to customize.`,
          booking: `I've prepared a booking interface with available options${intentResult.context.location ? ` for ${intentResult.context.location}` : ''}. You can compare prices, durations, and amenities before making your selection.`,
          comparison: `I've generated a side-by-side comparison table to help you evaluate your options. The analysis highlights key differences in price, features, and value.`,
          research: `I've gathered information${intentResult.context.location ? ` about ${intentResult.context.location}` : ''} including current weather, travel tips, and highlights. Let me know if you'd like me to dive deeper into any specific area.`,
          analysis: `I've created a detailed analysis dashboard with your key metrics, spending breakdown, and personalized recommendations for optimization.`,
          creation: `I've set up a creation workspace for you. Fill in the details and I'll help refine and develop your content.`,
          chat: `I'm here to help! I can plan trips, compare options, analyze data, or assist with creative tasks. What would you like to work on?`,
        };
        streamedContent = fallbackResponses[intentResult.intent] || fallbackResponses['chat'];
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMsgId
              ? { ...m, content: streamedContent }
              : m
          )
        );
      }

      addLog('info', 'AIResponse', 'Response completed', { contentLength: streamedContent.length });
    } catch (streamErr) {
      const errMsg = streamErr instanceof Error ? streamErr.message : 'Stream failed';
      addLog('error', 'AIResponse', `Streaming error: ${errMsg}`);
      // Update with error message
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMsgId
            ? { ...m, content: `I've analyzed your request and set up a ${intentResult.intent} interface with ${intentResult.confidence}% confidence. The layout includes ${intentResult.components.length} adaptive components for you to explore.` }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }

    if (intentResult.confidence > 90) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [analyzeIntent, setMessages, setIsStreaming, setShowConfetti]);

  const handlePredictionSelect = useCallback((suggestion: PredictiveSuggestion) => {
    const messages: Record<string, string> = {
      book_flight: 'Find flights for my trip',
      book_hotel: 'Find hotels near my destination',
      check_weather: 'Check the weather forecast',
      set_budget: 'Set a budget limit for this trip',
      rent_car: 'Rent a car for my trip',
      add_insurance: 'Add travel insurance',
      select_seats: 'Help me select seats',
      meal_pref: 'Set meal preferences',
      baggage: 'Check baggage policy',
      view_details: 'Show me detailed breakdown',
      save_compare: 'Save this comparison',
      share: 'Share this with my team',
      save: 'Save this to my favorites',
      compare: 'Compare the options',
      directions: 'Get directions',
      export: 'Export this report',
      alerts: 'Set up alerts',
      visualize: 'Show me trends visualization',
      refine: 'Help me refine this',
      plan_trip: 'Plan a trip for me',
      analyze: 'Analyze this data',
      recommend: 'Give me recommendations',
      find_restaurants: 'Find restaurants nearby',
      outdoor: 'Show outdoor activities',
    };
    handleSend(messages[suggestion.action] || suggestion.label);
  }, [handleSend]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isAnalyzing && !isStreaming) {
      handleSend(input.trim());
      setInput('');
    }
  };

  return (
    <div
      className="h-screen w-full flex flex-col overflow-hidden"
      style={{ background: '#FDFCF8' }}
    >
      {/* Confetti overlay */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="fixed inset-0 z-[100] pointer-events-none"
          >
            {confettiParticles.map((p, i) => (
              <motion.div
                key={i}
                initial={{ x: '50vw', y: '50vh', scale: 0, rotate: 0 }}
                animate={{
                  x: `${p.x}vw`,
                  y: `${p.y}vh`,
                  scale: p.scale,
                  rotate: p.rotate,
                }}
                transition={{ duration: p.duration, ease: 'easeOut' }}
                className="absolute w-2 h-2 rounded-sm"
                style={{
                  background: ['#BE123C', '#0F766E', '#15803D', '#B45309', '#78716C'][p.colorIndex],
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress bar */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-14 left-0 right-0 z-40 h-0.5"
            style={{ background: '#E7E5E4' }}
          >
            <motion.div
              className="h-full"
              style={{
                width: `${progress}%`,
                background: '#0F766E',
                transition: 'width 0.3s ease',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="flex flex-1 pt-14 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeModule={activeModule}
          onModuleChange={(mod) => {
            setActiveModule(mod);
            addLog('info', 'Navigation', `Switched to ${mod} module`);
            // Trigger intent based on module
            const moduleIntents: Record<string, string> = {
              analysis: 'Analyze this data for me',
              code: 'Help me write some code',
              creative: 'Help me create something',
              travel: 'Plan a trip for me',
              chat: 'Let\'s chat',
              data: 'Analyze my data',
            };
            if (moduleIntents[mod]) {
              handleSend(moduleIntents[mod]);
            }
          }}
          logEntries={filteredLogs}
          filterLevel={filterLevel}
          onFilterChange={setFilterLevel}
          onClearLog={clearEntries}
        />

        {/* Canvas */}
        <main className="flex-1 overflow-y-auto relative" role="main">
          {/* Performance Dashboard */}
          <div className="px-6 pt-6 mb-2">
            <MetricsDashboard metrics={metrics} recommendations={recommendations} />
          </div>

          {/* Intent Result Display */}
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key={result.intent}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Intent Header */}
                <div
                  className="sticky top-0 z-30 px-6 py-3 flex items-center justify-between"
                  style={{
                    background: 'rgba(253, 252, 248, 0.95)',
                    backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid #E7E5E4',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(190, 18, 60, 0.08)' }}
                    >
                      <Sparkles className="w-4 h-4" style={{ color: '#BE123C' }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium capitalize" style={{ color: '#292524' }}>
                          {result.intent} Interface
                        </span>
                        <ConfidenceBadge score={result.confidence} size="sm" />
                      </div>
                      <span className="text-[10px]" style={{ color: '#A8A29E' }}>{result.reasoning}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px]" style={{ color: '#A8A29E' }}>
                      {result.components.length} components
                    </span>
                  </div>
                </div>

                {/* Generated Layout */}
                <DynamicLayout
                  intent={result.intent}
                />

                {/* Predictive Chips */}
                <div className="px-6 py-4" style={{ borderTop: '1px solid #E7E5E4' }}>
                  <PredictiveChips
                    suggestions={predictions}
                    onSelect={handlePredictionSelect}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full text-center px-6"
              >
                <div
                  className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
                  style={{ background: '#1C1917' }}
                >
                  <Hexagon className="w-10 h-10 text-white" />
                </div>
                <h2
                  className="text-xl font-semibold mb-2"
                  style={{ color: '#292524', fontFamily: 'Playfair Display, serif' }}
                >
                  Welcome to Nexus
                </h2>
                <p className="text-sm max-w-md mb-8" style={{ color: '#78716C', lineHeight: 1.6 }}>
                  Describe what you need and I'll generate the perfect interface. Try planning a trip, analyzing data, or comparing options.
                </p>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg w-full">
                  {[
                    { icon: Sparkles, label: 'Plan a trip', desc: 'to Paris next week', color: '#BE123C' },
                    { icon: Terminal, label: 'Compare', desc: 'flights to Tokyo', color: '#0F766E' },
                    { icon: Hexagon, label: 'Analyze', desc: 'travel budget', color: '#B45309' },
                  ].map((action, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSend(`I want to ${action.label.toLowerCase()} ${action.desc}`)}
                      className="nexus-card p-4 text-left group"
                    >
                      <action.icon className="w-5 h-5 mb-2" style={{ color: action.color }} />
                      <div className="text-sm font-medium" style={{ color: '#292524' }}>{action.label}</div>
                      <div className="text-xs" style={{ color: '#A8A29E' }}>{action.desc}</div>
                    </motion.button>
                  ))}
                </div>

                {/* Recent Activity */}
                {messages.length > 0 && (
                  <div className="mt-12 w-full max-w-lg">
                    <div className="nexus-label mb-3">Recent Activity</div>
                    <div className="space-y-2">
                      {messages.filter(m => m.role === 'user').slice(-3).map((msg, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(msg.content)}
                          className="w-full text-left nexus-card px-4 py-3 flex items-center gap-3 group"
                        >
                          <ChevronRight className="w-4 h-4" style={{ color: '#A8A29E' }} />
                          <span className="text-sm truncate" style={{ color: '#78716C' }}>{msg.content}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Chat Panel */}
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 380, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="flex-shrink-0 overflow-hidden hidden md:flex md:flex-col"
              style={{
                borderLeft: '1px solid #E7E5E4',
                background: '#FFFFFF',
              }}
            >
              {/* Chat Header */}
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: '1px solid #E7E5E4' }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center"
                    style={{ background: 'rgba(190, 18, 60, 0.08)' }}
                  >
                    <Bot className="w-3.5 h-3.5" style={{ color: '#BE123C' }} />
                  </div>
                  <span className="text-sm font-medium" style={{ color: '#292524' }}>Nexus Chat</span>
                  {isAnalyzing && (
                    <div className="flex gap-0.5">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-1 h-1 rounded-full"
                          style={{
                            background: '#0F766E',
                            animation: `pulse-soft 1.4s ease-in-out ${i * 0.2}s infinite`,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setChatOpen(false)}
                  className="p-1 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BE123C]"
                  style={{ color: '#A8A29E' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#292524'; e.currentTarget.style.background = '#FAF9F6'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#A8A29E'; e.currentTarget.style.background = 'transparent'; }}
                  aria-label="Close chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Messages */}
              <div
                ref={chatContainerRef}
                onScroll={handleChatScroll}
                className="flex-1 overflow-y-auto p-4 space-y-4 relative"
                style={{ height: 'calc(100% - 130px)' }}
              >
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center gap-3" style={{ color: '#A8A29E' }}>
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(190, 18, 60, 0.06)' }}
                    >
                      <Bot className="w-6 h-6" style={{ color: '#BE123C' }} />
                    </div>
                    <div className="text-xs max-w-[200px]" style={{ color: '#78716C' }}>
                      Describe your intent and I'll generate the interface
                    </div>
                  </div>
                )}
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div
                        className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-1"
                        style={{ background: 'rgba(190, 18, 60, 0.08)' }}
                      >
                        <Bot className="w-3.5 h-3.5" style={{ color: '#BE123C' }} />
                      </div>
                    )}
                    <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                      <div
                        className={`px-3 py-2 rounded-xl text-xs leading-relaxed ${
                          msg.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'
                        }`}
                        style={
                          msg.role === 'user'
                            ? { background: '#1C1917', color: '#FAF9F6' }
                            : { background: '#FAF9F6', color: '#292524', border: '1px solid #E7E5E4' }
                        }
                      >
                        {msg.content || (msg.role === 'assistant' ? (
                          <span className="flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Thinking...
                          </span>
                        ) : msg.content)}
                      </div>
                      {msg.metadata?.confidence && (
                        <div className="mt-1">
                          <ConfidenceBadge score={msg.metadata.confidence} size="sm" />
                        </div>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div
                        className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-1"
                        style={{ background: 'rgba(15, 118, 110, 0.08)' }}
                      >
                        <User className="w-3.5 h-3.5" style={{ color: '#0F766E' }} />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Scroll to bottom button */}
              <AnimatePresence>
                {userScrolledUp && messages.length > 0 && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    onClick={scrollToBottom}
                    className="absolute bottom-20 right-6 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-colors"
                    style={{ background: '#1C1917', color: '#FAF9F6' }}
                    aria-label="Scroll to bottom"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Input */}
              <div className="p-3" style={{ borderTop: '1px solid #E7E5E4' }}>
                <form onSubmit={handleSubmit}>
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ background: '#FAF9F6', border: '1px solid #E7E5E4' }}
                  >
                    <button
                      type="button"
                      className="p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BE123C] rounded"
                      style={{ color: '#A8A29E' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#292524'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#A8A29E'; }}
                      aria-label="Voice input"
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      className="p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BE123C] rounded"
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
                      placeholder={isAnalyzing ? 'Analyzing...' : 'Describe your intent...'}
                      className="flex-1 bg-transparent text-xs outline-none"
                      style={{ color: '#292524' }}
                      disabled={isAnalyzing || isStreaming}
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || isAnalyzing || isStreaming}
                      className="p-1.5 rounded transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BE123C]"
                      style={{
                        background: input.trim() && !isAnalyzing && !isStreaming ? '#1C1917' : '#E7E5E4',
                        color: input.trim() && !isAnalyzing && !isStreaming ? '#FAF9F6' : '#A8A29E',
                      }}
                      aria-label="Send message"
                    >
                      {isAnalyzing || isStreaming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Toggle */}
        {!chatOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => setChatOpen(true)}
            className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BE123C] focus-visible:ring-offset-2"
            style={{ background: '#1C1917', color: '#FAF9F6' }}
            aria-label="Open chat"
          >
            <Maximize2 className="w-5 h-5" />
          </motion.button>
        )}
      </div>
    </div>
  );
}
