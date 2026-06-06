use crate::domain::errors::AppError;
use crate::domain::voice::{TranscriptPayload, VoiceState, DEFAULT_MODEL_URI};
use crossbeam_channel::unbounded;
use jarvis_transcriber::core::config::Config;
use jarvis_transcriber::transcription::engine::{worker_thread, Command};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Condvar, Mutex};
use std::thread;
use tauri::{AppHandle, Emitter};

/// Spawns a background voice worker thread and returns its control handles.
///
/// The worker listens on `command_rx` for Start/Stop signals and writes
/// transcribed text into `latest_transcript`, notifying via `completion_notifier`.
///
/// # Arguments
///
/// * `silence_threshold_rms` - RMS amplitude threshold below which audio is silence.
/// * `silence_duration_ms` - Milliseconds of silence before transcription finalises.
/// * `model_path` - Local filesystem path to the Parakeet transcription model.
///
/// # Returns
///
/// Returns a [`VoiceState`] with channel senders and synchronisation primitives
/// on success, or an [`AppError`] on failure.
///
/// # Errors
///
/// Returns an error if the transcription model cannot be loaded or the audio
/// device is unavailable. The caller (app setup) is expected to catch this and
/// continue with `ManagedVoiceState(None)` rather than crashing.
pub fn init_voice_state(
    silence_threshold_rms: f32,
    silence_duration_ms: u64,
    model_path: String,
) -> Result<VoiceState, AppError> {
    let (command_tx, command_rx) = unbounded();
    let is_transcribing = Arc::new(AtomicBool::new(false));
    let latest_transcript = Arc::new(Mutex::new(String::new()));
    let completion_notifier = Arc::new((Mutex::new(false), Condvar::new()));
    let on_complete_callback = Arc::new(Mutex::new(None)); // unused – we poll instead

    let config = Config {
        silence_threshold_rms,
        silence_duration: (silence_duration_ms as f32) / 1000.0,
    };

    // Clones for the worker thread
    let is_tx_clone = is_transcribing.clone();
    let lt_clone = latest_transcript.clone();
    let cn_clone = completion_notifier.clone();
    let cb_clone = on_complete_callback;

    thread::spawn(move || {
        worker_thread(
            command_rx,
            is_tx_clone,
            lt_clone,
            cn_clone,
            cb_clone,
            config,
            DEFAULT_MODEL_URI.to_string(),
            model_path,
        );
    });

    Ok(VoiceState {
        command_tx,
        is_transcribing,
        latest_transcript,
        completion_notifier,
    })
}

/// Sends a Start command to the voice worker and spawns a watcher thread.
///
/// The watcher blocks on `completion_notifier`, then emits the transcript
/// to the frontend as a `"voice-transcript-received"` Tauri event.
///
/// Uses `compare_exchange` on `is_transcribing` to prevent concurrent starts.
///
/// # Arguments
///
/// * `state` - The active [`VoiceState`] with channel handles and synchronisation.
/// * `app` - The Tauri [`AppHandle`] used to emit the transcript event.
///
/// # Returns
///
/// Returns `Ok(())` on success, or an [`AppError`] on failure.
///
/// # Errors
///
/// Returns [`AppError::VoiceError("Voice listener already active")`] if a
/// transcription is already in progress. Returns [`AppError::VoiceError`] if
/// the command channel is disconnected.
pub fn start_transcription(state: &VoiceState, app: AppHandle) -> Result<(), AppError> {
    // Guard against double-start using compare_exchange to avoid race conditions
    if state
        .is_transcribing
        .compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
        .is_err()
    {
        return Err(AppError::VoiceError(
            "Voice listener already active".to_string(),
        ));
    }

    // Reset the completion flag before starting
    {
        let (lock, _) = &*state.completion_notifier;
        let mut completed = lock
            .lock()
            .map_err(|e| AppError::LockError(e.to_string()))?;
        *completed = false;
    }

    if let Err(e) = state.command_tx.send(Command::Start) {
        state.is_transcribing.store(false, Ordering::SeqCst);
        return Err(AppError::VoiceError(format!(
            "Failed to send start command: {e}"
        )));
    }

    // Spawn a lightweight thread to wait for the transcription to finish
    // and then emit the result as a Tauri event.
    let notifier = state.completion_notifier.clone();
    let transcript = state.latest_transcript.clone();

    thread::spawn(move || {
        // Block until the worker signals completion
        let (lock, cvar) = &*notifier;
        let mut completed = match lock.lock() {
            Ok(c) => c,
            Err(e) => {
                eprintln!("Voice watcher: mutex lock failed: {e}");
                return;
            }
        };
        while !*completed {
            completed = match cvar.wait(completed) {
                Ok(c) => c,
                Err(e) => {
                    eprintln!("Voice watcher: condvar wait failed: {e}");
                    return;
                }
            };
        }
        drop(completed);

        // Read the transcript and emit the event
        let text = match transcript.lock() {
            Ok(t) => t.clone(),
            Err(e) => {
                eprintln!("Voice watcher: transcript lock failed: {e}");
                return;
            }
        };
        let _ = app.emit(
            "voice-transcript-received",
            TranscriptPayload { transcript: text },
        );
    });

    Ok(())
}

/// Sends a Stop command to the voice worker to terminate transcription early.
///
/// Signals the background worker thread to finalise its current buffer and stop.
///
/// # Arguments
///
/// * `state` - The active [`VoiceState`] with the command channel sender.
///
/// # Returns
///
/// Returns `Ok(())` on success, or an [`AppError`] on failure.
///
/// # Errors
///
/// Returns [`AppError::VoiceError`] if the command channel is disconnected.
pub fn stop_transcription(state: &VoiceState) -> Result<(), AppError> {
    state
        .command_tx
        .send(Command::Stop)
        .map_err(|e| AppError::VoiceError(format!("Failed to send stop command: {e}")))?;
    Ok(())
}

/// Returns `true` if the voice worker is currently transcribing.
///
/// Reads the `is_transcribing` atomic flag without sending a channel message.
///
/// # Arguments
///
/// * `state` - The active [`VoiceState`] with the atomic flag.
///
/// # Returns
///
/// `true` if a transcription is in progress, `false` otherwise.
pub fn get_status(state: &VoiceState) -> bool {
    state.is_transcribing.load(Ordering::SeqCst)
}
