import React from 'react';
import type { Mission } from '@/agent/types/mission';
import { MissionProgress } from './MissionProgress';
import { MissionHistory } from './MissionHistory';
import { MissionSummary } from './MissionSummary';
import { ReflectionPanel } from './ReflectionPanel';
import { KnowledgeExplorer } from './KnowledgeExplorer';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Activity, History, Network, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MissionPanelProps {
  mission: Mission;
  className?: string;
}

export const MissionPanel: React.FC<MissionPanelProps> = ({ mission, className }) => {
  const thoughtsByType = mission.thoughts.reduce((acc, thought) => {
    if (!acc[thought.type]) acc[thought.type] = [];
    acc[thought.type].push(thought);
    return acc;
  }, {} as Record<string, typeof mission.thoughts>);

  return (
    <div className={`flex flex-col h-full bg-background/30 backdrop-blur-xl border border-white/5 rounded-xl overflow-hidden ${className}`}>
      <div className="p-6 border-b border-white/5 bg-gradient-to-br from-primary/5 to-transparent">
        <MissionSummary mission={mission} />
      </div>

      <Tabs defaultValue="overview" className="flex-1 flex flex-col">
        <div className="px-6 border-b border-white/5">
          <TabsList className="bg-transparent border-none gap-6 h-12 overflow-x-auto no-scrollbar">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 gap-2 font-mono text-xs uppercase tracking-widest"
            >
              <Activity className="w-3 h-3" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="timeline" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 gap-2 font-mono text-xs uppercase tracking-widest"
            >
              <History className="w-3 h-3" />
              Trace
            </TabsTrigger>
            <TabsTrigger 
              value="thoughts" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 gap-2 font-mono text-xs uppercase tracking-widest"
            >
              <Brain className="w-3 h-3" />
              Reasoning
            </TabsTrigger>
            <TabsTrigger 
              value="reflections" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 gap-2 font-mono text-xs uppercase tracking-widest"
            >
              <Shield className="w-3 h-3" />
              Reflections
            </TabsTrigger>
            <TabsTrigger 
              value="knowledge" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 gap-2 font-mono text-xs uppercase tracking-widest"
            >
              <Network className="w-3 h-3" />
              Cognitive
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="overview" className="h-full m-0 outline-none">
            <ScrollArea className="h-full p-6">
              <MissionProgress mission={mission} />
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="timeline" className="h-full m-0 outline-none">
            <ScrollArea className="h-full p-6">
              <MissionHistory mission={mission} />
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="thoughts" className="h-full m-0 outline-none">
            <ScrollArea className="h-full p-6 space-y-8">
              {Object.entries(thoughtsByType).map(([type, thoughts]) => (
                <section key={type} className="space-y-4">
                  <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {type}
                  </h3>
                  <div className="space-y-3">
                    {thoughts.map((thought, i) => (
                      <div key={i} className="group relative p-4 rounded-lg bg-white/5 border border-white/5 hover:border-primary/20 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] font-mono text-muted-foreground opacity-50">
                            {new Date(thought.timestamp).toLocaleTimeString()}
                          </span>
                          {thought.taskId && (
                            <Badge variant="outline" className="text-[8px] h-4 rounded-none border-white/10 font-mono">
                              TASK: {thought.taskId.slice(0, 8)}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs leading-relaxed text-muted-foreground group-hover:text-foreground transition-colors">
                          {thought.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
              {mission.thoughts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-30">
                  <Brain className="w-12 h-12" />
                  <p className="text-xs font-mono uppercase tracking-widest">Awaiting Runtime Reasoning...</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="reflections" className="h-full m-0 outline-none">
            <ScrollArea className="h-full p-6">
              <ReflectionPanel reflections={mission.reflections} />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="knowledge" className="h-full m-0 outline-none">
            <div className="h-full p-6">
              <KnowledgeExplorer mission={mission} />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
