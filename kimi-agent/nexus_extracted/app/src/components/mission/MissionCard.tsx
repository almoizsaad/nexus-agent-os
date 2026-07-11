import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { Mission, MissionPriority, MissionStatus } from '@/agent/types/mission';
import { Target, AlertCircle, CheckCircle2, Clock, Play, Pause, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MissionCardProps {
  mission: Mission;
  onClick?: (mission: Mission) => void;
  className?: string;
}

const priorityColors: Record<MissionPriority, string> = {
  low: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  critical: 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse',
};

const statusIcons: Record<MissionStatus, React.ReactNode> = {
  idle: <Clock className="w-4 h-4" />,
  running: <Play className="w-4 h-4 text-green-500 animate-pulse" />,
  paused: <Pause className="w-4 h-4 text-yellow-500" />,
  completed: <CheckCircle2 className="w-4 h-4 text-blue-500" />,
  failed: <AlertCircle className="w-4 h-4 text-red-500" />,
  cancelled: <Square className="w-4 h-4 text-gray-500" />,
};

export const MissionCard: React.FC<MissionCardProps> = ({ mission, onClick, className }) => {
  const completedTasks = mission.plans.reduce(
    (acc, plan) => acc + plan.tasks.filter((t) => t.status === 'completed').length,
    0
  );
  const totalTasks = mission.plans.reduce((acc, plan) => acc + plan.tasks.length, 0);
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <Card 
      className={cn(
        "group cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-primary/50 bg-background/50 backdrop-blur-sm border-white/5",
        mission.status === 'running' && "ring-1 ring-primary/20",
        className
      )}
      onClick={() => onClick?.(mission)}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start mb-2">
          <Badge className={cn("text-[10px] uppercase tracking-wider font-bold", priorityColors[mission.goal.priority])}>
            {mission.goal.priority}
          </Badge>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {statusIcons[mission.status]}
            <span className="capitalize font-mono">{mission.status}</span>
          </div>
        </div>
        <CardTitle className="text-lg font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
          {mission.title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4 pb-4">
        <p className="text-sm text-muted-foreground line-clamp-2 italic">
          "{mission.goal.description}"
        </p>
        
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-mono uppercase text-muted-foreground tracking-widest">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1" />
        </div>
      </CardContent>
      
      <CardFooter className="pt-0 flex items-center justify-between text-[10px] text-muted-foreground font-mono">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Target className="w-3 h-3" />
            {mission.runningAgents.length} Agents
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(mission.createdAt).toLocaleDateString()}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
};
