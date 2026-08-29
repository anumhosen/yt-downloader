import React from 'react';
import { Download, Github, Heart, Shield, Code2, ExternalLink } from 'lucide-react';

export const AboutView: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-3 py-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center mx-auto shadow-xl shadow-blue-500/25">
          <Download className="w-9 h-9 text-white" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">ytDownloader</h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          A fast, lightweight, open-source video and audio downloader powered by Rust & Tauri.
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-xs font-semibold">
          Version 3.20.0 (Tauri v2 Migration Edition)
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Shield className="w-4 h-4 text-blue-400" /> Open Source License
          </div>
          <p className="text-xs text-slate-400">
            Released under the GPL-3.0 License. Free for personal and community use.
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Code2 className="w-4 h-4 text-indigo-400" /> Technology Stack
          </div>
          <p className="text-xs text-slate-400">
            Built with Rust, Tauri 2.0, React 18, Vite, TypeScript & TailwindCSS.
          </p>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Project Links</h4>
        <div className="flex flex-wrap gap-4">
          <a
            href="https://github.com/anumhosen/yt-downloader"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition-colors"
          >
            <Github className="w-4 h-4" /> GitHub Repository <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>
        </div>
      </div>

      <div className="text-center text-xs text-slate-500 pt-4">
        Created by Andrew • Refactored to Tauri desktop stack
      </div>
    </div>
  );
};
