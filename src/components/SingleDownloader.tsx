import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { Download, Search, Film, Music, CheckCircle2, AlertCircle, Loader2, FolderOpen, SlidersHorizontal } from 'lucide-react';
import { AppConfig, VideoInfo } from '../types';

interface SingleDownloaderProps {
  config: AppConfig;
  onStartDownload: (url: string, outputDir: string, format: string, isAudio: boolean, title?: string) => void;
}

export const SingleDownloader: React.FC<SingleDownloaderProps> = ({ config, onStartDownload }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [resolution, setResolution] = useState('best');
  const [audioFormat, setAudioFormat] = useState('mp3');
  const [isAudioOnly, setIsAudioOnly] = useState(false);
  const [downloadPath, setDownloadPath] = useState(config.download_path || '');
  const [downloadStarted, setDownloadStarted] = useState(false);

  useEffect(() => {
    if (config.download_path) {
      setDownloadPath(config.download_path);
    }
  }, [config.download_path]);

  const handleFetchInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setVideoInfo(null);
    setDownloadStarted(false);

    try {
      const data = await invoke<any>('fetch_video_info', { url: url.trim() });
      setVideoInfo({
        id: data.id || '',
        title: data.title || 'Untitled Video',
        description: data.description,
        duration: data.duration,
        thumbnail: data.thumbnail,
        uploader: data.uploader,
        view_count: data.view_count,
        formats: data.formats || [],
      });
      setResolution('best');
    } catch (err: any) {
      setError(typeof err === 'string' ? err : err.message || 'Failed to fetch video metadata');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        defaultPath: downloadPath || undefined,
      });
      if (selected && typeof selected === 'string') {
        setDownloadPath(selected);
      }
    } catch (err) {
      console.error('Folder selection error:', err);
    }
  };

  const getFormatSelectionString = (): string => {
    if (isAudioOnly) {
      return audioFormat;
    }
    if (resolution === 'best') {
      return 'bestvideo+bestaudio/best';
    }
    const resHeight = resolution.replace('p', '');
    return `bestvideo[height<=${resHeight}]+bestaudio/best[height<=${resHeight}]/best`;
  };

  const handleDownload = () => {
    if (!url.trim() || downloadStarted) return;
    const targetDir = downloadPath || config.download_path || '.';
    const formatStr = getFormatSelectionString();
    onStartDownload(url.trim(), targetDir, formatStr, isAudioOnly, videoInfo?.title);
    setDownloadStarted(true);
    setTimeout(() => setDownloadStarted(false), 3000);
  };

  // Available standard resolution options
  const resolutionOptions = [
    { value: 'best', label: '🌟 Best Available (Max Quality)' },
    { value: '2160p', label: '4K Ultra HD (2160p)' },
    { value: '1440p', label: '2K Quad HD (1440p)' },
    { value: '1080p', label: 'Full HD (1080p)' },
    { value: '720p', label: 'HD (720p)' },
    { value: '480p', label: 'Standard (480p)' },
    { value: '360p', label: 'Low (360p)' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight text-white">Single Video Downloader</h2>
        <p className="text-slate-400 text-sm">Download videos and audios with custom resolution and quality selection.</p>
      </div>

      <form onSubmit={handleFetchInfo} className="space-y-4">
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="Paste video link here (e.g., https://youtube.com/watch?v=...)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-4 py-3.5 pr-28 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="absolute right-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Fetch Info
          </button>
        </div>
      </form>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {videoInfo && (
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6 animate-fadeIn">
          <div className="flex flex-col md:flex-row gap-6">
            {videoInfo.thumbnail && (
              <img
                src={videoInfo.thumbnail}
                alt={videoInfo.title}
                className="w-full md:w-64 aspect-video object-cover rounded-xl border border-slate-700/60 shadow-md"
              />
            )}
            <div className="flex-1 space-y-3">
              <h3 className="text-lg font-semibold text-white line-clamp-2">{videoInfo.title}</h3>
              {videoInfo.uploader && (
                <p className="text-sm text-slate-400">Channel: <span className="text-slate-200">{videoInfo.uploader}</span></p>
              )}
              {videoInfo.duration && (
                <p className="text-xs text-slate-500">Duration: {Math.floor(videoInfo.duration / 60)}m {Math.floor(videoInfo.duration % 60)}s</p>
              )}
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Format Mode Toggle */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Format Mode</label>
              <div className="flex rounded-lg bg-slate-900/60 p-1 border border-slate-800">
                <button
                  onClick={() => setIsAudioOnly(false)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-medium transition-all ${
                    !isAudioOnly ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Film className="w-3.5 h-3.5" /> Video
                </button>
                <button
                  onClick={() => setIsAudioOnly(true)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-medium transition-all ${
                    isAudioOnly ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Music className="w-3.5 h-3.5" /> Audio
                </button>
              </div>
            </div>

            {/* Resolution Selector / Audio Format Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
                {isAudioOnly ? 'Audio Format' : 'Video Resolution'}
              </label>

              {!isAudioOnly ? (
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500"
                >
                  {resolutionOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={audioFormat}
                  onChange={(e) => setAudioFormat(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500"
                >
                  <option value="mp3">MP3 (High Quality 320kbps)</option>
                  <option value="m4a">M4A (AAC Original)</option>
                  <option value="opus">OPUS (WebM Audio)</option>
                  <option value="wav">WAV (Uncompressed)</option>
                </select>
              )}
            </div>

            {/* Download Location Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Download Path</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={downloadPath || 'Default Directory'}
                  className="flex-1 bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 truncate"
                />
                <button
                  onClick={handleSelectFolder}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
                >
                  <FolderOpen className="w-3.5 h-3.5" /> Browse
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-800 pt-4">
            <span className="text-xs text-slate-400 font-mono">
              Selected: {!isAudioOnly ? `Video MP4 (${resolution === 'best' ? 'Max Quality' : resolution}) + Combined Audio` : `Audio ${audioFormat.toUpperCase()}`}
            </span>

            <button
              onClick={handleDownload}
              disabled={downloadStarted}
              className={`px-6 py-3 font-semibold rounded-xl text-sm transition-all flex items-center gap-2 shadow-lg ${
                downloadStarted
                  ? 'bg-green-600 text-white shadow-green-600/30 cursor-default'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/30'
              }`}
            >
              {downloadStarted ? (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Download Started
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" /> Start Download
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
