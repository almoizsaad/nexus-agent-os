# Nexus Agent OS — Mission Lifecycle Flow

## 1. Mission Decomposition and Execution
A mission follows a structured lifecycle from high-level goal to verified achievement.

```mermaid
sequenceDiagram
    participant U as User
    participant B as ExecutiveBrain
    participant C as CoordinatorAgent
    participant W as WorkerAgent
    participant T as ToolRegistry

    U->>B: Submit Goal (e.g., "Plan Trip")
    B->>C: Create & Start Mission
    C->>C: Planner.generatePlan(goal)
    C->>C: PlanValidator.validate()
    C->>B: Emit PLAN_STARTED
    
    rect rgb(240, 240, 240)
        Note over C,W: Execution Cycle
        C->>W: Assign Task (Direct Message)
        W->>T: executeTool(params)
        T-->>W: Tool Result
        W->>C: Task Completed (Direct Message)
    end
    
    C->>C: DependencyResolver.getReadyTasks()
    Note right of C: Repeats until all tasks done
    
    C->>B: Emit PLAN_COMPLETED
    B->>U: Mission Success
```

## 2. Recovery Scenarios
- **Task Failure**: Coordinator triggers automatic retry (up to 3 times).
- **Persistent Failure**: Coordinator triggers `replan` (up to 2 times).
- **Mission Failure**: ExecutiveBrain triggers mission retry (incremental backoff).

## 3. Parallelism
Tasks without dependencies are executed in parallel by the `WorkflowEngine` and `PlannerCoordinator`, maximizing throughput and reducing overall mission latency.
