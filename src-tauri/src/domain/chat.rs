use serde::{Deserialize, Serialize};
use std::sync::Mutex;

/// Managed state for the chat subsystem.
#[derive(Default)]
pub struct ChatState {
    /// Currently selected LLM provider name.
    pub active_provider: Mutex<String>,
}

#[derive(Serialize)]
pub struct ChatResponse {
    pub message: String,
    pub provider: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    pub id: String,
    pub title: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}
