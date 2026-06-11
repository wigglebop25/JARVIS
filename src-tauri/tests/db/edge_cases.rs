use crate::db::{cleanup, setup_test_repo, unique_db_path};
use jarvis_lib::infrastructure::database::{create_pool, run_migrations, SessionRepository};
use rig_core::message::Message;

#[tokio::test]
async fn database_is_reopenable_and_persists_data() {
    let path = unique_db_path("reopen");

    {
        run_migrations(path.to_str().unwrap());
        let pool = create_pool(path.to_str().unwrap());
        let repo = SessionRepository::with_pool(pool);
        repo.create_session(Some("Persisted Session".to_string()))
            .await
            .unwrap();
    }

    {
        run_migrations(path.to_str().unwrap());
        let pool = create_pool(path.to_str().unwrap());
        let repo = SessionRepository::with_pool(pool);
        let sessions = repo.get_all_sessions().await.unwrap();
        assert_eq!(sessions.len(), 1);
        assert_eq!(sessions[0].title, Some("Persisted Session".to_string()));
    }

    cleanup(&path);
}

#[tokio::test]
async fn create_and_retrieve_roundtrip_many_sessions() {
    let (repo, path) = setup_test_repo("roundtrip_many").await;

    let mut ids = Vec::new();
    for i in 0..50 {
        let id = repo
            .create_session(Some(format!("Session {}", i)))
            .await
            .unwrap();
        ids.push(id);
    }

    let sessions = repo.get_all_sessions().await.unwrap();
    assert_eq!(sessions.len(), 50);

    for id in &ids {
        let history = repo.get_session_history(id).await.unwrap();
        assert!(history.is_empty());
    }

    cleanup(&path);
}

#[tokio::test]
async fn timestamps_are_reasonable() {
    let (repo, path) = setup_test_repo("timestamps").await;

    let before = chrono::Utc::now().timestamp();
    repo.create_session(Some("Timestamps".to_string()))
        .await
        .unwrap();
    let after = chrono::Utc::now().timestamp();

    let sessions = repo.get_all_sessions().await.unwrap();
    let session = &sessions[0];

    assert!(session.created_at >= before);
    assert!(session.created_at <= after);
    assert!(session.updated_at >= before);
    assert!(session.updated_at <= after);

    cleanup(&path);
}

#[tokio::test]
async fn history_json_is_valid_json_array() {
    let (repo, path) = setup_test_repo("json_validity").await;

    let id = repo.create_session(Some("JSON".to_string())).await.unwrap();

    let conn = rusqlite::Connection::open(path.to_str().unwrap()).unwrap();

    let json: String = conn
        .query_row(
            "SELECT history_json FROM session_history WHERE session_id = ?1",
            [id.clone()],
            |r| r.get(0),
        )
        .unwrap();
    assert!(json.starts_with('['));
    assert!(json.ends_with(']'));

    let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
    assert!(parsed.is_array());

    cleanup(&path);
}

#[tokio::test]
async fn delete_all_sessions_clears_both_tables() {
    let (repo, path) = setup_test_repo("delete_all").await;

    let id1 = repo.create_session(Some("One".to_string())).await.unwrap();
    let id2 = repo.create_session(Some("Two".to_string())).await.unwrap();

    repo.save_session_history(&id1, &[Message::user("Hello")])
        .await
        .unwrap();

    repo.delete_session(&id1).await.unwrap();
    repo.delete_session(&id2).await.unwrap();

    let conn = rusqlite::Connection::open(path.to_str().unwrap()).unwrap();

    let sessions_count: i32 = conn
        .query_row("SELECT COUNT(*) FROM sessions", [], |r| r.get(0))
        .unwrap();
    let history_count: i32 = conn
        .query_row("SELECT COUNT(*) FROM session_history", [], |r| r.get(0))
        .unwrap();
    assert_eq!(sessions_count, 0);
    assert_eq!(history_count, 0);

    cleanup(&path);
}

#[tokio::test]
async fn rename_does_not_affect_history() {
    let (repo, path) = setup_test_repo("rename_no_history_impact").await;

    let id = repo
        .create_session(Some("Original".to_string()))
        .await
        .unwrap();
    repo.save_session_history(&id, &[Message::user("Keep me")])
        .await
        .unwrap();

    repo.rename_session(&id, "New Title").await.unwrap();

    let history = repo.get_session_history(&id).await.unwrap();
    assert_eq!(history.len(), 1);

    cleanup(&path);
}

#[tokio::test]
async fn error_display_messages_are_descriptive() {
    let (repo, path) = setup_test_repo("error_display").await;

    let err = repo.get_session_history("no-such-id").await.unwrap_err();
    let msg = err.to_string();
    assert!(
        msg.contains("Session not found"),
        "Error should mention 'Session not found'"
    );

    let err = repo
        .rename_session("no-such-id", "Title")
        .await
        .unwrap_err();
    let msg = err.to_string();
    assert!(msg.contains("Session not found"));

    let err = repo.delete_session("no-such-id").await.unwrap_err();
    let msg = err.to_string();
    assert!(msg.contains("Session not found"));

    let err = repo
        .save_session_history("no-such-id", &[])
        .await
        .unwrap_err();
    let msg = err.to_string();
    assert!(msg.contains("Session not found"));

    cleanup(&path);
}
