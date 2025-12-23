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
    pub deleted_at: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateSopItem {
    pub name: String,
    pub icon: String,
    pub item_type: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TodoItem {
    pub id: i64,
    pub sop_id: i64,
    pub content: String,
    pub completed: bool,
    pub sort_order: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateTodoItem {
    pub sop_id: i64,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FlowData {
    pub id: i64,
    pub sop_id: i64,
    pub nodes: String,
    pub edges: String,
    pub created_at: String,
    pub updated_at: String,
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
    db.soft_delete_sop_item(id).map_err(|e| e.to_string())
}

#[tauri::command]
fn rename_sop_item(state: tauri::State<AppState>, id: i64, name: String) -> Result<SopItem, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.rename_sop_item(id, &name).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_deleted_sop_items(state: tauri::State<AppState>) -> Result<Vec<SopItem>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_deleted_sop_items().map_err(|e| e.to_string())
}

#[tauri::command]
fn restore_sop_item(state: tauri::State<AppState>, id: i64) -> Result<SopItem, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.restore_sop_item(id).map_err(|e| e.to_string())
}

#[tauri::command]
fn permanently_delete_sop_item(state: tauri::State<AppState>, id: i64) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.permanently_delete_sop_item(id).map_err(|e| e.to_string())
}

#[tauri::command]
fn create_todo_item(state: tauri::State<AppState>, item: CreateTodoItem) -> Result<TodoItem, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.create_todo_item(&item).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_todo_items(state: tauri::State<AppState>, sop_id: i64) -> Result<Vec<TodoItem>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_todo_items(sop_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn toggle_todo_item(state: tauri::State<AppState>, id: i64) -> Result<TodoItem, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.toggle_todo_item(id).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_todo_item(state: tauri::State<AppState>, id: i64) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.delete_todo_item(id).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_todo_item(state: tauri::State<AppState>, id: i64, content: String) -> Result<TodoItem, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.update_todo_item(id, &content).map_err(|e| e.to_string())
}

#[tauri::command]
fn reorder_todo_items(state: tauri::State<AppState>, item_ids: Vec<i64>) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.reorder_todo_items(&item_ids).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_flow_data(state: tauri::State<AppState>, sop_id: i64) -> Result<Option<FlowData>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_flow_data(sop_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_flow_data(state: tauri::State<AppState>, sop_id: i64, nodes: String, edges: String) -> Result<FlowData, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.save_flow_data(sop_id, &nodes, &edges).map_err(|e| e.to_string())
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
            delete_sop_item,
            rename_sop_item,
            get_deleted_sop_items,
            restore_sop_item,
            permanently_delete_sop_item,
            create_todo_item,
            get_todo_items,
            toggle_todo_item,
            delete_todo_item,
            update_todo_item,
            reorder_todo_items,
            get_flow_data,
            save_flow_data
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
