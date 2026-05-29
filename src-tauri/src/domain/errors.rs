use serde::{ser::Serializer, Serialize};
use thiserror::Error;

/// Errors returned by the JARVIS backend to the frontend.
///
/// Every Tauri command handler returns `Result<T, AppError>`. The error is
/// serialized as its display string and forwarded to the TypeScript caller.
#[derive(Error, Debug)]
pub enum AppError {
    /// Voice subsystem failure (e.g. device unavailable, already active).
    #[error("Voice error: {0}")]
    VoiceError(String),

    /// Mutex lock acquisition failure (poisoned or contention).
    #[error("Lock error: {0}")]
    LockError(String),

    /// Feature or resource not yet available (e.g. telemetry not initialized).
    #[error("Not available: {0}")]
    NotAvailable(String),

    /// General runtime error (DB, I/O, serialization, etc.).
    #[error("System error: {0}")]
    SystemError(String),
}

/// Converts [`rusqlite::Error`] into [`AppError::SystemError`].
impl From<rusqlite::Error> for AppError {
    fn from(e: rusqlite::Error) -> Self {
        AppError::SystemError(e.to_string())
    }
}

/// Converts serde_json errors into [`AppError::SystemError`].
impl From<serde_json::Error> for AppError {
    fn from(e: serde_json::Error) -> Self {
        AppError::SystemError(e.to_string())
    }
}

/// Converts I/O errors into [`AppError::SystemError`].
impl From<std::io::Error> for AppError {
    fn from(e: std::io::Error) -> Self {
        AppError::SystemError(e.to_string())
    }
}

// Manual Serialize so Tauri can send AppError across the IPC bridge.
impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}
