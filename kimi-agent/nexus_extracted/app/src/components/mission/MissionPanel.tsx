import React from 'react';
import type { Mission } from '@/agent/types/mission';
import { MissionProgress } from './MissionProgress';
import { MissionHistory } from './MissionHistory';
import { MissionSummary } from './MissionSummary';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Activity, History, Database, Network } from 'lucide-react';

interface MissionPanelProps {
  mission: Mission;
  className?: string;
}

export const MissionPanel: React.FC<MissionPanelProps> = ({ mission, className }) => {
  return (
    <div className={`flex flex-col h-full bg-background/30 backdrop-blur-xl border border-white/5 rounded-xl overflow-hidden ${className}`}>
      <div className="p-6 border-b border-white/5 bg-gradient-to-br from-primary/5 to-transparent">
        <MissionSummary mission={mission} />
      </div>

      <Tabs defaultValue="overview" className="flex-1 flex flex-col">
        <div className="px-6 border-b border-white/5">
          <TabsList className="bg-transparent border-none gap-6 h-12">
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
              Timeline
            </TabsTrigger>
            <TabsTrigger 
              value="insights" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 gap-2 font-mono text-xs uppercase tracking-widest"
            >
              <Brain className="w-3 h-3" />
              Insights
            </TabsTrigger>
            <TabsTrigger 
              value="state" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 gap-2 font-mono text-xs uppercase tracking-widest"
            >
              <Database className="w-3 h-3" />
              System State
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          <TabsContent value="overview" className="p-6 m-0 outline-none">
            <MissionProgress mission={mission} />
          </TabsContent>
          
          <TabsContent value="timeline" className="p-6 m-0 outline-none">
            <MissionHistory mission={mission} />
          </TabsContent>
          
          <TabsContent value="insights" className="p-6 m-0 outline-none space-y-8">
            <section>
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                <Brain className="w-3 h-3 text-purple-500" />
                Thought Process
              </h3>
              <div className="space-y-4">
                {mission.thoughts.map((thought, i) => (
                  <div key={i} className="p-4 rounded-lg bg-white/5 border border-white/5 text-sm italic text-muted-foreground">
                    {thought.content}
                  </div>
                ))}
              </div>
            </section>
            
            <section>
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                <Activity className="w-3 h-3 text-blue-500" />
                Reflections
              </h3>
              <div className="space-y-4">
                {mission.reflections.map((reflection, i) => (
                  <div key={i} className="p-4 rounded-lg bg-white/5 border border-white/5 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className={`text-xs font-bold ${reflection.success ? 'text-green-500' : 'text-red-500'}`}>
                        {reflection.success ? 'Success' : 'Failure'} ({(reflection.confidenceScore * 100).toFixed(0)}%)
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {new Date(reflection.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <strong>Lessons:</strong> {reflection.lessonsLearned.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </TabsContent>
          
          <TabsContent value="state" className="p-6 m-0 outline-none space-y-8">
            <section>
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                <Database className="w-3 h-3 text-emerald-500" />
                Memory Updates
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mission.memoryUpdates.map((update, i) => (
                  <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/5 font-mono text-[10px]">
                    <div className="text-primary mb-1">{update.key}</div>
                    <div className="truncate text-muted-foreground">{JSON.stringify(update.value)}</div>
                  </div>
                ))}
              </div>
            </section>
            
            <section>
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                <Network className="w-3 h-3 text-amber-500" />
                Knowledge Graph
              </h3>
              <div className="space-y-3">
                {mission.knowledgeUpdates.map((update, i) => (
                  <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/5 flex items-start gap-3">
                    <div className="mt-1 w-2 h-2 rounded-full bg-amber-500" />
                    <div>
                      <div className="text-xs font-bold">{update.type}</div>
                      <div className="text-xs text-muted-foreground">{update.summary}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};
