import React, { useEffect } from 'react';
import { useMissionStore } from '@/stores/missionStore';
import { MissionCard } from './MissionCard';
import { MissionPanel } from './MissionPanel';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Target, LayoutDashboard, History, Settings } from 'lucide-react';
import ParticleCanvas from '../generative-ui/ParticleCanvas';
import type { Mission } from '@/agent/types/mission';
import { Card } from '../ui/card';

export const MissionWorkspace: React.FC = () => {
  const { missions, activeMissionId, setActiveMission, addMission } = useMissionStore();
  const activeMission = activeMissionId ? missions[activeMissionId] : null;

  useEffect(() => {
    if (Object.keys(missions).length === 0) {
      const mockMission: Mission = {
        id: 'mission-1',
        title: 'Project Phoenix: System Migration',
        goal: {
          description: 'Migrate the entire legacy database to the new distributed architecture while maintaining zero downtime.',
          successCriteria: ['Zero data loss', 'No downtime during cutover', 'Latency reduced by 40%'],
          priority: 'critical'
        },
        context: { env: 'production', cluster: 'us-east-1' },
        constraints: ['Max bandwidth: 1Gbps', 'Freeze window: Sunday 02:00-04:00'],
        status: 'running',
        createdAt: Date.now() - 3600000,
        updatedAt: Date.now(),
        plans: [
          {
            id: 'plan-1',
            goal: 'Phase 1: Readiness Assessment',
            createdAt: Date.now() - 3600000,
            tasks: [
              { id: 'task-1', description: 'Validate source schema consistency', status: 'completed' },
              { id: 'task-2', description: 'Check destination cluster connectivity', status: 'completed' },
              { id: 'task-3', description: 'Run synthetic load tests on staging', status: 'running' },
              { id: 'task-4', description: 'Configure final replication hooks', status: 'pending' },
            ]
          }
        ],
        runningAgents: [
          { id: 'agent-1', name: 'Alpha-Orchestrator', role: 'orchestrator', capabilities: ['planning', 'coordination'] },
          { id: 'agent-2', name: 'Data-Migrator-1', role: 'worker', capabilities: ['sql', 'io'] }
        ],
        timeline: [
          { id: 't-1', timestamp: Date.now() - 3600000, type: 'event', title: 'Mission Initiated', description: 'High-level goal received and parsed.' },
          { id: 't-2', timestamp: Date.now() - 3300000, type: 'thought', title: 'Strategy Formulated', description: 'Decided to use phased replication to ensure zero downtime.' },
          { id: 't-3', timestamp: Date.now() - 3000000, type: 'action', title: 'Task Executed', description: 'Schema validation completed successfully.' },
        ],
        thoughts: [
          { id: crypto.randomUUID(), agentId: 'system', content: 'I should verify the replication lag before initiating the final cutover.', timestamp: Date.now(), type: 'observation' }
        ],
        reflections: [
          { workflowId: 'w-1', timestamp: Date.now() - 2000000, success: true, confidenceScore: 0.95, lessonsLearned: ['Parallel schema validation is faster than sequential'], mistakes: [], improvements: [], metadata: {} }
        ],
        memoryUpdates: [
          { key: 'migration_status', value: 'in_progress', timestamp: Date.now() }
        ],
        knowledgeUpdates: [
          { id: 'k-1', type: 'System Topology', summary: 'Updated node map for destination cluster.', timestamp: Date.now() }
        ]
      };
      
      const mockMission2: Mission = {
        id: 'mission-2',
        title: 'Autonomous Market Research: AI Trends',
        goal: {
          description: 'Analyze emerging trends in generative AI for Q3 2026 and identify potential investment opportunities.',
          successCriteria: ['Top 5 trends identified', 'Competitor landscape mapped', 'Investment thesis draft'],
          priority: 'medium'
        },
        context: { industry: 'Tech', focus: 'GenAI' },
        constraints: ['Use public sources only', 'Budget: $500 max API usage'],
        status: 'completed',
        createdAt: Date.now() - 86400000,
        updatedAt: Date.now() - 43200000,
        plans: [],
        runningAgents: [],
        timeline: [
          { id: 't-4', timestamp: Date.now() - 86400000, type: 'event', title: 'Mission Started', description: 'Targeting top 50 tech blogs and research papers.' }
        ],
        thoughts: [],
        reflections: [],
        memoryUpdates: [],
        knowledgeUpdates: [],
        outcome: {
          success: true,
          summary: 'Successfully identified "Liquid Neural Networks" and "Small Language Model Distillation" as key trends.',
          deliverables: ['AI_Trends_Q3_2026.pdf', 'Market_Map.json'],
          lessonsLearned: ['Academic papers provide higher signal than tech blogs for long-term trends.'],
          timestamp: Date.now() - 43200000
        }
      };

      addMission(mockMission);
      addMission(mockMission2);
      setActiveMission(mockMission.id);
    }
  }, [missions, addMission, setActiveMission]);

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
          <Button className="w-full gap-2 font-mono text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" />
            Initiate Mission
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <LayoutDashboard className="w-3 h-3" />
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
                <LayoutDashboard className="w-8 h-8 text-purple-500 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold mb-1">Fleet Status</h3>
                <p className="text-[10px] text-muted-foreground uppercase font-mono">Monitor all active agent units</p>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
