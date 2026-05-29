//! Tauri commands for querying local system information.
//!
//! This module exposes command handlers to the frontend for retrieving information
//! about the local environment, such as CPU temperature, battery status, system time,
//! and the active username.

use crate::domain::errors::AppError;
use crate::domain::system::SystemInfo;
use crate::infrastructure::system::LocalSystemInfoService;
use tauri::State;

/// Retrieves the latest system telemetry snapshot from the background worker.
///
/// The data (CPU usage, RAM usage, disk usage, temperature) is collected every
/// 3 seconds by a background thread and cached. This command reads the cache.
///
/// # Arguments
///
/// * `system_service` - The service responsible for reading cached system state, injected by Tauri.
///
/// # Returns
///
/// Returns a [`SystemInfo`] struct containing CPU, RAM, disk, temperature, and username
/// on success, or an [`AppError`] on failure.
///
/// # Errors
///
/// Returns [`AppError::NotAvailable`] if the telemetry worker has not completed
/// its first collection cycle yet.
#[tauri::command]
pub async fn get_system_info(
    system_service: State<'_, LocalSystemInfoService>,
) -> Result<SystemInfo, AppError> {
    use crate::domain::system::SystemInfoService;
    system_service.get_system_info()
}
