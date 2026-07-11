import type { AgentCommunicationMessage, IAgentMessageBus } from '../types/communication';
import { EventBus } from './EventBus';
import type { AgentMessage as EventBusMessage } from './EventBus';

export class AgentMessageBus implements IAgentMessageBus {
  private eventBus: EventBus;
  private subscribers: Map<string, Array<(message: AgentCommunicationMessage) => void>> = new Map();

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    
    // Subscribe to a generic communication topic on the underlying event bus
    this.eventBus.subscribe('agent:communication', (message: EventBusMessage) => {
      this.notifySubscribers(message as unknown as AgentCommunicationMessage);
    });
  }

  public async publish(message: AgentCommunicationMessage): Promise<void> {
    this.eventBus.publish('agent:communication', message as unknown as EventBusMessage);
  }

  public subscribe(receiverId: string, callback: (message: AgentCommunicationMessage) => void): void {
    const subs = this.subscribers.get(receiverId) || [];
    subs.push(callback);
    this.subscribers.set(receiverId, subs);
  }

  public unsubscribe(receiverId: string, callback: (message: AgentCommunicationMessage) => void): void {
    const subs = this.subscribers.get(receiverId);
    if (subs) {
      this.subscribers.set(receiverId, subs.filter(s => s !== callback));
    }
  }

  private notifySubscribers(message: AgentCommunicationMessage): void {
    // Handle broadcast
    if (message.receiver === 'all') {
      for (const callbacks of this.subscribers.values()) {
        callbacks.forEach(cb => cb(message));
      }
      return;
    }

    // Handle multicast
    if (Array.isArray(message.receiver)) {
      message.receiver.forEach(receiverId => {
        const callbacks = this.subscribers.get(receiverId);
        if (callbacks) {
          callbacks.forEach(cb => cb(message));
        }
      });
      return;
    }

    // Handle direct message
    const callbacks = this.subscribers.get(message.receiver);
    if (callbacks) {
      callbacks.forEach(cb => cb(message));
    }
  }
}
