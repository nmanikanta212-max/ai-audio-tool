import React, { useState } from 'react';
import {
  Sparkles,
  Volume2,
  Mic,
  Languages,
  Sliders,
  Play,
  Download,
  RotateCcw,
  Plus,
  Trash2,
  MessageSquare,
  User,
  Wand2,
  Loader2,
  CheckCircle2,
  Infinity as InfinityIcon,
  Clock,
  Flame,
  Layers,
  ChevronRight,
} from 'lucide-react';
import {
  AVAILABLE_VOICES,
  POPULAR_LANGUAGES,
  VoiceOption,
  GenerationOptions,
  DEFAULT_GENERATION_OPTIONS,
} from '../types/audio';
import { PlayerTrack } from './AudioPlayerBar';
import { estimateDuration } from '../utils/audioUtils';
import { GenerationOptionsPanel } from './GenerationOptionsPanel';
import confetti from 'canvas-confetti';

interface QuickTTSStudioProps {
  onPlayTrack: (track: PlayerTrack) => void;
  onSaveToLibrary?: (clip: any) => void;
}

export const QuickTTSStudio: React.FC<QuickTTSStudioProps> = ({ onPlayTrack, onSaveToLibrary }) => {
  const [mode, setMode] = useState<'solo' | 'dialogue'>('solo');
  const [selectedLanguage, setSelectedLanguage] = useState('English (US)');
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [genderFilter, setGenderFilter] = useState<'All' | 'Male' | 'Female'>('All');
  const [stylePreset, setStylePreset] = useState('Clear, engaging and natural');

  // Duration settings (min 10 min, max 30 min)
  const [targetMinutes, setTargetMinutes] = useState<number>(10);
  const [isLongformEngineActive, setIsLongformEngineActive] = useState<boolean>(true);

  // Advanced Generation Options
  const [generationOptions, setGenerationOptions] = useState<GenerationOptions>(DEFAULT_GENERATION_OPTIONS);
  const [showOptionsPanel, setShowOptionsPanel] = useState<boolean>(false);

  const [soloText, setSoloText] = useState(
    `Welcome to VoxInfinite, the zero-credit limit AI audio studio. You can generate unlimited voiceovers, podcasts, and audio series in any language completely free!

In today's feature, we explore how neural speech synthesizers are transforming the entertainment and audio fiction landscape. From full-cast dramatic screenplays with natural chuckles and breaths, to continuous 10-to-30 minute educational audio series, the creative horizon is completely boundless.

Sit back, relax, and immerse yourself in studio-grade 24kHz audio synthesis crafted for podcasters, storytellers, and creators worldwide.`
  );

  // Dialogue mode state: Male and Female casting
  const [speaker1, setSpeaker1] = useState({
    name: 'Alex',
    gender: 'Male' as 'Male' | 'Female',
    voice: 'Charon',
    style: 'Deep, cinematic, contemplative host',
  });
  const [speaker2, setSpeaker2] = useState({
    name: 'Sam',
    gender: 'Female' as 'Male' | 'Female',
    voice: 'Kore',
    style: 'Articulate, vibrant and inquisitive co-host',
  });

  const [dialogueLines, setDialogueLines] = useState<Array<{ id: string; speaker: string; text: string; styleCue?: string }>>([
    {
      id: 'd1',
      speaker: 'Alex',
      text: 'Welcome to VoxInfinite. Today we are exploring extended 10-to-30 minute audio production. <breath> Sam, have you ever experienced an audio generator with zero credit caps?',
      styleCue: 'deep cinematic tone',
    },
    {
      id: 'd2',
      speaker: 'Sam',
      text: '|Yeah|, it is unprecedented! Most platforms restrict you to two minutes before hitting a paywall. Here, we can produce complete 10-to-30 minute episodes.',
      styleCue: 'enthusiastic and upbeat',
    },
    {
      id: 'd3',
      speaker: 'Alex',
      text: 'And notice the voice contrast between my deeper male cadence and your articulate female voice. It sounds just like a studio broadcast.',
      styleCue: 'smiling, warm',
    },
    {
      id: 'd4',
      speaker: 'Sam',
      text: 'Exactly! <laugh> And with automatic multi-segment audio stitching, listeners get a single continuous WAV audio masterclass.',
      styleCue: 'cheerful, energized',
    },
  ]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter voices by gender
  const filteredVoices = AVAILABLE_VOICES.filter(
    (v) => genderFilter === 'All' || v.gender === genderFilter
  );

  // Word count & duration estimates
  const currentTotalWords =
    mode === 'solo'
      ? soloText.trim().split(/\s+/).filter(Boolean).length
      : dialogueLines.reduce((acc, line) => acc + line.text.trim().split(/\s+/).filter(Boolean).length, 0);

  const estimatedMinutes = Math.max(0.5, (currentTotalWords / 140)).toFixed(1);

  // Style presets list
  const STYLE_PRESETS = [
    { label: 'Natural & Engaging', value: 'Clear, engaging, warm and natural pacing' },
    { label: 'Cinematic Movie Trailer', value: 'Deep, cinematic, dramatic tension with deliberate pauses' },
    { label: 'Calm ASMR / Meditation', value: 'Gentle, soft whisper-like cadence with tranquil breaths' },
    { label: 'Podcast Host', value: 'Lively, friendly, charismatic and conversational' },
    { label: 'Breaking News Anchor', value: 'Crisp, articulate, authoritative and fast-paced' },
    { label: 'Storyteller / Fantasy', value: 'Expressive, mysterious, rich emotional cadence' },
  ];

  // Insert vocal tag at cursor or end of text
  const insertVocalTag = (tag: string) => {
    if (mode === 'solo') {
      setSoloText((prev) => `${prev} ${tag} `);
    } else {
      setDialogueLines((prev) => {
        if (prev.length === 0) return prev;
        const lastIdx = prev.length - 1;
        const updated = [...prev];
        updated[lastIdx] = {
          ...updated[lastIdx],
          text: `${updated[lastIdx].text} ${tag} `,
        };
        return updated;
      });
    }
  };

  // Auto insert natural vocal tags into script
  const handleAutoInsertVocalTags = () => {
    if (mode === 'solo') {
      const sentences = soloText.split('. ');
      const enhanced = sentences
        .map((s, idx) => {
          if (idx % 3 === 0 && idx > 0 && !s.includes('<')) return `${s}. <breath>`;
          if (idx % 5 === 0 && idx > 0 && !s.includes('<')) return `${s}. <laugh>`;
          return s;
        })
        .join('. ');
      setSoloText(enhanced);
    } else {
      setDialogueLines((prev) =>
        prev.map((line, idx) => {
          if (idx % 2 === 0 && !line.text.includes('<') && !line.text.includes('|')) {
            return { ...line, text: `${line.text} <breath>` };
          }
          if (idx % 3 === 0 && !line.text.includes('<') && !line.text.includes('|')) {
            return { ...line, text: `|yeah|, ${line.text}` };
          }
          return line;
        })
      );
    }
    setSuccessMsg('Natural vocal bursts (<breath>, <laugh>, |yeah|) inserted into script!');
  };

  // AI Script Expander to 10-30 min
  const handleExpandToTargetDuration = async () => {
    setIsExpanding(true);
    setErrorMsg(null);
    try {
      const topicText =
        mode === 'solo'
          ? soloText.slice(0, 300)
          : dialogueLines.map((l) => `${l.speaker}: ${l.text}`).slice(0, 4).join('\n');

      const res = await fetch('/api/expand-script-longform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicText || 'Exploring cutting-edge technology and human storytelling',
          targetMinutes,
          format: mode,
          speaker1,
          speaker2,
          language: selectedLanguage,
          genre: generationOptions.genrePreset,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to expand script');

      if (mode === 'solo') {
        const fullNarration = (data.acts || [])
          .map((act: any) => `## ${act.actTitle}\n\n${act.narration || ''}`)
          .join('\n\n');
        setSoloText(fullNarration || soloText);
      } else {
        const expandedDialogue: Array<{ id: string; speaker: string; text: string; styleCue?: string }> = [];
        (data.acts || []).forEach((act: any, aIdx: number) => {
          (act.dialogue || []).forEach((line: any, lIdx: number) => {
            expandedDialogue.push({
              id: `exp-${aIdx}-${lIdx}-${Date.now()}`,
              speaker: line.speaker || speaker1.name,
              text: line.text || '',
              styleCue: line.styleCue || 'conversational',
            });
          });
        });
        if (expandedDialogue.length > 0) {
          setDialogueLines(expandedDialogue);
        }
      }

      setSuccessMsg(
        `Script successfully expanded for a ~${targetMinutes}-minute continuous audio presentation!`
      );
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Script expansion failed.');
    } finally {
      setIsExpanding(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (isLongformEngineActive) {
        // Use Longform Concatenation Engine
        const res = await fetch('/api/generate-longform-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode,
            soloText: mode === 'solo' ? soloText : undefined,
            dialogueLines: mode === 'dialogue' ? dialogueLines : undefined,
            speaker1,
            speaker2,
            language: selectedLanguage,
            targetMinutes,
            genrePreset: generationOptions.genrePreset,
            pace: generationOptions.pace,
            pitch: generationOptions.pitch,
            emotion: generationOptions.emotion,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to generate longform audio');

        const mins = Math.round((data.durationSeconds || 0) / 60);
        setSuccessMsg(
          `Longform audio generated! (${mins} min audio synthesized across ${data.segmentCount} segments, zero credits limit).`
        );
        confetti({ particleCount: 50, spread: 80, origin: { y: 0.8 } });

        onPlayTrack({
          id: `longform-${Date.now()}`,
          title: mode === 'solo' ? soloText.slice(0, 36) + '...' : `${speaker1.name} & ${speaker2.name} Episode`,
          subtitle: `${selectedLanguage} · Longform (${mins || targetMinutes} min audio)`,
          audioBase64: data.audioBase64,
          mimeType: data.mimeType || 'audio/wav',
        });
      } else {
        // Standard generation
        if (mode === 'solo') {
          const res = await fetch('/api/generate-speech', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: soloText,
              voice: selectedVoice,
              style: stylePreset,
              language: selectedLanguage,
              genrePreset: generationOptions.genrePreset,
              pace: generationOptions.pace,
              pitch: generationOptions.pitch,
              emotion: generationOptions.emotion,
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to generate speech');

          setSuccessMsg('Audio generated successfully!');
          confetti({ particleCount: 30, spread: 60 });
          onPlayTrack({
            id: `solo-${Date.now()}`,
            title: soloText.slice(0, 32) + '...',
            subtitle: `${selectedVoice} (${selectedLanguage})`,
            audioBase64: data.audioBase64,
            mimeType: data.mimeType || 'audio/wav',
          });
        } else {
          const res = await fetch('/api/generate-dialogue-speech', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lines: dialogueLines,
              speaker1,
              speaker2,
              language: selectedLanguage,
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to generate dialogue audio');

          setSuccessMsg('Dialogue audio generated successfully!');
          confetti({ particleCount: 35, spread: 70 });
          onPlayTrack({
            id: `dialogue-${Date.now()}`,
            title: `${speaker1.name} & ${speaker2.name}`,
            subtitle: `Dialogue (${selectedLanguage})`,
            audioBase64: data.audioBase64,
            mimeType: data.mimeType || 'audio/wav',
          });
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred during audio generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTranslateCurrentScript = async () => {
    setIsTranslating(true);
    setErrorMsg(null);
    try {
      const textToTranslate =
        mode === 'solo'
          ? soloText
          : dialogueLines.map((l) => `${l.speaker}: ${l.text}`).join('\n');

      const res = await fetch('/api/translate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToTranslate,
          targetLanguage: selectedLanguage,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to translate script');

      if (mode === 'solo') {
        setSoloText(data.translatedText);
      } else {
        const rawLines = data.translatedText.split('\n').filter((l: string) => l.trim().length > 0);
        const parsed = rawLines.map((line: string, idx: number) => {
          const colonIdx = line.indexOf(':');
          if (colonIdx > 0) {
            const spk = line.slice(0, colonIdx).trim();
            const txt = line.slice(colonIdx + 1).trim();
            return {
              id: `trans-${idx}-${Date.now()}`,
              speaker: spk.toLowerCase().includes(speaker1.name.toLowerCase()) ? speaker1.name : speaker2.name,
              text: txt,
            };
          }
          return {
            id: `trans-${idx}-${Date.now()}`,
            speaker: idx % 2 === 0 ? speaker1.name : speaker2.name,
            text: line.trim(),
          };
        });
        setDialogueLines(parsed);
      }
      setSuccessMsg(`Script translated naturally to ${selectedLanguage}!`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Translation failed.');
    } finally {
      setIsTranslating(false);
    }
  };

  const addDialogueLine = () => {
    const nextSpeaker = dialogueLines.length % 2 === 0 ? speaker1.name : speaker2.name;
    setDialogueLines([
      ...dialogueLines,
      {
        id: `line-${Date.now()}`,
        speaker: nextSpeaker,
        text: '',
        styleCue: 'conversational',
      },
    ]);
  };

  const removeDialogueLine = (index: number) => {
    setDialogueLines(dialogueLines.filter((_, i) => i !== index));
  };

  const updateDialogueLine = (index: number, field: string, value: string) => {
    const updated = [...dialogueLines];
    updated[index] = { ...updated[index], [field]: value };
    setDialogueLines(updated);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Hero Banner with Duration & Gender Calling */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-950/80 via-indigo-950/60 to-zinc-950 border border-violet-800/40 p-6 md:p-8 shadow-2xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1">
                <InfinityIcon className="w-3.5 h-3.5" />
                Zero Credits Limit · 100% Free
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Min 10 Min — Max 30 Min Audio Engine
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Long-Form AI Audio Voice Studio
            </h1>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Generate long-form voiceovers from <strong>10 to 30 minutes</strong> with authentic Male and Female voices,
              multi-speaker dialogues, and seamless audio stitching.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-2 bg-zinc-900/90 p-1.5 rounded-xl border border-zinc-800 self-stretch lg:self-auto justify-center">
            <button
              onClick={() => setMode('solo')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                mode === 'solo'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-900/50'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              Solo (Male / Female)
            </button>
            <button
              onClick={() => setMode('dialogue')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                mode === 'dialogue'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-900/50'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Male + Female Dialogue
            </button>
          </div>
        </div>

        {/* Longform Duration Control Strip (10 min to 30 min) */}
        <div className="mt-6 pt-5 border-t border-zinc-800/80 grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/60">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-cyan-400" />
                Target Duration:
              </span>
              <span className="text-sm font-mono font-extrabold text-cyan-400">
                {targetMinutes} Minutes
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Min 10 Min · Max 30 Min long-form audio synthesis
            </p>
          </div>

          {/* Slider */}
          <div className="space-y-1">
            <input
              type="range"
              min={10}
              max={30}
              step={1}
              value={targetMinutes}
              onChange={(e) => setTargetMinutes(Number(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-[10px] font-mono text-zinc-500">
              <span>10m (Min)</span>
              <span>15m</span>
              <span>20m</span>
              <span>25m</span>
              <span>30m (Max)</span>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center justify-end gap-1.5">
            {[10, 15, 20, 30].map((mins) => (
              <button
                key={mins}
                onClick={() => setTargetMinutes(mins)}
                className={`px-2.5 py-1 text-xs rounded-lg font-mono font-bold transition cursor-pointer ${
                  targetMinutes === mins
                    ? 'bg-cyan-500 text-zinc-950 shadow-md shadow-cyan-950/50'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Voice Casting (Male & Female) & Language (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Language Selector */}
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Languages className="w-4 h-4 text-violet-400" />
              Language & Accent
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-violet-500 font-medium"
            >
              {POPULAR_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.name}>
                  {lang.flag} {lang.name} ({lang.nativeName})
                </option>
              ))}
            </select>
          </div>

          {/* Solo Voice Casting with Male / Female Filter */}
          {mode === 'solo' ? (
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-violet-400" />
                  Voice Persona
                </label>

                {/* Male / Female Filter */}
                <div className="flex bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 text-[11px]">
                  {(['All', 'Male', 'Female'] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setGenderFilter(g)}
                      className={`px-2 py-0.5 rounded transition ${
                        genderFilter === g
                          ? 'bg-violet-600 text-white font-bold'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {g === 'Male' ? '👨 Male' : g === 'Female' ? '👩 Female' : 'All'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {filteredVoices.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVoice(v.id)}
                    className={`flex items-start justify-between p-3 rounded-lg border transition cursor-pointer text-left ${
                      selectedVoice === v.id
                        ? 'bg-violet-600/20 border-violet-500 text-white'
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{v.name}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                            v.gender === 'Male'
                              ? 'bg-blue-950/60 text-blue-300 border border-blue-800/50'
                              : 'bg-pink-950/60 text-pink-300 border border-pink-800/50'
                          }`}
                        >
                          {v.gender === 'Male' ? '👨 Male' : '👩 Female'}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1">{v.tone}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Style Preset */}
              <div className="space-y-1.5 pt-2 border-t border-zinc-800">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-violet-400" />
                  Voice Atmosphere
                </label>
                <select
                  value={stylePreset}
                  onChange={(e) => setStylePreset(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-violet-500"
                >
                  {STYLE_PRESETS.map((p, i) => (
                    <option key={i} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            /* Dialogue Mode: Male + Female Cast */
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 space-y-4">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-violet-400" />
                  Dual Cast: Male + Female
                </span>
                <span className="text-[10px] text-cyan-400 font-mono">Duet Broadcast</span>
              </label>

              {/* Speaker 1 (Male default) */}
              <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-blue-900/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-blue-300">Speaker 1</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-800/40">
                      👨 {speaker1.gender}
                    </span>
                  </div>
                  <select
                    value={speaker1.voice}
                    onChange={(e) => setSpeaker1({ ...speaker1, voice: e.target.value })}
                    className="bg-zinc-900 border border-zinc-700 text-xs text-white rounded px-2 py-0.5"
                  >
                    {AVAILABLE_VOICES.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.gender})
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  value={speaker1.name}
                  onChange={(e) => setSpeaker1({ ...speaker1, name: e.target.value })}
                  placeholder="Speaker 1 Name"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-white"
                />
              </div>

              {/* Speaker 2 (Female default) */}
              <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-pink-900/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-pink-300">Speaker 2</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-pink-950 text-pink-300 border border-pink-800/40">
                      👩 {speaker2.gender}
                    </span>
                  </div>
                  <select
                    value={speaker2.voice}
                    onChange={(e) => setSpeaker2({ ...speaker2, voice: e.target.value })}
                    className="bg-zinc-900 border border-zinc-700 text-xs text-white rounded px-2 py-0.5"
                  >
                    {AVAILABLE_VOICES.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.gender})
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  value={speaker2.name}
                  onChange={(e) => setSpeaker2({ ...speaker2, name: e.target.value })}
                  placeholder="Speaker 2 Name"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-white"
                />
              </div>
            </div>
          )}

          {/* Vocal Tags Helper Toolbar */}
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 space-y-2.5">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              1-Click Vocal Bursts & Natural Pauses
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { tag: '<laugh>', label: '😆 <laugh>' },
                { tag: '<gasp>', label: '😲 <gasp>' },
                { tag: '<breath>', label: '💨 <breath>' },
                { tag: '|yeah|', label: '👍 |yeah|' },
                { tag: '|mhm|', label: '🤝 |mhm|' },
              ].map((item) => (
                <button
                  key={item.tag}
                  type="button"
                  onClick={() => insertVocalTag(item.tag)}
                  className="px-2.5 py-1 text-xs font-mono rounded bg-zinc-800 hover:bg-violet-600 hover:text-white text-zinc-300 border border-zinc-700 transition cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Script Workspace (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 md:p-6 space-y-5">
            {/* Header with Words Meter & Expand Action */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Script Content
                </span>
                <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[11px] font-mono text-zinc-300">
                  {currentTotalWords} words (~{estimatedMinutes} mins)
                </span>
                <span className="text-[11px] text-cyan-400 font-mono">
                  Target: {targetMinutes} mins
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExpandToTargetDuration}
                  disabled={isExpanding}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-cyan-950/50 transition cursor-pointer disabled:opacity-50"
                  title={`AI Expand script to hit ${targetMinutes} minutes`}
                >
                  {isExpanding ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Wand2 className="w-3.5 h-3.5 text-cyan-200" />
                  )}
                  <span>AI Expand to {targetMinutes} Mins</span>
                </button>

                <button
                  type="button"
                  onClick={handleTranslateCurrentScript}
                  disabled={isTranslating}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs transition cursor-pointer disabled:opacity-50"
                >
                  {isTranslating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Languages className="w-3 h-3" />}
                  <span>Translate</span>
                </button>
              </div>
            </div>

            {/* Script Text Area */}
            {mode === 'solo' ? (
              <div className="space-y-3">
                <textarea
                  rows={12}
                  value={soloText}
                  onChange={(e) => setSoloText(e.target.value)}
                  placeholder="Type or paste your narrative script. Click 'AI Expand to Target Mins' to generate a full 10-to-30 minute master script..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-violet-500 leading-relaxed font-sans"
                />
              </div>
            ) : (
              /* Dialogue Lines List */
              <div className="space-y-3">
                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {dialogueLines.map((line, idx) => (
                    <div
                      key={line.id}
                      className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <select
                          value={line.speaker}
                          onChange={(e) => updateDialogueLine(idx, 'speaker', e.target.value)}
                          className={`text-xs font-bold rounded px-2.5 py-1 border ${
                            line.speaker.toLowerCase() === speaker1.name.toLowerCase()
                              ? 'bg-blue-950/40 border-blue-800 text-blue-300'
                              : 'bg-pink-950/40 border-pink-800 text-pink-300'
                          }`}
                        >
                          <option value={speaker1.name}>{speaker1.name} (👨 Male)</option>
                          <option value={speaker2.name}>{speaker2.name} (👩 Female)</option>
                        </select>

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={line.styleCue || ''}
                            onChange={(e) => updateDialogueLine(idx, 'styleCue', e.target.value)}
                            placeholder="Emotion / Delivery cue"
                            className="text-[11px] bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5 text-zinc-300 placeholder-zinc-600 w-36"
                          />
                          <button
                            onClick={() => removeDialogueLine(idx)}
                            className="text-zinc-500 hover:text-red-400 p-1 transition"
                            title="Delete Line"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <textarea
                        rows={2}
                        value={line.text}
                        onChange={(e) => updateDialogueLine(idx, 'text', e.target.value)}
                        placeholder="Spoken words... (e.g. Look at that! <gasp> |yeah|)"
                        className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg p-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500"
                      />
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addDialogueLine}
                  className="w-full py-2.5 flex items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 hover:border-violet-500 text-xs text-zinc-400 hover:text-violet-300 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add Dialogue Turn
                </button>
              </div>
            )}

            {/* Notifications */}
            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-xs text-red-300">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                {successMsg}
              </div>
            )}

            {/* Advanced Generation Options Toggle */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowOptionsPanel(!showOptionsPanel)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 hover:border-violet-500/50 text-xs font-semibold text-zinc-300 transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-violet-400" />
                  <span>Audio Generation Options & Ambient Soundscapes</span>
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-300 font-mono">
                    {generationOptions.genrePreset} · {generationOptions.pace} · {generationOptions.pitch} · soundscape: {generationOptions.ambientSoundscape}
                  </span>
                </div>
                <span className="text-zinc-400 text-xs font-bold">{showOptionsPanel ? '▲ Hide Options' : '▼ Customize Options'}</span>
              </button>

              {showOptionsPanel && (
                <div className="mt-3">
                  <GenerationOptionsPanel
                    options={generationOptions}
                    onChangeOptions={setGenerationOptions}
                    onAutoInsertVocalTags={handleAutoInsertVocalTags}
                    onImportText={(txt) => setSoloText(txt)}
                  />
                </div>
              )}
            </div>

            {/* Bottom Generate Controls */}
            <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <InfinityIcon className="w-4 h-4 text-emerald-400" />
                <span>Zero Credits Limit · Continuous {targetMinutes}-Min Audio Concatenation</span>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || isExpanding}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white font-bold text-xs shadow-xl shadow-cyan-950/50 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Synthesizing Longform Audio ({targetMinutes}m)...</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" />
                    <span>Generate {targetMinutes}-Min Audio (Free)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
