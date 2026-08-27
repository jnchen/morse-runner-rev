/**
 * Optional online-service plugin contract.
 * The standalone app remains fully functional when no plugin is installed.
 */
export interface OnlineScore {
  id: string;
  owner: string;
  displayName?: string;
  call: string;
  mode: string;
  wpm: number;
  score: number;
  points: number;
  multipliers: number;
  durationSeconds: number;
  createdAt: string;
}

export interface OnlinePlugin {
  id: string;
  isConfigured(): boolean;
  login?(): Promise<void>;
  logout?(): Promise<void>;
  getUser?(): Promise<{ id: string; displayName?: string; call?: string } | null>;
  submitScore(score: Omit<OnlineScore, 'id' | 'owner' | 'createdAt'>): Promise<OnlineScore>;
  getLeaderboard(mode: string, limit?: number): Promise<OnlineScore[]>;
}

const registry = new Map<string, OnlinePlugin>();
export function registerOnlinePlugin(plugin: OnlinePlugin) { registry.set(plugin.id, plugin); }
export function getOnlinePlugin(id: string) { return registry.get(id); }
export function listOnlinePlugins() { return [...registry.values()]; }

export const offlinePlugin: OnlinePlugin = {
  id: 'offline',
  isConfigured: () => false,
  async getLeaderboard() { return []; },
  async submitScore() { throw new Error('Online service is not configured'); },
};
registerOnlinePlugin(offlinePlugin);
