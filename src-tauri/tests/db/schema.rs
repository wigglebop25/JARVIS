use crate::db::{cleanup, setup_test_repo};

#[tokio::test]
async fn schema_creates_both_tables_on_init() {
    let (_repo, path) = setup_test_repo("schema").await;

    let conn = rusqlite::Connection::open(path.to_str().unwrap()).unwrap();

    let sessions_exists: bool = conn
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='sessions'")
        .unwrap()
        .query_row([], |row| row.get::<_, String>(0))
        .is_ok();
    assert!(sessions_exists, "sessions table should exist");

    let history_exists: bool = conn
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='session_history'")
        .unwrap()
        .query_row([], |row| row.get::<_, String>(0))
        .is_ok();
    assert!(history_exists, "session_history table should exist");

    cleanup(&path);
}

#[tokio::test]
async fn foreign_keys_enabled_on_connection() {
    let (_repo, path) = setup_test_repo("fk_enabled").await;

    let conn = rusqlite::Connection::open(path.to_str().unwrap()).unwrap();
    conn.execute_batch("PRAGMA foreign_keys = ON").unwrap();

    let fk_status: i32 = conn
        .pragma_query_value(None, "foreign_keys", |row| row.get(0))
        .unwrap();
    assert_eq!(fk_status, 1);

    cleanup(&path);
}

#[tokio::test]
async fn sessions_table_has_expected_columns() {
    let (_repo, path) = setup_test_repo("schema_columns").await;

    let conn = rusqlite::Connection::open(path.to_str().unwrap()).unwrap();

    let columns = {
        let mut stmt = conn.prepare("PRAGMA table_info(sessions)").unwrap();
        stmt.query_map([], |row| row.get::<_, String>(1))
            .unwrap()
            .filter_map(|r| r.ok())
            .collect::<Vec<_>>()
    };

    assert!(columns.contains(&"id".to_string()));
    assert!(columns.contains(&"title".to_string()));
    assert!(columns.contains(&"created_at".to_string()));
    assert!(columns.contains(&"updated_at".to_string()));

    cleanup(&path);
}

#[tokio::test]
async fn session_history_table_has_expected_columns() {
    let (_repo, path) = setup_test_repo("history_schema_columns").await;

    let conn = rusqlite::Connection::open(path.to_str().unwrap()).unwrap();

    let columns = {
        let mut stmt = conn.prepare("PRAGMA table_info(session_history)").unwrap();
        stmt.query_map([], |row| row.get::<_, String>(1))
            .unwrap()
            .filter_map(|r| r.ok())
            .collect::<Vec<_>>()
    };

    assert!(columns.contains(&"session_id".to_string()));
    assert!(columns.contains(&"history_json".to_string()));

    cleanup(&path);
}

#[tokio::test]
async fn session_history_pk_is_session_id() {
    let (_repo, path) = setup_test_repo("history_pk").await;

    let conn = rusqlite::Connection::open(path.to_str().unwrap()).unwrap();

    let pks = {
        let mut stmt = conn.prepare("PRAGMA table_info(session_history)").unwrap();
        stmt.query_map([], |row| {
            let pk: i32 = row.get(5)?;
            let name: String = row.get(1)?;
            Ok((name, pk))
        })
        .unwrap()
        .filter_map(|r| r.ok())
        .filter(|(_, pk)| *pk > 0)
        .map(|(name, _)| name)
        .collect::<Vec<_>>()
    };

    assert_eq!(pks, vec!["session_id".to_string()]);

    cleanup(&path);
}
