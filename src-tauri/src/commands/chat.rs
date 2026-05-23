use crate::domain::chat::{ChatResponse, Session};
use crate::domain::config::AppConfig;
use crate::domain::errors::AppError;
use crate::handlers::chat::{get_providers, send_prompt, set_provider};
use crate::infrastructure::db::DatabaseManager;
use crate::infrastructure::repository::SessionRepository;
use rig::message::Message;
use tauri::State;

/// Create a new session and return the ID
#[tauri::command]
pub async fn create_session(
    title: Option<String>,
    db: State<'_, DatabaseManager>,
) -> Result<String, AppError> {
    let repo = SessionRepository::new(&db);
    repo.create_session(title)
}

/// Send a prompt to the Rust agent
#[tauri::command]
pub async fn prompt(
    session_id: String,
    input: String,
    config: State<'_, std::sync::Mutex<AppConfig>>,
    db: State<'_, DatabaseManager>,
) -> Result<ChatResponse, AppError> {
    let config_clone = {
        let config_guard = config
            .lock()
            .map_err(|e| AppError::SystemError(format!("Failed to lock config: {}", e)))?;
        config_guard.clone()
    };
    let provider = config_clone.provider.to_string();
    let repo = SessionRepository::new(&db);
    let response = send_prompt(&session_id, &input, &config_clone, &repo).await?;

    Ok(ChatResponse {
        message: response,
        provider,
    })
}

/// Get available LLM providers
#[tauri::command]
pub async fn get_chat_providers() -> Result<Vec<String>, AppError> {
    get_providers()
}

/// Set the active LLM provider.
#[tauri::command]
pub async fn set_chat_provider(
    provider: String,
    config: State<'_, std::sync::Mutex<AppConfig>>,
    app: tauri::AppHandle,
) -> Result<(), AppError> {
    use tauri::Manager;
    let config_path = app
        .path()
        .app_config_dir()
        .ok()
        .map(|dir| dir.join("config.toml"));
    set_provider(provider, &config, config_path.as_deref())
}

/// List all sessions
#[tauri::command]
pub async fn list_sessions(db: State<'_, DatabaseManager>) -> Result<Vec<Session>, AppError> {
    let repo = SessionRepository::new(&db);
    repo.get_all_sessions()
}

/// Get history for a session
#[tauri::command]
pub async fn get_history(
    session_id: String,
    db: State<'_, DatabaseManager>,
) -> Result<Vec<Message>, AppError> {
    let repo = SessionRepository::new(&db);
    repo.get_session_history(&session_id)
}
