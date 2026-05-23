/**
 * Configuration Service
 * 
 * Reads/writes application configuration via the Tauri backend,
 * which persists to `config.toml` on the host filesystem.
 */

import { invoke } from '@tauri-apps/api/core';
import { AppConfig } from '@/types/tauri';

// ─── Defaults (used as fallback if backend is unavailable) ──────────────────

export const DEFAULT_CONFIG: AppConfig = {
  provider: 'openai',
  api_key: '',
  chat_model: 'google/gemma-4-e4b',
  chat_base_url: 'http://127.0.0.1:1234/v1',

  vad_threshold: 0.5,
  silence_threshold_rms: 0.01,
  silence_duration_ms: 1000,
  transcription_model_path: 'parakeet-tdt-0.6b-v3-int8',

  system_prompt: 'You are JARVIS, a helpful AI assistant.',
  compaction_prompt: 'Summarize this context briefly, capturing key points.',
  database_name: 'jarvis.db',
  mcp_config_path: 'mcp.json',
};

// ─── Re-export the type for convenience ─────────────────────────────────────

export type { AppConfig };

// ─── Provider Defaults ──────────────────────────────────────────────────────

export const PROVIDER_BASE_URLS: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  gemini: 'https://generativelanguage.googleapis.com/v1beta',
  anthropic: 'https://api.anthropic.com/v1',
};

export const PROVIDER_MODEL_SUGGESTIONS: Record<string, string[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  gemini: ['gemini-2.5-flash', 'gemini-2.5-pro', 'google/gemma-4-e4b'],
  anthropic: ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-latest', 'claude-3-haiku-20240307'],
};

// ─── Service Methods ────────────────────────────────────────────────────────

/**
 * Fetches the current application configuration from the Rust backend.
 * Falls back to DEFAULT_CONFIG if the backend is unreachable.
 */
export const getConfig = async (): Promise<AppConfig> => {
  try {
    return await invoke<AppConfig>('get_config');
  } catch (err) {
    console.warn('[ConfigService] Backend get_config failed, using defaults:', err);
    return { ...DEFAULT_CONFIG };
  }
};

/**
 * Saves the application configuration via the Rust backend.
 * The backend writes the config to `config.toml` on disk.
 */
export const saveConfig = async (config: AppConfig): Promise<void> => {
  try {
    await invoke('update_config', { newConfig: config });
    console.log('[ConfigService] Config saved via backend.');
  } catch (err) {
    console.error('[ConfigService] Backend update_config failed:', err);
    throw err;
  }
};

/**
 * Resets configuration to defaults by saving defaults to the backend.
 */
export const resetConfig = async (): Promise<AppConfig> => {
  const defaults = { ...DEFAULT_CONFIG };
  try {
    await invoke('update_config', { newConfig: defaults });
    console.log('[ConfigService] Config reset to defaults via backend.');
  } catch (err) {
    console.warn('[ConfigService] Backend reset failed, returning local defaults:', err);
  }
  return defaults;
};
