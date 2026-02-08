/**
 * Simple event emitter for cross-component communication.
 * Used to notify components when data changes (e.g., workspace renamed).
 */

type EventCallback = () => void;

class EventEmitter {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  emit(event: string): void {
    this.listeners.get(event)?.forEach((callback) => callback());
  }
}

// Singleton instance
export const events = new EventEmitter();

// Event names
export const WORKSPACE_UPDATED = 'workspace:updated';
export const USER_UPDATED = 'user:updated';

