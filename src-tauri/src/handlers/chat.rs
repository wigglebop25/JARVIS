use crate::domain::config::{AppConfig, Providers};
use crate::domain::errors::AppError;
use crate::infrastructure::agent::AGENT_MANAGER;
use crate::infrastructure::repository::SessionRepository;
use std::path::Path;

pub async fn send_prompt(
    session_id: &str,
    input: &str,
    attachments: Option<&[String]>,
    config: &AppConfig,
    repo: &SessionRepository<'_>,
) -> Result<String, AppError> {
    // 1. Get history from DB
    let mut history = repo.get_session_history(session_id).unwrap_or_default();

    // 2. Format user prompt for the agent to include file paths
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

    // 3. Send prompt via lazy singleton
    let response = AGENT_MANAGER
        .send_prompt(&prompt_with_attachments, &mut history, config)
        .await?;

    // 4. Clean up the user message in history before saving to database
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

    // 5. Save history back
    repo.save_session_history(session_id, &history)?;

    Ok(response)
}

pub fn get_providers() -> Result<Vec<String>, AppError> {
    Ok(Providers::all()
        .into_iter()
        .map(|p| p.to_string())
        .collect())
}

pub fn set_provider(
    provider: String,
    config: &std::sync::Mutex<AppConfig>,
    config_path: Option<&Path>,
) -> Result<(), AppError> {
    let provider_enum = provider.parse::<Providers>()
        .map_err(|e| AppError::SystemError(e))?;

    let mut config_guard = config
        .lock()
        .map_err(|e| AppError::SystemError(format!("Lock error: {}", e)))?;

    config_guard.provider = provider_enum;

    if let Some(path) = config_path {
        config_guard
            .save_to(path)
            .map_err(|e| AppError::SystemError(format!("Failed to save config: {}", e)))?;
    }

    Ok(())
}
