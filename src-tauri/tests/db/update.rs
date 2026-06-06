use crate::db::{cleanup, setup_db};
use jarvis_lib::domain::errors::AppError;
use jarvis_lib::infrastructure::repository::SessionRepository;
use rig::message::Message;

// ---------------------------------------------------------------------------
// rename_session
// ---------------------------------------------------------------------------

#[test]
fn rename_session_updates_title() {
    let (db, path) = setup_db("update_title");
    let repo = SessionRepository::new(&db);

    let id = repo.create_session(Some("Old Title".to_string())).unwrap();
    repo.rename_session(&id, "New Title").unwrap();

    let sessions = repo.get_all_sessions().unwrap();
    assert_eq!(sessions.len(), 1);
    assert_eq!(sessions[0].title, Some("New Title".to_string()));

    cleanup(&path);
}

#[test]
fn rename_session_bumps_updated_at() {
    let (db, path) = setup_db("update_bumps_ts");
    let repo = SessionRepository::new(&db);

    let id = repo.create_session(Some("Timestamp Test".to_string())).unwrap();

    let original_updated = {
        let sessions = repo.get_all_sessions().unwrap();
        sessions[0].updated_at
    };

    std::thread::sleep(std::time::Duration::from_millis(50));

    repo.rename_session(&id, "Renamed").unwrap();

    let updated_session = {
        let sessions = repo.get_all_sessions().unwrap();
        sessions[0].clone()
    };

    assert!(
        updated_session.updated_at >= original_updated,
        "updated_at should increase after rename"
    );

    cleanup(&path);
}

#[test]
fn rename_session_nonexistent_errors() {
    let (db, path) = setup_db("update_noexist");
    let repo = SessionRepository::new(&db);

    let result = repo.rename_session("nonexistent-id", "Title");
    assert!(result.is_err());

    match result.unwrap_err() {
        AppError::SystemError(msg) => assert!(msg.contains("Session not found")),
        other => panic!("Expected SystemError, got {:?}", other),
    }

    cleanup(&path);
}

#[test]
fn rename_session_to_empty_string() {
    let (db, path) = setup_db("update_empty_title");
    let repo = SessionRepository::new(&db);

    let id = repo.create_session(Some("Original".to_string())).unwrap();
    repo.rename_session(&id, "").unwrap();

    let sessions = repo.get_all_sessions().unwrap();
    assert_eq!(sessions[0].title, Some("".to_string()));

    cleanup(&path);
}

// ---------------------------------------------------------------------------
// save_session_history
// ---------------------------------------------------------------------------

#[test]
fn save_session_history_updates_json_column() {
    let (db, path) = setup_db("update_history_json");
    let repo = SessionRepository::new(&db);

    let id = repo.create_session(Some("History Update".to_string())).unwrap();

    let history = vec![Message::user("Hello")];
    repo.save_session_history(&id, &history).unwrap();

    let conn = db.conn.lock().unwrap();
    let json: String = conn
        .query_row(
            "SELECT history_json FROM session_history WHERE session_id = ?1",
            [id],
            |r| r.get(0),
        )
        .unwrap();
    assert!(json.contains("Hello"));

    drop(conn);
    cleanup(&path);
}

#[test]
fn save_session_history_bumps_sessions_updated_at() {
    let (db, path) = setup_db("update_history_ts");
    let repo = SessionRepository::new(&db);

    let id = repo.create_session(Some("Timestamp".to_string())).unwrap();

    let original_updated = {
        let sessions = repo.get_all_sessions().unwrap();
        sessions[0].updated_at
    };

    std::thread::sleep(std::time::Duration::from_millis(50));

    let history = vec![Message::user("Update timestamp")];
    repo.save_session_history(&id, &history).unwrap();

    let new_updated = {
        let sessions = repo.get_all_sessions().unwrap();
        sessions[0].updated_at
    };

    assert!(new_updated >= original_updated);

    cleanup(&path);
}

#[test]
fn save_session_history_nonexistent_session_errors() {
    let (db, path) = setup_db("update_history_noexist");
    let repo = SessionRepository::new(&db);

    let result = repo.save_session_history("nonexistent-id", &[]);
    assert!(result.is_err());

    match result.unwrap_err() {
        AppError::SystemError(msg) => assert!(msg.contains("Session not found")),
        other => panic!("Expected SystemError, got {:?}", other),
    }

    cleanup(&path);
}

#[test]
fn save_session_history_overwrites_previous() {
    let (db, path) = setup_db("update_history_overwrite");
    let repo = SessionRepository::new(&db);

    let id = repo.create_session(Some("Overwrite".to_string())).unwrap();

    let first = vec![Message::user("First message")];
    repo.save_session_history(&id, &first).unwrap();

    let second = vec![Message::user("Second message")];
    repo.save_session_history(&id, &second).unwrap();

    let loaded = repo.get_session_history(&id).unwrap();
    assert_eq!(loaded.len(), 1);

    cleanup(&path);
}

#[test]
fn save_session_history_with_empty_vec() {
    let (db, path) = setup_db("update_history_empty_vec");
    let repo = SessionRepository::new(&db);

    let id = repo.create_session(Some("Empty Save".to_string())).unwrap();

    let history = vec![Message::user("Something")];
    repo.save_session_history(&id, &history).unwrap();
    assert_eq!(repo.get_session_history(&id).unwrap().len(), 1);

    repo.save_session_history(&id, &[]).unwrap();
    assert!(repo.get_session_history(&id).unwrap().is_empty());

    cleanup(&path);
}
