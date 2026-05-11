use serde::{ser::Serializer, Serialize};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Python error: {0}")]
    PythonError(String),

    #[error("Voice error: {0}")]
    VoiceError(String),

    #[error("Lock error: {0}")]
    LockError(String),

    #[error("Not available: {0}")]
    NotAvailable(String),

    #[error("System error: {0}")]
    SystemError(String),
}

// We must manually implement Serialize for our error type
// so that Tauri can return it to the frontend.
impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}
