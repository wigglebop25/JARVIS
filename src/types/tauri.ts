export interface ChatResponse {
  message: string;
  provider: string;
}

export interface TokenCountResponse {
  prompt_tokens: number;
  response_tokens: number;
  total_tokens: number;
}

export interface TranscriptPayload {
  transcript: string;
}

export interface VoiceStatus {
  isActive: boolean;
}

/**
 * Mirrors the Rust `Session` struct from domain::db.
 */
export interface Session {
  id: string;
  title: string | null;
  created_at: number;
  updated_at: number;
}

/**
 * Mirrors the Rust `rig::message::Message` structure.
 * The `rig` crate serializes messages as { role: "user"|"assistant", content: "..." }.
 */
export interface RigMessage {
  role: string;
  content: Array<Record<string, any>>;
}

/**
 * Mirrors the Rust `AppConfig` struct from domain::config.
 * Field names are snake_case to match Rust serde serialization.
 */
export interface AppConfig {
  provider: 'openai' | 'gemini' | 'anthropic';
  api_key: string;
  chat_model: string;
  chat_base_url: string;
  vad_threshold: number;
  silence_threshold_rms: number;
  silence_duration_ms: number;
  transcription_model_path: string;
  database_name: string;
  system_prompt: string;
  compaction_prompt: string;
  compaction_threshold: number;
  mcp_config_path: string;
  sandbox_dir: string;
  read_extensions: string[];
  write_extensions: string[];
}
