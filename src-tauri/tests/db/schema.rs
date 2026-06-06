use crate::db::{cleanup, setup_db};

#[test]
fn schema_creates_both_tables_on_init() {
    let (db, path) = setup_db("schema");

    let conn = db.conn.lock().unwrap();

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

    drop(conn);
    cleanup(&path);
}

#[test]
fn foreign_keys_enabled_on_connection() {
    let (db, path) = setup_db("fk_enabled");

    let conn = db.conn.lock().unwrap();
    let fk_status: i32 = conn
        .pragma_query_value(None, "foreign_keys", |row| row.get(0))
        .unwrap();
    assert_eq!(fk_status, 1);

    drop(conn);
    cleanup(&path);
}

#[test]
fn sessions_table_has_expected_columns() {
    let (db, path) = setup_db("schema_columns");

    let conn = db.conn.lock().unwrap();
    let columns = {
        let mut stmt = conn
            .prepare("PRAGMA table_info(sessions)")
            .unwrap();
        stmt.query_map([], |row| row.get::<_, String>(1))
            .unwrap()
            .filter_map(|r| r.ok())
            .collect::<Vec<_>>()
    };

    assert!(columns.contains(&"id".to_string()));
    assert!(columns.contains(&"title".to_string()));
    assert!(columns.contains(&"created_at".to_string()));
    assert!(columns.contains(&"updated_at".to_string()));

    drop(conn);
    cleanup(&path);
}

#[test]
fn session_history_table_has_expected_columns() {
    let (db, path) = setup_db("history_schema_columns");

    let conn = db.conn.lock().unwrap();
    let columns = {
        let mut stmt = conn
            .prepare("PRAGMA table_info(session_history)")
            .unwrap();
        stmt.query_map([], |row| row.get::<_, String>(1))
            .unwrap()
            .filter_map(|r| r.ok())
            .collect::<Vec<_>>()
    };

    assert!(columns.contains(&"session_id".to_string()));
    assert!(columns.contains(&"history_json".to_string()));

    drop(conn);
    cleanup(&path);
}

#[test]
fn session_history_pk_is_session_id() {
    let (db, path) = setup_db("history_pk");

    let conn = db.conn.lock().unwrap();
    let pks = {
        let mut stmt = conn
            .prepare("PRAGMA table_info(session_history)")
            .unwrap();
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

    drop(conn);
    cleanup(&path);
}
