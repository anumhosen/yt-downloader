import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { Settings, FolderOpen, RefreshCw, CheckCircle2, XCircle, Download, Save, Loader2 } from 'lucide-react';
import { AppConfig, BinaryStatus } from '../types';

interface PreferencesViewProps {
  config: AppConfig;
  onSaveConfig: (updatedConfig: AppConfig) => void;
}

export const PreferencesView: React.FC<PreferencesViewProps> = ({ config, onSaveConfig }) => {
  const [downloadPath, setDownloadPath] = useState(config.download_path || '');
  const [defaultFormat, setDefaultFormat] = useState(config.default_format || 'mp4');
  const [useTray, setUseTray] = useState(config.use_tray || false);
  const [binaryStatus, setBinaryStatus] = useState<BinaryStatus | null>(null);
  const [downloadingYtdlp, setDownloadingYtdlp] = useState(false);
  const [downloadingFfmpeg, setDownloadingFfmpeg] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchBinaryStatus = async () => {
    try {
      const status = await invoke<BinaryStatus>('check_binaries');
      setBinaryStatus(status);
    } catch (err) {
      console.error('Failed to check binary status:', err);
    }
  };

  useEffect(() => {
    fetchBinaryStatus();
  }, []);

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

  const handleDownloadYtdlp = async () => {
    setDownloadingYtdlp(true);
    try {
      await invoke('download_ytdlp_binary');
      await fetchBinaryStatus();
    } catch (err) {
      console.error('Failed to download yt-dlp binary:', err);
    } finally {
      setDownloadingYtdlp(false);
    }
  };

  const handleDownloadFfmpeg = async () => {
    setDownloadingFfmpeg(true);
    try {
      await invoke('download_ffmpeg_binary');
      await fetchBinaryStatus();
    } catch (err) {
      console.error('Failed to download FFmpeg binary:', err);
    } finally {
      setDownloadingFfmpeg(false);
    }
  };

  const handleSave = () => {
    const updated: AppConfig = {
      ...config,
      download_path: downloadPath,
      default_format: defaultFormat,
      use_tray: useTray,
    };
    onSaveConfig(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight text-white">Preferences</h2>
        <p className="text-slate-400 text-sm">Configure default download paths, system settings, and binary dependencies.</p>
      </div>

      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
        {/* General Settings */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider border-b border-slate-800 pb-2">General Settings</h3>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-2">Default Download Directory</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={downloadPath}
                placeholder="Click browse to set directory..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500"
              />
              <button
                onClick={handleSelectFolder}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center gap-2 border border-slate-700 transition-colors"
              >
                <FolderOpen className="w-4 h-4" /> Browse
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-2">Default Format</label>
              <select
                value={defaultFormat}
                onChange={(e) => setDefaultFormat(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2.5"
              >
                <option value="mp4">MP4 Video</option>
                <option value="mkv">MKV Video</option>
                <option value="mp3">MP3 Audio</option>
                <option value="m4a">M4A Audio</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="useTray"
                checked={useTray}
                onChange={(e) => setUseTray(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="useTray" className="text-xs text-slate-300 cursor-pointer">
                Minimize to System Tray on Close
              </label>
            </div>
          </div>
        </div>

        {/* Binary Engine Dependencies */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">CLI Binary Dependencies</h3>
            <button
              onClick={fetchBinaryStatus}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Status
            </button>
          </div>

          {binaryStatus && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* yt-dlp Status */}
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">yt-dlp Engine</span>
                  {binaryStatus.ytdlp_found ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Ready
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                      <XCircle className="w-3 h-3" /> Missing
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 font-mono truncate">Path: {binaryStatus.ytdlp_path}</p>
                {binaryStatus.ytdlp_version && (
                  <p className="text-[11px] text-slate-500">Version: {binaryStatus.ytdlp_version}</p>
                )}

                <button
                  onClick={handleDownloadYtdlp}
                  disabled={downloadingYtdlp}
                  className="w-full mt-2 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-medium rounded-lg flex items-center justify-center gap-2 border border-slate-700 transition-colors"
                >
                  {downloadingYtdlp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  {binaryStatus.ytdlp_found ? 'Update yt-dlp Binary' : 'Download yt-dlp Executable'}
                </button>
              </div>

              {/* ffmpeg Status */}
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">FFmpeg Engine (Required for Merging)</span>
                  {binaryStatus.ffmpeg_found ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Installed & Ready
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                      <XCircle className="w-3 h-3" /> Missing (Separated Files)
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 font-mono truncate">Path: {binaryStatus.ffmpeg_path}</p>
                {binaryStatus.ffmpeg_version && (
                  <p className="text-[11px] text-slate-500 truncate">Version: {binaryStatus.ffmpeg_version}</p>
                )}

                <button
                  onClick={handleDownloadFfmpeg}
                  disabled={downloadingFfmpeg}
                  className="w-full mt-2 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-medium rounded-lg flex items-center justify-center gap-2 border border-slate-700 transition-colors"
                >
                  {downloadingFfmpeg ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  {binaryStatus.ffmpeg_found ? 'Update FFmpeg Binary' : 'Download FFmpeg Executable'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          {saveSuccess ? (
            <span className="text-xs text-green-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Settings saved successfully!
            </span>
          ) : <span />}

          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition-all flex items-center gap-2 shadow-lg shadow-blue-600/30"
          >
            <Save className="w-4 h-4" /> Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};
