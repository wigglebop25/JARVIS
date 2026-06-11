use crate::domain::chat::Session;
use crate::domain::errors::AppError;
use crate::infrastructure::database::{
    global_pool, lock_db,
    models::{
        schema::{session_history::dsl as hist, sessions::dsl as sess},
        NewSessionHistoryRow, NewSessionRow, SessionHistoryRow, SessionRow,
    },
    DbPool,
};
use diesel::prelude::*;
use diesel_async::{AsyncConnection, RunQueryDsl};
use rig_core::message::Message;
use uuid::Uuid;

pub struct SessionRepository {
    pool: DbPool,
}

impl Default for SessionRepository {
    fn default() -> Self {
        Self::new()
    }
}

impl SessionRepository {
    pub fn new() -> Self {
        Self {
            pool: global_pool(),
        }
    }

    pub fn with_pool(pool: DbPool) -> Self {
        Self { pool }
    }

    pub async fn create_session(&self, title: Option<String>) -> Result<String, AppError> {
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp();
        let _db_lock = lock_db();
        let mut conn = self.pool.get().await?;
        conn.transaction::<_, AppError, _>(async |conn| {
            diesel::insert_into(sess::sessions)
                .values(NewSessionRow {
                    id: id.clone(),
                    title,
                    created_at: now,
                    updated_at: now,
                })
                .execute(conn)
                .await?;
            diesel::insert_into(hist::session_history)
                .values(NewSessionHistoryRow {
                    session_id: &id,
                    history_json: "[]",
                })
                .execute(conn)
                .await?;
            Ok(())
        })
        .await?;
        Ok(id)
    }

    pub async fn get_session_history(&self, session_id: &str) -> Result<Vec<Message>, AppError> {
        let mut conn = self.pool.get().await?;
        let row: Option<SessionHistoryRow> = hist::session_history
            .filter(hist::session_id.eq(session_id))
            .first::<SessionHistoryRow>(&mut conn)
            .await
            .optional()?;
        let row = row.ok_or_else(|| AppError::SystemError("Session not found".into()))?;
        Ok(serde_json::from_str(&row.history_json)?)
    }

    pub async fn save_session_history(
        &self,
        session_id: &str,
        history: &[Message],
    ) -> Result<(), AppError> {
        let now = chrono::Utc::now().timestamp();
        let history_json = serde_json::to_string(history)?;
        let _db_lock = lock_db();
        let mut conn = self.pool.get().await?;
        conn.transaction::<_, AppError, _>(async |conn| {
            let n = diesel::update(hist::session_history.filter(hist::session_id.eq(session_id)))
                .set(hist::history_json.eq(&history_json))
                .execute(conn)
                .await?;
            if n == 0 {
                return Err(AppError::SystemError("Session not found".into()));
            }
            diesel::update(sess::sessions.filter(sess::id.eq(session_id)))
                .set(sess::updated_at.eq(now))
                .execute(conn)
                .await?;
            Ok(())
        })
        .await
    }

    pub async fn get_all_sessions(&self) -> Result<Vec<Session>, AppError> {
        let mut conn = self.pool.get().await?;
        let rows: Vec<SessionRow> = sess::sessions
            .order(sess::updated_at.desc())
            .load::<SessionRow>(&mut conn)
            .await?;
        Ok(rows.into_iter().map(Session::from).collect())
    }

    pub async fn rename_session(&self, session_id: &str, title: &str) -> Result<(), AppError> {
        let now = chrono::Utc::now().timestamp();
        let _db_lock = lock_db();
        let mut conn = self.pool.get().await?;
        let n = diesel::update(sess::sessions.filter(sess::id.eq(session_id)))
            .set((sess::title.eq(title), sess::updated_at.eq(now)))
            .execute(&mut conn)
            .await?;
        if n == 0 {
            return Err(AppError::SystemError("Session not found".into()));
        }
        Ok(())
    }

    pub async fn delete_session(&self, session_id: &str) -> Result<(), AppError> {
        let _db_lock = lock_db();
        let mut conn = self.pool.get().await?;
        let n = diesel::delete(sess::sessions.filter(sess::id.eq(session_id)))
            .execute(&mut conn)
            .await?;
        if n == 0 {
            return Err(AppError::SystemError("Session not found".into()));
        }
        Ok(())
    }
}
