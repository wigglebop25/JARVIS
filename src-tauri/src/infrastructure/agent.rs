use crate::domain::config::{AppConfig, Providers};
use crate::domain::errors::AppError;
use agent_rs_lib::agent::memory::context::{AgentContextExt, ContextManagedAgent};
use agent_rs_lib::agent::permission::PermissionPolicy;
use agent_rs_lib::agent::tools::{
    GlobSearchTool, GrepSearchTool, ListDirectoryTool, ReadDocumentTool, WriteDocumentTool,
};
use agent_rs_lib::config::McpConfig;
use agent_rs_lib::mcp::client::McpClient;
use std::sync::LazyLock;
use rig::agent::Agent;
use rig::prelude::*;
use rig::providers::{anthropic, gemini, openai};
use rig::tool::ToolDyn;
use std::path::Path;
use tokio::sync::RwLock;

/// A type-erased LLM agent that wraps any supported provider.
///
/// Each variant holds a [`ContextManagedAgent`] with the corresponding provider's
/// completion model and agent types. The outer enum dispatches `chat()` calls
/// to the inner agent without requiring the caller to know which provider is active.
pub enum AppAgent {
    /// OpenAI-compatible agent (works with local servers via custom base URL).
    OpenAi(
        ContextManagedAgent<
            openai::completion::CompletionModel,
            Agent<openai::completion::CompletionModel>,
        >,
    ),
    /// Google Gemini agent.
    Gemini(ContextManagedAgent<gemini::CompletionModel, Agent<gemini::CompletionModel>>),
    /// Anthropic (Claude) agent.
    Anthropic(
        ContextManagedAgent<
            anthropic::completion::CompletionModel,
            Agent<anthropic::completion::CompletionModel>,
        >,
    ),
}

impl AppAgent {
    /// Sends a prompt to the underlying agent, forwarding the conversation history.
    ///
    /// Dispatches to the appropriate provider-specific agent variant.
    ///
    /// # Arguments
    ///
    /// * `prompt` - The input text to send to the agent.
    /// * `history` - The mutable conversation history; the prompt and response
    ///   are appended by the agent internally.
    ///
    /// # Returns
    ///
    /// Returns the agent's text response on success, or an [`AppError`] on failure.
    ///
    /// # Errors
    ///
    /// Returns [`AppError::SystemError`] if the agent's chat method fails.
    pub async fn chat(
        &self,
        prompt: &str,
        history: &mut Vec<rig::message::Message>,
    ) -> Result<String, AppError> {
        match self {
            AppAgent::OpenAi(agent) => agent
                .chat(prompt, history)
                .await
                .map_err(|e| AppError::SystemError(e.to_string())),
            AppAgent::Gemini(agent) => agent
                .chat(prompt, history)
                .await
                .map_err(|e| AppError::SystemError(e.to_string())),
            AppAgent::Anthropic(agent) => agent
                .chat(prompt, history)
                .await
                .map_err(|e| AppError::SystemError(e.to_string())),
        }
    }
}

/// Snapshot of config fields that determine whether the cached agent must be rebuilt.
///
/// When any of these fields changes between `send_prompt` calls, `AgentManager`
/// tears down and recreates the agent with the new parameters.
#[derive(PartialEq, Eq, Clone, Debug)]
struct ConfigSignature {
    provider: Providers,
    api_key: String,
    chat_model: String,
    chat_base_url: String,
    system_prompt: String,
    compaction_prompt: String,
    compaction_threshold: usize,
    mcp_config_path: String,
    sandbox_dir: String,
    read_extensions: String,
    write_extensions: String,
}

