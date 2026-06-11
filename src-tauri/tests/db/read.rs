use crate::db::{cleanup, setup_test_repo};
use jarvis_lib::domain::errors::AppError;
use rig_core::message::Message;

#[tokio::test]
async fn get_all_sessions_empty_database() {
    let (repo, path) = setup_test_repo("read_empty").await;

    let sessions = repo.get_all_sessions().await.unwrap();
    assert!(sessions.is_empty());

    cleanup(&path);
}

#[tokio::test]
async fn get_all_sessions_ordered_by_updated_at_desc() {
    let (repo, path) = setup_test_repo("read_order").await;

    let id1 = repo
        .create_session(Some("First".to_string()))
        .await
        .unwrap();
    let id2 = repo
        .create_session(Some("Second".to_string()))
        .await
        .unwrap();
    let id3 = repo
        .create_session(Some("Third".to_string()))
        .await
        .unwrap();

    repo.rename_session(&id1, "First Updated").await.unwrap();

    let sessions = repo.get_all_sessions().await.unwrap();
    assert_eq!(sessions.len(), 3);
    assert_eq!(sessions[0].id, id1);
    let ids: Vec<&str> = sessions.iter().map(|s| s.id.as_str()).collect();
    assert!(ids.contains(&id1.as_str()));
    assert!(ids.contains(&id2.as_str()));
    assert!(ids.contains(&id3.as_str()));

    cleanup(&path);
}

#[tokio::test]
async fn get_session_history_returns_empty_for_new_session() {
    let (repo, path) = setup_test_repo("read_history_empty").await;

    let id = repo
        .create_session(Some("Empty History".to_string()))
        .await
        .unwrap();
    let history = repo.get_session_history(&id).await.unwrap();

    assert!(history.is_empty());

    cleanup(&path);
}

#[tokio::test]
async fn get_session_history_nonexistent_session_errors() {
    let (repo, path) = setup_test_repo("read_history_noexist").await;

    let result = repo.get_session_history("nonexistent-id").await;
    assert!(result.is_err());

    match result.unwrap_err() {
        AppError::SystemError(msg) => assert!(msg.contains("Session not found")),
        other => panic!("Expected SystemError, got {:?}", other),
    }

    cleanup(&path);
}

#[tokio::test]
async fn get_session_history_preserves_serialized_messages() {
    let (repo, path) = setup_test_repo("read_history_serialize").await;

    let id = repo
        .create_session(Some("With Messages".to_string()))
        .await
        .unwrap();

    let history = vec![
        Message::user("Hello, JARVIS"),
        Message::assistant("Good evening, sir."),
    ];

    repo.save_session_history(&id, &history).await.unwrap();

    let loaded = repo.get_session_history(&id).await.unwrap();
    assert_eq!(loaded.len(), 2);

    cleanup(&path);
}
