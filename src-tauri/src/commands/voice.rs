//! Voice subsystem commands.
//!
//! Uses the `jarvis-transcriber` Rust crate directly (no Python bridge).
//! Wake-word detection is handled on the TypeScript frontend; this module
//! is responsible only for starting/stopping transcription and emitting
//! the transcript back to the frontend via Tauri events.

use crate::domain::errors::AppError;
use crate::domain::voice::VoiceState;
use crate::handlers::voice::{get_status, start_transcription, stop_transcription};
use tauri::{AppHandle, State};

/// Starts a new background voice transcription session.
///
/// Sends a `Start` command to the transcription background worker and spawns a watcher
/// thread that blocks on the completion of the voice recording, then emits a
/// `voice-transcript-received` Tauri event containing the transcribed text back to the frontend.
///
/// # Arguments
///
/// * `app` - The Tauri application handle used to emit events.
/// * `state` - The thread-safe state container managing the active transcriber lifecycle.
///
/// # Returns
///
/// Returns `Ok(true)` if the transcription listener successfully initialized and started,
/// or an [`AppError`] on failure.
#[tauri::command]
pub async fn start_voice_listener(
    app: AppHandle,
    state: State<'_, VoiceState>,
) -> Result<bool, AppError> {
    start_transcription(&state, app)?;
    Ok(true)
}

/// Stops the current voice transcription session prematurely.
///
/// Signals the background voice recording/transcribing task to terminate immediately
/// and finalize its current buffer.
///
/// # Arguments
///
/// * `state` - The thread-safe state container managing the active transcriber lifecycle.
///
/// # Returns
///
/// Returns `Ok(true)` if the stop signal was successfully transmitted, or an [`AppError`] on failure.
#[tauri::command]
pub async fn stop_voice_listener(state: State<'_, VoiceState>) -> Result<bool, AppError> {
    stop_transcription(&state)?;
    Ok(true)
}

/// Checks whether a voice transcription session is currently active.
///
/// # Arguments
///
/// * `state` - The thread-safe state container managing the active transcriber lifecycle.
///
/// # Returns
///
/// Returns `Ok(true)` if transcription is currently in progress, `Ok(false)` otherwise, or an [`AppError`].
#[tauri::command]
pub async fn get_voice_status(state: State<'_, VoiceState>) -> Result<bool, AppError> {
    Ok(get_status(&state))
}
