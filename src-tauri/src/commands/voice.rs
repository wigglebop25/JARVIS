//! Voice subsystem commands.
//!
//! Uses the `jarvis-transcriber` Rust crate directly (no Python bridge).
//! Wake-word detection is handled on the TypeScript frontend; this module
//! is responsible only for starting/stopping transcription and emitting
//! the transcript back to the frontend via Tauri events.

use crate::domain::errors::AppError;
use crate::domain::voice::ManagedVoiceState;
use crate::handlers::voice::{get_status, start_transcription, stop_transcription};
use tauri::{AppHandle, State};

/// Starts a new background voice transcription session.
///
/// Extracts the inner `VoiceState` from the [`ManagedVoiceState`] wrapper and
/// delegates to [`start_transcription`], which sends a `Start` command to the
/// background worker and spawns a watcher thread. The watcher blocks on the
/// completion notifier, then emits a `"voice-transcript-received"` Tauri event
/// containing the transcribed text back to the frontend.
///
/// # Arguments
///
/// * `app` - The Tauri application handle used to emit events to the frontend.
/// * `state` - The managed voice state container. Returns a "not available" error
///   if the transcription model failed to initialize during app startup.
///
/// # Returns
///
/// Returns `Ok(true)` if the transcription listener was successfully started,
/// or an [`AppError::VoiceError`] if the voice subsystem is unavailable or
/// a transcription is already in progress.
#[tauri::command]
pub async fn start_voice_listener(
    app: AppHandle,
    state: State<'_, ManagedVoiceState>,
) -> Result<bool, AppError> {
    let voice_state = state
        .0
        .as_ref()
        .ok_or_else(|| AppError::VoiceError("Voice subsystem not available".to_string()))?;
    start_transcription(voice_state, app)?;
    Ok(true)
}

/// Stops the current voice transcription session prematurely.
///
/// Signals the background voice recording/transcribing task to terminate
/// immediately and finalise its current buffer.
///
/// # Arguments
///
/// * `state` - The managed voice state container. Returns a "not available" error
///   if the voice subsystem was never initialised.
///
/// # Returns
///
/// Returns `Ok(true)` if the stop signal was sent successfully, or an
/// [`AppError::VoiceError`] if the voice subsystem is unavailable or the
/// command channel is disconnected.
#[tauri::command]
pub async fn stop_voice_listener(state: State<'_, ManagedVoiceState>) -> Result<bool, AppError> {
    let voice_state = state
        .0
        .as_ref()
        .ok_or_else(|| AppError::VoiceError("Voice subsystem not available".to_string()))?;
    stop_transcription(voice_state)?;
    Ok(true)
}

/// Checks whether a voice transcription session is currently active.
///
/// # Arguments
///
/// * `state` - The managed voice state container.
///
/// # Returns
///
/// Returns `Ok(true)` if transcription is currently in progress, `Ok(false)`
/// otherwise. Returns `Ok(false)` (no error) when the voice subsystem is
/// unavailable, so the frontend can always poll this safely.
#[tauri::command]
pub async fn get_voice_status(state: State<'_, ManagedVoiceState>) -> Result<bool, AppError> {
    match &state.0 {
        Some(vs) => Ok(get_status(vs)),
        None => Ok(false),
    }
}
