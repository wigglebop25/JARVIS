use serde::{Deserialize, Serialize};
use std::sync::Mutex;

/// Managed state for the chat subsystem.
///
/// Tracks the currently active provider name for frontend queries.
#[derive(Default)]
pub struct ChatState {
    /// Currently selected LLM provider name (e.g. `"openai"`, `"gemini"`).
    pub active_provider: Mutex<String>,
}

/// Response returned by the `prompt` Tauri command.
#[derive(Serialize)]
pub struct ChatResponse {
    /// The LLM agent's text reply.
    pub message: String,
    /// The name of the provider that generated the reply.
    pub provider: String,
}

/// A chat session persisted in the SQLite database.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    /// Unique session identifier (UUID v4).
    pub id: String,
    /// Optional human-readable title.
    pub title: Option<String>,
    /// Unix timestamp of creation.
    pub created_at: i64,
    /// Unix timestamp of the most recent activity.
    pub updated_at: i64,
}

/// Response format for the `count_tokens` command.
#[derive(serde::Serialize)]
pub struct TokenCountResponse {
    pub prompt_tokens: usize,
    pub response_tokens: usize,
    pub total_tokens: usize,
}
