# API Reference — Nexus Agent OS

## Agent Core

### `ExecutiveBrain`
The top-level controller for mission management.
- `createMission(title: string, goal: MissionGoal, context?: Record<string, any>): Promise<string>`
- `cancelMission(missionId: string): Promise<void>`
- `getGoalManager(): GoalManager`

### `AgentRuntime`
The base class for all agents.
- `processGoal(goal: string): Promise<void>`
- `healthCheck(): { status: string; details: any }`
- `destroy(): void`
- `registerPlanner(planner: Planner): void`
- `registerExecutor(executor: Executor): void`

### `CoordinatorAgent`
Extends `AgentRuntime` with multi-agent coordination capabilities.
- `startMission(mission: Mission): Promise<void>`
- `startCooperativePlan(plan: CooperativePlan): Promise<void>`

## Memory & Knowledge

### `MemoryManager`
Manages episodic and semantic memory.
- `remember(content: any, metadata?: any): Promise<void>`
- `recallMemories(query: string): Promise<any[]>`
- `consolidateSession(goalId: string): Promise<void>`

### `KnowledgeGraph`
Maintains a graph of entities and relationships.
- `addNode(node: KnowledgeNode): void`
- `addEdge(edge: KnowledgeEdge): void`
- `query(criteria: any): KnowledgeNode[]`

## Communication

### `UnifiedEventBus`
The central message bus for the system.
- `publish(event: UnifiedEvent): void`
- `subscribe(pattern: string, listener: (event: UnifiedEvent) => void): () => void`

## Types

### `Mission`
```typescript
interface Mission {
  id: string;
  title: string;
  goal: MissionGoal;
  status: MissionStatus;
  createdAt: number;
  updatedAt: number;
  // ...
}
```

### `MissionGoal`
```typescript
interface MissionGoal {
  description: string;
  successCriteria: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}
```
