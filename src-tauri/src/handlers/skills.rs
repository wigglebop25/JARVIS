use crate::domain::errors::AppError;

pub fn get_device_info() -> Result<String, AppError> {
    Err(AppError::NotAvailable(
        "jarvis-skills module not yet available".into(),
    ))
}

pub fn list_skills() -> Result<Vec<String>, AppError> {
    Err(AppError::NotAvailable(
        "jarvis-skills module not yet available".into(),
    ))
}
