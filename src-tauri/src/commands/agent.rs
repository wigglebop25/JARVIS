use crate::domain::errors::AppError;
use crate::infrastructure::agent::AGENT_MANAGER;

#[tauri::command]
pub async fn restart_agent() -> Result<(), AppError> {
    AGENT_MANAGER.restart().await;
    Ok(())
}
