use crate::domain::chat::Session;
use crate::domain::errors::AppError;
use crate::infrastructure::db::DatabaseManager;
use rig_core::message::Message;
use rusqlite::params;
use uuid::Uuid;

/// Repository for chat session persistence against a SQLite database.
///
/// Wraps [`DatabaseManager`] and provides typed CRUD operations for
/// sessions and their message history.
pub struct SessionRepository<'a> {
    db: &'a DatabaseManager,
}

impl<'a> SessionRepository<'a> {
    /// Creates a new repository bound to the given database manager.
    ///
    /// # Arguments
    ///
    /// * `db` - A reference to the [`DatabaseManager`] whose mutex-protected connection
    ///   will be used for all operations.
    pub fn new(db: &'a DatabaseManager) -> Self {
        Self { db }
    }

    /// Creates a new session with an auto-generated UUID and empty message history.
    ///
    /// Inserts rows in both `sessions` and `session_history` inside a single
    /// SQLite transaction so a failure on either insert rolls back the other.
    ///
    /// # Arguments
    ///
    /// * `title` - An optional display name for the new session.
    ///
    /// # Returns
    ///
    /// Returns the newly generated session UUID string on success, or an [`AppError`] on failure.
    ///
    /// # Errors
    ///
    /// Returns [`AppError::LockError`] if the database mutex is poisoned; returns
    /// [`AppError::SystemError`] on query or transaction failure.
    pub fn create_session(&self, title: Option<String>) -> Result<String, AppError> {
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp();

        let mut conn = self
            .db
            .conn
            .lock()
            .map_err(|e| AppError::LockError(format!("Database lock error: {}", e)))?;

        let tx = conn
            .transaction()
            .map_err(|e| AppError::SystemError(format!("Failed to start transaction: {}", e)))?;

        tx.execute(
            "INSERT INTO sessions (id, title, created_at, updated_at) VALUES (?1, ?2, ?3, ?4)",
            params![id, title, now, now],
        )
        .map_err(|e| AppError::SystemError(format!("Failed to insert session: {}", e)))?;

        // Initialize empty history
        tx.execute(
            "INSERT INTO session_history (session_id, history_json) VALUES (?1, ?2)",
            params![id, "[]"],
        )
        .map_err(|e| {
            AppError::SystemError(format!("Failed to initialize session history: {}", e))
        })?;

        tx.commit()
            .map_err(|e| AppError::SystemError(format!("Failed to commit transaction: {}", e)))?;

        Ok(id)
    }

    /// Returns the full message history for a session.
    ///
    /// # Arguments
    ///
    /// * `session_id` - The unique identifier of the session to load history for.
    ///
    /// # Returns
    ///
    /// Returns a vector of [`Message`]s (empty for a new session) on success,
    /// or an [`AppError`] on failure.
    ///
    /// # Errors
    ///
    /// Returns [`AppError::SystemError("Session not found")`] when no row exists for `session_id`;
    /// returns [`AppError::LockError`] on mutex poison; returns [`AppError::SystemError`]
    /// on deserialization failures.
    pub fn get_session_history(&self, session_id: &str) -> Result<Vec<Message>, AppError> {
        let conn = self
            .db
            .conn
            .lock()
            .map_err(|e| AppError::LockError(format!("Database lock error: {}", e)))?;

        let mut stmt = conn
            .prepare("SELECT history_json FROM session_history WHERE session_id = ?1")
            .map_err(|e| AppError::SystemError(format!("Failed to prepare query: {}", e)))?;

        let mut rows = stmt
            .query(params![session_id])
            .map_err(|e| AppError::SystemError(format!("Failed to query history: {}", e)))?;

        if let Some(row) = rows
            .next()
            .map_err(|e| AppError::SystemError(format!("Failed to retrieve row: {}", e)))?
        {
            let history_json: String = row.get(0).map_err(|e| {
                AppError::SystemError(format!("Failed to get history column: {}", e))
            })?;
            let history: Vec<Message> = serde_json::from_str(&history_json).map_err(|e| {
                AppError::SystemError(format!("Failed to deserialize history: {}", e))
            })?;
            Ok(history)
        } else {
            Err(AppError::SystemError("Session not found".to_string()))
        }
    }

