use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

fn default_transcription_model_path() -> String {
    "parakeet-tdt-0.6b-v3-int8".to_string()
}
fn default_database_name() -> String {
    "jarvis.db".to_string()
}
fn default_system_prompt() -> String {
    "You are JARVIS, a helpful AI assistant.".to_string()
}
fn default_compaction_prompt() -> String {
    "Summarize this context briefly, capturing key points.".to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub provider: Providers,
    pub silence_threshold_rms: f32,
    pub silence_duration_ms: u64,
    pub api_key: String,
    pub chat_model: String,
    pub chat_base_url: String,
    pub mcp_config_path: String,
    #[serde(default = "default_transcription_model_path")]
    pub transcription_model_path: String,
    #[serde(default = "default_database_name")]
    pub database_name: String,
    #[serde(default = "default_system_prompt")]
    pub system_prompt: String,
    #[serde(default = "default_compaction_prompt")]
    pub compaction_prompt: String,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Providers {
    Anthropic,
    OpenAI,
    Gemini,
}

impl Providers {
    pub fn as_str(&self) -> &'static str {
        match self {
            Providers::OpenAI => "openai",
            Providers::Gemini => "gemini",
            Providers::Anthropic => "anthropic",
        }
    }

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
        }
    }
}

impl AppConfig {
    pub fn load_from(path: &Path) -> Result<Self, anyhow::Error> {
        if !path.exists() {
            let default_config = Self::default();
            default_config.save_to(path)?;
            return Ok(default_config);
        }
        let content = fs::read_to_string(path)?;
        let config: Self = toml::from_str(&content)?;
        // Auto-save back to ensure missing fields (from older formats) are populated and saved
        let _ = config.save_to(path);
        Ok(config)
    }

    pub fn save_to(&self, path: &Path) -> Result<(), anyhow::Error> {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        let content = toml::to_string(self)?;
        fs::write(path, content)?;
        Ok(())
    }
}
