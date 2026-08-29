export interface AppConfig {
  download_path?: string;
  default_format?: string;
  default_quality?: string;
  dark_mode?: boolean;
  bounds?: {
    width: number;
    height: number;
    x?: number;
    y?: number;
  };
  is_maximized?: boolean;
  use_tray?: boolean;
  custom_ytdlp_path?: string;
  custom_ffmpeg_path?: string;
}

export interface HistoryItem {
  id: string;
  title: string;
  url: string;
  thumbnail?: string;
  file_path: string;
  format: string;
  file_size?: string;
  timestamp: string;
  is_playlist?: boolean;
}

export interface BinaryStatus {
  ytdlp_found: boolean;
  ytdlp_path: string;
  ytdlp_version?: string;
  ffmpeg_found: boolean;
  ffmpeg_path: string;
  ffmpeg_version?: string;
}

export interface DownloadProgress {
  download_id: string;
  percentage: number;
  speed: string;
  eta: string;
  downloaded_bytes: string;
  total_bytes: string;
  status: 'downloading' | 'combining' | 'processing' | 'finished' | 'error';
  message?: string;
}

export interface FormatInfo {
  format_id: string;
  ext: string;
  resolution?: string;
  filesize?: number;
  filesize_approx?: number;
  vcodec?: string;
  acodec?: string;
  fps?: number;
  tbr?: number;
}

export interface VideoInfo {
  id: string;
  title: string;
  description?: string;
  duration?: number;
  thumbnail?: string;
  uploader?: string;
  view_count?: number;
  formats: FormatInfo[];
}

export type NavigationTab = 'single' | 'playlist' | 'manager' | 'compressor' | 'history' | 'preferences' | 'about';

export type format = {
  vcodec?: string;
  acodec?: string;
  ext: string;
  filesize?: number;
  format_id: string;
  format_note: string;
  height: number;
  resolution: string;
  video_ext: string;
  audio_ext: string;
  filesize_approx?: number;
  tbr: number;
  fps: number;
};

export type info = {
  title: string;
  id: string;
  thumbnail: string;
  duration: number;
  formats: format[];
  extractor_key: string;
};