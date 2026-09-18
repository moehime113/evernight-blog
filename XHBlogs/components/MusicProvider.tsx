"use client";

import { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { siteConfig } from '../siteConfig';

// 【增强版 LRC 歌词解析】
function parseLrc(lrcText: string) {
  if (!lrcText || lrcText.length > 30000) return [];

  const lines = lrcText.split(/\r?\n/);
  const result = [];

  for (const line of lines) {
    const matches = [...line.matchAll(/\[(\d{2,}):(\d{2})(?:\.(\d{2,3}))?\]/g)];
    if (matches.length > 0) {
      const text = line.replace(/\[\d{2,}:\d{2}(?:\.\d{2,3})?\]/g, '').trim();

      // 剔除控制字符
      const cleanText = text.replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, "");

      if (cleanText) {
        for (const match of matches) {
          const min = parseInt(match[1]);
          const sec = parseInt(match[2]);
          const ms = match[3] ? parseInt(match[3]) : 0;
          const divisor = match[3] && match[3].length === 3 ? 1000 : 100;
          const time = min * 60 + sec + ms / divisor;
          result.push({ time, text: cleanText });
        }
      }
    }
  }
  return result.sort((a, b) => a.time - b.time);
}

// 🌟 1. 扩充 Context 类型，加入 MusicPage 需要的所有属性
type PlayMode = 'loop' | 'single' | 'random';

export interface Song {
  id: string | number;
  title: string;
  artist: string;
  cover: string;
  src: string;
  lrcUrl?: string | null;
  lyrics?: { time: number; text: string }[];
  lrc?: string;
  lyric?: string;
  name?: string;
  author?: string;
  pic?: string;
}

type SongResult = {
  id?: string;
  name?: string;
  artist?: string;
  author?: string;
  cover?: string;
  pic?: string;
  url?: string;
  lrc?: string;
  error?: string;
};

interface MusicContextType {
  playlist: Song[];
  currentIndex: number;
  currentSong: Song | undefined; // 扩展了 lyrics 属性
  isPlaying: boolean;
  progress: number;
  currentTime: number;
  duration: number;
  currentLyric: string;
  isLoading: boolean;
  volume: number;
  isMuted: boolean;
  playMode: PlayMode;

  togglePlay: () => void;
  nextSong: () => void;
  prevSong: () => void;
  handleSeek: (e: { target: { value: string } }) => void;
  playSong: (index: number) => void;
  setVolume: (value: number) => void;
  toggleMute: () => void;
  togglePlayMode: () => void;
}

const MusicContext = createContext<MusicContextType | null>(null);

