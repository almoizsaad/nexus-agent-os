export interface ReflectionResult {
  workflowId: string;
  timestamp: number;
  success: boolean;
  confidenceScore: number;
  lessonsLearned: string[];
  mistakes: string[];
  improvements: string[];
  metadata: Record<string, unknown>;
}

export interface ExecutionAnalysis {
  workflowId: string;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  retries: number;
  duration: number;
  errors: string[];
}

export interface IExecutionAnalyzer {
  analyze(workflowId: string, events: unknown[]): Promise<ExecutionAnalysis>;
}

export interface ISelfReflectionEngine {
  reflect(analysis: ExecutionAnalysis): Promise<ReflectionResult>;
}

export interface IPlanImprover {
  suggestImprovements(reflection: ReflectionResult): Promise<string[]>;
}

export interface IFailureAnalyzer {
  analyzeFailure(taskId: string, error: string): Promise<string>;
}

export interface ISuccessAnalyzer {
  analyzeSuccess(taskId: string, result: unknown): Promise<string>;
}
