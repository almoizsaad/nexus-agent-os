# Nexus OS — Intelligence Operating Environment

**Beyond the Chatbot Challenge — DOO Builders League 2026**

Nexus OS is a generative operating environment where natural language intent is synthesized into live system processes. It replaces traditional conversational interfaces with a unified control plane.

## Live Demo

**[Enter Nexus OS Control Plane](https://vnjxkqdyo6wlm.kimi.page)**

## What Makes Nexus OS Different

| Traditional AI Chatbots | Nexus OS |
|---|---|
| Text-only responses | Dynamic generated shells |
| Static UI | Intent-adaptive layouts |
| Generic replies | Context-aware mission synthesis |
| Hidden reasoning | Transparent kernel logs |

## Features

- **Intent Kernel** — Natural language parsed into executable intent with confidence scoring
- **Generative Shell** — Dynamic layouts: control planes, timelines, comparisons, forms
- **Predictive Scheduler** — Anticipates system needs with context-aware suggestions
- **Neural Agent Integration** — Powered by Moonshot AI with streaming responses
- **Secure Reasoner** — Every kernel decision shows its logic
- **Geospatial Mission Synthesis** — Showcase mission with flights, hotels, itineraries, budgets

## Architecture

```
User Input → Intent Analyzer (AI API) → UI Generator → Rendered Interface
                ↓                              ↓
        Confidence Score              Predictive Chips
        Reasoning Panel               Context Awareness
```

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS
- **State Management:** Zustand + TanStack Query
- **AI:** Moonshot API (moonshot-v1-8k) with streaming
- **Routing:** React Router (HashRouter)
- **Animations:** Framer Motion + GSAP

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Add your Moonshot API key to .env

# Start development
npm run dev

# Build for production
npm run build
```

### Environment Variables

```env
VITE_API_KEY=your_moonshot_api_key
VITE_API_BASE_URL=https://api.moonshot.cn/v1
```

## Project Structure

```
src/
├── components/
│   ├── layout/          # Navbar, Sidebar
│   ├── generative-ui/   # DynamicLayout, PredictiveChips
│   └── ui/              # shadcn/ui components
├── lib/
│   ├── agents/          # Intent analyzer (AI API)
│   └── types/           # TypeScript types
├── stores/              # Zustand stores
├── hooks/               # Custom React hooks
├── pages/               # Home, Workspace
└── sections/            # HeroSection, NeuralDatastream
```

## Design System

Nexus uses the "Artisan Editorial" design language:

- **Colors:** Warm paper white (#FDFCF8), crimson ink (#BE123C), deep teal (#0F766E)
- **Typography:** Playfair Display (headlines), Inter (body), IBM Plex Mono (data)
- **Patterns:** Paper texture overlay, physical cards, stamp badges, ink-spread progress

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — System architecture and data flow
- [FAILURE_TESTS.md](./FAILURE_TESTS.md) — Failure scenarios and recovery
- [UX_PRINCIPLES.md](./UX_PRINCIPLES.md) — Design philosophy and UX patterns

## License

MIT — DOO Builders League 2026