export function MusicProvider({ children }: { children: ReactNode }) {
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [status, setStatus] = useState("正在连接高可用神经云端...");
  const [isLoading, setIsLoading] = useState(siteConfig.cloudMusicIds?.length > 0);

  // 🌟 2. 新增音量和播放模式状态
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playMode, setPlayMode] = useState<PlayMode>('loop');

  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchMusicData = async () => {
      try {
        const res = await fetch(`/api/music?ids=${siteConfig.cloudMusicIds.join(',')}`);
        const rawResults: SongResult[] = await res.json();

        const mergedPlaylist = rawResults
          .filter((song) => song && song.url && !song.error)
          .map((song) => ({
            id: song.id || Math.random().toString(),
            title: song.name || '未知歌曲',
            artist: song.artist || song.author || '未知歌手',
            cover: song.cover || song.pic || '/img/dusays-69c24230a5ff8.jpg',
            src: song.url!,
            lrcUrl: null,
            lyrics: song.lrc ? parseLrc(song.lrc) : []
          }));

        if (isMounted) {
          if (mergedPlaylist.length > 0) setPlaylist(mergedPlaylist);
          else setStatus("云端链路受阻");
          setIsLoading(false);
        }
      } catch (error) {
        if (isMounted) { setStatus("网络初始化失败"); setIsLoading(false); }
      }
    };

    if (siteConfig.cloudMusicIds?.length > 0) fetchMusicData();

    return () => { isMounted = false; };
  }, []);

  const currentSong = playlist[currentIndex];
  const lyrics = currentSong?.lyrics;
  const currentLyric = !currentSong ? status
    : lyrics?.length
      ? (lyrics.findLast(line => currentTime >= line.time) ?? lyrics[0]).text
      : currentSong.lrcUrl ? "♪ 正在缓冲 ♪" : "♪ 纯享音乐 ♪";

  useEffect(() => {
    if (!currentSong?.lrcUrl || currentSong.lyrics?.length) return;
    let isMounted = true;
    const saveLyrics = (lyrics: NonNullable<Song['lyrics']>) => {
      if (isMounted) setPlaylist(prev => prev.map(song => song === currentSong
        ? { ...song, lyrics, lrcUrl: null } : song));
    };
    fetch(currentSong.lrcUrl)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load lyrics');
        return res.text();
      })
      .then(text => saveLyrics(parseLrc(text)))
      .catch(() => saveLyrics([]));
    return () => { isMounted = false; };
  }, [currentSong]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    let cancelled = false;
    if (isPlaying) audio.play().catch(() => {
      if (!cancelled) setIsPlaying(false);
    });
    else audio.pause();
    return () => { cancelled = true; };
  }, [currentSong?.src, currentIndex, isPlaying]);

  // 🌟 4. 同步音量到 audio 元素
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted, currentSong?.src]);

  const togglePlay = () => {
    if (currentSong) setIsPlaying(playing => !playing);
  };

  const selectSong = (index: number) => {
    if (!Number.isInteger(index) || !playlist[index]) return;
    setCurrentIndex(index);
    setCurrentTime(0);
    setProgress(0);
    if (index !== currentIndex) setDuration(0);
    else if (audioRef.current) {
      audioRef.current.currentTime = 0;
      if (isPlaying) audioRef.current.play().catch(() => setIsPlaying(false));
    }
  };

  // 🌟 5. 重写 nextSong，加入对随机模式的处理
  const nextSong = () => {
    if (!playlist.length) return;
    selectSong(playMode === 'random'
      ? Math.floor(Math.random() * playlist.length)
      : (currentIndex + 1) % playlist.length);
  };

  const prevSong = () => {
    if (!playlist.length) return;
    selectSong(playMode === 'random'
      ? Math.floor(Math.random() * playlist.length)
      : (currentIndex - 1 + playlist.length) % playlist.length);
  };

  // 🌟 6. 暴露直接播放指定歌曲的方法
  const playSong = (index: number) => {
    if (!Number.isInteger(index) || !playlist[index]) return;
    if (index !== currentIndex) selectSong(index);
    setIsPlaying(true);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const { currentTime, duration } = audioRef.current;
      setCurrentTime(currentTime);
      setDuration(duration || 0);
      setProgress((currentTime / (duration || 1)) * 100);
    }
  };

  // 🌟 7. 处理歌曲结束
  const handleEnded = () => {
    if (playMode === 'single') selectSong(currentIndex);
    else nextSong();
  };

  const handleSeek = (e: { target: { value: string } }) => {
    const newProgress = Number(e.target.value);
    setProgress(newProgress);
    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = (newProgress / 100) * audioRef.current.duration;
    }
  };

  const setVolume = (val: number) => {
    setVolumeState(val);
    if (isMuted && val > 0) setIsMuted(false);
  };

  const toggleMute = () => setIsMuted(!isMuted);

  const togglePlayMode = () => {
    setPlayMode(prev => {
      if (prev === 'loop') return 'single';
      if (prev === 'single') return 'random';
      return 'loop';
    });
  };

  return (
    <MusicContext.Provider value={{
        playlist, currentIndex, currentSong, isPlaying, progress, currentTime, duration, currentLyric, isLoading,
        volume, isMuted, playMode, // 暴露新状态
        togglePlay, nextSong, prevSong, handleSeek,
        playSong, setVolume, toggleMute, togglePlayMode // 暴露新方法
    }}>
      {children}
      {currentSong && (
        <audio
          ref={audioRef}
          src={currentSong.src}
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded} // 使用我们重写的结束处理
          onLoadedMetadata={handleTimeUpdate}
        />
      )}
    </MusicContext.Provider>
  );
}

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) throw new Error("useMusic must be used within MusicProvider");
  return context;
};
