//! Tauri commands for querying local system information.
//!
//! This module exposes command handlers to the frontend for retrieving information
//! about the local environment, such as CPU temperature, battery status, system time,
//! and the active username.

use crate::domain::errors::AppError;
use crate::domain::system::SystemInfo;
use crate::infrastructure::system::LocalSystemInfoService;
use tauri::State;

/// Retrieves detailed system information from the local device.
///
/// This queries various diagnostics (such as battery charge state, local clock, CPU
/// temperature, and the system login username) using the injected `LocalSystemInfoService`.
///
/// # Arguments
///
/// * `system_service` - The service responsible for reading system state.
///
/// # Returns
///
/// Returns a [`SystemInfo`] struct containing all retrieved statistics on success,
/// or an [`AppError`] on failure.
#[tauri::command]
pub async fn get_system_info(
    system_service: State<'_, LocalSystemInfoService>,
) -> Result<SystemInfo, AppError> {
    use crate::domain::system::SystemInfoService;
    system_service.get_system_info()
}
