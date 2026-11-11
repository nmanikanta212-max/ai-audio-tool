import React from 'react';
import {
  Sliders,
  Volume2,
  Sparkles,
  Zap,
  Gauge,
  Music,
  Wind,
  ShieldCheck,
  Check,
  FileText,
  Upload,
} from 'lucide-react';
import {
  GenerationOptions,
  AudioGenrePreset,
  SpeechPace,
  PitchResonance,
  EmotionTone,
  AmbientSoundscape,
} from '../types/audio';
import { soundscapeManager } from '../utils/soundscapeGenerator';

interface GenerationOptionsPanelProps {
  options: GenerationOptions;
  onChangeOptions: (updated: GenerationOptions) => void;
  onAutoInsertVocalTags?: () => void;
  onImportText?: (importedText: string) => void;
}

export const GenerationOptionsPanel: React.FC<GenerationOptionsPanelProps> = ({
  options,
  onChangeOptions,
  onAutoInsertVocalTags,
  onImportText,
}) => {
  const updateOption = <K extends keyof GenerationOptions>(key: K, value: GenerationOptions[K]) => {
    const updated = { ...options, [key]: value };
    onChangeOptions(updated);

    // If ambient soundscape changed or volume changed, update soundscapeManager
    if (key === 'ambientSoundscape') {
      soundscapeManager.setSoundscape(value as string, options.ambientVolume);
    } else if (key === 'ambientVolume') {
      soundscapeManager.setVolume(value as number);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImportText) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) onImportText(text);
    };
    reader.readAsText(file);
  };

  const GENRE_PRESETS: Array<{ id: AudioGenrePreset; label: string; icon: string; desc: string }> = [
    { id: 'podcast', label: 'Podcast & Talk Show', icon: '🎙️', desc: 'Banter, natural pauses, authentic conversational rhythm' },
    { id: 'audiobook', label: 'Audiobook & Story', icon: '📖', desc: 'Rich character presence, expressive cadence' },
    { id: 'meditation', label: 'Sleep & ASMR', icon: '🧘', desc: 'Tranquil whispers, slow pacing, deep breaths' },
    { id: 'cinematic', label: 'Cinematic Drama', icon: '🎬', desc: 'Deep bass, dramatic tension, movie-trailer intensity' },
    { id: 'news', label: 'News & Documentary', icon: '📰', desc: 'Crisp, articulate, authoritative broadcast delivery' },
    { id: 'educational', label: 'Masterclass / Lecture', icon: '🎓', desc: 'Clear conceptual emphasis, thoughtful pacing' },
    { id: 'comedy', label: 'Comedy & Parody', icon: '🎭', desc: 'Playful timing, laughter bursts, energetic vibe' },
  ];

  const SOUNDSCAPES: Array<{ id: AmbientSoundscape; label: string; icon: string }> = [
    { id: 'none', label: 'Pure Voice (None)', icon: '🔇' },
    { id: 'rain', label: 'Gentle Rain', icon: '🌧️' },
    { id: 'waves', label: 'Twilight Waves', icon: '🌊' },
    { id: 'space', label: 'Cosmic Drone', icon: '🚀' },
    { id: 'forest', label: 'Pine Forest', icon: '🌲' },
    { id: 'cafe', label: 'Cozy Cafe', icon: '☕' },
  ];

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 md:p-6 space-y-6 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
            <Sliders className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Advanced Voice & Audio Generation Options</h3>
            <p className="text-[11px] text-zinc-400">Pacing, pitch resonance, genre presets & soundscapes</p>
          </div>
        </div>

        {/* File import button */}
        {onImportText && (
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 font-medium transition cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-violet-400" />
            <span>Import Script (.txt/.md)</span>
            <input type="file" accept=".txt,.md,.json" onChange={handleFileUpload} className="hidden" />
          </label>
        )}
      </div>

      {/* 1. Genre Production Presets */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold text-zinc-300 flex items-center justify-between uppercase tracking-wider">
          <span>1. Format & Genre Presets</span>
          <span className="text-[10px] text-violet-400 font-mono">Tailors AI Delivery</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {GENRE_PRESETS.map((genre) => (
            <button
              key={genre.id}
              type="button"
              onClick={() => updateOption('genrePreset', genre.id)}
              className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                options.genrePreset === genre.id
                  ? 'bg-violet-600/20 border-violet-500 text-white shadow-sm'
                  : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <span>{genre.icon}</span>
                <span className="truncate">{genre.label}</span>
              </div>
              <p className="text-[10px] text-zinc-400 mt-1 line-clamp-1">{genre.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Pace & Pitch Resonance Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-zinc-800/80">
        {/* Pace */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            Speech Pacing & Speed
          </label>
          <div className="grid grid-cols-4 gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs font-mono">
            {(['0.8x', '1.0x', '1.15x', '1.3x'] as SpeechPace[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => updateOption('pace', p)}
                className={`py-1 rounded text-center transition cursor-pointer ${
                  options.pace === p ? 'bg-cyan-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Pitch Resonance */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5 text-indigo-400" />
            Vocal Resonance
          </label>
          <div className="grid grid-cols-3 gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
            {(
              [
                { id: 'deep', label: 'Deep Bass' },
                { id: 'balanced', label: 'Balanced' },
                { id: 'high', label: 'Crisp High' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => updateOption('pitch', item.id)}
                className={`py-1 rounded text-center transition cursor-pointer text-[11px] font-semibold ${
                  options.pitch === item.id
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Emotion Tone */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            Emotional Energy
          </label>
          <select
            value={options.emotion}
            onChange={(e) => updateOption('emotion', e.target.value as EmotionTone)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500"
          >
            <option value="enthusiastic">Enthusiastic & Bright</option>
            <option value="neutral">Neutral & Objective</option>
            <option value="mysterious">Mysterious & Suspenseful</option>
            <option value="calm">Calming & Serene</option>
            <option value="whisper">Whispered & Intimate</option>
            <option value="dramatic">Dramatic & Solemn</option>
          </select>
        </div>
      </div>

      {/* 3. Real-Time Ambient Soundscape Mixer */}
      <div className="space-y-3 pt-2 border-t border-zinc-800/80">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 uppercase tracking-wider">
            <Wind className="w-3.5 h-3.5 text-emerald-400" />
            Background Ambient Soundscape (In-Browser Web Audio)
          </label>
          <span className="text-[10px] text-emerald-400 font-mono">Real-Time Mix</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {SOUNDSCAPES.map((sound) => (
            <button
              key={sound.id}
              type="button"
              onClick={() => updateOption('ambientSoundscape', sound.id)}
              className={`p-2 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                options.ambientSoundscape === sound.id
                  ? 'bg-emerald-600/20 border-emerald-500 text-white'
                  : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              <span className="text-base">{sound.icon}</span>
              <span className="text-[11px] font-bold truncate">{sound.label}</span>
            </button>
          ))}
        </div>

        {/* Ambient Volume slider when active */}
        {options.ambientSoundscape !== 'none' && (
          <div className="flex items-center gap-3 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
            <span className="text-xs text-zinc-400 shrink-0">Soundscape Volume:</span>
            <input
              type="range"
              min={0.02}
              max={0.4}
              step={0.01}
              value={options.ambientVolume}
              onChange={(e) => updateOption('ambientVolume', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded appearance-none cursor-pointer accent-emerald-500"
            />
            <span className="text-xs font-mono text-emerald-400 w-12 text-right">
              {Math.round(options.ambientVolume * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* 4. Audio Quality & Script Auto-Tagging Helpers */}
      <div className="pt-2 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
            <input
              type="checkbox"
              checked={options.normalizeAudio}
              onChange={(e) => updateOption('normalizeAudio', e.target.checked)}
              className="accent-violet-600 rounded cursor-pointer"
            />
            <span>Broadcast Loudness Normalization (-14 LUFS)</span>
          </label>
        </div>

        {onAutoInsertVocalTags && (
          <button
            type="button"
            onClick={onAutoInsertVocalTags}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-violet-600 hover:text-white text-zinc-300 transition cursor-pointer font-medium"
            title="Auto-insert natural <laugh>, <breath>, and |yeah| into dialogue"
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>Auto-Enhance Script with Vocal Bursts</span>
          </button>
        )}
      </div>
    </div>
  );
};