    /// Overwrites the session history and bumps `updated_at` in a single transaction.
    ///
    /// # Arguments
    ///
    /// * `session_id` - The unique identifier of the session to save history for.
    /// * `history` - The full conversation history to persist (replaces the existing JSON).
    ///
    /// # Returns
    ///
    /// Returns `Ok(())` on success, or an [`AppError`] on failure.
    ///
    /// # Errors
    ///
    /// Returns [`AppError::SystemError("Session not found")`] if `session_id` does not exist;
    /// returns [`AppError::LockError`] or [`AppError::SystemError`] on other failures.
    pub fn save_session_history(
        &self,
        session_id: &str,
        history: &[Message],
    ) -> Result<(), AppError> {
        let now = chrono::Utc::now().timestamp();
        let history_json = serde_json::to_string(history)
            .map_err(|e| AppError::SystemError(format!("Failed to serialize history: {}", e)))?;

        let mut conn = self
            .db
            .conn
            .lock()
            .map_err(|e| AppError::LockError(format!("Database lock error: {}", e)))?;

        let tx = conn
            .transaction()
            .map_err(|e| AppError::SystemError(format!("Failed to start transaction: {}", e)))?;

        let rows = tx
            .execute(
                "UPDATE session_history SET history_json = ?1 WHERE session_id = ?2",
                params![history_json, session_id],
            )
            .map_err(|e| AppError::SystemError(format!("Failed to update history: {}", e)))?;

        if rows == 0 {
            return Err(AppError::SystemError("Session not found".to_string()));
        }

        tx.execute(
            "UPDATE sessions SET updated_at = ?1 WHERE id = ?2",
            params![now, session_id],
        )
        .map_err(|e| {
            AppError::SystemError(format!("Failed to update session updated_at: {}", e))
        })?;

        tx.commit()
            .map_err(|e| AppError::SystemError(format!("Failed to commit transaction: {}", e)))?;

        Ok(())
    }

    /// Returns all sessions ordered by most-recently updated first.
    ///
    /// # Returns
    ///
    /// Returns a vector of [`Session`] structs on success, or an [`AppError`] on failure.
    ///
    /// # Errors
    ///
    /// Returns [`AppError::LockError`] if the database mutex is poisoned;
    /// returns [`AppError::SystemError`] on query failures.
    pub fn get_all_sessions(&self) -> Result<Vec<Session>, AppError> {
        let conn = self
            .db
            .conn
            .lock()
            .map_err(|e| AppError::LockError(format!("Database lock error: {}", e)))?;

        let mut stmt = conn
            .prepare(
                "SELECT id, title, created_at, updated_at FROM sessions ORDER BY updated_at DESC",
            )
            .map_err(|e| AppError::SystemError(format!("Failed to prepare query: {}", e)))?;

        let session_iter = stmt
            .query_map([], |row| {
                Ok(Session {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    created_at: row.get(2)?,
                    updated_at: row.get(3)?,
                })
            })
            .map_err(|e| AppError::SystemError(format!("Failed to query sessions: {}", e)))?;

        let mut sessions = Vec::new();
        for session in session_iter {
            sessions.push(session.map_err(|e| {
                AppError::SystemError(format!("Failed to retrieve session: {}", e))
            })?);
        }
        Ok(sessions)
    }

    /// Renames a session and updates its `updated_at` timestamp.
    ///
    /// # Arguments
    ///
    /// * `session_id` - The unique identifier of the session to rename.
    /// * `title` - The new display title for the session.
    ///
    /// # Returns
    ///
    /// Returns `Ok(())` on success, or an [`AppError`] on failure.
    ///
    /// # Errors
    ///
    /// Returns [`AppError::SystemError("Session not found")`] if `session_id` does not exist.
    pub fn rename_session(&self, session_id: &str, title: &str) -> Result<(), AppError> {
        let now = chrono::Utc::now().timestamp();
        let conn = self
            .db
            .conn
            .lock()
            .map_err(|e| AppError::LockError(format!("Database lock error: {}", e)))?;

        let rows = conn
            .execute(
                "UPDATE sessions SET title = ?1, updated_at = ?2 WHERE id = ?3",
                params![title, now, session_id],
            )
            .map_err(|e| AppError::SystemError(format!("Failed to rename session: {}", e)))?;

        if rows == 0 {
            return Err(AppError::SystemError("Session not found".to_string()));
        }

        Ok(())
    }

    /// Deletes a session and all its associated history (cascaded via foreign key).
    ///
    /// # Arguments
    ///
    /// * `session_id` - The unique identifier of the session to delete.
    ///
    /// # Returns
    ///
    /// Returns `Ok(())` on success, or an [`AppError`] on failure.
    ///
    /// # Errors
    ///
    /// Returns [`AppError::SystemError("Session not found")`] if `session_id` does not exist.
    pub fn delete_session(&self, session_id: &str) -> Result<(), AppError> {
        let conn = self
            .db
            .conn
            .lock()
            .map_err(|e| AppError::LockError(format!("Database lock error: {}", e)))?;

        let rows = conn
            .execute("DELETE FROM sessions WHERE id = ?1", params![session_id])
            .map_err(|e| AppError::SystemError(format!("Failed to delete session: {}", e)))?;

        if rows == 0 {
            return Err(AppError::SystemError("Session not found".to_string()));
        }

        Ok(())
    }
}
