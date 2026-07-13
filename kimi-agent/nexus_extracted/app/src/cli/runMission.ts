import { bootstrapHeadlessRuntime } from './bootstrap';
import { ExecutiveBrain } from '../agent/core/ExecutiveBrain';
import { EventBus } from '../agent/core/EventBus';
import { AgentEventType } from '../agent/types/agent';
import type { AgentProtocolEvent, ThoughtGeneratedEvent, AgentProtocolAction } from '../agent/types/agent';

async function runMission() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: npm run mission -- "<title>" "<goal>"');
    process.exit(1);
  }

  const title = args[0];
  const goalDescription = args[1];

  const container = bootstrapHeadlessRuntime();
  const brain = container.resolve(ExecutiveBrain);
  const eventBus = container.resolve(EventBus);

  console.log('\n' + '='.repeat(50));
  console.log(`MISSION START: ${title}`);
  console.log(`GOAL: ${goalDescription}`);
  console.log('='.repeat(50) + '\n');

  // Trace every event
  eventBus.subscribe<AgentProtocolEvent>('agent:events', (event) => {
    const timestamp = new Date(event.timestamp).toISOString();
    console.log(`[${timestamp}] EVENT: ${event.type}`);
    if (event.type === AgentEventType.TOOL_RESULT) {
      const payload = event.payload as { toolName: string; success: boolean };
      console.log(`  > Tool: ${payload.toolName}, Success: ${payload.success}`);
    } else if (event.type === AgentEventType.AGENT_UPDATE) {
      const payload = event.payload as { status: string };
      console.log(`  > Status Update: ${payload.status}`);
    } else if (event.type === AgentEventType.REFLECTION) {
      const payload = event.payload as { reflection: { success: boolean; confidenceScore: number } };
      console.log(`  > Reflection: Success=${payload.reflection.success}, Confidence=${payload.reflection.confidenceScore}`);
    }
  });

  eventBus.subscribe<ThoughtGeneratedEvent>('agent:thoughts', (event) => {
    const timestamp = new Date(event.timestamp).toISOString();
    const payload = event.payload as { thought: { type: string; content: string } };
    console.log(`[${timestamp}] THOUGHT [${payload.thought.type}]: ${payload.thought.content}`);
  });

  eventBus.subscribe<AgentProtocolAction>('agent:actions', (action) => {
    const payload = action.payload as { message?: string; status?: string };
    console.log(`[ACTION] ${action.type}: ${payload.message || payload.status || ''}`);
  });


  try {
    const missionId = await brain.createMission(title, {
      description: goalDescription,
      successCriteria: ['Completed'],
      priority: 'medium'
    });

    console.log(`Mission created with ID: ${missionId}`);

    // Wait for completion or failure
    const success = await new Promise((resolve) => {
      const unsub = eventBus.subscribe('agent:events', (event) => {
        if (event.type === AgentEventType.AGENT_UPDATE) {
          const payload = event.payload as Record<string, unknown>;
          if (payload.missionId === missionId) {
            if (payload.status === 'PLAN_COMPLETED') {
              console.log('\n' + '='.repeat(50));
              console.log('MISSION SUCCESS');
              console.log('='.repeat(50));
              unsub();
              resolve(true);
            } else if (payload.status === 'PLAN_FAILED') {
              console.log('\n' + '='.repeat(50));
              console.log('MISSION FAILED');
              console.log('='.repeat(50));
              unsub();
              resolve(false);
            }
          }
        }
      });

      // Timeout after 5 minutes
      const timeout = setTimeout(() => {
        console.error('Mission timed out.');
        unsub();
        resolve(false);
      }, 300000);

      // Ensure timeout is cleared if mission completes
      const originalResolve = resolve;
      resolve = (val: unknown) => {
        clearTimeout(timeout);
        originalResolve(val as boolean | PromiseLike<boolean>);
      };
    });

    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('Failed to run mission:', error);
    process.exit(1);
  }
}

runMission();
