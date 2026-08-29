import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { FileVideo, FolderOpen, Play, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { AppConfig } from '../types';

interface VideoCompressorProps {
  config: AppConfig;
}

export const VideoCompressor: React.FC<VideoCompressorProps> = ({ config }) => {
  const [inputFile, setInputFile] = useState('');
  const [outputFile, setOutputFile] = useState('');
  const [crf, setCrf] = useState(23); // Standard x264 CRF (18 = lossless, 28 = low quality)
  const [preset, setPreset] = useState('medium');
  const [audioBitrate, setAudioBitrate] = useState('128k');
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSelectInput = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: 'Video Files', extensions: ['mp4', 'mkv', 'avi', 'mov', 'webm'] }],
      });
      if (selected && typeof selected === 'string') {
        setInputFile(selected);
        if (!outputFile) {
          const compressedName = selected.replace(/(\.[^.]+)$/, '_compressed.mp4');
          setOutputFile(compressedName);
        }
      }
    } catch (err) {
      console.error('File selection error:', err);
    }
  };

  const handleCompress = async () => {
    if (!inputFile || !outputFile) return;

    setProcessing(true);
    setStatusMessage('Compressing video with ffmpeg...');

    try {
      const taskId = `compress-${Date.now()}`;
      await invoke('start_compression', {
        taskId,
        inputFile,
        outputFile,
        crf,
        preset,
        audioBitrate,
      });
      setStatusMessage('Compression task initiated! Check output destination once complete.');
    } catch (err: any) {
      setStatusMessage(`Error: ${typeof err === 'string' ? err : err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight text-white">Video Compressor</h2>
        <p className="text-slate-400 text-sm">Compress large video files locally using H.264/AAC ffmpeg encoding.</p>
      </div>

      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">Input Video File</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                placeholder="Select a video file to compress..."
                value={inputFile}
                className="flex-1 bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500"
              />
              <button
                onClick={handleSelectInput}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center gap-2 border border-slate-700 transition-colors"
              >
                <FolderOpen className="w-4 h-4" /> Browse
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">Output Destination</label>
            <input
              type="text"
              value={outputFile}
              onChange={(e) => setOutputFile(e.target.value)}
              placeholder="Output file path..."
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500"
            />
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-300">Compression Quality (CRF: {crf})</label>
              <span className="text-[10px] text-slate-500">{crf <= 20 ? 'High' : crf <= 25 ? 'Medium' : 'Compact'}</span>
            </div>
            <input
              type="range"
              min="18"
              max="32"
              value={crf}
              onChange={(e) => setCrf(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
            <p className="text-[10px] text-slate-500">Lower CRF = better visual quality & larger size.</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">Encoding Preset</label>
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2.5"
            >
              <option value="ultrafast">Ultrafast (Fastest, lower compression)</option>
              <option value="fast">Fast</option>
              <option value="medium">Medium (Recommended)</option>
              <option value="slow">Slow (Better compression)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">Audio Bitrate</label>
            <select
              value={audioBitrate}
              onChange={(e) => setAudioBitrate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2.5"
            >
              <option value="96k">96 kbps (Speech)</option>
              <option value="128k">128 kbps (Standard)</option>
              <option value="192k">192 kbps (High Quality)</option>
            </select>
          </div>
        </div>

        {statusMessage && (
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
            <span>{statusMessage}</span>
          </div>
        )}

        <div className="flex justify-end border-t border-slate-800 pt-4">
          <button
            onClick={handleCompress}
            disabled={processing || !inputFile || !outputFile}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all flex items-center gap-2 shadow-lg shadow-blue-600/30"
          >
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Start Compression
          </button>
        </div>
      </div>
    </div>
  );
};
