import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

const isTauri = () =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export type AgentStatusPayload =
  | { status: 'building' }
  | { status: 'ready'; provider?: string }
  | { status: 'error'; error?: string };

export type AgentStatus = AgentStatusPayload['status'];

/**
 * Clears the cached AI agent on the backend and kicks off a background rebuild.
 */
export const restartAgent = async (): Promise<void> => {
  if (!isTauri()) return;
  await invoke('restart_agent');
};

/**
 * Subscribes to agent status updates emitted by the backend prebuild task.
 * Returns an unsubscribe function. Returns a no-op in browser-only dev.
 */
export const onAgentStatus = async (cb: (payload: AgentStatusPayload) => void): Promise<UnlistenFn> => {
  if (!isTauri()) return () => {};
  return listen<AgentStatusPayload>('agent-status', (ev) => cb(ev.payload));
};
