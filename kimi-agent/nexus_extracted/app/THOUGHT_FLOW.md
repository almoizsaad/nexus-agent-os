# Nexus Agent OS — Thought Flow (Intelligence Loop)

## 1. The Cognitive Cycle
The "Intelligence Loop" ensures that every execution informs future decisions through the Reflection and Memory layers.

```mermaid
graph TD
    Execution[Execution Events] --> Analyzer[Execution Analyzer]
    Analyzer --> Reflection[Reflection Engine]
    
    subgraph "Introspection"
        Reflection --> Lessons[Identify Lessons Learned]
        Reflection --> Mistakes[Identify Mistakes]
        Reflection --> Fixes[Identify Improvements]
    end
    
    Lessons --> Memory[Memory Manager]
    Mistakes --> Memory
    Fixes --> Memory
    
    Memory --> Semantic[Semantic Memory Store]
    Semantic --> Context[Context Retrieval]
    Context --> Planner[Future Planning Cycles]
```

## 2. Memory Tiering
- **Working Memory**: Transient state for the current task (status, parameters).
- **Session Memory**: Episodic log of the current mission (all events).
- **Semantic Memory**: Consolidated insights and facts persisted across missions.

## 3. Self-Improvement
The `ImprovementEngine` monitors system performance (latency, success rates) and provides optimization recommendations. These recommendations can dynamically adjust agent behavior, such as increasing retry limits for non-deterministic tools or suggesting plan refinements.
