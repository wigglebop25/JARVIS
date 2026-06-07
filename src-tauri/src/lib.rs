pub mod commands;
pub mod domain;
pub mod handlers;
pub mod infrastructure;

use crate::commands::chat::*;
use crate::commands::config::*;
use crate::commands::documents::*;
use crate::commands::system::*;
use crate::commands::voice::*;
use tauri::Manager;
// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

/// Application entry-point for the Tauri desktop app.
///
/// Sets up:
/// - Configuration loaded from `config.toml` (with defaults for missing fields).
/// - SQLite database for chat session persistence.
/// - Voice transcription worker (gracefully degrades if the model is unavailable).
/// - Background system telemetry worker that emits `"system-telemetry"` events.
/// - All Tauri command handlers listed in `invoke_handler`.
///
/// Plugins: `tauri-plugin-media`, `tauri-plugin-opener`, `tauri-plugin-dialog`.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_media::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(domain::chat::ChatState::default())
        .setup(|app| {
            // Load Configuration
            let config = if let Ok(config_dir) = app.path().app_config_dir() {
                let config_path = config_dir.join("config.toml");
                domain::config::AppConfig::load_from(&config_path).unwrap_or_default()
            } else {
                domain::config::AppConfig::default()
            };

            let silence_threshold_rms = config.silence_threshold_rms;
            let silence_duration_ms = config.silence_duration_ms;
            let model_path = config.transcription_model_path.clone();
            let db_name = config.database_name.clone();
            app.manage(tokio::sync::Mutex::new(config));

            // Load Database
            let data_dir = app.path().app_data_dir()?;
            let db_path = data_dir.join(&db_name);
            let db = infrastructure::db::DatabaseManager::new(&db_path)?;
            app.manage(db);

            // Initialize the voice transcription worker
            let voice_state = match handlers::voice::init_voice_state(
                silence_threshold_rms,
                silence_duration_ms,
                model_path,
            ) {
                Ok(vs) => domain::voice::ManagedVoiceState(Some(vs)),
                Err(e) => {
                    eprintln!("Warning: voice initialization failed: {e}");
                    domain::voice::ManagedVoiceState(None)
                }
            };
            app.manage(voice_state);

            // Initialize the system telemetry service and spawn background worker thread
            let system_service = infrastructure::system::LocalSystemInfoService::new();
            app.manage(system_service);

            let app_handle = app.handle().clone();
            std::thread::spawn(move || {
                infrastructure::system::start_telemetry_worker(app_handle);
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Config
            get_config,
            update_config,
            // Chat
            prompt,
            stream_prompt,
            count_tokens,
            create_session,
            list_sessions,
            get_history,
            rename_session,
            delete_session,
            get_chat_providers,
            set_chat_provider,
            // Voice (jarvis-transcriber, pure Rust)
            start_voice_listener,
            stop_voice_listener,
            get_voice_status,
            // System Telemetry
            get_system_info,
            // Document Commands
            read_document,
            write_document,
            list_directory,
            glob_search,
            grep_search,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
