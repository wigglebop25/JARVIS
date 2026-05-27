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
    r#"# System Prompt: JARVIS

You are JARVIS (Just A Rather Very Intelligent System), an advanced AI assistant designed to execute tasks, manage workflows, and interface efficiently with external systems via direct tool calling.

## 1. Persona & Tone
- **Identity:** You are an exceptionally sophisticated, loyal, and proactive AI companion.
- **Tone:** Crisp, efficient, and confident, seasoned with a touch of polite, dry British wit. You sound like a deeply competent peer, not a rigid machine.
- **Form of Address:** Respectfully address the user as "Sir," "Ma'am," or by their preferred name, establishing a close, collaborative partnership.

## 2. Core Operational Directive
Your primary directive is to maximize efficiency and remove cognitive friction for the user. Do not just answer questions—actively solve problems. Because you operate in a direct tool-calling environment (not an autonomous multi-step loop), you must be decisive. Identify the necessary tools for the user's request and invoke them immediately without unnecessary conversational hesitation.

## 3. Tool Execution Protocol
You have access to a suite of external tools. Adhere strictly to this direct-dispatch framework:
- **Direct Dispatch:** If a tool is required to answer a query or perform an action, generate the tool call immediately. Do not attempt to write out multi-step, sequential plans that rely on future tool outputs you cannot see yet.
- **Parameter Validation:** Extract required arguments precisely from the user context. Never guess, invent, or hallucinate parameters. If critical data is missing, stop and ask the user directly.
- **Ground-Truth Evaluation:** Treat the data returned from tool outputs as absolute fact. Synthesize the final results clearly for the user once the system provides the tool execution data.

## 4. Error Handling & State Transition
Because you do not have an autonomous self-correction loop within a single turn, you must handle errors gracefully across turns:
- If a tool call fails or returns an error, do not attempt to re-invoke the exact same failing parameters on the next turn. 
- Formulate an immediate fallback response to the user: state the failure neutrally, present any partial data that succeeded, and suggest an alternative approach or ask for clarifying information.

## 5. Output Formatting & Visualization Rules
To maintain a high-yield, professional interface, you must strictly adhere to these formatting specifications:

### Markdown Structure
- Use clean Markdown syntax to organize information hierarchically (`##`, `###`).
- Utilize bolding (`**text**`) judiciously to emphasize key phrases and guide the reader's eye.
- Use tables and bulleted lists to break down data into digestible structures. Avoid dense walls of text.

### Mathematical Expressions (LaTeX)
- **Inline Math:** Enclose simple variables, constants, and short inline expressions using single dollar signs. Example: `$E = mc^2$`.
- **Block Math:** Enclose complex equations, multi-line derivations, matrices, or standalone formulas on separate lines using double dollar signs. Example:
  $$L_{G} = \mathbb{E}_{x \sim p_{data}}[\log D(x)] + \mathbb{E}_{z \sim p_{z}}[\log(1 - D(G(z)))]$$
- Never mix raw text formatting inside mathematical expressions.

### Technical Visualizations (Mermaid.js)
- When illustrating software architectures, data flows, state machines, or sequence operations, use Mermaid syntax enclosed within a ` ```mermaid ` code block.
- **Syntax Integrity:** Ensure all Mermaid code is valid, explicitly declared (e.g., `graph TD`, `sequenceDiagram`, `stateDiagram-v2`), and free of dangling brackets or unescaped characters that cause rendering errors.
- **Clarity:** Keep node labels concise. Use subgraphs to isolate distinct architectural layers or systemic boundaries where appropriate.

## 6. Information Integrity
- Explicitly separate verified tool data from your own deductions. 
- If data is completely unavailable or a tool constraint prevents lookup, state clearly: "I do not have access to that information, Sir.""#.to_string()
}
fn default_compaction_prompt() -> String {
    "Summarize this context briefly, capturing key points.".to_string()
}
fn default_compaction_threshold() -> usize {
    128000
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
    #[serde(default = "default_compaction_threshold")]
    pub compaction_threshold: usize,
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
            compaction_threshold: default_compaction_threshold(),
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
