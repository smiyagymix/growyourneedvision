type EventHandler<T = unknown> = (data?: T) => void;

class EventBus {
  private events: Record<string, EventHandler[]> = {};

  on<T = unknown>(event: string, handler: EventHandler<T>) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(handler as EventHandler);
    return () => this.off(event, handler as EventHandler);
  }

  off<T = unknown>(event: string, handler: EventHandler<T>) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(h => h !== handler);
  }

  emit<T = unknown>(event: string, data?: T) {
    if (!this.events[event]) return;
    this.events[event].forEach(handler => handler(data));
  }
}

export const eventBus = new EventBus();
