//! Tauri command handlers for JARVIS.
//!
//! This module groups all command handlers exposed to the frontend, categorized by
//! functional area:
//! - [`chat`]: Session and chat agent interactions.
//! - [`config`]: Application configuration management.
//! - [`skills`]: Stub handlers for future integration with the `jarvis-skills` MCP server.
//! - [`system`]: Local system information querying.
//! - [`voice`]: Voice transcription and audio-listener management.

pub mod chat;
pub mod config;
pub mod documents;
pub mod system;
pub mod voice;