impl ConfigSignature {
    fn from_config(config: &AppConfig) -> Self {
        let mut read_exts: Vec<&str> = config.read_extensions.iter().map(|s| s.as_str()).collect();
        read_exts.sort();
        let mut write_exts: Vec<&str> = config.write_extensions.iter().map(|s| s.as_str()).collect();
        write_exts.sort();

        Self {
            provider: config.provider,
            api_key: config.api_key.clone(),
            chat_model: config.chat_model.clone(),
            chat_base_url: config.chat_base_url.clone(),
            system_prompt: config.system_prompt.clone(),
            compaction_prompt: config.compaction_prompt.clone(),
            compaction_threshold: config.compaction_threshold,
            mcp_config_path: config.mcp_config_path.clone(),
            sandbox_dir: config.sandbox_dir.clone(),
            read_extensions: read_exts.join(","),
            write_extensions: write_exts.join(","),
        }
    }

    fn empty() -> Self {
        Self {
            provider: Providers::OpenAI,
            api_key: String::new(),
            chat_model: String::new(),
            chat_base_url: String::new(),
            system_prompt: String::new(),
            compaction_prompt: String::new(),
            compaction_threshold: 0,
            mcp_config_path: String::new(),
            sandbox_dir: String::new(),
            read_extensions: String::new(),
            write_extensions: String::new(),
        }
    }
}

/// Thread-safe singleton that lazily builds and caches the LLM agent.
///
/// The agent is rebuilt when the config fields (provider, model, prompt, etc.) change.
/// Rebuilding uses a double-checked lock so concurrent callers never build twice.
pub struct AgentManager {
    agent: RwLock<Option<AppAgent>>,
    signature: RwLock<ConfigSignature>,
}

/// Global lazy-initialised agent manager shared across the application.
pub static AGENT_MANAGER: LazyLock<AgentManager> = LazyLock::new(|| AgentManager {
    agent: RwLock::new(None),
    signature: RwLock::new(ConfigSignature::empty()),
});

impl AgentManager {
    /// Sends a prompt to the cached agent, rebuilding it first if config has changed.
    ///
    /// Computes a config-signature from the provided `config` and compares it with
    /// the cached signature. If they differ or no agent exists yet, the agent is
    /// rebuilt asynchronously (including MCP tool connectors). A double-checked lock
    /// prevents concurrent callers from building the agent twice.
    ///
    /// # Arguments
    ///
    /// * `prompt` - The user's input text to send to the agent.
    /// * `history` - Mutable conversation history (prompt + response appended by the agent).
    /// * `config` - The current application configuration used to compute the rebuild signature.
/// * `app` - Optional Tauri `AppHandle`; when provided, MCP connection errors during
///   agent rebuild emit a `"mcp-connection-error"` Tauri event to the frontend.
    ///
    /// # Returns
    ///
    /// Returns the agent's text reply on success, or an [`AppError`] on failure.
    ///
    /// # Errors
    ///
    /// Returns [`AppError::SystemError`] if agent initialisation fails or the inner agent
    /// returns an error during chat.
    pub async fn send_prompt(
        &self,
        prompt: &str,
        history: &mut Vec<rig::message::Message>,
        config: &AppConfig,
        app: Option<&tauri::AppHandle>,
    ) -> Result<String, AppError> {
        let signature = ConfigSignature::from_config(config);

        let needs_rebuild = {
            let sig_guard = self.signature.read().await;
            let agent_guard = self.agent.read().await;
            *sig_guard != signature || agent_guard.is_none()
        };

        if needs_rebuild {
            // Build the agent first asynchronously (guards not held across build)
            let new_agent = build_agent(config, app).await?;

            let mut sig_guard = self.signature.write().await;
            let mut agent_guard = self.agent.write().await;

            if *sig_guard != signature || agent_guard.is_none() {
                *agent_guard = Some(new_agent);
                *sig_guard = signature;
            }
        }

        let agent_guard = self.agent.read().await;
        let agent = agent_guard
            .as_ref()
            .ok_or_else(|| AppError::SystemError("Agent failed to initialize".to_string()))?;

        agent.chat(prompt, history).await
    }
}

