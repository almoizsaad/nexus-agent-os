import React from 'react';
import { Mission, MissionPriority } from '@/agent/types/mission';
import { Badge } from '@/components/ui/badge';
import { Target, Shield, Clock, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MissionSummaryProps {
  mission: Mission;
}

const priorityColors: Record<MissionPriority, string> = {
  low: 'text-blue-500 border-blue-500/20',
  medium: 'text-yellow-500 border-yellow-500/20',
  high: 'text-orange-500 border-orange-500/20',
  critical: 'text-red-500 border-red-500/20',
};

export const MissionSummary: React.FC<MissionSummaryProps> = ({ mission }) => {
  const elapsedTime = React.useMemo(() => {
    return Math.floor((Date.now() - mission.createdAt) / 60000);
  }, [mission.createdAt]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight">{mission.title}</h2>
            <Badge variant="outline" className={cn("text-[10px] uppercase font-mono", priorityColors[mission.goal.priority])}>
              {mission.goal.priority} PRIORITY
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            {mission.goal.description}
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em] mb-1">Status</div>
          <Badge className="capitalize font-mono text-xs">{mission.status}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-3 rounded-lg bg-white/5 border border-white/5 space-y-1">
          <div className="text-[10px] font-mono text-muted-foreground uppercase flex items-center gap-1.5">
            <Target className="w-3 h-3" />
            Success Criteria
          </div>
          <div className="text-xs font-medium">{mission.goal.successCriteria.length} Points</div>
        </div>
        <div className="p-3 rounded-lg bg-white/5 border border-white/5 space-y-1">
          <div className="text-[10px] font-mono text-muted-foreground uppercase flex items-center gap-1.5">
            <Shield className="w-3 h-3" />
            Constraints
          </div>
          <div className="text-xs font-medium">{mission.constraints.length} Active</div>
        </div>
        <div className="p-3 rounded-lg bg-white/5 border border-white/5 space-y-1">
          <div className="text-[10px] font-mono text-muted-foreground uppercase flex items-center gap-1.5">
            <Brain className="w-3 h-3" />
            Active Agents
          </div>
          <div className="text-xs font-medium">{mission.runningAgents.length} Units</div>
        </div>
        <div className="p-3 rounded-lg bg-white/5 border border-white/5 space-y-1">
          <div className="text-[10px] font-mono text-muted-foreground uppercase flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            Elapsed Time
          </div>
          <div className="text-xs font-medium">
            {elapsedTime}m
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {mission.goal.successCriteria.map((item, i) => (
          <Badge key={i} variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px] py-0.5">
            <CheckCircleIcon className="w-3 h-3 mr-1" />
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
};

const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <path d="m9 11 3 3L22 4" />
  </svg>
);
