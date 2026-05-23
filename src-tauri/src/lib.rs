pub mod commands;
pub mod domain;
pub mod handlers;

use crate::commands::chat::*;
use crate::commands::config::*;
use crate::commands::skills::*;
use crate::commands::voice::*;
use crate::domain::errors::AppError;
use tauri::{App, Manager};
// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(domain::chat::ChatState::default())
        .setup(|app: &mut App| {
            // Load Configuration
            let config = if let Ok(config_dir) = app.path().app_config_dir() {
                let config_path = config_dir.join("config.toml");
                domain::config::AppConfig::load_from(&config_path).unwrap_or_default()
            } else {
                domain::config::AppConfig::default()
            };

            let vad_threshold = config.vad_threshold;
            let silence_duration_ms = config.silence_duration_ms;
            let model_path = config.transcription_model_path.clone();
            let db_name = config.database_name.clone();
            app.manage(std::sync::Mutex::new(config));

            // Load Database
            if let Ok(data_dir) = app.path().app_data_dir() {
                let db_path = data_dir.join(&db_name);
                let db = domain::db::DatabaseManager::new(&db_path).map_err(|e| {
                    AppError::SystemError(format!("Failed to initialize database {}", e))
                });
                app.manage(db);
            }

            // Initialize the voice transcription worker in the background
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let voice_state = handlers::voice::init_voice_state(
                    vad_threshold,
                    silence_duration_ms,
                    model_path,
                )
                .map_err(|e| {
                    AppError::VoiceError(format!("failed to initialise voice subsystem {}", e))
                });
                handle.manage(voice_state);
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Config
            get_config,
            update_config,
            // Chat
            prompt,
            create_session,
            list_sessions,
            get_history,
            get_chat_providers,
            set_chat_provider,
            // Voice (jarvis-transcriber, pure Rust)
            start_voice_listener,
            stop_voice_listener,
            get_voice_status,
            // Skills (jarvis-skills MCP — stubs)
            get_device_info,
            list_skills,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
