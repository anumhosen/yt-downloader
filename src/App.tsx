import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { Sidebar } from './components/Sidebar';
import { SingleDownloader } from './components/SingleDownloader';
import { PlaylistDownloader } from './components/PlaylistDownloader';
import { VideoCompressor } from './components/VideoCompressor';
import { HistoryView } from './components/HistoryView';
import { PreferencesView } from './components/PreferencesView';
import { AboutView } from './components/AboutView';
import { DownloadManagerView } from './components/DownloadManagerView';
import { AppConfig, DownloadProgress, NavigationTab } from './types';
import { Loader2, Download, CheckCircle2, AlertCircle, Layers } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('single');
  const [config, setConfig] = useState<AppConfig>({});
  const [activeDownloads, setActiveDownloads] = useState<Map<string, any>>(new Map());

  // Load config on mount
  useEffect(() => {
    invoke<AppConfig>('load_config')
      .then((data) => setConfig(data))
      .catch((err) => console.error('Failed to load config:', err));
  }, []);

  // Listen to Rust IPC download events
  useEffect(() => {
    const unlistenProgress = listen<DownloadProgress>('download-progress', (event) => {
      const payload = event.payload;
      setActiveDownloads((prev) => {
        const next = new Map(prev);
        const existing = next.get(payload.download_id) || {};
        next.set(payload.download_id, { ...existing, ...payload });
        return next;
      });
    });

    return () => {
      unlistenProgress.then((fn) => fn());
    };
  }, []);

  const handleSaveConfig = async (updated: AppConfig) => {
    try {
      await invoke('save_config', { config: updated });
      setConfig(updated);
    } catch (err) {
      console.error('Failed to save config:', err);
    }
  };

  const handleStartDownload = async (
    url: string,
    outputDir: string,
    format: string,
    isAudio: boolean,
    title?: string,
    isPlaylist: boolean = false
  ) => {
    const downloadId = `dl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const downloadTitle = title || url;

    // Track in Download Manager state
    setActiveDownloads((prev) => {
      const next = new Map(prev);
      next.set(downloadId, {
        download_id: downloadId,
        title: downloadTitle,
        url,
        outputDir,
        format: isAudio ? 'mp3' : format,
        percentage: 0,
        speed: '',
        eta: '',
        downloaded_bytes: '',
        total_bytes: '',
        status: 'downloading',
        message: 'Starting download...',
        timestamp: new Date().toLocaleTimeString(),
      });
      return next;
    });

    // Save to download history
    try {
      await invoke('add_to_history', {
        item: {
          id: downloadId,
          title: downloadTitle,
          url,
          file_path: `${outputDir}/${downloadTitle}.${format}`,
          format: isAudio ? 'mp3' : format,
          timestamp: new Date().toLocaleString(),
          is_playlist: isPlaylist,
        },
      });
    } catch (err) {
      console.error('Failed to add to history:', err);
    }

    try {
      await invoke('start_download', {
        downloadId,
        url,
        outputDir,
        formatSelection: format,
        isAudioOnly: isAudio,
        isPlaylist,
        customArgs: null,
      });
    } catch (err) {
      console.error('Failed to start download:', err);
    }
  };

  const handleClearItem = (downloadId: string) => {
    setActiveDownloads((prev) => {
      const next = new Map(prev);
      next.delete(downloadId);
      return next;
    });
  };

  const handleClearFinished = () => {
    setActiveDownloads((prev) => {
      const next = new Map(prev);
      Array.from(next.entries()).forEach(([id, item]) => {
        if (item.status === 'finished') {
          next.delete(id);
        }
      });
      return next;
    });
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-slate-100">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Active Download Progress Bar overlay */}
        {Array.from(activeDownloads.values()).some(
          (dl) => dl.status === 'downloading' || dl.status === 'combining'
        ) && (
          <div className="bg-slate-900/90 border-b border-slate-800 px-6 py-3 space-y-2">
            {Array.from(activeDownloads.values())
              .filter((dl) => dl.status === 'downloading' || dl.status === 'combining')
              .map((dl) => (
                <div key={dl.download_id} className="flex items-center justify-between text-xs gap-4">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {dl.status === 'downloading' && <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />}
                    {dl.status === 'combining' && <Layers className="w-3.5 h-3.5 text-indigo-400 animate-pulse shrink-0" />}

                    <span className="font-semibold text-slate-200 capitalize shrink-0">
                      {dl.status === 'combining' ? 'Combining Streams' : 'Downloading'}:
                    </span>
                    <span className="text-slate-400 truncate">{dl.title || dl.message || dl.download_id}</span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-slate-300 font-mono">
                    <span>{dl.percentage.toFixed(1)}%</span>
                    {dl.speed && <span className="text-slate-500">({dl.speed})</span>}
                    {dl.eta && <span className="text-slate-500">ETA: {dl.eta}</span>}
                  </div>
                </div>
              ))}
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-8">
          {activeTab === 'single' && (
            <SingleDownloader config={config} onStartDownload={handleStartDownload} />
          )}
          {activeTab === 'playlist' && (
            <PlaylistDownloader config={config} onStartDownload={handleStartDownload} />
          )}
          {activeTab === 'manager' && (
            <DownloadManagerView
              downloads={activeDownloads}
              onClearItem={handleClearItem}
              onClearFinished={handleClearFinished}
            />
          )}
          {activeTab === 'compressor' && <VideoCompressor config={config} />}
          {activeTab === 'history' && <HistoryView />}
          {activeTab === 'preferences' && (
            <PreferencesView config={config} onSaveConfig={handleSaveConfig} />
          )}
          {activeTab === 'about' && <AboutView />}
        </main>
      </div>
    </div>
  );
};
