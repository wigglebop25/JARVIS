use crate::domain::config::{AppConfig, Providers};
use crate::domain::errors::AppError;
use crate::infrastructure::agent::AGENT_MANAGER;
use crate::infrastructure::database::SessionRepository;
use rig_core::message::{AssistantContent, Message, UserContent};
use std::collections::HashMap;
use std::path::Path;
use std::sync::{Arc, LazyLock};

/// Per-session lock that serialises load→agent→save critical sections.
/// Prevents two concurrent `send_prompt`/`send_stream_prompt` calls for
/// the same session from racing on history reads and writes.
static SESSION_LOCKS: LazyLock<tokio::sync::Mutex<HashMap<String, Arc<tokio::sync::Mutex<()>>>>> =
    LazyLock::new(|| tokio::sync::Mutex::new(HashMap::new()));

async fn acquire_session_lock(session_id: &str) -> Arc<tokio::sync::Mutex<()>> {
    let mut map = SESSION_LOCKS.lock().await;
    map.entry(session_id.to_string())
        .or_insert_with(|| Arc::new(tokio::sync::Mutex::new(())))
        .clone()
}

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
    repo: &SessionRepository,
    app: Option<&tauri::AppHandle>,
) -> Result<String, AppError> {
    let lock = acquire_session_lock(session_id).await;
    let _guard = lock.lock().await;

    let mut history = repo.get_session_history(session_id).await?;

    let prompt_with_attachments = prepare_prompt_with_attachments(input, attachments);

    let response = AGENT_MANAGER
        .send_prompt(&prompt_with_attachments, &mut history, config, app)
        .await?;

    update_history_with_clean_user_message(&mut history, input, attachments);

    repo.save_session_history(session_id, &history).await?;

    Ok(response)
}

/// Sends a user prompt to the cached LLM agent, streams the response, and persists the conversation.
///
/// 1. Loads session history from the database.
/// 2. Prepends attachment paths as hints for the agent's `read_document` tool.
/// 3. Calls `AGENT_MANAGER.send_stream_prompt`, which streams response tokens through the channel.
/// 4. Cleans attachment metadata from the saved user message.
/// 5. Persists the updated history back to the database.
///
/// # Arguments
///
/// * `session_id` - The unique identifier of the session to continue.
/// * `input` - The user's raw prompt text.
/// * `attachments` - Optional file paths to prepend as document hints for the agent.
/// * `config` - The current application configuration.
/// * `repo` - A [`SessionRepository`] bound to the database.
/// * `app` - Optional Tauri `AppHandle`.
/// * `channel` - Tauri IPC Channel to emit streaming tokens back to the frontend.
///
/// # Returns
///
/// Returns the assistant's final response text on success, or an [`AppError`] on failure.
fn assistant_message_text(
    content: &rig_core::OneOrMany<rig_core::message::AssistantContent>,
) -> String {
    content
        .iter()
        .filter_map(|item| match item {
            rig_core::message::AssistantContent::Text(t) => Some(t.text.as_str()),
            _ => None,
        })
        .collect::<Vec<_>>()
        .join("\n")
}

fn deduplicate_consecutive_assistant_messages(history: Vec<Message>) -> Vec<Message> {
    let mut result: Vec<Message> = Vec::new();
    for msg in history {
        if let Message::Assistant { content, .. } = &msg {
            if let Some(Message::Assistant {
                content: prev_content,
                ..
            }) = result.last()
            {
                let prev_text = assistant_message_text(prev_content);
                let curr_text = assistant_message_text(content);
                if prev_text == curr_text {
                    let prev_has_tools = prev_content.iter().any(|item| {
                        matches!(item, rig_core::message::AssistantContent::ToolCall(_))
                    });
                    let curr_has_tools = content.iter().any(|item| {
                        matches!(item, rig_core::message::AssistantContent::ToolCall(_))
                    });
                    if curr_has_tools != prev_has_tools {
                        // One has tools, the other doesn't — keep the one with tools
                        // (richer context). If curr is the one with tools, replace
                        // prev; if prev is the one with tools, keep prev and skip curr.
                        if curr_has_tools {
                            result.pop();
                            result.push(msg);
                        }
                    } else if prev_has_tools && curr_has_tools {
                        // Both have tool calls — may represent distinct tool invocations.
                        result.push(msg);
                    }
                    // else: neither has tools — identical text-only duplicate, skip curr.
                    continue;
                }
            }
        }
        result.push(msg);
    }
    result
}

pub async fn send_stream_prompt(
    session_id: &str,
    input: &str,
    attachments: Option<&[String]>,
    config: &AppConfig,
    repo: &SessionRepository,
    app: Option<&tauri::AppHandle>,
    channel: tauri::ipc::Channel<String>,
) -> Result<String, AppError> {
    let lock = acquire_session_lock(session_id).await;
    let _guard = lock.lock().await;

    let history = repo.get_session_history(session_id).await?;

    let prompt_with_attachments = prepare_prompt_with_attachments(input, attachments);

    let mut updated_history = AGENT_MANAGER
        .send_stream_prompt(&prompt_with_attachments, &history, config, app, &channel)
        .await?;

    let final_response = if let Some(rig_core::message::Message::Assistant { content, .. }) =
        updated_history.last()
    {
        if let Some(text) = content.iter().find_map(|item| match item {
            AssistantContent::Text(t) => Some(t.text.clone()),
            _ => None,
        }) {
            text
        } else {
            return Err(AppError::SystemError(
                "Streaming response completed but did not contain any text content".to_string(),
            ));
        }
    } else {
        return Err(AppError::SystemError(
            "Streaming response completed but no assistant message was appended to history"
                .to_string(),
        ));
    };

    update_history_with_clean_user_message(&mut updated_history, input, attachments);

    let updated_history = deduplicate_consecutive_assistant_messages(updated_history);

    repo.save_session_history(session_id, &updated_history)
        .await?;

    Ok(final_response)
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

fn prepare_prompt_with_attachments(input: &str, attachments: Option<&[String]>) -> String {
    let mut prompt = String::new();
    if let Some(paths) = attachments {
        for path in paths {
            prompt.push_str(&format!(
                "[Attached Document: {}]\nUse the 'read_document' tool to read this file if you need to access its contents.\n\n",
                path
            ));
        }
    }
    prompt.push_str(input);
    prompt
}

fn update_history_with_clean_user_message(
    history: &mut [Message],
    input: &str,
    attachments: Option<&[String]>,
) {
    let Some(paths) = attachments else {
        return;
    };
    if paths.is_empty() {
        return;
    }

    // Search from the end of the history for the user message that has the attachments metadata
    for msg in history.iter_mut().rev() {
        if let Message::User { content } = msg {
            let is_attachment_msg = match content.first_ref() {
                UserContent::Text(text_content) => {
                    text_content.text.starts_with("[Attached Document:")
                }
                _ => false,
            };

            if is_attachment_msg {
                let mut clean_text = String::new();
                for path in paths {
                    clean_text.push_str(&format!("[Attached: {}]\n", path));
                }
                clean_text.push_str(input);
                *msg = Message::user(&clean_text);
                break;
            }
        }
    }
}
