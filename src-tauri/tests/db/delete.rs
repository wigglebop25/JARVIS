use crate::db::{cleanup, setup_db};
use jarvis_lib::domain::errors::AppError;
use jarvis_lib::infrastructure::repository::SessionRepository;

#[test]
fn delete_session_removes_from_sessions_table() {
    let (db, path) = setup_db("delete_session");
    let repo = SessionRepository::new(&db);

    let id = repo.create_session(Some("To Delete".to_string())).unwrap();
    repo.delete_session(&id).unwrap();

    let sessions = repo.get_all_sessions().unwrap();
    assert!(sessions.is_empty());

    cleanup(&path);
}

#[test]
fn delete_session_nonexistent_errors() {
    let (db, path) = setup_db("delete_noexist");
    let repo = SessionRepository::new(&db);

    let result = repo.delete_session("nonexistent-id");
    assert!(result.is_err());

    match result.unwrap_err() {
        AppError::SystemError(msg) => assert!(msg.contains("Session not found")),
        other => panic!("Expected SystemError, got {:?}", other),
    }

    cleanup(&path);
}

#[test]
fn delete_session_does_not_affect_others() {
    let (db, path) = setup_db("delete_only_one");
    let repo = SessionRepository::new(&db);

    let id1 = repo.create_session(Some("Keep".to_string())).unwrap();
    let id2 = repo.create_session(Some("Delete".to_string())).unwrap();

    repo.delete_session(&id2).unwrap();

    let sessions = repo.get_all_sessions().unwrap();
    assert_eq!(sessions.len(), 1);
    assert_eq!(sessions[0].id, id1);
    assert_eq!(sessions[0].title, Some("Keep".to_string()));

    cleanup(&path);
}
