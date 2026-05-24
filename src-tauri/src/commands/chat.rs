//! Tauri commands for the chat and session management system.
//!
//! This module exposes command handlers to the frontend for creating sessions,
//! prompting the conversational agent, listing session history, and selecting/listing
//! AI providers.

use crate::domain::chat::{ChatResponse, Session};
use crate::domain::config::AppConfig;
use crate::domain::errors::AppError;
use crate::handlers::chat::{get_providers, send_prompt, set_provider};
use crate::infrastructure::db::DatabaseManager;
use crate::infrastructure::repository::SessionRepository;
use rig::message::Message;
use tauri::State;

/// Creates a new chat session.
///
/// # Arguments
///
/// * `title` - An optional title to assign to the new session.
/// * `db` - The database manager state.
///
/// # Returns
///
/// Returns the unique session ID (UUID) on success, or an [`AppError`] on failure.
#[tauri::command]
pub async fn create_session(
    title: Option<String>,
    db: State<'_, DatabaseManager>,
) -> Result<String, AppError> {
    let repo = SessionRepository::new(&db);
    repo.create_session(title)
}

/// Sends a prompt to the conversational AI agent within a specific session.
///
/// # Arguments
///
/// * `session_id` - The unique identifier of the session.
/// * `input` - The prompt or question text from the user.
/// * `config` - The application configuration state.
/// * `db` - The database manager state.
///
/// # Returns
///
/// Returns a [`ChatResponse`] containing the agent's message and the name of the
/// active provider on success, or an [`AppError`] on failure.
#[tauri::command]
pub async fn prompt(
    session_id: String,
    input: String,
    attachments: Option<Vec<String>>,
    config: State<'_, std::sync::Mutex<AppConfig>>,
    db: State<'_, DatabaseManager>,
) -> Result<ChatResponse, AppError> {
    let config_clone = {
        let config_guard = config
            .lock()
            .map_err(|e| AppError::SystemError(format!("Failed to lock config: {}", e)))?;
        config_guard.clone()
    };
    let provider = config_clone.provider.to_string();
    let repo = SessionRepository::new(&db);
    let response = send_prompt(&session_id, &input, attachments.as_deref(), &config_clone, &repo).await?;

    Ok(ChatResponse {
        message: response,
        provider,
    })
}

/// Retrieves the list of available LLM providers supported by the application.
///
/// # Returns
///
/// Returns a list of provider names on success, or an [`AppError`] on failure.
#[tauri::command]
pub async fn get_chat_providers() -> Result<Vec<String>, AppError> {
    get_providers()
}

/// Sets the active LLM provider and saves the selection to the configuration file.
///
/// # Arguments
///
/// * `provider` - The name of the provider to activate (e.g. "gemini", "openai").
/// * `config` - The application configuration state.
/// * `app` - The Tauri application handle.
///
/// # Returns
///
/// Returns `Ok(())` on success, or an [`AppError`] on failure.
#[tauri::command]
pub async fn set_chat_provider(
    provider: String,
    config: State<'_, std::sync::Mutex<AppConfig>>,
    app: tauri::AppHandle,
) -> Result<(), AppError> {
    use tauri::Manager;
    let config_path = app
        .path()
        .app_config_dir()
        .ok()
        .map(|dir| dir.join("config.toml"));
    set_provider(provider, &config, config_path.as_deref())
}

/// Lists all historical and active chat sessions.
///
/// # Arguments
///
/// * `db` - The database manager state.
///
/// # Returns
///
/// Returns a list of [`Session`]s on success, or an [`AppError`] on failure.
#[tauri::command]
pub async fn list_sessions(db: State<'_, DatabaseManager>) -> Result<Vec<Session>, AppError> {
    let repo = SessionRepository::new(&db);
    repo.get_all_sessions()
}

/// Retrieves the message history for a specific chat session.
///
/// # Arguments
///
/// * `session_id` - The unique identifier of the session.
/// * `db` - The database manager state.
///
/// # Returns
///
/// Returns a list of [`Message`]s representing the conversation history on success,
/// or an [`AppError`] on failure.
#[tauri::command]
pub async fn get_history(
    session_id: String,
    db: State<'_, DatabaseManager>,
) -> Result<Vec<Message>, AppError> {
    let repo = SessionRepository::new(&db);
    repo.get_session_history(&session_id)
}

/// Renames a chat session.
///
/// # Arguments
///
/// * `session_id` - The unique identifier of the session to rename.
/// * `title` - The new title to assign to the session.
/// * `db` - The database manager state.
///
/// # Returns
///
/// Returns `Ok(())` on success, or an [`AppError`] on failure.
#[tauri::command]
pub async fn rename_session(
    session_id: String,
    title: String,
    db: State<'_, DatabaseManager>,
) -> Result<(), AppError> {
    let repo = SessionRepository::new(&db);
    repo.rename_session(&session_id, &title)
}

/// Deletes a chat session and all its associated history.
///
/// # Arguments
///
/// * `session_id` - The unique identifier of the session to delete.
/// * `db` - The database manager state.
///
/// # Returns
///
/// Returns `Ok(())` on success, or an [`AppError`] on failure.
#[tauri::command]
pub async fn delete_session(
    session_id: String,
    db: State<'_, DatabaseManager>,
) -> Result<(), AppError> {
    let repo = SessionRepository::new(&db);
    repo.delete_session(&session_id)
}

