use regex::Regex;
use serde::{Deserialize, Serialize};
use std::process::Stdio;
use tauri::{AppHandle, Emitter};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;

use super::binary_manager::resolve_executable;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VideoMetadata {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub duration: Option<f64>,
    pub thumbnail: Option<String>,
    pub uploader: Option<String>,
    pub view_count: Option<u64>,
    pub formats: Vec<FormatInfo>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FormatInfo {
    pub format_id: String,
    pub ext: String,
    pub resolution: Option<String>,
    pub filesize: Option<u64>,
    pub filesize_approx: Option<u64>,
    pub vcodec: Option<String>,
    pub acodec: Option<String>,
    pub fps: Option<f64>,
    pub tbr: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DownloadProgressPayload {
    pub download_id: String,
    pub percentage: f32,
    pub speed: String,
    pub eta: String,
    pub downloaded_bytes: String,
    pub total_bytes: String,
    pub status: String, // "downloading", "processing", "finished", "error"
    pub message: Option<String>,
}

#[tauri::command]
pub async fn fetch_video_info(app: AppHandle, url: String) -> Result<serde_json::Value, String> {
    let executable = resolve_executable(&app, "yt-dlp")
        .ok_or_else(|| "yt-dlp executable not found. Please download it in Preferences.".to_string())?;

    let output = Command::new(&executable)
        .arg("--dump-json")
        .arg("--no-playlist")
        .arg(&url)
        .output()
        .await
        .map_err(|e| format!("Failed to execute yt-dlp: {}", e))?;

    if !output.status.success() {
        let err_msg = String::from_utf8_lossy(&output.stderr).to_string();
        return Err(format!("yt-dlp error: {}", err_msg));
    }

    let json_str = String::from_utf8_lossy(&output.stdout);
    let val: serde_json::Value = serde_json::from_str(&json_str)
        .map_err(|e| format!("Failed to parse metadata JSON: {}", e))?;

    Ok(val)
}

#[tauri::command]
pub async fn fetch_playlist_info(app: AppHandle, url: String) -> Result<serde_json::Value, String> {
    let executable = resolve_executable(&app, "yt-dlp")
        .ok_or_else(|| "yt-dlp executable not found.".to_string())?;

    let output = Command::new(&executable)
        .arg("--flat-playlist")
        .arg("--dump-json")
        .arg(&url)
        .output()
        .await
        .map_err(|e| format!("Failed to execute yt-dlp: {}", e))?;

    if !output.status.success() {
        let err_msg = String::from_utf8_lossy(&output.stderr).to_string();
        return Err(format!("yt-dlp error: {}", err_msg));
    }

    let json_str = String::from_utf8_lossy(&output.stdout);
    // Parse newline-separated JSON entries for playlist items
    let mut items = Vec::new();
    for line in json_str.lines() {
        if let Ok(val) = serde_json::from_str::<serde_json::Value>(line) {
            items.push(val);
        }
    }

    Ok(serde_json::json!({
        "entries": items
    }))
}

#[tauri::command]
pub async fn start_download(
    app: AppHandle,
    download_id: String,
    url: String,
    output_dir: String,
    format_selection: String,
    is_audio_only: bool,
    is_playlist: Option<bool>,
    custom_args: Option<Vec<String>>,
) -> Result<String, String> {
    let executable = resolve_executable(&app, "yt-dlp")
        .ok_or_else(|| "yt-dlp executable not found.".to_string())?;

    let mut cmd = Command::new(&executable);

    // Prevent downloading entire playlist if URL contains &list= parameter
    if !is_playlist.unwrap_or(false) {
        cmd.arg("--no-playlist");
    }

    // Setup output path template
    let output_template = format!("{}/%(title)s.%(ext)s", output_dir.replace('\\', "/"));
    cmd.arg("-o").arg(&output_template);
    cmd.arg("--newline"); // Output progress line by line for clean parsing

    if is_audio_only {
        cmd.arg("-x").arg("--audio-format").arg(&format_selection);
    } else if !format_selection.is_empty() && format_selection != "best" {
        cmd.arg("-f").arg(&format_selection);
        cmd.arg("--merge-output-format").arg("mp4");
    } else {
        cmd.arg("-f").arg("bestvideo+bestaudio/best");
        cmd.arg("--merge-output-format").arg("mp4");
    }

    // Include ffmpeg path if found for video+audio stream merging
    if let Some(ffmpeg_path) = resolve_executable(&app, "ffmpeg") {
        if let Some(parent) = ffmpeg_path.parent() {
            cmd.arg("--ffmpeg-location").arg(parent);
        } else {
            cmd.arg("--ffmpeg-location").arg(&ffmpeg_path);
        }
    }

    if let Some(args) = custom_args {
        for arg in args {
            cmd.arg(arg);
        }
    }

    cmd.arg(&url);
    cmd.stdout(Stdio::piped());
    cmd.stderr(Stdio::piped());

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("Failed to spawn yt-dlp process: {}", e))?;

    let stdout = child.stdout.take().ok_or("Failed to capture stdout")?;
    let mut reader = BufReader::new(stdout).lines();

    let app_handle = app.clone();
    let id_clone = download_id.clone();

    // Spawn async background task to monitor stdout progress
    tokio::spawn(async move {
        let percent_re = Regex::new(r"\[download\]\s+([\d\.]+)%\s+of\s+([~\w\.\s]+)\s+at\s+([\w\./\s]+)\s+ETA\s+([\d:]+)").unwrap();

        while let Ok(Some(line)) = reader.next_line().await {
            if line.contains("[download]") {
                if let Some(caps) = percent_re.captures(&line) {
                    let percent: f32 = caps.get(1).map_or(0.0, |m| m.as_str().parse().unwrap_or(0.0));
                    let total_str = caps.get(2).map_or("", |m| m.as_str().trim()).to_string();
                    let speed_str = caps.get(3).map_or("", |m| m.as_str().trim()).to_string();
                    let eta_str = caps.get(4).map_or("", |m| m.as_str().trim()).to_string();

                    let payload = DownloadProgressPayload {
                        download_id: id_clone.clone(),
                        percentage: percent,
                        speed: speed_str,
                        eta: eta_str,
                        downloaded_bytes: "".to_string(),
                        total_bytes: total_str,
                        status: "downloading".to_string(),
                        message: None,
                    };

                    let _ = app_handle.emit("download-progress", payload);
                }
            } else if line.contains("[Merger]") || line.contains("Merging formats into") {
                let payload = DownloadProgressPayload {
                    download_id: id_clone.clone(),
                    percentage: 99.0,
                    speed: "".to_string(),
                    eta: "".to_string(),
                    downloaded_bytes: "".to_string(),
                    total_bytes: "".to_string(),
                    status: "combining".to_string(),
                    message: Some("Combining video & audio streams with FFmpeg...".to_string()),
                };
                let _ = app_handle.emit("download-progress", payload);
            } else if line.contains("[ExtractAudio]") || line.contains("[ffmpeg]") {
                let payload = DownloadProgressPayload {
                    download_id: id_clone.clone(),
                    percentage: 99.0,
                    speed: "".to_string(),
                    eta: "".to_string(),
                    downloaded_bytes: "".to_string(),
                    total_bytes: "".to_string(),
                    status: "processing".to_string(),
                    message: Some(line.clone()),
                };
                let _ = app_handle.emit("download-progress", payload);
            }
        }

        let status = child.wait().await;
        match status {
            Ok(s) if s.success() => {
                let payload = DownloadProgressPayload {
                    download_id: id_clone.clone(),
                    percentage: 100.0,
                    speed: "".to_string(),
                    eta: "00:00".to_string(),
                    downloaded_bytes: "".to_string(),
                    total_bytes: "".to_string(),
                    status: "finished".to_string(),
                    message: Some("Download complete!".to_string()),
                };
                let _ = app_handle.emit("download-progress", payload);
            }
            _ => {
                let payload = DownloadProgressPayload {
                    download_id: id_clone.clone(),
                    percentage: 0.0,
                    speed: "".to_string(),
                    eta: "".to_string(),
                    downloaded_bytes: "".to_string(),
                    total_bytes: "".to_string(),
                    status: "error".to_string(),
                    message: Some("Download failed or was cancelled.".to_string()),
                };
                let _ = app_handle.emit("download-progress", payload);
            }
        }
    });

    Ok(download_id)
}
