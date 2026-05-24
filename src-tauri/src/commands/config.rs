//! Tauri commands for application configuration management.
//!
//! This module exposes command handlers to the frontend for retrieving and
//! updating the global settings of the JARVIS application (such as active LLM providers,
//! API keys, or voice detection thresholds).

use crate::domain::config::AppConfig;
use crate::domain::errors::AppError;
use tauri::{AppHandle, Manager, State};

/// Retrieves the current application configuration, augmented with default system values.
///
/// # Arguments
///
/// * `config` - The current configuration stored in the application's global state.
///
/// # Returns
///
/// Returns a serialized [`serde_json::Value`] representing the application's configuration,
/// including fallback settings (like `vad_threshold`), or an [`AppError`] on failure.
#[tauri::command]
pub async fn get_config(
    config: State<'_, std::sync::Mutex<AppConfig>>,
) -> Result<serde_json::Value, AppError> {
    let config_guard = config
        .lock()
        .map_err(|e| AppError::SystemError(format!("Failed to lock config: {}", e)))?;

    let mut val = serde_json::to_value(&*config_guard)
        .map_err(|e| AppError::SystemError(format!("Failed to serialize config: {}", e)))?;

    if let serde_json::Value::Object(ref mut map) = val {
        map.insert("vad_threshold".to_string(), serde_json::Value::from(0.5));
    }

    Ok(val)
}

/// Updates the application configuration in global state and persists it to disk.
///
/// # Arguments
///
/// * `new_config` - The new application configuration structure to apply.
/// * `config` - The active configuration stored in the application's global state.
/// * `app` - The Tauri application handle used to resolve system paths.
///
/// # Returns
///
/// Returns `Ok(())` on success, or an [`AppError`] on failure.
#[tauri::command]
pub async fn update_config(
    new_config: AppConfig,
    config: State<'_, std::sync::Mutex<AppConfig>>,
    app: AppHandle,
) -> Result<(), AppError> {
    let mut config_guard = config
        .lock()
        .map_err(|e| AppError::SystemError(format!("Failed to lock config: {}", e)))?;

    *config_guard = new_config;

    if let Ok(config_dir) = app.path().app_config_dir() {
        let config_path = config_dir.join("config.toml");
        config_guard
            .save_to(&config_path)
            .map_err(|e| AppError::SystemError(format!("Failed to save config: {}", e)))?;
    }

    Ok(())
}
