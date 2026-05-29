use crossbeam_channel::Sender;
use jarvis_transcriber::transcription::engine::Command;
use serde::Serialize;
use std::sync::atomic::AtomicBool;
use std::sync::{Arc, Condvar, Mutex};

/// Default URL for downloading the Parakeet transcription model tarball.
pub const DEFAULT_MODEL_URI: &str = "https://blob.handy.computer/parakeet-v3-int8.tar.gz";

/// Default local directory name for the extracted Parakeet model.
pub const DEFAULT_MODEL_PATH: &str = "parakeet-tdt-0.6b-v3-int8";

/// Payload emitted to the frontend when a transcription completes.
#[derive(Clone, Serialize)]
pub struct TranscriptPayload {
    /// The transcribed text from the voice recording.
    pub transcript: String,
}

/// Shared state for the voice transcription subsystem.
///
/// Created once during app setup and managed by Tauri. The worker thread
/// listens on `command_tx` for start/stop signals and writes results
/// into `latest_transcript`, notifying via `completion_notifier`.
pub struct VoiceState {
    /// Channel sender used to dispatch Start/Stop commands to the worker.
    pub command_tx: Sender<Command>,
    /// Atomic flag set to `true` while a transcription is in progress.
    pub is_transcribing: Arc<AtomicBool>,
    /// Holds the most recent completed transcript.
    pub latest_transcript: Arc<Mutex<String>>,
    /// Condition variable pair used to signal completion to the watcher thread.
    pub completion_notifier: Arc<(Mutex<bool>, Condvar)>,
}

/// Optional wrapper that allows voice initialisation to fail gracefully.
///
/// If the transcription model or audio device is unavailable at startup,
/// the app stores `ManagedVoiceState(None)` and continues without voice support.
pub struct ManagedVoiceState(pub Option<VoiceState>);
