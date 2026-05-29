use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::fs;
use std::path::Path;

fn default_transcription_model_path() -> String {
    "parakeet-tdt-0.6b-v3-int8".to_string()
}
fn default_database_name() -> String {
    "jarvis.db".to_string()
}
fn default_system_prompt() -> String {
    include_str!("defaults/system_prompt.md").to_string()
}
fn default_compaction_prompt() -> String {
    "Summarize this context briefly, capturing key points.".to_string()
}
fn default_compaction_threshold() -> usize {
    128000
}
fn default_sandbox_dir() -> String {
    ".".to_string()
}

fn default_read_extensions() -> HashSet<String> {
    ["txt", "md", "pdf", "json", "toml", "rs", "js", "ts", "tsx", "html", "css"]
        .iter()
        .map(|s| s.to_string())
        .collect()
}

fn default_write_extensions() -> HashSet<String> {
    ["txt", "md", "json", "toml", "rs", "js", "ts", "tsx", "html", "css"]
        .iter()
        .map(|s| s.to_string())
        .collect()
}

/// Top-level application configuration, deserialized from `config.toml`.
///
/// Every field has a sensible default so the app can start with a minimal config file.
/// Missing fields are backfilled on load (see [`AppConfig::load_from`]).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    /// Active LLM provider (openai / gemini / anthropic).
    pub provider: Providers,
    /// RMS amplitude threshold below which audio is considered silence.
    pub silence_threshold_rms: f32,
    /// Milliseconds of continuous silence that triggers transcription finalisation.
    pub silence_duration_ms: u64,
    /// API key for the active provider (empty for local models).
    pub api_key: String,
    /// Model identifier passed to the provider's API (e.g. `"google/gemma-4-e4b"`).
    pub chat_model: String,
    /// Base URL for the provider's API (e.g. `http://127.0.0.1:1234/v1` for local).
    pub chat_base_url: String,
    /// Path to the MCP server configuration JSON file.
    pub mcp_config_path: String,
    #[serde(default = "default_transcription_model_path")]
    pub transcription_model_path: String,
    /// Filename for the SQLite database (stored in the app data directory).
    #[serde(default = "default_database_name")]
    pub database_name: String,
    /// System prompt injected at the start of every LLM conversation.
    #[serde(default = "default_system_prompt")]
    pub system_prompt: String,
    /// Prompt used by the compaction agent to summarise long histories.
    #[serde(default = "default_compaction_prompt")]
    pub compaction_prompt: String,
    /// Token count threshold that triggers history compaction.
    #[serde(default = "default_compaction_threshold")]
    pub compaction_threshold: usize,
    /// Root directory for sandboxed file read/write operations.
    #[serde(default = "default_sandbox_dir")]
    pub sandbox_dir: String,
    /// File extensions the agent is allowed to read.
    #[serde(default = "default_read_extensions")]
    pub read_extensions: HashSet<String>,
    /// File extensions the agent is allowed to write.
    #[serde(default = "default_write_extensions")]
    pub write_extensions: HashSet<String>,
}

/// Supported LLM providers.
///
/// Serialised to/from lowercase strings (e.g. `"openai"`, `"gemini"`, `"anthropic"`).
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Providers {
    /// Anthropic (Claude models via `api.anthropic.com`).
    Anthropic,
    /// OpenAI-compatible API (works with local servers like llama.cpp).
    OpenAI,
    /// Google Gemini API.
    Gemini,
}

impl Providers {
    /// Returns the lowercase string representation of this provider.
    ///
    /// Useful for serialising the provider name for the frontend or for
    /// dynamic dispatch in the agent builder.
    ///
    /// # Returns
    ///
    /// A static string: `"openai"`, `"gemini"`, or `"anthropic"`.
    pub fn as_str(&self) -> &'static str {
        match self {
            Providers::OpenAI => "openai",
            Providers::Gemini => "gemini",
            Providers::Anthropic => "anthropic",
        }
    }

    /// Returns all supported provider variants in a fixed order.
    ///
    /// # Returns
    ///
    /// A vector containing `OpenAI`, `Gemini`, and `Anthropic`.
    pub fn all() -> Vec<Self> {
        vec![Providers::OpenAI, Providers::Gemini, Providers::Anthropic]
    }
}

impl std::fmt::Display for Providers {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.as_str())
    }
}

impl std::str::FromStr for Providers {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "openai" => Ok(Providers::OpenAI),
            "gemini" => Ok(Providers::Gemini),
            "anthropic" => Ok(Providers::Anthropic),
            _ => Err(format!("Unknown provider: {}", s)),
        }
    }
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            provider: Providers::OpenAI,
            silence_threshold_rms: 0.01,
            silence_duration_ms: 1000,
            api_key: "".to_string(),
            chat_model: "google/gemma-4-e4b".to_string(),
            chat_base_url: "http://127.0.0.1:1234/v1".to_string(),
            mcp_config_path: "mcp.json".to_string(),
            transcription_model_path: default_transcription_model_path(),
            database_name: default_database_name(),
            system_prompt: default_system_prompt(),
            compaction_prompt: default_compaction_prompt(),
            compaction_threshold: default_compaction_threshold(),
            sandbox_dir: default_sandbox_dir(),
            read_extensions: default_read_extensions(),
            write_extensions: default_write_extensions(),
        }
    }
}

impl AppConfig {
    /// Loads configuration from a TOML file at `path`.
    ///
    /// If the file does not exist, a default config is written to disk and returned.
    /// If the file exists but is missing newer fields, those fields are populated
    /// with their default values and the file is only re-saved when the serialized
    /// content actually changes (avoids unnecessary writes).
    ///
    /// # Errors
    ///
    /// Returns `anyhow::Error` if the file exists but cannot be read or parsed.
    /// A failed re-save for backfilled fields logs a warning but does not fail.
    pub fn load_from(path: &Path) -> Result<Self, anyhow::Error> {
        if !path.exists() {
            let default_config = Self::default();
            default_config.save_to(path)?;
            return Ok(default_config);
        }
        let content = fs::read_to_string(path)?;
        let config: Self = toml::from_str(&content)?;
        let serialized = toml::to_string(&config)?;
        if serialized != content {
            if let Err(e) = config.save_to(path) {
                eprintln!("Warning: failed to save updated config: {e}");
            }
        }
        Ok(config)
    }

    /// Persists this configuration to a TOML file at `path`, creating parent directories if needed.
    ///
    /// # Errors
    ///
    /// Returns `anyhow::Error` if the directory cannot be created or the file cannot be written.
    pub fn save_to(&self, path: &Path) -> Result<(), anyhow::Error> {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        let content = toml::to_string(self)?;
        fs::write(path, content)?;
        Ok(())
    }
}
