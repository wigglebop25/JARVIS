use crate::db::{cleanup, setup_db};
use jarvis_lib::infrastructure::repository::SessionRepository;
use rig::message::Message;

#[test]
fn cascade_delete_removes_session_history() {
    let (db, path) = setup_db("cascade");
    let repo = SessionRepository::new(&db);

    let id = repo.create_session(Some("Cascade Test".to_string())).unwrap();

    let history = vec![Message::user("Will be cascaded")];
    repo.save_session_history(&id, &history).unwrap();

    assert_eq!(repo.get_session_history(&id).unwrap().len(), 1);

    repo.delete_session(&id).unwrap();

    let result = repo.get_session_history(&id);
    assert!(result.is_err());

    let conn = db.conn.lock().unwrap();
    let count: i32 = conn
        .query_row("SELECT COUNT(*) FROM session_history", [], |r| r.get(0))
        .unwrap();
    assert_eq!(count, 0);

    drop(conn);
    cleanup(&path);
}

#[test]
fn cascade_delete_on_multiple_sessions() {
    let (db, path) = setup_db("cascade_multi");
    let repo = SessionRepository::new(&db);

    let id1 = repo.create_session(Some("Session A".to_string())).unwrap();
    let id2 = repo.create_session(Some("Session B".to_string())).unwrap();
    let id3 = repo.create_session(Some("Session C".to_string())).unwrap();

    repo.save_session_history(&id1, &[Message::user("A msg")])
        .unwrap();
    repo.save_session_history(&id2, &[Message::user("B msg")])
        .unwrap();
    repo.save_session_history(&id3, &[Message::user("C msg")])
        .unwrap();

    repo.delete_session(&id2).unwrap();

    let sessions = repo.get_all_sessions().unwrap();
    assert_eq!(sessions.len(), 2);

    assert_eq!(repo.get_session_history(&id1).unwrap().len(), 1);
    assert!(repo.get_session_history(&id2).is_err());
    assert_eq!(repo.get_session_history(&id3).unwrap().len(), 1);

    let conn = db.conn.lock().unwrap();
    let count: i32 = conn
        .query_row("SELECT COUNT(*) FROM session_history", [], |r| r.get(0))
        .unwrap();
    assert_eq!(count, 2);

    drop(conn);
    cleanup(&path);
}

#[test]
fn foreign_key_constraint_enforced() {
    let (db, path) = setup_db("fk_constraint");

    let conn = db.conn.lock().unwrap();
    let result = conn.execute(
        "INSERT INTO session_history (session_id, history_json) VALUES ('orphan-id', '[]')",
        [],
    );
    assert!(
        result.is_err(),
        "FK constraint should reject orphan history row"
    );

    drop(conn);
    cleanup(&path);
}