async fn build_agent(
    config: &AppConfig,
    app: Option<&tauri::AppHandle>,
) -> Result<AppAgent, AppError> {
    use tauri::Emitter;

    // Setup document tools with sandbox and extension config
    let policy = PermissionPolicy::AllowAll;
    let sandbox_root = &config.sandbox_dir;
    let read_exts = config.read_extensions.clone();
    let write_exts = config.write_extensions.clone();

    let mut tools: Vec<Box<dyn ToolDyn>> = vec![
        Box::new(ReadDocumentTool::new(sandbox_root, read_exts.clone(), policy.clone())),
        Box::new(WriteDocumentTool::new(sandbox_root, write_exts, policy.clone())),
        Box::new(ListDirectoryTool::new(sandbox_root, policy.clone())),
        Box::new(GlobSearchTool::new(sandbox_root, policy.clone())),
        Box::new(GrepSearchTool::new(sandbox_root, config.read_extensions.clone(), policy)),
    ];

    if Path::new(&config.mcp_config_path).exists() {
        if let Ok(mcp_config) = McpConfig::from_path(&config.mcp_config_path) {
            for (name, server_def) in mcp_config.mcp_servers {
                let mut single_servers = std::collections::HashMap::new();
                single_servers.insert(name.clone(), server_def);
                let single_config = McpConfig {
                    mcp_servers: single_servers,
                };
                match McpClient::new(single_config).tools().await {
                    Ok(mcp_tools) => {
                        tools.extend(mcp_tools);
                    }
                    Err(e) => {
                        let err_msg = format!("Failed to connect to MCP server '{}': {:?}", name, e);
                        eprintln!("{}", err_msg);
                        if let Some(handle) = app {
                            let _ = handle.emit("mcp-connection-error", serde_json::json!({
                                "server": name,
                                "error": e.to_string(),
                            }));
                        }
                    }
                }
            }
        }
    }

    match config.provider {
        Providers::OpenAI => {
            let api_key = if config.api_key.is_empty() {
                "sk-local"
            } else {
                &config.api_key
            };
            let mut builder = openai::Client::builder().api_key(api_key);
            if !config.chat_base_url.is_empty() {
                builder = builder.base_url(&config.chat_base_url);
            }
            let client = builder
                .build()
                .map_err(|e| AppError::SystemError(e.to_string()))?
                .completions_api();

            let model = client.completion_model(&config.chat_model);

            let compaction_model = rig::agent::AgentBuilder::new(model.clone())
                .preamble(&config.compaction_prompt)
                .build();

            let agent = rig::agent::AgentBuilder::new(model)
                .tools(tools)
                .preamble(&config.system_prompt)
                .default_max_turns(20)
                .build()
                .with_compaction(config.compaction_threshold, compaction_model);

            Ok(AppAgent::OpenAi(agent))
        }
        Providers::Gemini => {
            let mut builder = gemini::Client::builder().api_key(&config.api_key);
            if !config.chat_base_url.is_empty() {
                builder = builder.base_url(&config.chat_base_url);
            }
            let client = builder
                .build()
                .map_err(|e| AppError::SystemError(e.to_string()))?;

            let compaction_model = client
                .agent(&config.chat_model)
                .preamble(&config.compaction_prompt)
                .build();

            let agent = client
                .agent(&config.chat_model)
                .tools(tools)
                .preamble(&config.system_prompt)
                .default_max_turns(20)
                .build()
                .with_compaction(config.compaction_threshold, compaction_model);

            Ok(AppAgent::Gemini(agent))
        }
        Providers::Anthropic => {
            let mut builder = anthropic::Client::builder().api_key(&config.api_key);
            if !config.chat_base_url.is_empty() {
                builder = builder.base_url(&config.chat_base_url);
            }
            let client = builder
                .build()
                .map_err(|e| AppError::SystemError(e.to_string()))?;

            let compaction_model = client
                .agent(&config.chat_model)
                .preamble(&config.compaction_prompt)
                .build();

            let agent = client
                .agent(&config.chat_model)
                .tools(tools)
                .preamble(&config.system_prompt)
                .default_max_turns(20)
                .build()
                .with_compaction(config.compaction_threshold, compaction_model);

            Ok(AppAgent::Anthropic(agent))
        }
    }
}
