use crate::db::{cleanup, setup_test_repo};

#[tokio::test]
async fn create_session_with_title() {
    let (repo, path) = setup_test_repo("create_title").await;

    let id = repo
        .create_session(Some("My Chat".to_string()))
        .await
        .unwrap();

    assert!(!id.is_empty());
    assert!(uuid::Uuid::parse_str(&id).is_ok());

    let sessions = repo.get_all_sessions().await.unwrap();
    assert_eq!(sessions.len(), 1);
    assert_eq!(sessions[0].id, id);
    assert_eq!(sessions[0].title, Some("My Chat".to_string()));

    cleanup(&path);
}

#[tokio::test]
async fn create_session_without_title() {
    let (repo, path) = setup_test_repo("create_no_title").await;

    repo.create_session(None).await.unwrap();

    let sessions = repo.get_all_sessions().await.unwrap();
    assert_eq!(sessions.len(), 1);
    assert_eq!(sessions[0].title, None);

    cleanup(&path);
}

#[tokio::test]
async fn create_session_initializes_empty_history() {
    let (repo, path) = setup_test_repo("create_empty_history").await;

    let id = repo.create_session(Some("Test".to_string())).await.unwrap();
    let history = repo.get_session_history(&id).await.unwrap();

    assert!(history.is_empty());

    cleanup(&path);
}

#[tokio::test]
async fn create_session_stores_row_in_both_tables() {
    let (repo, path) = setup_test_repo("create_both_tables").await;

    let id = repo
        .create_session(Some("Both Tables".to_string()))
        .await
        .unwrap();

    use rusqlite::Connection;
    let conn = Connection::open(path.to_str().unwrap()).unwrap();
    conn.execute_batch("PRAGMA foreign_keys = ON").unwrap();

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

    cleanup(&path);
}

#[tokio::test]
async fn create_multiple_sessions_generates_unique_ids() {
    let (repo, path) = setup_test_repo("create_unique_ids").await;

    let id1 = repo.create_session(Some("One".to_string())).await.unwrap();
    let id2 = repo.create_session(Some("Two".to_string())).await.unwrap();
    let id3 = repo
        .create_session(Some("Three".to_string()))
        .await
        .unwrap();

    assert_ne!(id1, id2);
    assert_ne!(id2, id3);
    assert_ne!(id1, id3);

    let sessions = repo.get_all_sessions().await.unwrap();
    assert_eq!(sessions.len(), 3);

    cleanup(&path);
}
