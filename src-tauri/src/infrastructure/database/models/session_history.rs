use crate::infrastructure::database::models::schema::session_history;
use diesel::prelude::*;

#[derive(Queryable, Identifiable, Selectable, PartialEq, Debug, Clone)]
#[diesel(table_name = session_history)]
#[diesel(primary_key(session_id))]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct SessionHistoryRow {
    pub session_id: String,
    pub history_json: String,
}

#[derive(Insertable, PartialEq, Debug, Clone)]
#[diesel(table_name = session_history)]
pub struct NewSessionHistoryRow<'a> {
    pub session_id: &'a str,
    pub history_json: &'a str,
}
