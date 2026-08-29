import React, { useState } from 'react';
import { DownloadProgress } from '../types';
import { Download, Layers, CheckCircle2, AlertCircle, Loader2, Sparkles, FolderOpen, Play, Trash2 } from 'lucide-react';

interface DownloadItem extends DownloadProgress {
  title?: string;
  url?: string;
  outputDir?: string;
  format?: string;
  timestamp?: string;
}

interface DownloadManagerViewProps {
  downloads: Map<string, DownloadItem>;
  onClearItem: (downloadId: string) => void;
  onClearFinished: () => void;
}

export const DownloadManagerView: React.FC<DownloadManagerViewProps> = ({
  downloads,
  onClearItem,
  onClearFinished,
}) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'combining' | 'finished' | 'error'>('all');

  const items = Array.from(downloads.values());

  const filteredItems = items.filter((item) => {
    if (filter === 'active') return item.status === 'downloading';
    if (filter === 'combining') return item.status === 'combining' || item.status === 'processing';
    if (filter === 'finished') return item.status === 'finished';
    if (filter === 'error') return item.status === 'error';
    return true;
  });

  const activeCount = items.filter((i) => i.status === 'downloading' || i.status === 'combining').length;
  const finishedCount = items.filter((i) => i.status === 'finished').length;
  const combiningCount = items.filter((i) => i.status === 'combining').length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            Download Manager
            {activeCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 border border-blue-500/40 text-blue-400">
                {activeCount} Active
              </span>
            )}
          </h2>
          <p className="text-slate-400 text-sm">
            Monitor active video and audio downloads, FFmpeg stream merging, and completed tasks in real time.
          </p>
        </div>

        {finishedCount > 0 && (
          <button
            onClick={onClearFinished}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear Completed ({finishedCount})
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        {(
          [
            { id: 'all', label: `All (${items.length})` },
            { id: 'active', label: `Downloading (${items.filter((i) => i.status === 'downloading').length})` },
            { id: 'combining', label: `Combining Streams (${combiningCount})` },
            { id: 'finished', label: `Completed (${finishedCount})` },
            { id: 'error', label: `Failed (${items.filter((i) => i.status === 'error').length})` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Download Items List */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center text-slate-500 space-y-2">
            <Download className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-400">No downloads matching filter</p>
            <p className="text-xs">Start a video or playlist download to monitor progress here.</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.download_id}
              className="glass-panel rounded-2xl p-5 border border-slate-800/80 space-y-4 transition-all hover:border-slate-700/80"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-semibold text-white truncate">
                      {item.title || item.download_id}
                    </h4>

                    {/* Status Badges */}
                    {item.status === 'downloading' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 border border-blue-500/30 text-blue-400">
                        <Loader2 className="w-3 h-3 animate-spin" /> Downloading
                      </span>
                    )}

                    {item.status === 'combining' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 shadow-sm animate-pulse">
                        <Layers className="w-3 h-3" /> Combining Video & Audio
                      </span>
                    )}

                    {item.status === 'finished' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-500/10 border border-green-500/30 text-green-400">
                        <CheckCircle2 className="w-3 h-3" /> Combined MP4 Ready
                      </span>
                    )}

                    {item.status === 'error' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-500/10 border border-red-500/30 text-red-400">
                        <AlertCircle className="w-3 h-3" /> Download Failed
                      </span>
                    )}
                  </div>

                  {item.url && <p className="text-xs text-slate-400 truncate">{item.url}</p>}
                  {item.message && (
                    <p className="text-[11px] text-slate-400 font-mono italic">{item.message}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onClearItem(item.download_id)}
                    className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress Bar & Telemetry */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs text-slate-300">
                  <span className="font-mono font-semibold">{item.percentage.toFixed(1)}%</span>
                  <div className="flex items-center gap-3 text-slate-400 text-[11px] font-mono">
                    {item.total_bytes && <span>Size: {item.total_bytes}</span>}
                    {item.speed && <span className="text-blue-400">Speed: {item.speed}</span>}
                    {item.eta && <span className="text-slate-400">ETA: {item.eta}</span>}
                  </div>
                </div>

                <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      item.status === 'finished'
                        ? 'bg-green-500 shadow-sm shadow-green-500/50'
                        : item.status === 'combining'
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse shadow-sm shadow-indigo-500/50'
                        : item.status === 'error'
                        ? 'bg-red-500'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-500 shadow-sm shadow-blue-500/50'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, item.percentage))}%` }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
