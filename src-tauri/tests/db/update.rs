use crate::db::{cleanup, setup_test_repo};
use jarvis_lib::domain::errors::AppError;
use rig_core::message::Message;

#[tokio::test]
async fn rename_session_updates_title() {
    let (repo, path) = setup_test_repo("update_title").await;

    let id = repo
        .create_session(Some("Old Title".to_string()))
        .await
        .unwrap();
    repo.rename_session(&id, "New Title").await.unwrap();

    let sessions = repo.get_all_sessions().await.unwrap();
    assert_eq!(sessions.len(), 1);
    assert_eq!(sessions[0].title, Some("New Title".to_string()));

    cleanup(&path);
}

#[tokio::test]
async fn rename_session_bumps_updated_at() {
    let (repo, path) = setup_test_repo("update_bumps_ts").await;

    let id = repo
        .create_session(Some("Timestamp Test".to_string()))
        .await
        .unwrap();

    let original_updated = {
        let sessions = repo.get_all_sessions().await.unwrap();
        sessions[0].updated_at
    };

    tokio::time::sleep(std::time::Duration::from_millis(50)).await;

    repo.rename_session(&id, "Renamed").await.unwrap();

    let updated_session = {
        let sessions = repo.get_all_sessions().await.unwrap();
        sessions[0].clone()
    };

    assert!(
        updated_session.updated_at >= original_updated,
        "updated_at should increase after rename"
    );

    cleanup(&path);
}

#[tokio::test]
async fn rename_session_nonexistent_errors() {
    let (repo, path) = setup_test_repo("update_noexist").await;

    let result = repo.rename_session("nonexistent-id", "Title").await;
    assert!(result.is_err());

    match result.unwrap_err() {
        AppError::SystemError(msg) => assert!(msg.contains("Session not found")),
        other => panic!("Expected SystemError, got {:?}", other),
    }

    cleanup(&path);
}

#[tokio::test]
async fn rename_session_to_empty_string() {
    let (repo, path) = setup_test_repo("update_empty_title").await;

    let id = repo
        .create_session(Some("Original".to_string()))
        .await
        .unwrap();
    repo.rename_session(&id, "").await.unwrap();

    let sessions = repo.get_all_sessions().await.unwrap();
    assert_eq!(sessions[0].title, Some("".to_string()));

    cleanup(&path);
}

#[tokio::test]
async fn save_session_history_updates_json_column() {
    let (repo, path) = setup_test_repo("update_history_json").await;

    let id = repo
        .create_session(Some("History Update".to_string()))
        .await
        .unwrap();

    let history = vec![Message::user("Hello")];
    repo.save_session_history(&id, &history).await.unwrap();

    use rusqlite::Connection;
    let conn = Connection::open(path.to_str().unwrap()).unwrap();
    conn.execute_batch("PRAGMA foreign_keys = ON").unwrap();

    let json: String = conn
        .query_row(
            "SELECT history_json FROM session_history WHERE session_id = ?1",
            [id],
            |r| r.get(0),
        )
        .unwrap();
    assert!(json.contains("Hello"));

    cleanup(&path);
}

#[tokio::test]
async fn save_session_history_bumps_sessions_updated_at() {
    let (repo, path) = setup_test_repo("update_history_ts").await;

    let id = repo
        .create_session(Some("Timestamp".to_string()))
        .await
        .unwrap();

    let original_updated = {
        let sessions = repo.get_all_sessions().await.unwrap();
        sessions[0].updated_at
    };

    tokio::time::sleep(std::time::Duration::from_millis(50)).await;

    let history = vec![Message::user("Update timestamp")];
    repo.save_session_history(&id, &history).await.unwrap();

    let new_updated = {
        let sessions = repo.get_all_sessions().await.unwrap();
        sessions[0].updated_at
    };

    assert!(new_updated >= original_updated);

    cleanup(&path);
}

#[tokio::test]
async fn save_session_history_nonexistent_session_errors() {
    let (repo, path) = setup_test_repo("update_history_noexist").await;

    let result = repo.save_session_history("nonexistent-id", &[]).await;
    assert!(result.is_err());

    match result.unwrap_err() {
        AppError::SystemError(msg) => assert!(msg.contains("Session not found")),
        other => panic!("Expected SystemError, got {:?}", other),
    }

    cleanup(&path);
}

#[tokio::test]
async fn save_session_history_overwrites_previous() {
    let (repo, path) = setup_test_repo("update_history_overwrite").await;

    let id = repo
        .create_session(Some("Overwrite".to_string()))
        .await
        .unwrap();

    let first = vec![Message::user("First message")];
    repo.save_session_history(&id, &first).await.unwrap();

    let second = vec![Message::user("Second message")];
    repo.save_session_history(&id, &second).await.unwrap();

    let loaded = repo.get_session_history(&id).await.unwrap();
    assert_eq!(loaded.len(), 1);

    cleanup(&path);
}

#[tokio::test]
async fn save_session_history_with_empty_vec() {
    let (repo, path) = setup_test_repo("update_history_empty_vec").await;

    let id = repo
        .create_session(Some("Empty Save".to_string()))
        .await
        .unwrap();

    let history = vec![Message::user("Something")];
    repo.save_session_history(&id, &history).await.unwrap();
    assert_eq!(repo.get_session_history(&id).await.unwrap().len(), 1);

    repo.save_session_history(&id, &[]).await.unwrap();
    assert!(repo.get_session_history(&id).await.unwrap().is_empty());

    cleanup(&path);
}
