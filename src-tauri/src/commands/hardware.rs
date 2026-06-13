use crate::domain::errors::AppError;
use crate::domain::hardware::HardwareState;
use crate::infrastructure::hardware;

#[tauri::command]
pub async fn get_hardware_state() -> Result<HardwareState, AppError> {
    hardware::get_hardware_state().await
}

#[tauri::command]
pub async fn set_system_volume(level: u8) -> Result<(), AppError> {
    hardware::set_system_volume(level).await
}

#[tauri::command]
pub async fn set_volume_muted(muted: bool) -> Result<(), AppError> {
    hardware::set_volume_muted(muted).await
}

#[tauri::command]
pub async fn set_wifi_enabled(enabled: bool) -> Result<(), AppError> {
    hardware::set_wifi_enabled(enabled).await
}

#[tauri::command]
pub async fn set_bluetooth_enabled(enabled: bool) -> Result<(), AppError> {
    hardware::set_bluetooth_enabled(enabled).await
}
