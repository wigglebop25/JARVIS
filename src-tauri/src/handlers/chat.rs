use crate::domain::config::{AppConfig, Providers};
use crate::domain::errors::AppError;
use crate::infrastructure::agent::AGENT_MANAGER;
use crate::infrastructure::repository::SessionRepository;
use std::path::Path;

/// Sends a user prompt to the cached LLM agent and persists the conversation.
///
/// 1. Loads session history from the database (propagates errors instead of
///    silently swallowing them with `unwrap_or_default`).
/// 2. Prepends attachment paths as hints for the agent's `read_document` tool.
/// 3. Calls `AGENT_MANAGER.send_prompt`, which lazily rebuilds the agent
///    when config changes and emits `"mcp-connection-error"` events via `app`.
/// 4. Cleans attachment metadata from the saved user message (replaces the
///    verbose `[Attached Document: …]` hint with a concise `[Attached: …]` marker).
/// 5. Persists the updated history back to the database.
///
/// # Arguments
///
/// * `session_id` - The unique identifier of the session to continue.
/// * `input` - The user's raw prompt text.
/// * `attachments` - Optional file paths to prepend as document hints for the agent.
/// * `config` - The current application configuration (used for agent rebuild checks).
/// * `repo` - A [`SessionRepository`] bound to the database.
/// * `app` - Optional Tauri `AppHandle`; when provided, MCP connection errors during
///   agent rebuilding emit a `"mcp-connection-error"` event to the frontend.
///
/// # Returns
///
/// Returns the agent's text reply on success, or an [`AppError`] on failure.
///
/// # Errors
///
/// Propagates any error from history retrieval, agent chat, or history persistence.
/// Returns [`AppError::SystemError`] if the agent cannot be built or the LLM call fails.
pub async fn send_prompt(
    session_id: &str,
    input: &str,
    attachments: Option<&[String]>,
    config: &AppConfig,
    repo: &SessionRepository<'_>,
    app: Option<&tauri::AppHandle>,
) -> Result<String, AppError> {
    let mut history = repo.get_session_history(session_id)?;

    let mut prompt_with_attachments = String::new();
    if let Some(paths) = attachments {
        for path in paths {
            prompt_with_attachments.push_str(&format!(
                "[Attached Document: {}]\nUse the 'read_document' tool to read this file if you need to access its contents.\n\n",
                path
            ));
        }
    }
    prompt_with_attachments.push_str(input);

    let response = AGENT_MANAGER
        .send_prompt(&prompt_with_attachments, &mut history, config, app)
        .await?;

    let len = history.len();
    if len >= 2 {
        if let Some(user_msg) = history.get_mut(len - 2) {
            let mut clean_text = String::new();
            if let Some(paths) = attachments {
                for path in paths {
                    clean_text.push_str(&format!("[Attached: {}]\n", path));
                }
            }
            clean_text.push_str(input);
            *user_msg = rig::message::Message::user(&clean_text);
        }
    }

    repo.save_session_history(session_id, &history)?;

    Ok(response)
}

/// Returns the list of all supported LLM provider names as strings.
///
/// These values are safe to pass to [`set_provider`] and to the Tauri
/// [`set_chat_provider`](crate::commands::chat::set_chat_provider) command.
///
/// # Returns
///
/// Returns a vector containing `"openai"`, `"gemini"`, and `"anthropic"`.
pub fn get_providers() -> Result<Vec<String>, AppError> {
    Ok(Providers::all()
        .into_iter()
        .map(|p| p.to_string())
        .collect())
}

/// Switches the active provider in the config mutex and persists to disk.
///
/// The lock is released before the file write to avoid blocking concurrent readers.
///
/// # Arguments
///
/// * `provider` - The provider name to activate (`"openai"`, `"gemini"`, or `"anthropic"`).
/// * `config` - The `tokio::sync::Mutex`-guarded application configuration.
/// * `config_path` - Optional filesystem path to persist the updated config to.
///   When `None`, the config is updated in memory only.
///
/// # Returns
///
/// Returns `Ok(())` on success, or an [`AppError`] on failure.
///
/// # Errors
///
/// Returns [`AppError::SystemError`] if the provider name is unknown or the config
/// file cannot be written.
pub async fn set_provider(
    provider: String,
    config: &tokio::sync::Mutex<AppConfig>,
    config_path: Option<&Path>,
) -> Result<(), AppError> {
    let provider_enum = provider
        .parse::<Providers>()
        .map_err(AppError::SystemError)?;

    let config_to_save = {
        let mut config_guard = config.lock().await;
        config_guard.provider = provider_enum;
        config_guard.clone()
    };

    if let Some(path) = config_path {
        config_to_save
            .save_to(path)
            .map_err(|e| AppError::SystemError(format!("Failed to save config: {}", e)))?;
    }

    Ok(())
}
