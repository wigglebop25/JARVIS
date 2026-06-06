use crate::db::{cleanup, setup_db};
use jarvis_lib::domain::errors::AppError;
use jarvis_lib::infrastructure::repository::SessionRepository;
use rig::message::Message;

#[test]
fn get_all_sessions_empty_database() {
    let (db, path) = setup_db("read_empty");
    let repo = SessionRepository::new(&db);

    let sessions = repo.get_all_sessions().unwrap();
    assert!(sessions.is_empty());

    cleanup(&path);
}

#[test]
fn get_all_sessions_ordered_by_updated_at_desc() {
    let (db, path) = setup_db("read_order");
    let repo = SessionRepository::new(&db);

    let id1 = repo.create_session(Some("First".to_string())).unwrap();
    let id2 = repo.create_session(Some("Second".to_string())).unwrap();
    let id3 = repo.create_session(Some("Third".to_string())).unwrap();

    // Rename the first session — this bumps its updated_at
    repo.rename_session(&id1, "First Updated").unwrap();

    let sessions = repo.get_all_sessions().unwrap();
    assert_eq!(sessions.len(), 3);
    // Most recently updated (id1) should be first
    assert_eq!(sessions[0].id, id1);
    // All three IDs are present
    let ids: Vec<&str> = sessions.iter().map(|s| s.id.as_str()).collect();
    assert!(ids.contains(&id1.as_str()));
    assert!(ids.contains(&id2.as_str()));
    assert!(ids.contains(&id3.as_str()));

    cleanup(&path);
}

#[test]
fn get_session_history_returns_empty_for_new_session() {
    let (db, path) = setup_db("read_history_empty");
    let repo = SessionRepository::new(&db);

    let id = repo.create_session(Some("Empty History".to_string())).unwrap();
    let history = repo.get_session_history(&id).unwrap();

    assert!(history.is_empty());

    cleanup(&path);
}

#[test]
fn get_session_history_nonexistent_session_errors() {
    let (db, path) = setup_db("read_history_noexist");
    let repo = SessionRepository::new(&db);

    let result = repo.get_session_history("nonexistent-id");
    assert!(result.is_err());

    match result.unwrap_err() {
        AppError::SystemError(msg) => assert!(msg.contains("Session not found")),
        other => panic!("Expected SystemError, got {:?}", other),
    }

    cleanup(&path);
}

#[test]
fn get_session_history_preserves_serialized_messages() {
    let (db, path) = setup_db("read_history_serialize");
    let repo = SessionRepository::new(&db);

    let id = repo.create_session(Some("With Messages".to_string())).unwrap();

    let history = vec![
        Message::user("Hello, JARVIS"),
        Message::assistant("Good evening, sir."),
    ];

    repo.save_session_history(&id, &history).unwrap();

    let loaded = repo.get_session_history(&id).unwrap();
    assert_eq!(loaded.len(), 2);

    cleanup(&path);
}
