use rusqlite::{Connection, Result};
use std::path::Path;
use std::sync::Mutex;

/// Manages the SQLite database connection for session persistence.
///
/// Creates (or opens) the database at the given path and ensures the
/// `sessions` and `session_history` tables exist with the expected schema.
/// Foreign-key cascading is enabled via `PRAGMA foreign_keys = ON`.
pub struct DatabaseManager {
    pub conn: Mutex<Connection>,
}

impl DatabaseManager {
    /// Opens or creates the SQLite database at `path` and initialises the schema.
    ///
    /// Enables foreign keys via `PRAGMA foreign_keys = ON` and creates the
    /// `sessions` and `session_history` tables if they do not exist.
    /// The `session_history.session_id` column has a `ON DELETE CASCADE` foreign
    /// key to `sessions.id`.
    ///
    /// # Arguments
    ///
    /// * `path` - Filesystem path to the SQLite database file.
    ///
    /// # Returns
    ///
    /// Returns a new [`DatabaseManager`] wrapping a mutex-protected connection,
    /// or a [`rusqlite::Error`] on failure.
    pub fn new<P: AsRef<Path>>(path: P) -> Result<Self> {
        let conn = Connection::open(path)?;

        conn.execute("PRAGMA foreign_keys = ON;", [])?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                title TEXT,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS session_history (
                session_id TEXT PRIMARY KEY,
                history_json TEXT NOT NULL,
                FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
            )",
            [],
        )?;

        Ok(Self {
            conn: Mutex::new(conn),
        })
    }
}
