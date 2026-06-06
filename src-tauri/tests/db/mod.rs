#[cfg(test)]
pub mod create;
#[cfg(test)]
pub mod delete;
#[cfg(test)]
pub mod edge_cases;
#[cfg(test)]
pub mod read;
#[cfg(test)]
pub mod relations;
#[cfg(test)]
pub mod schema;
#[cfg(test)]
pub mod update;

use jarvis_lib::infrastructure::db::DatabaseManager;
use std::fs;
use std::path::PathBuf;

pub fn unique_db_path(suffix: &str) -> PathBuf {
    let id = uuid::Uuid::new_v4();
    std::env::temp_dir().join(format!("jarvis_test_db_{}_{}.db", suffix, id))
}

pub fn setup_db(label: &str) -> (DatabaseManager, PathBuf) {
    let path = unique_db_path(label);
    let db = DatabaseManager::new(&path).unwrap();
    (db, path)
}

pub fn cleanup(path: &PathBuf) {
    let _ = fs::remove_file(path);
}
