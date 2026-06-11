use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, OnceLock};

use diesel::connection::SimpleConnection;
use diesel::migration::MigrationSource;
use diesel::SqliteConnection;
use diesel_async::{
    pooled_connection::{
        deadpool::{Hook, HookError, Object, Pool, PoolError},
        AsyncDieselConnectionManager,
    },
    sync_connection_wrapper::SyncConnectionWrapper,
    SimpleAsyncConnection,
};
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};
use tokio::sync::Mutex;

pub const MIGRATIONS: EmbeddedMigrations =
    embed_migrations!("./src/infrastructure/database/migrations");

pub type DbPool = Pool<SyncConnectionWrapper<SqliteConnection>>;

static DB_POOL: OnceLock<DbPool> = OnceLock::new();
static DB_LOCK: OnceLock<Arc<Mutex<()>>> = OnceLock::new();

pub fn create_pool(database_url: &str) -> DbPool {
    let pragmas_set = Arc::new(AtomicBool::new(false));
    let manager =
        AsyncDieselConnectionManager::<SyncConnectionWrapper<SqliteConnection>>::new(database_url);
    let mut builder = Pool::builder(manager);
    builder = builder.post_create(Hook::async_fn(
        move |conn: &mut SyncConnectionWrapper<SqliteConnection>, _| {
            let pragmas_set = pragmas_set.clone();
            Box::pin(async move {
                if !pragmas_set.swap(true, Ordering::SeqCst) {
                    conn.batch_execute(
                        "PRAGMA foreign_keys = ON;\
                     PRAGMA journal_mode = WAL;\
                     PRAGMA synchronous = NORMAL;\
                     PRAGMA mmap_size = 30000000000;",
                    )
                    .await
                    .map_err(|e| HookError::Message(e.to_string().into()))?;
                }
                Ok(())
            })
        },
    ));
    builder.build().expect("Failed to create database pool")
}

/// Initialize the process-wide DB pool. Must be called exactly once from
/// `lib.rs` during app startup, after `run_migrations` has completed.
/// Panics if called more than once.
pub fn init_pool(database_url: &str) {
    let pool = create_pool(database_url);
    if DB_POOL.set(pool).is_err() {
        panic!("init_pool called more than once");
    }
}

pub async fn connect_from_pool(
) -> Result<Object<SyncConnectionWrapper<SqliteConnection>>, PoolError> {
    DB_POOL
        .get()
        .expect("init_pool was not called before connect_from_pool")
        .get()
        .await
}

/// Returns a clone of the process-wide DB pool.
///
/// Intended for repository construction in runtime code. Tests should prefer
/// [`create_pool`] + [`crate::infrastructure::database::SessionRepository::with_pool`]
/// to obtain true per-test isolation.
pub fn global_pool() -> DbPool {
    DB_POOL
        .get()
        .expect("init_pool was not called before global_pool")
        .clone()
}

pub fn lock_db() -> Arc<Mutex<()>> {
    DB_LOCK
        .get_or_init(|| Arc::new(Mutex::new(())))
        .clone()
}

/// Run all pending embedded migrations on the file at `database_url`.
/// Blocks the current thread; call from startup only.
pub fn run_migrations(database_url: &str) {
    use diesel::Connection;
    use diesel::RunQueryDsl;
    let mut conn =
        SqliteConnection::establish(database_url).expect("Failed to open database for migrations");

    // Pre-check: if our application tables exist but `__diesel_schema_migrations`
    // does not, this is a pre-diesel JARVIS database. Mark all embedded
    // migrations as already applied so the existing data survives.
    //
    // Table and column names MUST match exactly what `diesel_migrations` uses,
    // otherwise the migration harness won't recognize the pre-seeded rows and
    // will re-run the migration SQL — which crashes on the existing tables.
    // See `diesel-2.3.10/src/migration/setup_migration_table.sql`:
    //   CREATE TABLE IF NOT EXISTS __diesel_schema_migrations (
    //          version VARCHAR(50) PRIMARY KEY NOT NULL,
    //          run_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    //   );
    // And `migrations_internals-2.3.0/src/lib.rs::version_from_string`:
    //   path.split('_').next().map(|s| s.replace('-', ""))
    // — the stored version is the leading numeric portion of the directory name
    // (e.g. `0001_initial_schema` → `0001`), NOT the full directory name.
    let has_sessions: bool = diesel::select(diesel::dsl::sql::<diesel::sql_types::Bool>(
        "EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='sessions')",
    ))
    .get_result(&mut conn)
    .unwrap_or(false);
    let has_history: bool = diesel::select(diesel::dsl::sql::<diesel::sql_types::Bool>(
        "EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='session_history')",
    ))
    .get_result(&mut conn)
    .unwrap_or(false);
    let has_migrations_table: bool = diesel::select(diesel::dsl::sql::<diesel::sql_types::Bool>(
        "EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='__diesel_schema_migrations')",
    ))
    .get_result(&mut conn)
    .unwrap_or(false);

    if has_sessions && has_history && !has_migrations_table {
        conn.batch_execute(
            "CREATE TABLE __diesel_schema_migrations (\
                 version VARCHAR(50) PRIMARY KEY NOT NULL,\
                 run_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP\
             )",
        )
        .expect("Failed to create __diesel_schema_migrations table");

        let migrations: Vec<Box<dyn diesel::migration::Migration<diesel::sqlite::Sqlite>>> =
            MIGRATIONS
                .migrations()
                .expect("Failed to load embedded migrations");
        for m in &migrations {
            let version = m.name().version().to_string();
            diesel::sql_query(format!(
                "INSERT INTO __diesel_schema_migrations (version) VALUES ('{}')",
                version
            ))
            .execute(&mut conn)
            .expect("Failed to record pre-existing schema migration");
        }
    }

    conn.run_pending_migrations(MIGRATIONS)
        .expect("Failed to run database migrations");
}
