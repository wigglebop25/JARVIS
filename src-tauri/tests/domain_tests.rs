use jarvis_lib::domain::config::AppConfig;
use jarvis_lib::infrastructure::database::{create_pool, run_migrations, SessionRepository};
use std::fs;

#[test]
fn test_config_serialization() {
    let config = AppConfig::default();
    let toml_str = toml::to_string(&config).unwrap();
    let deserialized: AppConfig = toml::from_str(&toml_str).unwrap();
    assert_eq!(config.chat_model, deserialized.chat_model);
}

#[test]
fn test_config_load_save() {
    let temp_dir = std::env::temp_dir();
    let config_path = temp_dir.join("jarvis_test_config.toml");

    let default_config = AppConfig::default();
    default_config.save_to(&config_path).unwrap();

    let loaded = AppConfig::load_from(&config_path).unwrap();
    assert_eq!(
        default_config.silence_threshold_rms,
        loaded.silence_threshold_rms
    );

    let _ = fs::remove_file(config_path);
}

#[tokio::test]
async fn test_database_manager() {
    let temp_dir = std::env::temp_dir();
    let id = uuid::Uuid::new_v4();
    let db_path = temp_dir.join(format!("jarvis_test_db_manager_{}.db", id));

    let _ = fs::remove_file(&db_path);

    run_migrations(db_path.to_str().unwrap());
    let pool = create_pool(db_path.to_str().unwrap());
    let repo = SessionRepository::with_pool(pool);

    let session_id = repo
        .create_session(Some("Test Session".to_string()))
        .await
        .unwrap();

    let initial_history = repo.get_session_history(&session_id).await.unwrap();
    assert!(initial_history.is_empty());

    let sessions = repo.get_all_sessions().await.unwrap();
    assert_eq!(sessions.len(), 1);
    assert_eq!(sessions[0].title, Some("Test Session".to_string()));

    // Verify row exists in session_history via sync connection
    {
        let conn = rusqlite::Connection::open(db_path.to_str().unwrap()).unwrap();
        let count: i32 = conn
            .query_row("SELECT COUNT(*) FROM session_history", [], |r| r.get(0))
            .unwrap();
        assert_eq!(count, 1);
    }

    // Rename session
    repo.rename_session(&session_id, "Renamed Session")
        .await
        .unwrap();
    let sessions = repo.get_all_sessions().await.unwrap();
    assert_eq!(sessions.len(), 1);
    assert_eq!(sessions[0].title, Some("Renamed Session".to_string()));

    // Delete session
    repo.delete_session(&session_id).await.unwrap();

    let sessions = repo.get_all_sessions().await.unwrap();
    assert!(sessions.is_empty());

    // Verify history row is cascade deleted
    {
        let conn = rusqlite::Connection::open(db_path.to_str().unwrap()).unwrap();
        let count: i32 = conn
            .query_row("SELECT COUNT(*) FROM session_history", [], |r| r.get(0))
            .unwrap();
        assert_eq!(count, 0);
    }

    let _ = fs::remove_file(&db_path);
    let _ = fs::remove_file(format!("{}-wal", db_path.display()));
    let _ = fs::remove_file(format!("{}-shm", db_path.display()));
}

#[test]
fn test_config_missing_fields_defaults() {
    let temp_dir = std::env::temp_dir();
    let config_path = temp_dir.join("jarvis_test_missing_fields.toml");
    let _ = fs::remove_file(&config_path);

    let partial_toml = r#"
        provider = "openai"
        silence_threshold_rms = 0.02
        silence_duration_ms = 2000
        api_key = "test_key"
        chat_model = "gpt-4"
        chat_base_url = "https://api.openai.com/v1"
        mcp_config_path = "mcp_test.json"
    "#;

    fs::write(&config_path, partial_toml).unwrap();

    let loaded = AppConfig::load_from(&config_path).unwrap();

    assert_eq!(loaded.provider.to_string(), "openai");
    assert_eq!(loaded.transcription_model_path, "parakeet-tdt-0.6b-v3-int8");
    assert_eq!(loaded.database_name, "jarvis.db");
    assert_eq!(loaded.system_prompt, AppConfig::default().system_prompt);
    assert_eq!(
        loaded.compaction_prompt,
        "Summarize this context briefly, capturing key points."
    );
    assert_eq!(loaded.compaction_threshold, 128000);

    let _ = fs::remove_file(config_path);
}

#[test]
fn test_set_provider() {
    let temp_dir = std::env::temp_dir();
    let config_path = temp_dir.join("jarvis_test_set_provider.toml");
    let _ = fs::remove_file(&config_path);

    let config = AppConfig::default();
    let mutex = tokio::sync::Mutex::new(config);

    tokio::runtime::Runtime::new()
        .unwrap()
        .block_on(jarvis_lib::handlers::chat::set_provider(
            "gemini".to_string(),
            &mutex,
            Some(&config_path),
        ))
        .unwrap();

    let updated = mutex.blocking_lock();
    assert_eq!(updated.provider.to_string(), "gemini");

    let loaded = AppConfig::load_from(&config_path).unwrap();
    assert_eq!(loaded.provider.to_string(), "gemini");

    let _ = fs::remove_file(config_path);
}

#[test]
fn test_calculate_tokens() {
    let prompt = "Explain quantum computing in one sentence.";
    let response =
        "Quantum computing uses superposition and entanglement to perform complex computations.";

    let (prompt_tokens, response_tokens) =
        jarvis_lib::commands::chat::calculate_tokens(prompt, Some(response));

    assert!(prompt_tokens > 0);
    assert!(response_tokens > 0);
    assert!(prompt_tokens < 20);
    assert!(response_tokens < 30);

    let (prompt_tokens_only, response_none_tokens) =
        jarvis_lib::commands::chat::calculate_tokens(prompt, None);
    assert_eq!(prompt_tokens_only, prompt_tokens);
    assert_eq!(response_none_tokens, 0);
}
