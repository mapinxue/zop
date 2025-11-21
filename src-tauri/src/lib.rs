use tauri::Manager;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn toggle_always_on_top(app: tauri::AppHandle) -> Result<bool, String> {
    let window = app.get_webview_window("main").ok_or("Window not found")?;

    // Get current always on top state
    let current_state = window.is_always_on_top().map_err(|e| e.to_string())?;

    // Toggle the state
    let new_state = !current_state;
    window.set_always_on_top(new_state).map_err(|e| e.to_string())?;

    Ok(new_state)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, toggle_always_on_top])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
