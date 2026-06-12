use crate::domain::errors::AppError;
use crate::infrastructure::agent::{prebuild_agent, AGENT_MANAGER};
use tauri::AppHandle;

#[tauri::command]
pub async fn restart_agent(app: AppHandle) -> Result<(), AppError> {
    AGENT_MANAGER.restart().await;
    tauri::async_runtime::spawn(prebuild_agent(app));
    Ok(())
}
