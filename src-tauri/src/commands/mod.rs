//! Tauri command handlers for JARVIS.
//!
//! This module groups all command handlers exposed to the frontend, categorized by
//! functional area:
//! - [`chat`]: Session and chat agent interactions.
//! - [`config`]: Application configuration management.
//! - [`documents`]: Sandboxed file read/write and search commands.
//! - [`system`]: Local system information querying.
//! - [`voice`]: Voice transcription and audio-listener management.

pub mod chat;
pub mod config;
pub mod documents;
pub mod system;
pub mod voice;
