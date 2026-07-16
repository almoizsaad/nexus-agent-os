import React, { useEffect } from 'react';
import { useMissionStore } from '@/stores/missionStore';
import { MissionCard } from './MissionCard';
import { MissionPanel } from './MissionPanel';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Target, Activity, Cpu, History, Settings } from 'lucide-react';
import ParticleCanvas from '../generative-ui/ParticleCanvas';
import { Card } from '../ui/card';
import { agent } from '@/agent/bootstrap/createAgent';

export const MissionWorkspace: React.FC = () => {
  const { missions, activeMissionId, setActiveMission, addMission } = useMissionStore();
  const activeMission = activeMissionId ? missions[activeMissionId] : null;

  useEffect(() => {
    // Initial state setup if needed, but no mock data
  }, [missions, addMission, setActiveMission]);

  const handleInitiateMission = async () => {
    const goal = window.prompt('Enter mission objective:');
    if (!goal) return;

    await agent.executiveBrain.createMission(goal, {
      description: goal,
      successCriteria: ['Task completed as requested'],
      priority: 'medium'
    });
  };

  const missionList = Object.values(missions).sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <ParticleCanvas />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,102,255,0.05),transparent_70%)] pointer-events-none" />

      {/* Sidebar - Mission Explorer */}
      <aside className="w-80 flex flex-col border-r border-white/5 bg-background/50 backdrop-blur-2xl z-20">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Target className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold tracking-tight text-lg">NEXUS</span>
          </div>
          <Button size="icon" variant="ghost" className="rounded-full w-8 h-8 border border-white/5">
            <Settings className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>

        <div className="p-4 border-b border-white/5">
          <Button 
            className="w-full gap-2 font-mono text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20"
            onClick={handleInitiateMission}
          >
            <Plus className="w-4 h-4" />
            Initiate Mission
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Activity className="w-3 h-3" />
              Active Operations
            </div>
            
            {missionList.length > 0 ? (
              missionList.map((mission) => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  onClick={() => setActiveMission(mission.id)}
                  className={activeMissionId === mission.id ? "border-primary/50 bg-primary/5 shadow-lg shadow-primary/5" : ""}
                />
              ))
            ) : (
              <div className="py-20 text-center space-y-4">
                <div className="w-12 h-12 rounded-full border border-dashed border-white/10 mx-auto flex items-center justify-center">
                  <Target className="w-6 h-6 text-muted-foreground/20" />
                </div>
                <p className="text-[10px] font-mono uppercase text-muted-foreground/50 tracking-widest">
                  No active missions detected
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative z-10">
        {activeMission ? (
          <div className="flex-1 p-6 overflow-hidden">
            <MissionPanel mission={activeMission} />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-8 max-w-2xl mx-auto">
            <div className="relative">
              <div className="absolute inset-0 bg-primary blur-[100px] opacity-20" />
              <Target className="w-20 h-20 text-primary animate-pulse relative z-10" />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl font-black tracking-tighter">SELECT AN OPERATION</h1>
              <p className="text-muted-foreground leading-relaxed">
                Welcome to the Nexus Command Center. Select an existing mission from the explorer or 
                initiate a new autonomous sequence to begin.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 w-full">
              <Card className="p-6 bg-white/5 border-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                <History className="w-8 h-8 text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold mb-1">Operational History</h3>
                <p className="text-[10px] text-muted-foreground uppercase font-mono">Review past successes and failures</p>
              </Card>
              <Card className="p-6 bg-white/5 border-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                <Cpu className="w-8 h-8 text-purple-500 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold mb-1">System Status</h3>
                <p className="text-[10px] text-muted-foreground uppercase font-mono">Monitor all active kernel processes</p>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
