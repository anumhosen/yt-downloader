import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { History, Search, Trash2, Download, ExternalLink, FileSpreadsheet, FileCode, FolderOpen } from 'lucide-react';
import { HistoryItem } from '../types';

export const HistoryView: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await invoke<HistoryItem[]>('get_history');
      setHistory(data);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDeleteItem = async (id: string) => {
    try {
      const updated = await invoke<HistoryItem[]>('delete_history_item', { id });
      setHistory(updated);
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all download history?')) return;
    try {
      await invoke('clear_all_history');
      setHistory([]);
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  const handleExportJSON = async () => {
    try {
      const jsonStr = await invoke<string>('export_history_json');
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ytdownloader_history_${Date.now()}.json`;
      a.click();
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  const handleExportCSV = async () => {
    try {
      const csvStr = await invoke<string>('export_history_csv');
      const blob = new Blob([csvStr], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ytdownloader_history_${Date.now()}.csv`;
      a.click();
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  const filteredHistory = history.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Download History</h2>
          <p className="text-slate-400 text-sm">View, search, and manage your past video and audio downloads.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            onClick={handleExportJSON}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            <FileCode className="w-3.5 h-3.5" /> Export JSON
          </button>
          {history.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-red-500/30 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear History
            </button>
          )}
        </div>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Search history by title or URL..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-4 py-3 pl-11 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
        />
        <Search className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
      </div>

      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        {filteredHistory.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <History className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-medium">No download history found</p>
            <p className="text-xs">Your completed downloads will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredHistory.map((item) => (
              <div key={item.id} className="p-4 hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt="" className="w-16 h-10 object-cover rounded border border-slate-700 shrink-0" />
                  ) : (
                    <div className="w-16 h-10 bg-slate-800 rounded border border-slate-700 flex items-center justify-center text-slate-500 shrink-0">
                      <Download className="w-4 h-4" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-white truncate">{item.title}</h4>
                    <p className="text-xs text-slate-400 truncate">{item.url}</p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                      <span>Format: {item.format.toUpperCase()}</span>
                      <span>•</span>
                      <span>{item.timestamp}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
