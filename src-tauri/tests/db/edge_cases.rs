use crate::db::{cleanup, setup_db, unique_db_path};
use jarvis_lib::infrastructure::db::DatabaseManager;
use jarvis_lib::infrastructure::repository::SessionRepository;
use rig::message::Message;

#[test]
fn database_is_reopenable_and_persists_data() {
    let path = unique_db_path("reopen");

    {
        let db = DatabaseManager::new(&path).unwrap();
        let repo = SessionRepository::new(&db);
        repo.create_session(Some("Persisted Session".to_string()))
            .unwrap();
    }

    {
        let db = DatabaseManager::new(&path).unwrap();
        let repo = SessionRepository::new(&db);
        let sessions = repo.get_all_sessions().unwrap();
        assert_eq!(sessions.len(), 1);
        assert_eq!(
            sessions[0].title,
            Some("Persisted Session".to_string())
        );
    }

    cleanup(&path);
}

#[test]
fn create_and_retrieve_roundtrip_many_sessions() {
    let (db, path) = setup_db("roundtrip_many");
    let repo = SessionRepository::new(&db);

    let mut ids = Vec::new();
    for i in 0..50 {
        let id = repo
            .create_session(Some(format!("Session {}", i)))
            .unwrap();
        ids.push(id);
    }

    let sessions = repo.get_all_sessions().unwrap();
    assert_eq!(sessions.len(), 50);

    for id in &ids {
        let history = repo.get_session_history(id).unwrap();
        assert!(history.is_empty());
    }

    cleanup(&path);
}

#[test]
fn timestamps_are_reasonable() {
    let (db, path) = setup_db("timestamps");
    let repo = SessionRepository::new(&db);

    let before = chrono::Utc::now().timestamp();
    repo.create_session(Some("Timestamps".to_string())).unwrap();
    let after = chrono::Utc::now().timestamp();

    let sessions = repo.get_all_sessions().unwrap();
    let session = &sessions[0];

    assert!(session.created_at >= before);
    assert!(session.created_at <= after);
    assert!(session.updated_at >= before);
    assert!(session.updated_at <= after);

    cleanup(&path);
}

#[test]
fn history_json_is_valid_json_array() {
    let (db, path) = setup_db("json_validity");
    let repo = SessionRepository::new(&db);

    let id = repo.create_session(Some("JSON".to_string())).unwrap();

    let conn = db.conn.lock().unwrap();
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

    drop(conn);
    cleanup(&path);
}

#[test]
fn delete_all_sessions_clears_both_tables() {
    let (db, path) = setup_db("delete_all");
    let repo = SessionRepository::new(&db);

    let id1 = repo.create_session(Some("One".to_string())).unwrap();
    let id2 = repo.create_session(Some("Two".to_string())).unwrap();

    repo.save_session_history(&id1, &[Message::user("Hello")])
        .unwrap();

    repo.delete_session(&id1).unwrap();
    repo.delete_session(&id2).unwrap();

    let conn = db.conn.lock().unwrap();
    let sessions_count: i32 = conn
        .query_row("SELECT COUNT(*) FROM sessions", [], |r| r.get(0))
        .unwrap();
    let history_count: i32 = conn
        .query_row("SELECT COUNT(*) FROM session_history", [], |r| r.get(0))
        .unwrap();
    assert_eq!(sessions_count, 0);
    assert_eq!(history_count, 0);

    drop(conn);
    cleanup(&path);
}

#[test]
fn rename_does_not_affect_history() {
    let (db, path) = setup_db("rename_no_history_impact");
    let repo = SessionRepository::new(&db);

    let id = repo.create_session(Some("Original".to_string())).unwrap();
    repo.save_session_history(&id, &[Message::user("Keep me")])
        .unwrap();

    repo.rename_session(&id, "New Title").unwrap();

    let history = repo.get_session_history(&id).unwrap();
    assert_eq!(history.len(), 1);

    cleanup(&path);
}

#[test]
fn error_display_messages_are_descriptive() {
    let (db, path) = setup_db("error_display");
    let repo = SessionRepository::new(&db);

    let err = repo.get_session_history("no-such-id").unwrap_err();
    let msg = err.to_string();
    assert!(
        msg.contains("Session not found"),
        "Error should mention 'Session not found'"
    );

    let err = repo.rename_session("no-such-id", "Title").unwrap_err();
    let msg = err.to_string();
    assert!(msg.contains("Session not found"));

    let err = repo.delete_session("no-such-id").unwrap_err();
    let msg = err.to_string();
    assert!(msg.contains("Session not found"));

    let err = repo.save_session_history("no-such-id", &[]).unwrap_err();
    let msg = err.to_string();
    assert!(msg.contains("Session not found"));

    cleanup(&path);
}
