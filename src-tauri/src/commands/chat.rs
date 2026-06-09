//! Tauri commands for the chat and session management system.
//!
//! This module exposes command handlers to the frontend for creating sessions,
//! prompting the conversational agent, listing session history, and selecting/listing
//! AI providers.

use crate::domain::chat::{ChatResponse, Session, TokenCountResponse};
use crate::domain::config::AppConfig;
use crate::domain::errors::AppError;
use crate::handlers::chat::{get_providers, send_prompt, send_stream_prompt, set_provider};
use crate::infrastructure::db::DatabaseManager;
use crate::infrastructure::repository::SessionRepository;
use agent_rs_lib::agent::memory::tokenizer;
use rig_core::message::Message;
use tauri::State;

/// Creates a new chat session with an optional human-readable title.
///
/// Delegates to [`SessionRepository::create_session`], which inserts the session
/// and an empty history row inside a single SQLite transaction.
///
/// # Arguments
///
/// * `title` - An optional display name for the new session. Pass `None` for an untitled session.
/// * `db` - The database manager state, injected by Tauri.
///
/// # Returns
///
/// Returns the unique session ID (UUID v4) on success, or an [`AppError`] on failure.
///
/// # Errors
///
/// Returns [`AppError::LockError`] if the database mutex is poisoned.
/// Returns [`AppError::SystemError`] if the SQL INSERT or transaction commit fails.
#[tauri::command]
pub async fn create_session(
    title: Option<String>,
    db: State<'_, DatabaseManager>,
) -> Result<String, AppError> {
    let repo = SessionRepository::new(&db);
    repo.create_session(title)
}

/// Sends a user prompt to the LLM agent and returns the reply along with the active provider name.
///
/// 1. Creates a [`SessionRepository`] and loads the conversation history for `session_id`.
/// 2. Clones the current config outside the lock so the mutex is held only briefly.
/// 3. Forwards the `tauri::AppHandle` to the handler so that MCP connection errors during
///    agent (re)building can be emitted as `"mcp-connection-error"` Tauri events.
/// 4. Persists the updated history (with attachment metadata cleaned from the user message)
///    back to the database.
///
/// # Arguments
///
/// * `session_id` - The unique identifier of the session to continue.
/// * `input` - The user's prompt text.
/// * `attachments` - Optional file paths to attach as document hints for the agent.
/// * `config` - The application configuration state (locked briefly to clone).
/// * `db` - The database manager state, injected by Tauri.
/// * `app` - The Tauri application handle, used to emit MCP error events.
///
/// # Returns
///
/// Returns a [`ChatResponse`] containing the agent's reply and the active provider name,
/// or an [`AppError`] on failure.
///
/// # Errors
///
/// Propagates errors from history retrieval, agent chat, or history persistence.
/// Returns [`AppError::SystemError`] if the agent cannot be built or the LLM call fails.
#[tauri::command]
pub async fn prompt(
    session_id: String,
    input: String,
    attachments: Option<Vec<String>>,
    config: State<'_, tokio::sync::Mutex<AppConfig>>,
    db: State<'_, DatabaseManager>,
    app: tauri::AppHandle,
) -> Result<ChatResponse, AppError> {
    let config_clone = {
        let config_guard = config.lock().await;
        config_guard.clone()
    };
    let provider = config_clone.provider.to_string();
    let repo = SessionRepository::new(&db);
    let response = send_prompt(
        &session_id,
        &input,
        attachments.as_deref(),
        &config_clone,
        &repo,
        Some(&app),
    )
    .await?;

    Ok(ChatResponse {
        message: response,
        provider,
    })
}

/// Sends a user prompt to the LLM agent, streaming token chunks through the provided channel.
///
/// Returns the completed assistant reply on success, or an [`AppError`] on failure.
#[tauri::command]
pub async fn stream_prompt(
    session_id: String,
    input: String,
    attachments: Option<Vec<String>>,
    config: State<'_, tokio::sync::Mutex<AppConfig>>,
    db: State<'_, DatabaseManager>,
    app: tauri::AppHandle,
    channel: tauri::ipc::Channel<String>,
) -> Result<ChatResponse, AppError> {
    let config_clone = {
        let config_guard = config.lock().await;
        config_guard.clone()
    };
    let provider = config_clone.provider.to_string();
    let repo = SessionRepository::new(&db);
    let response = send_stream_prompt(
        &session_id,
        &input,
        attachments.as_deref(),
        &config_clone,
        &repo,
        Some(&app),
        channel,
    )
    .await?;

    Ok(ChatResponse {
        message: response,
        provider,
    })
}

/// Helper function to perform the actual token counting using `agent_rs_lib` BPE tokenizer.
///
/// > [!NOTE]
/// > **Approximation Notice:** This function uses the `cl100k_base` BPE tokenizer vocabulary (accurate for OpenAI models).
/// > For other providers like Anthropic and Gemini, this count serves as a close approximation.
pub fn calculate_tokens(prompt: &str, response: Option<&str>) -> (usize, usize) {
    let prompt_tokens = tokenizer::count_string_tokens(prompt);
    let response_tokens = response.map_or(0, tokenizer::count_string_tokens);
    (prompt_tokens, response_tokens)
}

