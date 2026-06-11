#![cfg(test)]

pub mod create;
pub mod delete;
pub mod edge_cases;
pub mod read;
pub mod relations;
pub mod schema;
pub mod update;

use jarvis_lib::infrastructure::database::{
    create_pool, run_migrations, DbPool, SessionRepository,
};
use std::path::PathBuf;

pub fn unique_db_path(suffix: &str) -> PathBuf {
    let id = uuid::Uuid::new_v4();
    std::env::temp_dir().join(format!("jarvis_test_db_{}_{}.db", suffix, id))
}

pub async fn setup_test_repo(label: &str) -> (SessionRepository, PathBuf) {
    let path = unique_db_path(label);
    run_migrations(path.to_str().unwrap());
    let pool: DbPool = create_pool(path.to_str().unwrap());
    (SessionRepository::with_pool(pool), path)
}

pub fn cleanup(path: &PathBuf) {
    let _ = std::fs::remove_file(path);
    let _ = std::fs::remove_file(format!("{}-wal", path.display()));
    let _ = std::fs::remove_file(format!("{}-shm", path.display()));
}
