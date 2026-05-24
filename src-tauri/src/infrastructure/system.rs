use crate::domain::errors::AppError;
use crate::domain::system::{SystemInfo, SystemInfoService};
use once_cell::sync::Lazy;
use std::sync::RwLock;
use sysinfo::{System, Disks};

pub static LATEST_TELEMETRY: Lazy<RwLock<Option<SystemInfo>>> = Lazy::new(|| RwLock::new(None));

#[derive(Clone, Default)]
pub struct LocalSystemInfoService;

impl LocalSystemInfoService {
    pub fn new() -> Self {
        Self
    }
}

impl SystemInfoService for LocalSystemInfoService {
    fn get_system_info(&self) -> Result<SystemInfo, AppError> {
        let guard = LATEST_TELEMETRY
            .read()
            .map_err(|e| AppError::LockError(format!("Failed to acquire read lock: {}", e)))?;
        
        guard.clone().ok_or_else(|| {
            AppError::NotAvailable("Telemetry worker has not initialized yet".into())
        })
    }
}

pub fn start_telemetry_worker(app_handle: tauri::AppHandle) {
    use tauri::Emitter;

    let mut sys = System::new();
    // Warm up CPU and memory measurement
    sys.refresh_cpu_all();
    sys.refresh_memory();

    let username = std::env::var("USERNAME")
        .or_else(|_| std::env::var("USER"))
        .unwrap_or_else(|_| "User".to_string());

    loop {
        // Sleep first so we have a delta for CPU usage calculations
        std::thread::sleep(std::time::Duration::from_secs(3));

        sys.refresh_cpu_all();
        sys.refresh_memory();

        let cpu_usage = sys.global_cpu_usage();

        let total_memory = sys.total_memory();
        let ram_usage = if total_memory > 0 {
            (sys.used_memory() as f32 / total_memory as f32) * 100.0
        } else {
            0.0
        };

        // Disk usage calculation
        let disks = Disks::new_with_refreshed_list();
        let disk_usage = if let Some(c_disk) = disks.iter().find(|d| d.mount_point() == std::path::Path::new("C:\\")) {
            let total = c_disk.total_space();
            if total > 0 {
                ((total - c_disk.available_space()) as f32 / total as f32) * 100.0
            } else {
                0.0
            }
        } else {
            let mut total = 0;
            let mut available = 0;
            for d in disks.list() {
                total += d.total_space();
                available += d.available_space();
            }
            if total > 0 {
                ((total - available) as f32 / total as f32) * 100.0
            } else {
                0.0
            }
        };

        let time = chrono::Local::now().to_rfc3339();
        
        // Returns None (null) on Windows if hardware sensors are unreadable without admin privileges
        let cpu_temperature = None;

        let info = SystemInfo {
            time,
            cpu_temperature,
            username: username.clone(),
            cpu_usage,
            ram_usage,
            disk_usage,
        };

        // Cache the latest telemetry
        if let Ok(mut guard) = LATEST_TELEMETRY.write() {
            *guard = Some(info.clone());
        }

        // Broadcast to the frontend
        let _ = app_handle.emit("system-telemetry", info);
    }
}
