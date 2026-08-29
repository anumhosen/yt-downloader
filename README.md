# ytDownloader (Tauri Edition)

[![GitHub release (latest by date)](https://img.shields.io/github/v/release/anumhosen/yt-downloader?label=latest%20release)](https://github.com/anumhosen/yt-downloader/releases/latest)
[![GitHub downloads](https://img.shields.io/github/downloads/anumhosen/yt-downloader/total?label=Github%20downloads)](https://github.com/anumhosen/yt-downloader/releases)

A modern, ultra-fast desktop video and audio downloader powered by **Tauri 2.0**, **Rust**, **React 18**, **Vite 5**, **TypeScript**, and **TailwindCSS v3**.

Supports downloading high-quality 4K/2K/1080p videos and audio from [hundreds of sites](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md) with automatic FFmpeg video & audio stream merging.

---

## Features 🚀

✅ **Ultra Fast & Lightweight** — Powered by Tauri v2 and Rust native process execution.  
✅ **Resolution Selection** — Pick custom video qualities (4K, 2K, 1080p, 720p, 480p, 360p).  
✅ **Automatic Stream Merging** — Merges separate video and audio streams seamlessly using FFmpeg.  
✅ **Live Download Manager** — Monitor active downloads, speed, ETA, stream merging, and completed files.  
✅ **Playlist Batch Downloader** — Download entire YouTube playlists or custom item selections.  
✅ **Video Compressor** — Compress large video files locally with custom CRF quality control.  
✅ **History & Exports** — Persistent download history with CSV and JSON export capabilities.  
✅ **No Ads / No Trackers** — Pure open-source desktop software.

---

## Technology Stack 🛠️

- **Framework**: [Tauri 2.0](https://tauri.app/) (Rust Desktop Engine)
- **Frontend**: [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite 5](https://vitejs.dev/)
- **Styling**: [TailwindCSS v3](https://tailwindcss.com/) & [Lucide React Icons](https://lucide.dev/)
- **Media Engine**: [yt-dlp](https://github.com/yt-dlp/yt-dlp) & [FFmpeg](https://ffmpeg.org/)

---

## Building and Running from Source 💻

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Rust & Cargo](https://www.rust-lang.org/)
- Platform build dependencies ([Tauri Prerequisites Guide](https://v2.tauri.app/start/prerequisites/))

### Getting Started
```bash
git clone https://github.com/anumhosen/yt-downloader.git
cd yt-downloader
npm install
```

### Development Mode (React HMR + Tauri Rust Backend):
```bash
npm run tauri dev
```

### Production Build:
```bash
npm run tauri build
```

---

## Automated CI/CD & Releases 📦

Automated cross-platform builds (Windows `.msi`/`.exe`, macOS `.dmg`/`.app`, and Linux `.AppImage`/`.deb`) are built automatically via **GitHub Actions** on every tag release pushing to `https://github.com/anumhosen/yt-downloader`.