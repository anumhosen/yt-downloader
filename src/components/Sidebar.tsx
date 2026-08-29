import React from 'react';
import { Download, ListVideo, ListChecks, FileVideo, History, Settings, Info } from 'lucide-react';
import { NavigationTab } from '../types';

interface SidebarProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'single' as NavigationTab, label: 'Single Video', icon: Download },
    { id: 'playlist' as NavigationTab, label: 'Playlist', icon: ListVideo },
    { id: 'manager' as NavigationTab, label: 'Download Manager', icon: ListChecks },
    { id: 'compressor' as NavigationTab, label: 'Compressor', icon: FileVideo },
    { id: 'history' as NavigationTab, label: 'History', icon: History },
    { id: 'preferences' as NavigationTab, label: 'Preferences', icon: Settings },
    { id: 'about' as NavigationTab, label: 'About', icon: Info },
  ];

  return (
    <aside className="w-64 glass-panel flex flex-col justify-between border-r border-slate-800 p-4 h-full select-none">
      <div>
        <div className="flex items-center gap-3 px-3 py-4 mb-6 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Download className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white leading-none tracking-tight">ytDownloader</h1>
            <span className="text-xs text-slate-400">v3.20.0 (Tauri)</span>
          </div>
        </div>

        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600/90 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-3 glass-card rounded-lg border border-slate-800/80">
        <p className="text-xs text-slate-400">Fast & Modern Video Engine</p>
        <p className="text-[10px] text-slate-500 mt-1">Powered by Tauri v2 & Rust</p>
      </div>
    </aside>
  );
};
