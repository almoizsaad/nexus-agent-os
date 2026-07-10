import type { AgentProtocolEvent } from '../protocol/events';
import type { AgentProtocolAction } from '../protocol/actions';

/**
 * A union type of all possible messages that can be sent over the EventBus.
 */
export type AgentMessage = AgentProtocolEvent | AgentProtocolAction;

/**
 * A callback function that handles a message.
 */
export type MessageListener<T> = (message: T) => void;

/**
 * EventBus provides a framework-independent, decoupled communication layer
 */
export class EventBus<M extends { type: string; payload: unknown } = AgentMessage> {
  private listeners: Map<string, Set<MessageListener<M>>> = new Map();

  /**
   * Subscribes to a specific topic.
   * @param topic The topic to listen for (e.g., 'agent:events', 'agent:actions').
   * @param listener The callback function to execute when a message is published.
   * @returns An unsubscribe function.
   */
  public subscribe<T extends M>(
    topic: string,
    listener: MessageListener<T>
  ): () => void {
    if (!this.listeners.has(topic)) {
      this.listeners.set(topic, new Set());
    }
    
    this.listeners.get(topic)!.add(listener as MessageListener<M>);

    return () => this.unsubscribe(topic, listener);
  }

  /**
   * Unsubscribes a listener from a topic.
   * @param topic The topic the listener is subscribed to.
   * @param listener The listener function to remove.
   */
  public unsubscribe<T extends M>(
    topic: string,
    listener: MessageListener<T>
  ): void {
    const topicListeners = this.listeners.get(topic);
    if (topicListeners) {
      topicListeners.delete(listener as MessageListener<M>);
      if (topicListeners.size === 0) {
        this.listeners.delete(topic);
      }
    }
  }

  /**
   * Publishes a message to all subscribers of a topic.
   * @param topic The topic to publish to.
   * @param message The message to send.
   */
  public publish<T extends M>(topic: string, message: T): void {
    const topicListeners = this.listeners.get(topic);
    if (topicListeners) {
      topicListeners.forEach((listener) => {
        try {
          listener(message);
        } catch (error) {
          console.error(`[EventBus] Error in listener for topic "${topic}":`, error);
        }
      });
    }
  }

  /**
   * Clears all listeners. Useful for testing or system reset.
   */
  public clear(): void {
    this.listeners.clear();
  }
}

// Export a singleton instance for global use if preferred, 
// though manual instantiation is supported for isolation.
export const globalEventBus = new EventBus();
