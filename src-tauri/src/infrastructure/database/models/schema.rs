// @generated automatically by Diesel CLI.

diesel::table! {
    session_history (session_id) {
        session_id -> Text,
        history_json -> Text,
    }
}

diesel::table! {
    sessions (id) {
        id -> Text,
        title -> Nullable<Text>,
        created_at -> BigInt,
        updated_at -> BigInt,
    }
}

diesel::joinable!(session_history -> sessions (session_id));

diesel::allow_tables_to_appear_in_same_query!(session_history, sessions,);
