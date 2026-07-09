# Nexus — System Architecture

## Overview

Nexus is an Intent-Driven Generative UI system that transforms natural language input into adaptive user interfaces through real-time AI analysis.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │   Navbar    │  │   Sidebar    │  │ Main Canvas  │  │ Chat Panel  │ │
│  │  (Nav/Routing│  │(Modules/Log) │  │(Dynamic UI)  │  │ (AI Chat)   │ │
│  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘ │
└─────────┼────────────────┼─────────────────┼─────────────────┼────────┘
          │                │                 │                 │
          └────────────────┴────────┬────────┴─────────────────┘
                                    │
                          ┌─────────┴─────────┐
                          │   React Frontend   │
                          │  (React 19 + Vite) │
                          └─────────┬─────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
   ┌──────┴──────┐      ┌──────────┴──────────┐     ┌──────┴──────┐
   │  Zustand    │      │   TanStack Query    │     │  Framer/   │
   │   Stores    │      │   (Server State)    │     │    GSAP    │
   └──────┬──────┘      └──────────┬──────────┘     └─────────────┘
          │                        │
          │              ┌─────────┴─────────┐
          │              │   Intent Hook     │
          │              │  (useIntent.ts)   │
          │              └─────────┬─────────┘
          │                        │
          │              ┌─────────┴─────────┐
          │              │ IntentAnalyzer.ts │
          │              │ (Moonshot AI API) │
          │              └─────────┬─────────┘
          │                        │
          │              ┌─────────┴─────────┐
          │              │   Moonshot API    │
          │              │ (api.moonshot.cn) │
          │              └───────────────────┘
          │
   ┌──────┴──────────────────────────────────────┐
   │              State Management                 │
   │  ┌─────────────┐      ┌───────────────────┐ │
   │  │  intentStore │      │    userStore      │ │
   │  │  (UI State)  │      │  (Session/History)│ │
   │  └─────────────┘      └───────────────────┘ │
   │  ┌─────────────┐      ┌───────────────────┐ │
   │  │   logStore   │      │  queryClient      │ │
   │  │(System Logs) │      │  (TanStack Query) │ │
   │  └─────────────┘      └───────────────────┘ │
   └─────────────────────────────────────────────┘
```

## Data Flow

```
1. User Input
   └─→ Text message entered in chat panel

2. Intent Analysis
   └─→ Local keyword matching (fallback)
   └─→ Moonshot AI API call (primary) with system prompt
   └─→ Response: { intent, confidence, reasoning }

3. Confidence Calculation
   └─→ intentMatch * 0.4 + contextScore * 0.2 + apiQuality * 0.3 + ambiguity * -0.1
   └─→ Adjusted by input length and specificity
   └─→ Result: 10-100 dynamic score

4. Context Extraction
   └─→ Location: regex patterns for "to Paris", "in Tokyo"
   └─→ Dates: "next week", "March 15-22", "tomorrow"
   └─→ Budget: "$5000 budget"

5. Component Generation
   └─→ Based on detected intent + context
   └─→ Realistic data with current dates, real airline names
   └─→ 5-6 components per layout type

6. UI Rendering
   └─→ DynamicLayout maps components to grid positions
   └─→ ComponentRenderer selects card type by ID/title
   └─→ AnimatePresence handles enter/exit animations

7. Predictive Suggestions
   └─→ Generated from current intent context
   └─→ History-based confidence adjustments
   └─→ Time/season-aware additional suggestions
```

## Component Hierarchy

```
App
├── HashRouter
│   ├── Routes
│   │   ├── / → Home (landing page)
│   │   └── /workspace → Workspace
│   │       ├── Navbar
│   │       ├── Sidebar
│   │       │   ├── Module Navigation (6 modules)
│   │       │   └── System Log (with filters)
│   │       ├── Main Canvas
│   │       │   └── DynamicLayout
│   │       │       ├── ComponentRenderer
│   │       │       │   ├── FlightCard
│   │       │       │   ├── HotelCard
│   │       │       │   ├── TimelineView
│   │       │       │   ├── BudgetChart
│   │       │       │   ├── OverviewCard
│   │       │       │   ├── WeatherWidget
│   │       │       │   ├── TableComponent
│   │       │       │   ├── FormComponent
│   │       │       │   ├── ListComponent
│   │       │       │   └── AnalysisCard
│   │       │       └── PredictiveChips
│   │       └── ChatPanel (inline)
│   └── Toaster
```

## API Specification

### Intent Analysis

**Request:**
```http
POST https://api.moonshot.cn/v1/chat/completions
Authorization: Bearer {API_KEY}
Content-Type: application/json

{
  "model": "moonshot-v1-8k",
  "messages": [
    {
      "role": "system",
      "content": "You are an intent analyzer. Analyze user input and respond ONLY with a JSON object..."
    },
    {
      "role": "user",
      "content": "Plan a trip to Paris next week"
    }
  ],
  "response_format": { "type": "json_object" }
}
```

**Response:**
```json
{
  "intent": "planning",
  "confidence": 94,
  "reasoning": "Detected travel planning intent with date context"
}
```

### Chat Completion (Streaming)

**Request:**
```http
POST https://api.moonshot.cn/v1/chat/completions
Authorization: Bearer {API_KEY}
Content-Type: application/json

{
  "model": "moonshot-v1-8k",
  "messages": [...],
  "stream": true
}
```

**Response:** Server-Sent Events stream
```
data: {"choices":[{"delta":{"content":"I'll"}}]}
data: {"choices":[{"delta":{"content":" help"}}]}
data: [DONE]
```

## Data Models

### IntentResult
```typescript
interface IntentResult {
  intent: 'booking' | 'research' | 'analysis' | 'creation' | 'comparison' | 'planning' | 'chat';
  confidence: number;        // 10-100, dynamically calculated
  layout: 'dashboard' | 'form' | 'timeline' | 'comparison' | 'chat' | 'gallery' | 'map';
  components: ComponentConfig[];
  context: UserContext;
  reasoning: string;
  predictedNext?: string;
}
```

### ComponentConfig
```typescript
interface ComponentConfig {
  id: string;                // Unique identifier
  type: 'card' | 'table' | 'chart' | 'form' | 'timeline' | 'map' | 'gallery' | 'list';
  title: string;
  data: Record<string, unknown>;
  position: { x, y, w, h };  // Grid position (12-column grid)
}
```

### UserContext
```typescript
interface UserContext {
  preferences: Record<string, unknown>;
  history: string[];         // Last 10 user inputs
  location?: string;         // Extracted destination
  dates?: { start?: string; end?: string };
  budget?: { min?: number; max?: number };
}
```

### LogEntry
```typescript
interface LogEntry {
  id: string;                // crypto.randomUUID()
  timestamp: string;         // ISO 8601
  level: 'info' | 'warn' | 'error' | 'debug';
  source: string;            // Component name
  message: string;
  metadata?: Record<string, unknown>;
}
```

## State Management

### Zustand Stores

| Store | Purpose | Persistence |
|-------|---------|-------------|
| `intentStore` | Current intent, confidence, components | Session |
| `userStore` | Session history, preferences | Session |
| `logStore` | System log entries (last 200) | Session |

### TanStack Query

| Query Key | Purpose | Stale Time |
|-----------|---------|------------|
| N/A (intent uses mutation) | Intent analysis | 5 minutes |

## Design System

See [UX_PRINCIPLES.md](./UX_PRINCIPLES.md) for complete design system documentation.

## Key Design Decisions

1. **HashRouter over BrowserRouter** — Prevents 404 errors on static hosting
2. **Zustand over Redux** — Simpler API, less boilerplate for our use case
3. **Streaming over polling** — Real-time AI responses feel more responsive
4. **Component mapping by ID/title** — Flexible matching without strict schema
5. **Local + AI hybrid** — Keyword matching as fallback ensures offline functionality
