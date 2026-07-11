# Developer Guide — Nexus Agent OS

## Introduction

Nexus Agent OS is a multi-agent framework designed for complex mission orchestration and adaptive user interfaces. This guide provides developers with the knowledge needed to extend the agent's capabilities, add new tools, and integrate the agent into new environments.

## Core Concepts

### 1. The Executive Brain
The `ExecutiveBrain` is the top-level controller. It manages missions via the `GoalManager` and schedules them using the `MissionScheduler`.
- **Goal**: High-level intent from the user.
- **Mission**: A tracked instance of a goal with its own state and context.

### 2. Coordinator Agent
The `CoordinatorAgent` is a specialized agent that decomposes missions into cooperative plans. It handles task delegation and multi-agent consensus.

### 3. Memory & Knowledge
- **Episodic Memory**: Session-specific events.
- **Semantic Memory**: Long-term, consolidated insights and reflections.
- **Knowledge Graph**: Structured relationships between entities and insights.

## Extending the Agent

### Adding a New Tool
1. Create a new tool class implementing the `AdvancedTool` interface.
2. Define its `inputSchema` and `outputSchema` using JSON Schema.
3. Register the tool in the `ToolRegistry`.

```typescript
export class MyCustomTool implements AdvancedTool {
  name = 'my_tool';
  description = 'Performs a specific action';
  inputSchema = { ... };
  outputSchema = { ... };
  async execute(args: Record<string, any>) {
    // Implementation
  }
}
```

### Adding a New Agent Role
Roles are defined in `src/agent/types/agent.ts`. To add a role:
1. Update the `AgentRole` type.
2. Define the role's capabilities in the `AgentFactory` or when spawning agents.

## Development Workflow

### Testing
Nexus uses Vitest for testing.
- `npm test`: Runs all tests.
- `npm run coverage`: Generates coverage reports.

### Linting
- `npm run lint`: Checks for code style and type safety issues.

### Building
- `npm run build`: Generates the production bundle in the `dist/` directory.

## Advanced Configuration

### Event Bus
The system uses a `UnifiedEventBus` for all communication. You can subscribe to topics like `agent.events`, `agent.actions`, or `workspace.events`.

```typescript
eventBus.subscribe('agent.events', (event) => {
  console.log('Received agent event:', event);
});
```

### Safety Layer
The `SafetyLayer` intercepts all tool requests and plans. You can add custom validation logic to ensure the agent operates within safe boundaries.
