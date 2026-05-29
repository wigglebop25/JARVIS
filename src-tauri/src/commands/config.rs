//! Tauri commands for application configuration management.
//!
//! This module exposes command handlers to the frontend for retrieving and
//! updating the global settings of the JARVIS application (such as active LLM providers,
//! API keys, or voice detection thresholds).

use crate::domain::config::AppConfig;
use crate::domain::errors::AppError;
use tauri::{AppHandle, Manager, State};

/// Returns the full application configuration as a JSON value.
///
/// The config is read from the `tokio::sync::Mutex` managed state (previously loaded
/// from `config.toml` at startup). No synthetic fields (e.g. `vad_threshold`) are injected.
///
/// # Arguments
///
/// * `config` - The application configuration state, injected by Tauri.
///
/// # Returns
///
/// Returns a [`serde_json::Value`] representing the full `AppConfig` on success,
/// or an [`AppError`] on failure.
///
/// # Errors
///
/// Returns [`AppError::SystemError`] if the config cannot be serialised to JSON.
#[tauri::command]
pub async fn get_config(
    config: State<'_, tokio::sync::Mutex<AppConfig>>,
) -> Result<serde_json::Value, AppError> {
    let config_guard = config.lock().await;
    serde_json::to_value(&*config_guard)
        .map_err(|e| AppError::SystemError(format!("Failed to serialize config: {}", e)))
}

/// Overwrites the in-memory config and persists it to the config file on disk.
///
/// The lock is released before the file write so that concurrent reads are not
/// blocked during I/O. Errors from directory resolution or file writing are
/// propagated to the frontend (previously they were silently ignored).
///
/// # Arguments
///
/// * `new_config` - The complete [`AppConfig`] to apply.
/// * `config` - The application configuration state, injected by Tauri.
/// * `app` - The Tauri application handle, used to resolve the config directory path.
///
/// # Returns
///
/// Returns `Ok(())` on success, or an [`AppError`] on failure.
///
/// # Errors
///
/// Returns [`AppError::SystemError`] if the config directory cannot be resolved or
/// the TOML file cannot be written.
#[tauri::command]
pub async fn update_config(
    new_config: AppConfig,
    config: State<'_, tokio::sync::Mutex<AppConfig>>,
    app: AppHandle,
) -> Result<(), AppError> {
    {
        let mut config_guard = config.lock().await;
        *config_guard = new_config.clone();
    }

    let config_dir = app
        .path()
        .app_config_dir()
        .map_err(|e| AppError::SystemError(format!("Failed to resolve config directory: {}", e)))?;
    let config_path = config_dir.join("config.toml");
    new_config
        .save_to(&config_path)
        .map_err(|e| AppError::SystemError(format!("Failed to save config: {}", e)))?;

    Ok(())
}
