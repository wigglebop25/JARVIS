use crate::domain::chat::Session;
use crate::domain::errors::AppError;
use crate::infrastructure::db::DatabaseManager;
use rig::message::Message;
use rusqlite::params;
use uuid::Uuid;

pub struct SessionRepository<'a> {
    db: &'a DatabaseManager,
}

impl<'a> SessionRepository<'a> {
    pub fn new(db: &'a DatabaseManager) -> Self {
        Self { db }
    }

    pub fn create_session(&self, title: Option<String>) -> Result<String, AppError> {
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp();

        let conn = self
            .db
            .conn
            .lock()
            .map_err(|e| AppError::LockError(format!("Database lock error: {}", e)))?;

        conn.execute(
            "INSERT INTO sessions (id, title, created_at, updated_at) VALUES (?1, ?2, ?3, ?4)",
            params![id, title, now, now],
        )
        .map_err(|e| AppError::SystemError(format!("Failed to insert session: {}", e)))?;

        // Initialize empty history
        conn.execute(
            "INSERT INTO session_history (session_id, history_json) VALUES (?1, ?2)",
            params![id, "[]"],
        )
        .map_err(|e| AppError::SystemError(format!("Failed to initialize session history: {}", e)))?;

        Ok(id)
    }

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
            let history_json: String = row
                .get(0)
                .map_err(|e| AppError::SystemError(format!("Failed to get history column: {}", e)))?;
            let history: Vec<Message> = serde_json::from_str(&history_json)
                .map_err(|e| AppError::SystemError(format!("Failed to deserialize history: {}", e)))?;
            Ok(history)
        } else {
            Ok(Vec::new())
        }
    }

    pub fn save_session_history(&self, session_id: &str, history: &[Message]) -> Result<(), AppError> {
        let now = chrono::Utc::now().timestamp();
        let history_json = serde_json::to_string(history)
            .map_err(|e| AppError::SystemError(format!("Failed to serialize history: {}", e)))?;

        let conn = self
            .db
            .conn
            .lock()
            .map_err(|e| AppError::LockError(format!("Database lock error: {}", e)))?;

        conn.execute(
            "UPDATE session_history SET history_json = ?1 WHERE session_id = ?2",
            params![history_json, session_id],
        )
        .map_err(|e| AppError::SystemError(format!("Failed to update history: {}", e)))?;

        conn.execute(
            "UPDATE sessions SET updated_at = ?1 WHERE id = ?2",
            params![now, session_id],
        )
        .map_err(|e| AppError::SystemError(format!("Failed to update session updated_at: {}", e)))?;

        Ok(())
    }

    pub fn get_all_sessions(&self) -> Result<Vec<Session>, AppError> {
        let conn = self
            .db
            .conn
            .lock()
            .map_err(|e| AppError::LockError(format!("Database lock error: {}", e)))?;

        let mut stmt = conn
            .prepare("SELECT id, title, created_at, updated_at FROM sessions ORDER BY updated_at DESC")
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
            sessions.push(
                session.map_err(|e| AppError::SystemError(format!("Failed to retrieve session: {}", e)))?,
            );
        }
        Ok(sessions)
    }
}
