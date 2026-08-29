use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::process::Command;
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BinaryStatus {
    pub ytdlp_found: bool,
    pub ytdlp_path: String,
    pub ytdlp_version: Option<String>,
    pub ffmpeg_found: bool,
    pub ffmpeg_path: String,
    pub ffmpeg_version: Option<String>,
}

pub fn resolve_executable(app: &AppHandle, binary_name: &str) -> Option<PathBuf> {
    let bin_name = if cfg!(windows) {
        format!("{}.exe", binary_name)
    } else {
        binary_name.to_string()
    };

    // 1. Check in App Data Directory
    if let Ok(app_dir) = app.path().app_data_dir() {
        let local_path = app_dir.join(&bin_name);
        if local_path.exists() {
            return Some(local_path);
        }
    }

    // 2. Check in Executable Dir & Current Working Dir
    if let Ok(mut current_exe) = std::env::current_exe() {
        current_exe.pop();
        let exe_path = current_exe.join(&bin_name);
        if exe_path.exists() {
            return Some(exe_path);
        }
    }

    if let Ok(cwd) = std::env::current_dir() {
        let cwd_path = cwd.join(&bin_name);
        if cwd_path.exists() {
            return Some(cwd_path);
        }
        let res_path = cwd.join("resources").join(&bin_name);
        if res_path.exists() {
            return Some(res_path);
        }
    }

    // 3. Check System PATH
    if let Ok(output) = Command::new(binary_name).arg("-version").output() {
        if output.status.success() {
            return Some(PathBuf::from(binary_name));
        }
    }

    if let Ok(output) = Command::new(binary_name).arg("--version").output() {
        if output.status.success() {
            return Some(PathBuf::from(binary_name));
        }
    }

    None
}

#[tauri::command]
pub fn check_binaries(app: AppHandle) -> BinaryStatus {
    let ytdlp = resolve_executable(&app, "yt-dlp");
    let ffmpeg = resolve_executable(&app, "ffmpeg");

    let (ytdlp_found, ytdlp_path, ytdlp_version) = match ytdlp {
        Some(path) => {
            let ver = Command::new(&path)
                .arg("--version")
                .output()
                .ok()
                .and_then(|o| String::from_utf8(o.stdout).ok())
                .map(|s| s.trim().to_string());
            (true, path.to_string_lossy().to_string(), ver)
        }
        None => (false, "Not found".to_string(), None),
    };

    let (ffmpeg_found, ffmpeg_path, ffmpeg_version) = match ffmpeg {
        Some(path) => {
            let ver = Command::new(&path)
                .arg("-version")
                .output()
                .ok()
                .and_then(|o| String::from_utf8(o.stdout).ok())
                .map(|s| s.lines().next().unwrap_or("").to_string());
            (true, path.to_string_lossy().to_string(), ver)
        }
        None => (false, "Not found".to_string(), None),
    };

    BinaryStatus {
        ytdlp_found,
        ytdlp_path,
        ytdlp_version,
        ffmpeg_found,
        ffmpeg_path,
        ffmpeg_version,
    }
}

#[tauri::command]
pub async fn download_ytdlp_binary(app: AppHandle) -> Result<String, String> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;

    if !app_dir.exists() {
        std::fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;
    }

    let filename = if cfg!(windows) { "yt-dlp.exe" } else { "yt-dlp" };
    let target_path = app_dir.join(filename);

    let url = if cfg!(windows) {
        "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe"
    } else if cfg!(target_os = "macos") {
        "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos"
    } else {
        "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp"
    };

    let client = reqwest::Client::builder()
        .user_agent("ytDownloader/3.20.0")
        .build()
        .map_err(|e| e.to_string())?;

    let response = client
        .get(url)
        .send()
        .await
        .map_err(|e| format!("Failed to download yt-dlp: {}", e))?;

    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read response body: {}", e))?;

    std::fs::write(&target_path, bytes).map_err(|e| format!("Failed to write yt-dlp binary: {}", e))?;

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mut perms = std::fs::metadata(&target_path)
            .map_err(|e| e.to_string())?
            .permissions();
        perms.set_mode(0o755);
        std::fs::set_permissions(&target_path, perms).map_err(|e| e.to_string())?;
    }

    Ok(target_path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn download_ffmpeg_binary(app: AppHandle) -> Result<String, String> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;

    if !app_dir.exists() {
        std::fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;
    }

    let filename = if cfg!(windows) { "ffmpeg.exe" } else { "ffmpeg" };
    let target_path = app_dir.join(filename);

    let url = if cfg!(windows) {
        "https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"
    } else {
        "https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz"
    };

    // Download standalone FFmpeg binary archive
    let client = reqwest::Client::builder()
        .user_agent("ytDownloader/3.20.0")
        .build()
        .map_err(|e| e.to_string())?;

    let response = client
        .get(url)
        .send()
        .await
        .map_err(|e| format!("Failed to download FFmpeg: {}", e))?;

    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read response body: {}", e))?;

    // If on Windows, save zip or write binary directly if available
    let temp_zip = app_dir.join("ffmpeg_temp.zip");
    std::fs::write(&temp_zip, &bytes).map_err(|e| format!("Failed to write temporary zip: {}", e))?;

    // Extract ffmpeg.exe from zip using PowerShell / tar
    if cfg!(windows) {
        let script = format!(
            "Expand-Archive -Path '{}' -DestinationPath '{}' -Force; Get-ChildItem -Path '{}' -Filter 'ffmpeg.exe' -Recurse | Copy-Item -Destination '{}' -Force; Remove-Item -Path '{}' -Force",
            temp_zip.to_string_lossy(),
            app_dir.to_string_lossy(),
            app_dir.to_string_lossy(),
            target_path.to_string_lossy(),
            temp_zip.to_string_lossy()
        );
        let _ = Command::new("powershell")
            .arg("-Command")
            .arg(&script)
            .output();
    }

    if target_path.exists() {
        Ok(target_path.to_string_lossy().to_string())
    } else {
        Err("Downloaded FFmpeg package but extraction failed. Please place ffmpeg.exe manually in App Data folder or install FFmpeg on system PATH.".to_string())
    }
}
