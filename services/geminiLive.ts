import { Listing } from "../types";

// Note: Real-time audio streaming requires a WebSocket connection to Gemini,
// which cannot be proxied through serverless functions. This feature requires
// either a dedicated WebSocket server or a different architecture.
// For now, this service is disabled in production for security.

export class CradleLiveService {
  private isEnabled = false;

  public onVolumeUpdate: (vol: number) => void = () => {};
  public onStatusChange: (status: 'connected' | 'disconnected' | 'error' | 'unavailable') => void = () => {};

  constructor() {
    // Live audio feature is disabled in production to protect API keys
    // To enable, you would need a dedicated WebSocket proxy server
    this.isEnabled = false;
  }

  async connect(listings: Listing[]) {
    console.warn("Cradle Live is currently unavailable. Real-time audio requires WebSocket infrastructure.");
    this.onStatusChange('unavailable');
  }

  public disconnect() {
    this.onStatusChange('disconnected');
  }
}
