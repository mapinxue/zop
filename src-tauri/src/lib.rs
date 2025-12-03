use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::Manager;

mod db;

use db::Database;

pub struct AppState {
    pub db: Mutex<Database>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SopItem {
    pub id: i64,
    pub name: String,
    pub icon: String,
    pub item_type: String, // "todo" or "flowchart"
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateSopItem {
    pub name: String,
    pub icon: String,
    pub item_type: String,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn toggle_always_on_top(app: tauri::AppHandle) -> Result<bool, String> {
    let window = app.get_webview_window("main").ok_or("Window not found")?;
    let current_state = window.is_always_on_top().map_err(|e| e.to_string())?;
    let new_state = !current_state;
    window
        .set_always_on_top(new_state)
        .map_err(|e| e.to_string())?;
    Ok(new_state)
}

#[tauri::command]
fn create_sop_item(state: tauri::State<AppState>, item: CreateSopItem) -> Result<SopItem, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.create_sop_item(&item).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_all_sop_items(state: tauri::State<AppState>) -> Result<Vec<SopItem>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_all_sop_items().map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_sop_item(state: tauri::State<AppState>, id: i64) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.delete_sop_item(id).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db = Database::new().expect("Failed to initialize database");

    tauri::Builder::default()
        .manage(AppState { db: Mutex::new(db) })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            toggle_always_on_top,
            create_sop_item,
            get_all_sop_items,
            delete_sop_item
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
