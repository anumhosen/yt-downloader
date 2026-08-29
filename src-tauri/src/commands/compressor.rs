use serde::{Deserialize, Serialize};
use std::process::Stdio;
use tauri::{AppHandle, Emitter};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;

use super::binary_manager::resolve_executable;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CompressionProgressPayload {
    pub task_id: String,
    pub percentage: f32,
    pub status: String, // "processing", "finished", "error"
    pub message: Option<String>,
}

#[tauri::command]
pub async fn start_compression(
    app: AppHandle,
    task_id: String,
    input_file: String,
    output_file: String,
    crf: u32,
    preset: String,
    audio_bitrate: String,
) -> Result<String, String> {
    let ffmpeg_bin = resolve_executable(&app, "ffmpeg")
        .ok_or_else(|| "ffmpeg executable not found.".to_string())?;

    let mut cmd = Command::new(&ffmpeg_bin);
    cmd.arg("-i").arg(&input_file);
    cmd.arg("-vcodec").arg("libx264");
    cmd.arg("-crf").arg(crf.to_string());
    cmd.arg("-preset").arg(&preset);
    cmd.arg("-acodec").arg("aac");
    cmd.arg("-b:a").arg(&audio_bitrate);
    cmd.arg("-y").arg(&output_file);

    cmd.stderr(Stdio::piped());

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("Failed to spawn ffmpeg: {}", e))?;

    let stderr = child.stderr.take().ok_or("Failed to capture stderr")?;
    let mut reader = BufReader::new(stderr).lines();

    let app_handle = app.clone();
    let id_clone = task_id.clone();

    tokio::spawn(async move {
        while let Ok(Some(line)) = reader.next_line().await {
            // Emit progress updates if line contains ffmpeg stats
            if line.contains("frame=") || line.contains("size=") {
                let payload = CompressionProgressPayload {
                    task_id: id_clone.clone(),
                    percentage: 50.0, // Progress estimation
                    status: "processing".to_string(),
                    message: Some(line),
                };
                let _ = app_handle.emit("compression-progress", payload);
            }
        }

        let status = child.wait().await;
        match status {
            Ok(s) if s.success() => {
                let payload = CompressionProgressPayload {
                    task_id: id_clone.clone(),
                    percentage: 100.0,
                    status: "finished".to_string(),
                    message: Some("Compression completed successfully!".to_string()),
                };
                let _ = app_handle.emit("compression-progress", payload);
            }
            _ => {
                let payload = CompressionProgressPayload {
                    task_id: id_clone.clone(),
                    percentage: 0.0,
                    status: "error".to_string(),
                    message: Some("Compression failed.".to_string()),
                };
                let _ = app_handle.emit("compression-progress", payload);
            }
        }
    });

    Ok(task_id)
}
