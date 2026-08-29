import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ListVideo, Search, Download, Loader2, AlertCircle, CheckSquare, Square } from 'lucide-react';
import { AppConfig } from '../types';

interface PlaylistDownloaderProps {
  config: AppConfig;
  onStartDownload: (url: string, outputDir: string, format: string, isAudio: boolean, title?: string) => void;
}

interface PlaylistItem {
  id: string;
  title: string;
  url: string;
  selected: boolean;
}

export const PlaylistDownloader: React.FC<PlaylistDownloaderProps> = ({ config, onStartDownload }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<PlaylistItem[]>([]);
  const [format, setFormat] = useState('mp4');

  const handleFetchPlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setItems([]);

    try {
      const data = await invoke<any>('fetch_playlist_info', { url: url.trim() });
      const rawEntries = data.entries || [];
      const parsedItems: PlaylistItem[] = rawEntries.map((item: any, idx: number) => ({
        id: item.id || `item-${idx}`,
        title: item.title || `Video #${idx + 1}`,
        url: item.url || item.webpage_url || `https://www.youtube.com/watch?v=${item.id}`,
        selected: true,
      }));
      setItems(parsedItems);
    } catch (err: any) {
      setError(typeof err === 'string' ? err : err.message || 'Failed to fetch playlist items');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    const allSelected = items.every((i) => i.selected);
    setItems(items.map((i) => ({ ...i, selected: !allSelected })));
  };

  const toggleItem = (id: string) => {
    setItems(items.map((i) => (i.id === id ? { ...i, selected: !i.selected } : i)));
  };

  const handleBatchDownload = () => {
    const selected = items.filter((i) => i.selected);
    const targetDir = config.download_path || '.';
    selected.forEach((item) => {
      onStartDownload(item.url, targetDir, format, format === 'mp3', item.title);
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight text-white">Playlist Downloader</h2>
        <p className="text-slate-400 text-sm">Download entire YouTube playlists or select individual videos for batch processing.</p>
      </div>

      <form onSubmit={handleFetchPlaylist} className="space-y-4">
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="Paste playlist URL (e.g., https://youtube.com/playlist?list=...)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-4 py-3.5 pr-32 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="absolute right-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ListVideo className="w-4 h-4" />}
            Fetch Playlist
          </button>
        </div>
      </form>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {items.length > 0 && (
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                {items.every((i) => i.selected) ? (
                  <CheckSquare className="w-4 h-4 text-blue-500" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500" />
                )}
                Toggle All ({items.filter((i) => i.selected).length}/{items.length})
              </button>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none"
              >
                <option value="mp4">Video (MP4)</option>
                <option value="mp3">Audio (MP3)</option>
              </select>

              <button
                onClick={handleBatchDownload}
                disabled={!items.some((i) => i.selected)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition-all flex items-center gap-2 shadow-lg shadow-blue-600/30"
              >
                <Download className="w-4 h-4" /> Download Selected
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
            {items.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                  item.selected
                    ? 'bg-slate-800/80 border-slate-700/80 text-white'
                    : 'bg-slate-900/40 border-slate-800/40 text-slate-400 opacity-60'
                }`}
              >
                {item.selected ? (
                  <CheckSquare className="w-4 h-4 text-blue-500 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <span className="text-xs text-slate-500 font-mono w-6">{idx + 1}.</span>
                <span className="text-xs font-medium truncate flex-1">{item.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
