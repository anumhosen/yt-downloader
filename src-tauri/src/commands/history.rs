use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct HistoryItem {
    pub id: String,
    pub title: String,
    pub url: String,
    pub thumbnail: Option<String>,
    pub file_path: String,
    pub format: String,
    pub file_size: Option<String>,
    pub timestamp: String,
    pub is_playlist: Option<bool>,
}

pub fn get_history_path(app: &AppHandle) -> Result<PathBuf, String> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;

    if !app_dir.exists() {
        fs::create_dir_all(&app_dir).map_err(|e| format!("Failed to create app data dir: {}", e))?;
    }

    Ok(app_dir.join("history.json"))
}

#[tauri::command]
pub fn get_history(app: AppHandle) -> Result<Vec<HistoryItem>, String> {
    let path = get_history_path(&app)?;
    if !path.exists() {
        return Ok(Vec::new());
    }

    let content = fs::read_to_string(path).map_err(|e| format!("Failed to read history: {}", e))?;
    let history: Vec<HistoryItem> = serde_json::from_str(&content).unwrap_or_default();
    Ok(history)
}

#[tauri::command]
pub fn add_to_history(app: AppHandle, item: HistoryItem) -> Result<Vec<HistoryItem>, String> {
    let mut history = get_history(app.clone())?;
    // Deduplicate or insert at beginning
    history.retain(|i| i.id != item.id);
    history.insert(0, item);

    let path = get_history_path(&app)?;
    let content = serde_json::to_string_pretty(&history).map_err(|e| format!("Failed to serialize history: {}", e))?;
    fs::write(path, content).map_err(|e| format!("Failed to write history: {}", e))?;

    Ok(history)
}

#[tauri::command]
pub fn delete_history_item(app: AppHandle, id: String) -> Result<Vec<HistoryItem>, String> {
    let mut history = get_history(app.clone())?;
    history.retain(|item| item.id != id);

    let path = get_history_path(&app)?;
    let content = serde_json::to_string_pretty(&history).map_err(|e| format!("Failed to serialize history: {}", e))?;
    fs::write(path, content).map_err(|e| format!("Failed to write history: {}", e))?;

    Ok(history)
}

#[tauri::command]
pub fn clear_all_history(app: AppHandle) -> Result<bool, String> {
    let path = get_history_path(&app)?;
    if path.exists() {
        fs::write(path, "[]").map_err(|e| format!("Failed to clear history: {}", e))?;
    }
    Ok(true)
}

#[tauri::command]
pub fn export_history_json(app: AppHandle) -> Result<String, String> {
    let history = get_history(app)?;
    serde_json::to_string_pretty(&history).map_err(|e| format!("Failed to export JSON: {}", e))
}

#[tauri::command]
pub fn export_history_csv(app: AppHandle) -> Result<String, String> {
    let history = get_history(app)?;
    let mut csv = String::from("id,title,url,file_path,format,timestamp\n");
    for item in history {
        csv.push_str(&format!(
            "\"{}\",\"{}\",\"{}\",\"{}\",\"{}\",\"{}\"\n",
            item.id.replace('"', "\"\""),
            item.title.replace('"', "\"\""),
            item.url.replace('"', "\"\""),
            item.file_path.replace('"', "\"\""),
            item.format,
            item.timestamp
        ));
    }
    Ok(csv)
}
