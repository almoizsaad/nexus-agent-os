import { useState } from 'react';
import { ChevronDown, ChevronUp, Brain, Sparkles } from 'lucide-react';

interface ReasoningPanelProps {
  reasoning: string;
  sources?: string[];
  isThinking?: boolean;
}

export default function ReasoningPanel({ reasoning, sources, isThinking }: ReasoningPanelProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="w-full">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BE123C] rounded px-1 py-0.5 -ml-1"
        style={{ color: '#78716C' }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#BE123C'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#78716C'; }}
        aria-expanded={expanded}
      >
        {isThinking ? (
          <Sparkles className="w-3.5 h-3.5 animate-pulse" style={{ color: '#0F766E' }} />
        ) : (
          <Brain className="w-3.5 h-3.5" />
        )}
        <span>{isThinking ? 'AI is thinking...' : 'View reasoning'}</span>
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {expanded && (
        <div
          className="mt-2 p-3 rounded-lg text-xs leading-relaxed"
          style={{
            background: '#FAF9F6',
            border: '1px solid #E7E5E4',
            color: '#78716C',
            animation: 'fade-in-up 0.2s ease',
          }}
        >
          <p>{reasoning}</p>
          {sources && sources.length > 0 && (
            <div className="mt-2 pt-2" style={{ borderTop: '1px solid #E7E5E4' }}>
              <span className="nexus-label" style={{ fontSize: 10 }}>Sources</span>
              <ul className="mt-1 space-y-1">
                {sources.map((s, i) => (
                  <li key={i} className="text-[10px]" style={{ color: '#0F766E' }}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
