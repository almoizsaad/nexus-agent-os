import React from 'react';
import { Mission } from '@/agent/types/mission';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MissionProgressProps {
  mission: Mission;
}

export const MissionProgress: React.FC<MissionProgressProps> = ({ mission }) => {
  return (
    <div className="space-y-8">
      {mission.plans.map((plan, planIdx) => (
        <section key={plan.id} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-primary/20 flex items-center justify-center text-[8px] text-primary">
                {planIdx + 1}
              </span>
              Operational Plan: {plan.goal}
            </h3>
            <Badge variant="outline" className="text-[10px] font-mono">
              {plan.tasks.filter(t => t.status === 'completed').length} / {plan.tasks.length}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {plan.tasks.map((task) => (
              <Card key={task.id} className={cn(
                "p-4 bg-white/5 border-white/5 transition-all duration-300",
                task.status === 'running' && "border-primary/50 shadow-lg shadow-primary/10"
              )}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {task.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                    {task.status === 'running' && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
                    {task.status === 'pending' && <Circle className="w-4 h-4 text-muted-foreground/30" />}
                    {task.status === 'failed' && <AlertCircle className="w-4 h-4 text-red-500" />}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "text-sm font-medium",
                        task.status === 'completed' && "text-muted-foreground line-through decoration-primary/30"
                      )}>
                        {task.description}
                      </span>
                      <span className="text-[10px] font-mono uppercase text-muted-foreground">
                        {task.status}
                      </span>
                    </div>
                    
                    {task.status === 'running' && (
                      <div className="space-y-1">
                        <Progress value={45} className="h-0.5" />
                        <div className="text-[8px] font-mono text-primary/70 animate-pulse">
                          AGENT_EXECUTING_TASK_ID_{task.id.substring(0, 8)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      ))}

      {mission.plans.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
          <div className="text-[10px] font-mono uppercase tracking-[0.2em]">
            Formulating Operational Plan...
          </div>
        </div>
      )}
    </div>
  );
};
