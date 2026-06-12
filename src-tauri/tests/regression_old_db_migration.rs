//! Regression test: pre-diesel JARVIS databases (created by the old `rusqlite`
//! code) must migrate cleanly without losing data. `run_migrations` must
//! detect the existing schema, mark the embedded migration as already applied,
//! and skip re-running the `CREATE TABLE` statements.

use jarvis_lib::infrastructure::database::run_migrations;
use std::fs;

#[test]
fn run_migrations_on_old_rusqlite_db_preserves_data() {
    let path = std::env::temp_dir().join("jarvis_old_repro.db");
    let _ = fs::remove_file(&path);
    let _ = fs::remove_file(format!("{}-wal", path.display()));
    let _ = fs::remove_file(format!("{}-shm", path.display()));

    let conn = rusqlite::Connection::open(&path).unwrap();
    conn.execute("PRAGMA foreign_keys = ON;", []).unwrap();
    conn.execute(
        "CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, title TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)",
        [],
    )
    .unwrap();
    conn.execute(
        "CREATE TABLE IF NOT EXISTS session_history (session_id TEXT PRIMARY KEY, history_json TEXT NOT NULL, FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE)",
        [],
    )
    .unwrap();
    conn.execute(
        "INSERT INTO sessions (id, title, created_at, updated_at) VALUES ('test-id', 'Old Session', 1700000000, 1700000000)",
        [],
    )
    .unwrap();
    drop(conn);

    eprintln!("Created old-style DB at {:?}", path);
    eprintln!("Calling run_migrations...");
    run_migrations(path.to_str().unwrap());
    eprintln!("run_migrations returned successfully");

    let conn = rusqlite::Connection::open(&path).unwrap();
    let title: String = conn
        .query_row("SELECT title FROM sessions WHERE id = 'test-id'", [], |r| {
            r.get(0)
        })
        .unwrap();
    assert_eq!(title, "Old Session");

    // Verify the migrations table was created with the right schema and
    // contains the version row.
    let version: String = conn
        .query_row(
            "SELECT version FROM __diesel_schema_migrations ORDER BY version LIMIT 1",
            [],
            |r| r.get(0),
        )
        .unwrap();
    assert_eq!(version, "0001");
    drop(conn);

    let _ = fs::remove_file(&path);
    let _ = fs::remove_file(format!("{}-wal", path.display()));
    let _ = fs::remove_file(format!("{}-shm", path.display()));
}

#[test]
fn run_migrations_on_fresh_db_creates_schema_normally() {
    let path = std::env::temp_dir().join("jarvis_fresh_repro.db");
    let _ = fs::remove_file(&path);
    let _ = fs::remove_file(format!("{}-wal", path.display()));
    let _ = fs::remove_file(format!("{}-shm", path.display()));

    run_migrations(path.to_str().unwrap());

    let conn = rusqlite::Connection::open(&path).unwrap();
    let tables: Vec<String> = conn
        .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        .unwrap()
        .query_map([], |r| r.get::<_, String>(0))
        .unwrap()
        .filter_map(|r| r.ok())
        .collect();
    assert!(tables.contains(&"sessions".to_string()));
    assert!(tables.contains(&"session_history".to_string()));
    assert!(tables.contains(&"__diesel_schema_migrations".to_string()));
    drop(conn);

    let _ = fs::remove_file(&path);
    let _ = fs::remove_file(format!("{}-wal", path.display()));
    let _ = fs::remove_file(format!("{}-shm", path.display()));
}

#[test]
fn run_migrations_called_twice_does_not_fail() {
    let path = std::env::temp_dir().join("jarvis_double_repro.db");
    let _ = fs::remove_file(&path);
    let _ = fs::remove_file(format!("{}-wal", path.display()));
    let _ = fs::remove_file(format!("{}-shm", path.display()));

    run_migrations(path.to_str().unwrap());
    run_migrations(path.to_str().unwrap());

    let conn = rusqlite::Connection::open(&path).unwrap();
    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM __diesel_schema_migrations", [], |r| {
            r.get(0)
        })
        .unwrap();
    assert_eq!(count, 1);
    drop(conn);

    let _ = fs::remove_file(&path);
    let _ = fs::remove_file(format!("{}-wal", path.display()));
    let _ = fs::remove_file(format!("{}-shm", path.display()));
}
