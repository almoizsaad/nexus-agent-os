import { useState, useEffect, useCallback } from 'react';
import { agent } from '../agent/bootstrap/createAgent';
import { AgentActionType, AgentEventType } from '../agent/types/agent';
import type { AgentStatus, Plan, AgentProtocolAction, AgentProtocolEvent } from '../agent/types/agent';

export function useAgent() {
  const [status, setStatus] = useState<AgentStatus>(agent.runtime.getStatus());
  const [currentPlan, setCurrentPlan] = useState<Plan | undefined>(agent.runtime.getCurrentPlan());
  const [history, setHistory] = useState<AgentProtocolAction[]>([]);

  useEffect(() => {
    // Subscribe to status and plan updates via agent:actions
    const unsubscribeActions = agent.eventBus.subscribe<AgentProtocolAction>('agent:actions', (action) => {
      if (action.type === AgentActionType.AGENT_UPDATE) {
        setStatus(action.payload.status as AgentStatus);
      } else if (action.type === AgentActionType.UPDATE_PLAN) {
        setCurrentPlan(agent.runtime.getCurrentPlan());
      }
      
      setHistory((prev) => [...prev, action].slice(-50));
    });

    return () => {
      unsubscribeActions();
    };
  }, []);

  const sendMessage = useCallback((text: string) => {
    const event: AgentProtocolEvent = {
      type: AgentEventType.USER_MESSAGE,
      payload: { text, sender: 'user' },
      timestamp: Date.now(),
    };
    agent.eventBus.publish('agent:events', event);
  }, []);

  return {
    status,
    currentPlan,
    history,
    sendMessage,
  };
}
