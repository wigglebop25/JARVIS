use crate::db::{cleanup, setup_db};
use jarvis_lib::infrastructure::repository::SessionRepository;

#[test]
fn create_session_with_title() {
    let (db, path) = setup_db("create_title");
    let repo = SessionRepository::new(&db);

    let id = repo.create_session(Some("My Chat".to_string())).unwrap();

    assert!(!id.is_empty());
    assert!(uuid::Uuid::parse_str(&id).is_ok());

    let sessions = repo.get_all_sessions().unwrap();
    assert_eq!(sessions.len(), 1);
    assert_eq!(sessions[0].id, id);
    assert_eq!(sessions[0].title, Some("My Chat".to_string()));

    cleanup(&path);
}

#[test]
fn create_session_without_title() {
    let (db, path) = setup_db("create_no_title");
    let repo = SessionRepository::new(&db);

    repo.create_session(None).unwrap();

    let sessions = repo.get_all_sessions().unwrap();
    assert_eq!(sessions.len(), 1);
    assert_eq!(sessions[0].title, None);

    cleanup(&path);
}

#[test]
fn create_session_initializes_empty_history() {
    let (db, path) = setup_db("create_empty_history");
    let repo = SessionRepository::new(&db);

    let id = repo.create_session(Some("Test".to_string())).unwrap();
    let history = repo.get_session_history(&id).unwrap();

    assert!(history.is_empty());

    cleanup(&path);
}

#[test]
fn create_session_stores_row_in_both_tables() {
    let (db, path) = setup_db("create_both_tables");
    let repo = SessionRepository::new(&db);

    let id = repo.create_session(Some("Both Tables".to_string())).unwrap();

    let conn = db.conn.lock().unwrap();

    let session_count: i32 = conn
        .query_row("SELECT COUNT(*) FROM sessions", [], |r| r.get(0))
        .unwrap();
    assert_eq!(session_count, 1);

    let history_count: i32 = conn
        .query_row("SELECT COUNT(*) FROM session_history", [], |r| r.get(0))
        .unwrap();
    assert_eq!(history_count, 1);

    let linked_id: String = conn
        .query_row(
            "SELECT session_id FROM session_history WHERE session_id = ?1",
            [id.clone()],
            |r| r.get(0),
        )
        .unwrap();
    assert_eq!(linked_id, id);

    drop(conn);
    cleanup(&path);
}

#[test]
fn create_multiple_sessions_generates_unique_ids() {
    let (db, path) = setup_db("create_unique_ids");
    let repo = SessionRepository::new(&db);

    let id1 = repo.create_session(Some("One".to_string())).unwrap();
    let id2 = repo.create_session(Some("Two".to_string())).unwrap();
    let id3 = repo.create_session(Some("Three".to_string())).unwrap();

    assert_ne!(id1, id2);
    assert_ne!(id2, id3);
    assert_ne!(id1, id3);

    let sessions = repo.get_all_sessions().unwrap();
    assert_eq!(sessions.len(), 3);

    cleanup(&path);
}
