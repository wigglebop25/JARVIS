use crate::domain::errors::AppError;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SystemInfo {
    pub time: String,
    pub cpu_temperature: Option<f32>,
    pub username: String,
    pub cpu_usage: f32,
    pub ram_usage: f32,
    pub disk_usage: f32,
}

pub trait SystemInfoService: Send + Sync {
    fn get_system_info(&self) -> Result<SystemInfo, AppError>;
}
