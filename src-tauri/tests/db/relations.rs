use crate::db::{cleanup, setup_test_repo};
use rig_core::message::Message;

#[tokio::test]
async fn cascade_delete_removes_session_history() {
    let (repo, path) = setup_test_repo("cascade").await;

    let id = repo
        .create_session(Some("Cascade Test".to_string()))
        .await
        .unwrap();

    let history = vec![Message::user("Will be cascaded")];
    repo.save_session_history(&id, &history).await.unwrap();

    assert_eq!(repo.get_session_history(&id).await.unwrap().len(), 1);

    repo.delete_session(&id).await.unwrap();

    let result = repo.get_session_history(&id).await;
    assert!(result.is_err());

    let conn = rusqlite::Connection::open(path.to_str().unwrap()).unwrap();
    conn.execute_batch("PRAGMA foreign_keys = ON").unwrap();

    let count: i32 = conn
        .query_row("SELECT COUNT(*) FROM session_history", [], |r| r.get(0))
        .unwrap();
    assert_eq!(count, 0);

    cleanup(&path);
}

#[tokio::test]
async fn cascade_delete_on_multiple_sessions() {
    let (repo, path) = setup_test_repo("cascade_multi").await;

    let id1 = repo
        .create_session(Some("Session A".to_string()))
        .await
        .unwrap();
    let id2 = repo
        .create_session(Some("Session B".to_string()))
        .await
        .unwrap();
    let id3 = repo
        .create_session(Some("Session C".to_string()))
        .await
        .unwrap();

    repo.save_session_history(&id1, &[Message::user("A msg")])
        .await
        .unwrap();
    repo.save_session_history(&id2, &[Message::user("B msg")])
        .await
        .unwrap();
    repo.save_session_history(&id3, &[Message::user("C msg")])
        .await
        .unwrap();

    repo.delete_session(&id2).await.unwrap();

    let sessions = repo.get_all_sessions().await.unwrap();
    assert_eq!(sessions.len(), 2);

    assert_eq!(repo.get_session_history(&id1).await.unwrap().len(), 1);
    assert!(repo.get_session_history(&id2).await.is_err());
    assert_eq!(repo.get_session_history(&id3).await.unwrap().len(), 1);

    let conn = rusqlite::Connection::open(path.to_str().unwrap()).unwrap();
    conn.execute_batch("PRAGMA foreign_keys = ON").unwrap();

    let count: i32 = conn
        .query_row("SELECT COUNT(*) FROM session_history", [], |r| r.get(0))
        .unwrap();
    assert_eq!(count, 2);

    cleanup(&path);
}

#[tokio::test]
async fn foreign_key_constraint_enforced() {
    let (_repo, path) = setup_test_repo("fk_constraint").await;

    let conn = rusqlite::Connection::open(path.to_str().unwrap()).unwrap();
    conn.execute_batch("PRAGMA foreign_keys = ON").unwrap();

    let result = conn.execute(
        "INSERT INTO session_history (session_id, history_json) VALUES ('orphan-id', '[]')",
        [],
    );
    assert!(
        result.is_err(),
        "FK constraint should reject orphan history row"
    );

    cleanup(&path);
}
