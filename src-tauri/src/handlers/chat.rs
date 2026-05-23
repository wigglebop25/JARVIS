use crate::domain::config::{AppConfig, Providers};
use crate::domain::errors::AppError;
use crate::infrastructure::agent::AGENT_MANAGER;
use crate::infrastructure::repository::SessionRepository;
use std::path::Path;

pub async fn send_prompt(
    session_id: &str,
    input: &str,
    config: &AppConfig,
    repo: &SessionRepository<'_>,
) -> Result<String, AppError> {
    // 1. Get history from DB
    let mut history = repo.get_session_history(session_id).unwrap_or_default();

    // 2. Send prompt via lazy singleton
    let response = AGENT_MANAGER
        .send_prompt(input, &mut history, config)
        .await?;

    // 3. Save history back
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
