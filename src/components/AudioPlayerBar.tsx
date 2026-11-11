import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Download,
  X,
  Radio,
  Sliders,
} from 'lucide-react';
import { formatTime, downloadBase64Audio } from '../utils/audioUtils';

export interface PlayerTrack {
  id: string;
  title: string;
  subtitle?: string;
  audioBase64?: string;
  audioUrl?: string;
  mimeType?: string;
}

interface AudioPlayerBarProps {
  track: PlayerTrack | null;
  onClose: () => void;
  onEnded?: () => void;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({ track, onClose, onEnded }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // Set audio source when track changes
  useEffect(() => {
    if (!track) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    let src = track.audioUrl;
    if (!src && track.audioBase64) {
      src = `data:${track.mimeType || 'audio/wav'};base64,${track.audioBase64}`;
    }

    if (src) {
      audio.src = src;
      audio.playbackRate = playbackRate;
      audio.load();
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn('Audio auto-play prevented or failed:', err);
          setIsPlaying(false);
        });
    }
  }, [track]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const handleSkip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(
        0,
        Math.min(audioRef.current.duration || 0, audioRef.current.currentTime + seconds)
      );
    }
  };

  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
    setShowSpeedMenu(false);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 1;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const handleDownload = () => {
    if (!track) return;
    if (track.audioBase64) {
      downloadBase64Audio(
        track.audioBase64,
        `${track.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.wav`,
        track.mimeType || 'audio/wav'
      );
    } else if (track.audioUrl) {
      const a = document.createElement('a');
      a.href = track.audioUrl;
      a.download = `${track.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.wav`;
      a.click();
    }
  };

  if (!track) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 border-t border-zinc-800 backdrop-blur-xl px-4 py-3 shadow-2xl transition-all">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => {
          setIsPlaying(false);
          if (onEnded) onEnded();
        }}
      />

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Track Info */}
        <div className="flex items-center gap-3 w-full md:w-1/4 min-w-0">
          <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shrink-0 shadow-md">
            <Radio className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-white truncate">{track.title}</h4>
            <p className="text-xs text-zinc-400 truncate">{track.subtitle || 'Generated AI Voice'}</p>
          </div>
          {/* Animated EQ wave bars */}
          <div className="flex items-end gap-0.5 h-5 px-2">
            {[40, 90, 60, 100, 75, 45, 80, 50].map((h, i) => (
              <span
                key={i}
                className="w-1 bg-violet-400 rounded-full transition-all duration-150"
                style={{
                  height: isPlaying ? `${Math.max(15, Math.round(h * Math.random()))}%` : '20%',
                  opacity: isPlaying ? 0.9 : 0.3,
                }}
              />
            ))}
          </div>
        </div>

        {/* Center: Controls & Scrubber */}
        <div className="flex flex-col items-center w-full md:w-2/4 gap-1.5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleSkip(-10)}
              className="text-zinc-400 hover:text-white transition p-1"
              title="Skip back 10 seconds"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-white text-zinc-950 flex items-center justify-center hover:bg-violet-200 transition shadow-lg cursor-pointer"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            <button
              onClick={() => handleSkip(10)}
              className="text-zinc-400 hover:text-white transition p-1"
              title="Skip forward 10 seconds"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          {/* Time Scrubber */}
          <div className="w-full flex items-center gap-2 text-xs text-zinc-400">
            <span className="w-10 text-right font-mono text-[11px]">{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-violet-500 hover:accent-violet-400 transition"
            />
            <span className="w-10 font-mono text-[11px]">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right side: Speed, Volume, Download, Close */}
        <div className="flex items-center justify-end gap-2.5 w-full md:w-1/4">
          {/* Speed Selector */}
          <div className="relative">
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:text-white font-mono transition"
            >
              {playbackRate}x
            </button>
            {showSpeedMenu && (
              <div className="absolute bottom-full right-0 mb-2 w-20 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl p-1 z-50 flex flex-col gap-0.5">
                {[0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => handleSpeedChange(rate)}
                    className={`text-xs py-1 px-2 rounded font-mono text-left ${
                      playbackRate === rate ? 'bg-violet-600 text-white' : 'text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Volume */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button onClick={toggleMute} className="text-zinc-400 hover:text-white">
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-violet-500"
            />
          </div>

          {/* Download button */}
          <button
            onClick={handleDownload}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition cursor-pointer"
            title="Download Audio (.wav)"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Download</span>
          </button>

          {/* Close Player */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition"
            title="Close Player"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
