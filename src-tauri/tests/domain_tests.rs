use jarvis_lib::domain::config::AppConfig;
use jarvis_lib::infrastructure::db::DatabaseManager;
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

    // cleanup
    let _ = fs::remove_file(config_path);
}

#[test]
fn test_database_manager() {
    let temp_dir = std::env::temp_dir();
    let db_path = temp_dir.join("jarvis_test.db");

    // Clean up before test just in case
    let _ = fs::remove_file(&db_path);

    let db = DatabaseManager::new(&db_path).unwrap();
    let repo = jarvis_lib::infrastructure::repository::SessionRepository::new(&db);
    let session_id = repo
        .create_session(Some("Test Session".to_string()))
        .unwrap();

    // The initial history should be empty
    let initial_history = repo.get_session_history(&session_id).unwrap();
    assert!(initial_history.is_empty());

    // We can't easily construct rig::message::Message here if its fields are private
    // or without importing more from rig, but we can verify it doesn't crash on an empty load.

    // Get all sessions
    let sessions = repo.get_all_sessions().unwrap();
    assert_eq!(sessions.len(), 1);
    assert_eq!(sessions[0].title, Some("Test Session".to_string()));

    // Verify row exists in session_history
    {
        let conn = db.conn.lock().unwrap();
        let count: i32 = conn
            .query_row("SELECT COUNT(*) FROM session_history", [], |r| r.get(0))
            .unwrap();
        assert_eq!(count, 1);
    }

    // Rename session
    repo.rename_session(&session_id, "Renamed Session").unwrap();
    let sessions = repo.get_all_sessions().unwrap();
    assert_eq!(sessions.len(), 1);
    assert_eq!(sessions[0].title, Some("Renamed Session".to_string()));

    // Delete session
    repo.delete_session(&session_id).unwrap();

    // Verify session is gone from sessions
    let sessions = repo.get_all_sessions().unwrap();
    assert!(sessions.is_empty());

    // Verify history row is cascade deleted from session_history
    {
        let conn = db.conn.lock().unwrap();
        let count: i32 = conn
            .query_row("SELECT COUNT(*) FROM session_history", [], |r| r.get(0))
            .unwrap();
        assert_eq!(count, 0);
    }

    // Clean up
    let _ = fs::remove_file(db_path);
}

#[test]
fn test_config_missing_fields_defaults() {
    let temp_dir = std::env::temp_dir();
    let config_path = temp_dir.join("jarvis_test_missing_fields.toml");
    let _ = fs::remove_file(&config_path);

    // Write a TOML string with only the old/subset fields
    let partial_toml = r#"
        provider = "openai"
        vad_threshold = 0.6
        silence_threshold_rms = 0.02
        silence_duration_ms = 2000
        api_key = "test_key"
        chat_model = "gpt-4"
        chat_base_url = "https://api.openai.com/v1"
        mcp_config_path = "mcp_test.json"
    "#;

    fs::write(&config_path, partial_toml).unwrap();

    // Load configuration – it should deserialize successfully and populate new fields with default values
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

    // Clean up
    let _ = fs::remove_file(config_path);
}

#[test]
fn test_set_provider() {
    let temp_dir = std::env::temp_dir();
    let config_path = temp_dir.join("jarvis_test_set_provider.toml");
    let _ = fs::remove_file(&config_path);

    let config = AppConfig::default();
    let mutex = tokio::sync::Mutex::new(config);

    // Call set_provider (now async, uses tokio::sync::Mutex)
    tokio::runtime::Runtime::new()
        .unwrap()
        .block_on(jarvis_lib::handlers::chat::set_provider(
            "gemini".to_string(),
            &mutex,
            Some(&config_path),
        ))
        .unwrap();

    // Verify state was updated
    let updated = mutex.blocking_lock();
    assert_eq!(updated.provider.to_string(), "gemini");

    // Verify it was persisted to disk
    let loaded = AppConfig::load_from(&config_path).unwrap();
    assert_eq!(loaded.provider.to_string(), "gemini");

    // Clean up
    let _ = fs::remove_file(config_path);
}

#[test]
fn test_calculate_tokens() {
    let prompt = "Explain quantum computing in one sentence.";
    let response = "Quantum computing uses superposition and entanglement to perform complex computations.";
    
    let (prompt_tokens, response_tokens) = jarvis_lib::commands::chat::calculate_tokens(prompt, Some(response));
    
    // Check that we got positive token counts
    assert!(prompt_tokens > 0);
    assert!(response_tokens > 0);
    
    // A single word is typically 1 or 2 tokens, so counts should be reasonable
    assert!(prompt_tokens < 20);
    assert!(response_tokens < 30);
    
    // Check with None response
    let (prompt_tokens_only, response_none_tokens) = jarvis_lib::commands::chat::calculate_tokens(prompt, None);
    assert_eq!(prompt_tokens_only, prompt_tokens);
    assert_eq!(response_none_tokens, 0);
}
