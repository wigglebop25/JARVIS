use crate::domain::errors::AppError;
use crate::domain::system::SystemInfo;
use crate::infrastructure::system::LocalSystemInfoService;
use tauri::State;

#[tauri::command]
pub async fn get_system_info(
    system_service: State<'_, LocalSystemInfoService>,
) -> Result<SystemInfo, AppError> {
    use crate::domain::system::SystemInfoService;
    system_service.get_system_info()
}
