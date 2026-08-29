use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WindowBounds {
    pub width: u32,
    pub height: u32,
    pub x: Option<i32>,
    pub y: Option<i32>,
}

impl Default for WindowBounds {
    fn default() -> Self {
        Self {
            width: 1024,
            height: 720,
            x: None,
            y: None,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppConfig {
    pub download_path: Option<String>,
    pub default_format: Option<String>,
    pub default_quality: Option<String>,
    pub dark_mode: Option<bool>,
    pub bounds: Option<WindowBounds>,
    pub is_maximized: Option<bool>,
    pub use_tray: Option<bool>,
    pub custom_ytdlp_path: Option<String>,
    pub custom_ffmpeg_path: Option<String>,
}

pub fn get_default_download_dir() -> String {
    dirs::download_dir()
        .or_else(|| dirs::home_dir().map(|h| h.join("Downloads")))
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_else(|| ".".to_string())
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            download_path: Some(get_default_download_dir()),
            default_format: Some("mp4".to_string()),
            default_quality: Some("best".to_string()),
            dark_mode: Some(true),
            bounds: Some(WindowBounds::default()),
            is_maximized: Some(false),
            use_tray: Some(false),
            custom_ytdlp_path: None,
            custom_ffmpeg_path: None,
        }
    }
}

pub fn get_config_path(app: &AppHandle) -> Result<PathBuf, String> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;

    if !app_dir.exists() {
        fs::create_dir_all(&app_dir).map_err(|e| format!("Failed to create app data dir: {}", e))?;
    }

    Ok(app_dir.join("config.json"))
}

#[tauri::command]
pub fn load_config(app: AppHandle) -> Result<AppConfig, String> {
    let config_path = get_config_path(&app)?;
    if !config_path.exists() {
        let default_config = AppConfig::default();
        save_config(app, default_config.clone())?;
        return Ok(default_config);
    }

    let content = fs::read_to_string(config_path).map_err(|e| format!("Failed to read config: {}", e))?;
    let mut config: AppConfig = serde_json::from_str(&content).unwrap_or_default();

    if config.download_path.as_ref().map_or(true, |p| p.trim().is_empty()) {
        config.download_path = Some(get_default_download_dir());
    }

    Ok(config)
}

#[tauri::command]
pub fn save_config(app: AppHandle, config: AppConfig) -> Result<(), String> {
    let config_path = get_config_path(&app)?;
    let content = serde_json::to_string_pretty(&config).map_err(|e| format!("Failed to serialize config: {}", e))?;
    fs::write(config_path, content).map_err(|e| format!("Failed to write config: {}", e))?;
    Ok(())
}