/// Counts tokens in a prompt and an optional response using `agent_rs_lib` BPE tokenizer.
///
/// > [!NOTE]
/// > **Approximation Notice:** This command uses the OpenAI `cl100k_base` tokenizer vocabulary.
/// > Counts for Anthropic/Gemini responses are close approximations rather than precise provider billing values.
#[tauri::command]
pub fn count_tokens(
    prompt: String,
    response: Option<String>,
) -> Result<TokenCountResponse, AppError> {
    let (prompt_tokens, response_tokens) = calculate_tokens(&prompt, response.as_deref());
    Ok(TokenCountResponse {
        prompt_tokens,
        response_tokens,
        total_tokens: prompt_tokens + response_tokens,
    })
}

/// Retrieves the list of LLM provider names supported by the application.
///
/// These values are safe to pass directly to [`set_chat_provider`].
///
/// # Returns
///
/// Returns a vector of provider name strings (`"openai"`, `"gemini"`, `"anthropic"`)
/// on success, or an [`AppError`] on failure.
#[tauri::command]
pub async fn get_chat_providers() -> Result<Vec<String>, AppError> {
    get_providers()
}

/// Switches the active LLM provider and persists the change to the config file.
///
/// Accepts one of `"openai"`, `"gemini"`, or `"anthropic"`. The config mutex is
/// released before the file write so concurrent reads are not blocked during I/O.
///
/// # Arguments
///
/// * `provider` - The provider name to activate. Must match one of the names
///   returned by [`get_chat_providers`].
/// * `config` - The application configuration state.
/// * `app` - The Tauri application handle, used to resolve the config directory path.
///
/// # Returns
///
/// Returns `Ok(())` on success, or an [`AppError`] on failure.
///
/// # Errors
///
/// Returns [`AppError::SystemError`] if the provider name is unknown or the config
/// file cannot be written.
#[tauri::command]
pub async fn set_chat_provider(
    provider: String,
    config: State<'_, tokio::sync::Mutex<AppConfig>>,
    app: tauri::AppHandle,
) -> Result<(), AppError> {
    use tauri::Manager;
    let config_path = app
        .path()
        .app_config_dir()
        .ok()
        .map(|dir| dir.join("config.toml"));
    set_provider(provider, &config, config_path.as_deref()).await
}

/// Lists all chat sessions ordered by most-recently updated first.
///
/// Delegates to [`SessionRepository::get_all_sessions`].
///
/// # Arguments
///
/// * `db` - The database manager state, injected by Tauri.
///
/// # Returns
///
/// Returns a vector of [`Session`] structs on success, or an [`AppError`] on failure.
///
/// # Errors
///
/// Returns [`AppError::LockError`] if the database mutex is poisoned.
/// Returns [`AppError::SystemError`] on SQL query failures.
#[tauri::command]
pub async fn list_sessions(db: State<'_, DatabaseManager>) -> Result<Vec<Session>, AppError> {
    let repo = SessionRepository::new(&db);
    repo.get_all_sessions()
}

/// Retrieves the message history for a specific chat session.
///
/// Delegates to [`SessionRepository::get_session_history`].
///
/// # Arguments
///
/// * `session_id` - The unique identifier of the session to retrieve history for.
/// * `db` - The database manager state, injected by Tauri.
///
/// # Returns
///
/// Returns a vector of [`Message`]s representing the conversation history on success,
/// or an [`AppError`] on failure.
///
/// # Errors
///
/// Returns [`AppError::SystemError("Session not found")`] if `session_id` does not exist.
/// Returns [`AppError::LockError`] on mutex poison.
/// Returns [`AppError::SystemError`] on JSON deserialisation failures.
#[tauri::command]
pub async fn get_history(
    session_id: String,
    db: State<'_, DatabaseManager>,
) -> Result<Vec<Message>, AppError> {
    let repo = SessionRepository::new(&db);
    repo.get_session_history(&session_id)
}

/// Renames a chat session and bumps its `updated_at` timestamp.
///
/// Delegates to [`SessionRepository::rename_session`].
///
/// # Arguments
///
/// * `session_id` - The unique identifier of the session to rename.
/// * `title` - The new display title for the session.
/// * `db` - The database manager state, injected by Tauri.
///
/// # Returns
///
/// Returns `Ok(())` on success, or an [`AppError`] on failure.
///
/// # Errors
///
/// Returns [`AppError::SystemError("Session not found")`] if `session_id` does not exist.
/// Returns [`AppError::LockError`] on mutex poison.
#[tauri::command]
pub async fn rename_session(
    session_id: String,
    title: String,
    db: State<'_, DatabaseManager>,
) -> Result<(), AppError> {
    let repo = SessionRepository::new(&db);
    repo.rename_session(&session_id, &title)
}

/// Deletes a chat session and all its associated history (cascaded via foreign key).
///
/// Delegates to [`SessionRepository::delete_session`].
///
/// # Arguments
///
/// * `session_id` - The unique identifier of the session to delete.
/// * `db` - The database manager state, injected by Tauri.
///
/// # Returns
///
/// Returns `Ok(())` on success, or an [`AppError`] on failure.
///
/// # Errors
///
/// Returns [`AppError::SystemError("Session not found")`] if `session_id` does not exist.
/// Returns [`AppError::LockError`] on mutex poison.
#[tauri::command]
pub async fn delete_session(
    session_id: String,
    db: State<'_, DatabaseManager>,
) -> Result<(), AppError> {
    let repo = SessionRepository::new(&db);
    repo.delete_session(&session_id)
}
