use crate::domain::config::AppConfig;
use crate::domain::errors::AppError;
use crate::handlers::documents;
use tauri::State;

#[tauri::command]
pub async fn read_document(
    path: String,
    config: State<'_, std::sync::Mutex<AppConfig>>,
) -> Result<String, AppError> {
    let (sandbox_dir, read_extensions) = {
        let guard = config
            .lock()
            .map_err(|e| AppError::SystemError(format!("Failed to lock config: {}", e)))?;
        (guard.sandbox_dir.clone(), guard.read_extensions.clone())
    };
    documents::read_document(&sandbox_dir, read_extensions, path).await
}

#[tauri::command]
pub async fn write_document(
    path: String,
    content: String,
    append: Option<bool>,
    config: State<'_, std::sync::Mutex<AppConfig>>,
) -> Result<String, AppError> {
    let (sandbox_dir, write_extensions) = {
        let guard = config
            .lock()
            .map_err(|e| AppError::SystemError(format!("Failed to lock config: {}", e)))?;
        (guard.sandbox_dir.clone(), guard.write_extensions.clone())
    };
    documents::write_document(&sandbox_dir, write_extensions, path, content, append).await
}

#[tauri::command]
pub async fn list_directory(
    path: Option<String>,
    config: State<'_, std::sync::Mutex<AppConfig>>,
) -> Result<String, AppError> {
    let sandbox_dir = {
        let guard = config
            .lock()
            .map_err(|e| AppError::SystemError(format!("Failed to lock config: {}", e)))?;
        guard.sandbox_dir.clone()
    };
    documents::list_directory(&sandbox_dir, path).await
}

#[tauri::command]
pub async fn glob_search(
    pattern: String,
    config: State<'_, std::sync::Mutex<AppConfig>>,
) -> Result<String, AppError> {
    let sandbox_dir = {
        let guard = config
            .lock()
            .map_err(|e| AppError::SystemError(format!("Failed to lock config: {}", e)))?;
        guard.sandbox_dir.clone()
    };
    documents::glob_search(&sandbox_dir, pattern).await
}

#[tauri::command]
pub async fn grep_search(
    query: String,
    path: Option<String>,
    case_sensitive: Option<bool>,
    config: State<'_, std::sync::Mutex<AppConfig>>,
) -> Result<String, AppError> {
    let (sandbox_dir, read_extensions) = {
        let guard = config
            .lock()
            .map_err(|e| AppError::SystemError(format!("Failed to lock config: {}", e)))?;
        (guard.sandbox_dir.clone(), guard.read_extensions.clone())
    };
    documents::grep_search(&sandbox_dir, read_extensions, query, path, case_sensitive).await
}
