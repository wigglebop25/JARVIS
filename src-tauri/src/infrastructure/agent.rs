use crate::domain::config::{AppConfig, Providers};
use crate::domain::errors::AppError;
use agent_rs_lib::agent::memory::context::{AgentContextExt, ContextManagedAgent};
use agent_rs_lib::agent::tools::{ReadDocumentTool, WriteDocumentTool};
use agent_rs_lib::config::McpConfig;
use agent_rs_lib::mcp::client::McpClient;
use once_cell::sync::Lazy;
use rig::agent::Agent;
use rig::prelude::*;
use rig::providers::{anthropic, gemini, openai};
use rig::tool::ToolDyn;
use std::path::Path;
use tokio::sync::RwLock;

pub enum AppAgent {
    OpenAi(
        ContextManagedAgent<
            openai::responses_api::ResponsesCompletionModel,
            Agent<openai::responses_api::ResponsesCompletionModel>,
        >,
    ),
    Gemini(
        ContextManagedAgent<
            gemini::CompletionModel,
            Agent<gemini::CompletionModel>,
        >,
    ),
    Anthropic(
        ContextManagedAgent<
            anthropic::completion::CompletionModel,
            Agent<anthropic::completion::CompletionModel>,
        >,
    ),
}

impl AppAgent {
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

#[derive(PartialEq, Eq, Clone, Debug)]
struct ConfigSignature {
    provider: Providers,
    api_key: String,
    chat_model: String,
    chat_base_url: String,
    system_prompt: String,
    compaction_prompt: String,
    mcp_config_path: String,
}

impl ConfigSignature {
    fn from_config(config: &AppConfig) -> Self {
        Self {
            provider: config.provider,
            api_key: config.api_key.clone(),
            chat_model: config.chat_model.clone(),
            chat_base_url: config.chat_base_url.clone(),
            system_prompt: config.system_prompt.clone(),
            compaction_prompt: config.compaction_prompt.clone(),
            mcp_config_path: config.mcp_config_path.clone(),
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
            mcp_config_path: String::new(),
        }
    }
}

pub struct AgentManager {
    agent: RwLock<Option<AppAgent>>,
    signature: RwLock<ConfigSignature>,
}

pub static AGENT_MANAGER: Lazy<AgentManager> = Lazy::new(|| AgentManager {
    agent: RwLock::new(None),
    signature: RwLock::new(ConfigSignature::empty()),
});

impl AgentManager {
    pub async fn send_prompt(
        &self,
        prompt: &str,
        history: &mut Vec<rig::message::Message>,
        config: &AppConfig,
    ) -> Result<String, AppError> {
        let signature = ConfigSignature::from_config(config);

        let needs_rebuild = {
            let sig_guard = self.signature.read().await;
            let agent_guard = self.agent.read().await;
            *sig_guard != signature || agent_guard.is_none()
        };

        if needs_rebuild {
            // Build the agent first asynchronously (guards not held across build)
            let new_agent = build_agent(config).await?;

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

async fn build_agent(config: &AppConfig) -> Result<AppAgent, AppError> {
    // Setup tools
    let mut tools: Vec<Box<dyn ToolDyn>> =
        vec![Box::new(ReadDocumentTool), Box::new(WriteDocumentTool)];

    if Path::new(&config.mcp_config_path).exists() {
        if let Ok(mcp_config) = McpConfig::from_path(&config.mcp_config_path) {
            if let Ok(mcp_client) = McpClient::new(mcp_config).tools().await {
                tools.extend(mcp_client);
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
                .map_err(|e| AppError::SystemError(e.to_string()))?;

            let compaction_model = client
                .agent(&config.chat_model)
                .preamble(&config.compaction_prompt)
                .build();

            let agent = client
                .agent(&config.chat_model)
                .tools(tools)
                .preamble(&config.system_prompt)
                .build()
                .with_compaction(128_000, compaction_model);

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
                .build()
                .with_compaction(128_000, compaction_model);

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
                .build()
                .with_compaction(128_000, compaction_model);

            Ok(AppAgent::Anthropic(agent))
        }
    }
}
