use crate::domain::errors::AppError;
use serde::{Deserialize, Serialize};

/// Snapshot of local system telemetry, emitted to the frontend periodically.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SystemInfo {
    /// RFC 3339 timestamp of the measurement.
    pub time: String,
    /// CPU core temperature in Celsius, if available from the sensor.
    pub cpu_temperature: Option<f32>,
    /// Logged-in username (`USERNAME` or `USER` env var).
    pub username: String,
    /// Global CPU usage as a percentage (0–100).
    pub cpu_usage: f32,
    /// RAM usage as a percentage of total physical memory.
    pub ram_usage: f32,
    /// Disk usage as a percentage of total space (C: drive on Windows, all disks otherwise).
    pub disk_usage: f32,
}

/// Trait for retrieving system telemetry.
///
/// Implementations may return cached or live data.
pub trait SystemInfoService: Send + Sync {
    /// Returns the latest system telemetry snapshot.
    ///
    /// # Errors
    ///
    /// Returns [`AppError::NotAvailable`] if no measurement has been collected yet.
    fn get_system_info(&self) -> Result<SystemInfo, AppError>;
}
