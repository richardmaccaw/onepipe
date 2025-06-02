import type { TrackEvent, IdentifyEvent, PageEvent } from '@onepipe/core';

export interface OnePipeConfig {
  endpoint: string;
  userId?: string;
  anonymousId?: string;
  debug?: boolean;
}

export interface TrackOptions {
  event: string;
  properties?: Record<string, any>;
  userId?: string;
  anonymousId?: string;
  timestamp?: Date;
  channel?: string;
  messageId?: string;
}

export interface IdentifyOptions {
  userId?: string;
  anonymousId?: string;
  traits?: Record<string, any>;
  timestamp?: Date;
  channel?: string;
  messageId?: string;
  properties?: Record<string, any>;
}

export interface PageOptions {
  name?: string;
  category?: string;
  properties?: Record<string, any>;
  userId?: string;
  anonymousId?: string;
  timestamp?: Date;
  channel?: string;
  messageId?: string;
}

export class OnePipeClient {
  private endpoint: string;
  private userId?: string;
  private anonymousId: string;
  private debug: boolean;

  constructor(config: OnePipeConfig) {
    this.endpoint = config.endpoint.replace(/\/$/, ''); // Remove trailing slash
    this.userId = config.userId;
    this.anonymousId = config.anonymousId || this.generateAnonymousId();
    this.debug = config.debug || false;
  }

  private generateAnonymousId(): string {
    return 'anon_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  private getContext() {
    const context: any = {
      ip: '', // Will be filled server-side
      library: {
        name: '@onepipe/client',
        version: '0.0.1',
      },
    };

    // Add browser context if available
    if (typeof window !== 'undefined') {
      context.page = {
        path: window.location.pathname,
        referrer: document.referrer,
        search: window.location.search,
        title: document.title,
        url: window.location.href,
      };
    }

    if (typeof navigator !== 'undefined') {
      context.userAgent = navigator.userAgent;
    }

    return context;
  }

  async track(options: TrackOptions): Promise<void> {
    const payload: TrackEvent = {
      type: 'track',
      anonymousId: options.anonymousId || this.anonymousId,
      userId: options.userId || this.userId,
      context: this.getContext(),
      timestamp: options.timestamp || new Date(),
      event: options.event,
      properties: options.properties || {},
      channel: options.channel,
      messageId: options.messageId,
    };

    await this.sendRequest('/track', payload);
  }

  async identify(options: IdentifyOptions = {}): Promise<void> {
    const payload: IdentifyEvent = {
      type: 'identify',
      anonymousId: options.anonymousId || this.anonymousId,
      userId: options.userId || this.userId,
      context: this.getContext(),
      timestamp: options.timestamp || new Date(),
      traits: options.traits || {},
      channel: options.channel,
      messageId: options.messageId,
      properties: options.properties,
    };

    await this.sendRequest('/identify', payload);
  }

  async page(options: PageOptions = {}): Promise<void> {
    const payload: PageEvent = {
      type: 'page',
      anonymousId: options.anonymousId || this.anonymousId,
      userId: options.userId || this.userId,
      context: this.getContext(),
      timestamp: options.timestamp || new Date(),
      name: options.name,
      category: options.category,
      properties: options.properties || {},
      channel: options.channel,
      messageId: options.messageId,
    };

    await this.sendRequest('/page', payload);
  }

  private async sendRequest(path: string, payload: any): Promise<void> {
    if (this.debug) {
      console.log(`OnePipe ${path}:`, payload);
    }

    try {
      const response = await fetch(`${this.endpoint}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = `OnePipe request failed: ${response.status} ${response.statusText}`;
        if (this.debug) {
          console.error(error);
        }
        throw new Error(error);
      }

      if (this.debug) {
        console.log(`OnePipe ${path} success`);
      }
    } catch (error) {
      const errorMessage = `OnePipe request failed: ${error}`;
      if (this.debug) {
        console.error(errorMessage);
      }
      throw error;
    }
  }

  // Helper methods
  setUserId(userId: string): void {
    this.userId = userId;
  }

  setAnonymousId(anonymousId: string): void {
    this.anonymousId = anonymousId;
  }

  getUserId(): string | undefined {
    return this.userId;
  }

  getAnonymousId(): string {
    return this.anonymousId;
  }
}

// Factory function for easy usage
export function createOnePipeClient(config: OnePipeConfig): OnePipeClient {
  return new OnePipeClient(config);
}

// Default export
export default OnePipeClient; 