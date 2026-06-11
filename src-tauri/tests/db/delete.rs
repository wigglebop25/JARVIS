use crate::db::{cleanup, setup_test_repo};
use jarvis_lib::domain::errors::AppError;

#[tokio::test]
async fn delete_session_removes_from_sessions_table() {
    let (repo, path) = setup_test_repo("delete_session").await;

    let id = repo
        .create_session(Some("To Delete".to_string()))
        .await
        .unwrap();
    repo.delete_session(&id).await.unwrap();

    let sessions = repo.get_all_sessions().await.unwrap();
    assert!(sessions.is_empty());

    cleanup(&path);
}

#[tokio::test]
async fn delete_session_nonexistent_errors() {
    let (repo, path) = setup_test_repo("delete_noexist").await;

    let result = repo.delete_session("nonexistent-id").await;
    assert!(result.is_err());

    match result.unwrap_err() {
        AppError::SystemError(msg) => assert!(msg.contains("Session not found")),
        other => panic!("Expected SystemError, got {:?}", other),
    }

    cleanup(&path);
}

#[tokio::test]
async fn delete_session_does_not_affect_others() {
    let (repo, path) = setup_test_repo("delete_only_one").await;

    let id1 = repo.create_session(Some("Keep".to_string())).await.unwrap();
    let id2 = repo
        .create_session(Some("Delete".to_string()))
        .await
        .unwrap();

    repo.delete_session(&id2).await.unwrap();

    let sessions = repo.get_all_sessions().await.unwrap();
    assert_eq!(sessions.len(), 1);
    assert_eq!(sessions[0].id, id1);
    assert_eq!(sessions[0].title, Some("Keep".to_string()));

    cleanup(&path);
}
