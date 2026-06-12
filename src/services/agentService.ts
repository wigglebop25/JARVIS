import { invoke } from '@tauri-apps/api/core';

const isTauri = () =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

/**
 * Clears the cached AI agent on the backend. The next chat prompt will
 * rebuild the agent from the current AppConfig.
 */
export const restartAgent = async (): Promise<void> => {
  if (!isTauri()) return;
  await invoke('restart_agent');
};
