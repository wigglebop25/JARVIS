use crate::domain::errors::AppError;
use crate::domain::voice::{TranscriptPayload, VoiceState, DEFAULT_MODEL_URI};
use crossbeam_channel::unbounded;
use jarvis_transcriber::core::config::Config;
use jarvis_transcriber::transcription::engine::{worker_thread, Command};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Condvar, Mutex};
use std::thread;
use tauri::{AppHandle, Emitter};

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

pub fn start_transcription(state: &VoiceState, app: AppHandle) -> Result<(), AppError> {
    // Reset the completion flag before starting
    {
        let (lock, _) = &*state.completion_notifier;
        let mut completed = lock
            .lock()
            .map_err(|e| AppError::LockError(e.to_string()))?;
        *completed = false;
    }

    state
        .command_tx
        .send(Command::Start)
        .map_err(|e| AppError::VoiceError(format!("Failed to send start command: {e}")))?;

    // Spawn a lightweight thread to wait for the transcription to finish
    // and then emit the result as a Tauri event.
    let notifier = state.completion_notifier.clone();
    let transcript = state.latest_transcript.clone();

    thread::spawn(move || {
        // Block until the worker signals completion
        let (lock, cvar) = &*notifier;
        let mut completed = lock.lock().unwrap();
        while !*completed {
            completed = cvar.wait(completed).unwrap();
        }

        // Read the transcript and emit the event
        let text = transcript.lock().unwrap().clone();
        let _ = app.emit(
            "voice-transcript-received",
            TranscriptPayload { transcript: text },
        );
    });

    Ok(())
}

pub fn stop_transcription(state: &VoiceState) -> Result<(), AppError> {
    state
        .command_tx
        .send(Command::Stop)
        .map_err(|e| AppError::VoiceError(format!("Failed to send stop command: {e}")))?;
    Ok(())
}

pub fn get_status(state: &VoiceState) -> bool {
    state.is_transcribing.load(Ordering::SeqCst)
}
