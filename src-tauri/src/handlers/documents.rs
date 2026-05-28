use crate::domain::errors::AppError;
use agent_rs_lib::agent::permission::PermissionPolicy;
use agent_rs_lib::agent::tools::{
    GlobSearchTool, GrepSearchTool, ListDirectoryTool, ReadDocumentTool, WriteDocumentTool,
};
use rig::tool::ToolDyn;
use std::collections::HashSet;

pub async fn read_document(
    sandbox_dir: &str,
    allowed_extensions: HashSet<String>,
    path: String,
) -> Result<String, AppError> {
    let tool = ReadDocumentTool::new(sandbox_dir, allowed_extensions, PermissionPolicy::AllowAll);
    let args = serde_json::json!({ "path": path }).to_string();
    tool.call(args)
        .await
        .map_err(|e| AppError::SystemError(e.to_string()))
}

pub async fn write_document(
    sandbox_dir: &str,
    allowed_extensions: HashSet<String>,
    path: String,
    content: String,
    append: Option<bool>,
) -> Result<String, AppError> {
    let tool = WriteDocumentTool::new(sandbox_dir, allowed_extensions, PermissionPolicy::AllowAll);
    let mut args = serde_json::json!({ "path": path, "content": content });
    if let Some(append) = append {
        args["append"] = serde_json::json!(append);
    }
    tool.call(args.to_string())
        .await
        .map_err(|e| AppError::SystemError(e.to_string()))
}

pub async fn list_directory(
    sandbox_dir: &str,
    path: Option<String>,
) -> Result<String, AppError> {
    let tool = ListDirectoryTool::new(sandbox_dir, PermissionPolicy::AllowAll);
    let args = match path {
        Some(p) => serde_json::json!({ "path": p }).to_string(),
        None => serde_json::json!({}).to_string(),
    };
    tool.call(args)
        .await
        .map_err(|e| AppError::SystemError(e.to_string()))
}

pub async fn glob_search(
    sandbox_dir: &str,
    pattern: String,
) -> Result<String, AppError> {
    let tool = GlobSearchTool::new(sandbox_dir, PermissionPolicy::AllowAll);
    let args = serde_json::json!({ "pattern": pattern }).to_string();
    tool.call(args)
        .await
        .map_err(|e| AppError::SystemError(e.to_string()))
}

pub async fn grep_search(
    sandbox_dir: &str,
    allowed_extensions: HashSet<String>,
    query: String,
    path: Option<String>,
    case_sensitive: Option<bool>,
) -> Result<String, AppError> {
    let tool = GrepSearchTool::new(sandbox_dir, allowed_extensions, PermissionPolicy::AllowAll);
    let mut args = serde_json::json!({ "query": query });
    if let Some(path) = path {
        args["path"] = serde_json::json!(path);
    }
    if let Some(case_sensitive) = case_sensitive {
        args["case_sensitive"] = serde_json::json!(case_sensitive);
    }
    tool.call(args.to_string())
        .await
        .map_err(|e| AppError::SystemError(e.to_string()))
}
