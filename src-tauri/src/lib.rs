pub mod commands;

use commands::binary_manager::*;
use commands::compressor::*;
use commands::config::*;
use commands::downloader::*;
use commands::history::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            load_config,
            save_config,
            get_history,
            add_to_history,
            delete_history_item,
            clear_all_history,
            export_history_json,
            export_history_csv,
            check_binaries,
            download_ytdlp_binary,
            download_ffmpeg_binary,
            fetch_video_info,
            fetch_playlist_info,
            start_download,
            start_compression,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
