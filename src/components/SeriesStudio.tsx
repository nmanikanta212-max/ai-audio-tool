import React, { useState } from 'react';
import {
  Layers,
  Sparkles,
  Play,
  Volume2,
  Download,
  Plus,
  Trash2,
  Wand2,
  Languages,
  Mic,
  Loader2,
  CheckCircle2,
  RotateCcw,
  Sliders,
  ChevronRight,
  Headphones,
  FileText,
  Clock,
  Infinity as InfinityIcon,
  FastForward,
} from 'lucide-react';
import {
  AudioSeries,
  Episode,
  DialogueLine,
  AVAILABLE_VOICES,
  POPULAR_LANGUAGES,
  GenerationOptions,
  DEFAULT_GENERATION_OPTIONS,
} from '../types/audio';
import { PlayerTrack } from './AudioPlayerBar';
import { downloadBase64Audio, formatTime } from '../utils/audioUtils';
import { GenerationOptionsPanel } from './GenerationOptionsPanel';
import confetti from 'canvas-confetti';

interface SeriesStudioProps {
  currentSeries: AudioSeries;
  onUpdateSeries: (updated: AudioSeries) => void;
  onPlayTrack: (track: PlayerTrack) => void;
}

export const SeriesStudio: React.FC<SeriesStudioProps> = ({
  currentSeries,
  onUpdateSeries,
  onPlayTrack,
}) => {
  const [selectedEpIndex, setSelectedEpIndex] = useState(0);
  const [isGeneratingAiScript, setIsGeneratingAiScript] = useState(false);
  const [isExpandingEp, setIsExpandingEp] = useState(false);
  const [showAiSeriesModal, setShowAiSeriesModal] = useState(false);

  // AI Generator modal state
  const [aiTopic, setAiTopic] = useState('');
  const [aiGenre, setAiGenre] = useState('Sci-Fi Mystery');
  const [aiEpisodesCount, setAiEpisodesCount] = useState(3);
  const [aiFormat, setAiFormat] = useState<'dialogue' | 'solo'>('dialogue');
  const [aiTone, setAiTone] = useState('Cinematic, engaging and immersive');
  const [aiTargetMinutes, setAiTargetMinutes] = useState(15);
  const [aiVoicePair, setAiVoicePair] = useState<'Male-Female' | 'Male-Male' | 'Female-Female'>('Male-Female');

  // Audio rendering states
  const [generatingEpId, setGeneratingEpId] = useState<string | null>(null);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Advanced Generation Options for Series
  const [generationOptions, setGenerationOptions] = useState<GenerationOptions>(DEFAULT_GENERATION_OPTIONS);
  const [showOptionsPanel, setShowOptionsPanel] = useState<boolean>(false);

  const activeEpisode = currentSeries.episodes[selectedEpIndex] || currentSeries.episodes[0];
  const activeEpMinutes = activeEpisode.targetDurationMinutes || currentSeries.targetDurationMinutes || 15;

  // Total words in active episode
  const activeEpWords =
    activeEpisode.scriptFormat === 'solo'
      ? (activeEpisode.soloScript || '').trim().split(/\s+/).filter(Boolean).length
      : (activeEpisode.dialogueLines || []).reduce(
          (acc, line) => acc + line.text.trim().split(/\s+/).filter(Boolean).length,
          0
        );
  const estimatedEpMinutes = Math.max(0.5, activeEpWords / 140).toFixed(1);

  // Update top-level series details
  const updateSeriesField = (field: keyof AudioSeries, value: any) => {
    onUpdateSeries({
      ...currentSeries,
      [field]: value,
    });
  };

  // Add new empty episode
  const addEpisode = () => {
    const nextNum = currentSeries.episodes.length + 1;
    const newEp: Episode = {
      id: `ep-${Date.now()}`,
      episodeNumber: nextNum,
      title: `Episode ${nextNum}: Title`,
      synopsis: 'Synopsis for this chapter...',
      scriptFormat: currentSeries.format,
      targetDurationMinutes: 15,
      dialogueLines: [
        {
          id: `line-${Date.now()}-1`,
          speaker: currentSeries.speaker1.name,
          text: 'Welcome to this episode. <breath> Let us dive in.',
          styleCue: 'warm and focused',
        },
        {
          id: `line-${Date.now()}-2`,
          speaker: currentSeries.speaker2?.name || 'Co-Host',
          text: '|Yeah|, I am really excited to explore this together.',
          styleCue: 'enthusiastic',
        },
      ],
      soloScript: 'Welcome back to the series. In today’s chapter, we discover something unexpected...',
    };

    const updatedEps = [...currentSeries.episodes, newEp];
    updateSeriesField('episodes', updatedEps);
    setSelectedEpIndex(updatedEps.length - 1);
  };

  // Delete episode
  const deleteEpisode = (index: number) => {
    if (currentSeries.episodes.length <= 1) {
      setFeedbackMsg({ type: 'error', text: 'An audio series must have at least one episode.' });
      return;
    }
    const updated = currentSeries.episodes.filter((_, i) => i !== index);
    const renumbered = updated.map((ep, i) => ({ ...ep, episodeNumber: i + 1 }));
    updateSeriesField('episodes', renumbered);
    setSelectedEpIndex(Math.max(0, index - 1));
  };

  // Update currently selected episode
  const updateActiveEpisode = (field: keyof Episode, value: any) => {
    const updatedEps = [...currentSeries.episodes];
    updatedEps[selectedEpIndex] = {
      ...updatedEps[selectedEpIndex],
      [field]: value,
    };
    updateSeriesField('episodes', updatedEps);
  };

  // Dialogue lines update in active episode
  const updateDialogueLine = (lineIdx: number, field: keyof DialogueLine, value: string) => {
    const ep = activeEpisode;
    if (!ep || !ep.dialogueLines) return;
    const updatedLines = [...ep.dialogueLines];
    updatedLines[lineIdx] = {
      ...updatedLines[lineIdx],
      [field]: value,
    };
    updateActiveEpisode('dialogueLines', updatedLines);
  };

  const addDialogueLineToActiveEp = () => {
    const ep = activeEpisode;
    const lines = ep.dialogueLines || [];
    const nextSpeaker =
      lines.length % 2 === 0
        ? currentSeries.speaker1.name
        : currentSeries.speaker2?.name || currentSeries.speaker1.name;

    const newLine: DialogueLine = {
      id: `line-${Date.now()}`,
      speaker: nextSpeaker,
      text: '',
      styleCue: 'conversational',
    };
    updateActiveEpisode('dialogueLines', [...lines, newLine]);
  };

  const removeDialogueLineFromActiveEp = (lineIdx: number) => {
    const ep = activeEpisode;
    if (!ep || !ep.dialogueLines) return;
    updateActiveEpisode(
      'dialogueLines',
      ep.dialogueLines.filter((_, i) => i !== lineIdx)
    );
  };

  const insertVocalTag = (tag: string) => {
    const ep = activeEpisode;
    if (ep.scriptFormat === 'solo') {
      updateActiveEpisode('soloScript', `${ep.soloScript || ''} ${tag} `);
    } else {
      const lines = ep.dialogueLines || [];
      if (lines.length === 0) return;
      const lastIdx = lines.length - 1;
      const updatedLines = [...lines];
      updatedLines[lastIdx] = {
        ...updatedLines[lastIdx],
        text: `${updatedLines[lastIdx].text} ${tag} `,
      };
      updateActiveEpisode('dialogueLines', updatedLines);
    }
  };

  // AI Expand Episode to 10-30 Minutes
  const handleExpandEpisodeScript = async () => {
    setIsExpandingEp(true);
    setFeedbackMsg(null);
    try {
      const topicContext = `${currentSeries.title} - ${activeEpisode.title}. ${activeEpisode.synopsis}`;
      const targetMins = activeEpisode.targetDurationMinutes || 15;

      const res = await fetch('/api/expand-script-longform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicContext,
          targetMinutes: targetMins,
          format: activeEpisode.scriptFormat,
          speaker1: currentSeries.speaker1,
          speaker2: currentSeries.speaker2,
          language: currentSeries.language,
          genre: currentSeries.genre,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to expand episode script');

      if (activeEpisode.scriptFormat === 'solo') {
        const fullNarration = (data.acts || [])
          .map((act: any) => `### ${act.actTitle}\n\n${act.narration || ''}`)
          .join('\n\n');
        updateActiveEpisode('soloScript', fullNarration);
      } else {
        const expandedDialogue: DialogueLine[] = [];
        (data.acts || []).forEach((act: any, aIdx: number) => {
          (act.dialogue || []).forEach((line: any, lIdx: number) => {
            expandedDialogue.push({
              id: `dl-exp-${aIdx}-${lIdx}-${Date.now()}`,
              speaker: line.speaker || currentSeries.speaker1.name,
              text: line.text || '',
              styleCue: line.styleCue || 'conversational',
            });
          });
        });
        if (expandedDialogue.length > 0) {
          updateActiveEpisode('dialogueLines', expandedDialogue);
        }
      }

      setFeedbackMsg({
        type: 'success',
        text: `Episode expanded to match ${targetMins}-minute audio duration!`,
      });
    } catch (err: any) {
      console.error(err);
      setFeedbackMsg({ type: 'error', text: err.message || 'Episode expansion failed' });
    } finally {
      setIsExpandingEp(false);
    }
  };

  // Render audio for a single episode (supports 10 to 30 min longform concatenation)
  const renderEpisodeAudio = async (ep: Episode, epIndex: number): Promise<boolean> => {
    setGeneratingEpId(ep.id);
    setFeedbackMsg(null);

    try {
      const targetMins = ep.targetDurationMinutes || currentSeries.targetDurationMinutes || 15;

      const res = await fetch('/api/generate-longform-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: ep.scriptFormat,
          soloText: ep.scriptFormat === 'solo' ? ep.soloScript : undefined,
          dialogueLines: ep.scriptFormat === 'dialogue' ? ep.dialogueLines : undefined,
          speaker1: currentSeries.speaker1,
          speaker2: currentSeries.speaker2 || {
            name: 'Co-Host',
            voice: 'Kore',
            gender: 'Female',
            style: 'conversational co-host',
          },
          language: currentSeries.language,
          targetMinutes: targetMins,
          genrePreset: generationOptions.genrePreset,
          pace: generationOptions.pace,
          pitch: generationOptions.pitch,
          emotion: generationOptions.emotion,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to render longform audio');

      const updatedEps = [...currentSeries.episodes];
      updatedEps[epIndex] = {
        ...updatedEps[epIndex],
        audioBase64: data.audioBase64,
        mimeType: data.mimeType || 'audio/wav',
        duration: data.durationSeconds,
        generatedAt: new Date().toISOString(),
      };
      updateSeriesField('episodes', updatedEps);

      return true;
    } catch (err: any) {
      console.error(err);
      setFeedbackMsg({ type: 'error', text: `Error generating Episode ${ep.episodeNumber}: ${err.message}` });
      return false;
    } finally {
      setGeneratingEpId(null);
    }
  };

  // Generate All Episodes in Batch
  const handleBatchGenerate = async () => {
    setIsBatchGenerating(true);
    setFeedbackMsg(null);
    const total = currentSeries.episodes.length;
    let successfulCount = 0;

    for (let i = 0; i < total; i++) {
      setBatchProgress({ current: i + 1, total });
      const ep = currentSeries.episodes[i];
      const ok = await renderEpisodeAudio(ep, i);
      if (ok) successfulCount++;
    }

    setIsBatchGenerating(false);
    if (successfulCount > 0) {
      confetti({ particleCount: 60, spread: 80, origin: { y: 0.7 } });
      setFeedbackMsg({
        type: 'success',
        text: `Batch rendering complete! ${successfulCount}/${total} episodes generated with zero credit limit.`,
      });
    }
  };

  // AI Series Generator
  const handleGenerateAiSeries = async () => {
    if (!aiTopic.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Please describe the topic or concept for your audio series.' });
      return;
    }

    setIsGeneratingAiScript(true);
    setFeedbackMsg(null);

    try {
      const res = await fetch('/api/generate-series-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic,
          genre: aiGenre,
          language: currentSeries.language,
          episodeCount: aiEpisodesCount,
          format: aiFormat,
          speaker1Name: currentSeries.speaker1.name,
          speaker2Name: currentSeries.speaker2?.name || 'Expert',
          tone: aiTone,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate series');

      const episodesWithIds: Episode[] = data.episodes.map((ep: any, idx: number) => ({
        id: `ep-gen-${idx}-${Date.now()}`,
        episodeNumber: idx + 1,
        title: ep.title || `Episode ${idx + 1}`,
        synopsis: ep.synopsis || '',
        scriptFormat: aiFormat,
        targetDurationMinutes: aiTargetMinutes,
        soloScript: ep.soloScript || '',
        dialogueLines: ep.dialogueScript
          ? ep.dialogueScript.map((l: any, lIdx: number) => ({
              id: `dl-${lIdx}-${Date.now()}`,
              speaker: l.speaker,
              text: l.text,
              styleCue: l.styleCue || 'conversational',
            }))
          : [],
      }));

      // Determine speaker voice based on gender pair
      let s1Voice = currentSeries.speaker1.voice;
      let s2Voice = currentSeries.speaker2?.voice || 'Kore';
      if (aiVoicePair === 'Male-Female') {
        s1Voice = 'Charon'; // Male
        s2Voice = 'Kore'; // Female
      } else if (aiVoicePair === 'Female-Female') {
        s1Voice = 'Kore'; // Female
        s2Voice = 'Zephyr'; // Female
      } else {
        s1Voice = 'Charon'; // Male
        s2Voice = 'Puck'; // Male
      }

      const newSeriesData: AudioSeries = {
        ...currentSeries,
        title: data.seriesTitle || currentSeries.title,
        description: data.seriesDescription || currentSeries.description,
        genre: data.genre || aiGenre,
        format: aiFormat,
        targetDurationMinutes: aiTargetMinutes,
        speaker1: {
          ...currentSeries.speaker1,
          name: data.suggestedSpeaker1?.name || currentSeries.speaker1.name,
          voice: s1Voice,
          gender: aiVoicePair.startsWith('Male') ? 'Male' : 'Female',
          style: data.suggestedSpeaker1?.style || currentSeries.speaker1.style,
        },
        speaker2:
          aiFormat === 'dialogue'
            ? {
                name: data.suggestedSpeaker2?.name || currentSeries.speaker2?.name || 'Sam',
                role: data.suggestedSpeaker2?.role || 'Co-Host',
                voice: s2Voice,
                gender: aiVoicePair.endsWith('Female') ? 'Female' : 'Male',
                style: data.suggestedSpeaker2?.style || 'Articulate co-host',
              }
            : undefined,
        episodes: episodesWithIds,
      };

      onUpdateSeries(newSeriesData);
      setSelectedEpIndex(0);
      setShowAiSeriesModal(false);
      confetti({ particleCount: 50, spread: 75 });
      setFeedbackMsg({
        type: 'success',
        text: `"${newSeriesData.title}" created with ${episodesWithIds.length} episodes (${aiTargetMinutes} min duration target)!`,
      });
    } catch (err: any) {
      console.error(err);
      setFeedbackMsg({ type: 'error', text: err.message || 'AI Series Generation failed' });
    } finally {
      setIsGeneratingAiScript(false);
    }
  };

  const playEpisode = (ep: Episode) => {
    if (!ep.audioBase64 && !ep.audioUrl) {
      setFeedbackMsg({ type: 'error', text: 'Audio not generated yet for this episode. Click "Generate Audio" first!' });
      return;
    }
    onPlayTrack({
      id: ep.id,
      title: `${currentSeries.title}: ${ep.title}`,
      subtitle: `${currentSeries.language} · Episode ${ep.episodeNumber}`,
      audioBase64: ep.audioBase64,
      audioUrl: ep.audioUrl,
      mimeType: ep.mimeType || 'audio/wav',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Top Banner & Quick Actions */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-800 p-6 md:p-8 shadow-2xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-xs font-bold border border-violet-500/30">
                {currentSeries.genre}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold border border-cyan-500/30">
                {currentSeries.language}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono font-semibold flex items-center gap-1">
                <InfinityIcon className="w-3.5 h-3.5" />
                Zero Credits Limit
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-mono font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                10 - 30 Min Episodes
              </span>
            </div>

            <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
              {currentSeries.title}
            </h1>
            <p className="text-sm text-zinc-300 line-clamp-2">
              {currentSeries.description}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => setShowAiSeriesModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-violet-900/40 transition cursor-pointer"
            >
              <Wand2 className="w-4 h-4" />
              <span>AI Producer (10-30m Series)</span>
            </button>

            <button
              onClick={handleBatchGenerate}
              disabled={isBatchGenerating}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-bold border border-zinc-700 transition cursor-pointer disabled:opacity-50"
            >
              {isBatchGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                  <span>
                    Batch Rendering ({batchProgress.current}/{batchProgress.total})
                  </span>
                </>
              ) : (
                <>
                  <FastForward className="w-4 h-4 text-emerald-400" />
                  <span>Batch Render All Episodes</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {feedbackMsg && (
          <div
            className={`mt-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
              feedbackMsg.type === 'error'
                ? 'bg-red-950/60 border border-red-800/80 text-red-200'
                : 'bg-emerald-950/60 border border-emerald-800/80 text-emerald-200'
            }`}
          >
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : null}
            <span>{feedbackMsg.text}</span>
          </div>
        )}
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Episodes Navigator & Series Casting (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Episode Timeline List */}
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-violet-400" />
                Episodes ({currentSeries.episodes.length})
              </span>
              <button
                onClick={addEpisode}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-violet-400" />
                <span>Add Episode</span>
              </button>
            </div>

            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {currentSeries.episodes.map((ep, idx) => {
                const isSelected = idx === selectedEpIndex;
                const hasAudio = !!ep.audioBase64 || !!ep.audioUrl;
                const isRendering = generatingEpId === ep.id;

                return (
                  <div
                    key={ep.id}
                    onClick={() => setSelectedEpIndex(idx)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? 'bg-violet-950/30 border-violet-500 shadow-md shadow-violet-950/50'
                        : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-zinc-400 font-bold">
                          EP {ep.episodeNumber}
                        </span>
                        <span className="text-[10px] text-cyan-400 font-mono">
                          {ep.targetDurationMinutes || 15}m target
                        </span>
                        {hasAudio ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Audio Ready
                          </span>
                        ) : isRendering ? (
                          <span className="text-[10px] text-violet-400 flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Rendering...
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-400">Draft</span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-white truncate mt-0.5">
                        {ep.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {hasAudio && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playEpisode(ep);
                          }}
                          className="p-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition cursor-pointer"
                          title="Play Audio"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteEpisode(idx);
                        }}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 transition"
                        title="Delete Episode"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Voice Casting (Male & Female) */}
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Mic className="w-4 h-4 text-violet-400" />
              Male & Female Voice Casting
            </span>

            {/* Language Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-zinc-400 flex items-center gap-1">
                <Languages className="w-3.5 h-3.5 text-cyan-400" />
                Target Language
              </label>
              <select
                value={currentSeries.language}
                onChange={(e) => updateSeriesField('language', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-violet-500"
              >
                {POPULAR_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.name}>
                    {l.flag} {l.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Speaker 1 Card */}
            <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-blue-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-blue-300">Speaker 1</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-800/40">
                    👨 Male
                  </span>
                </div>
                <select
                  value={currentSeries.speaker1.voice}
                  onChange={(e) =>
                    updateSeriesField('speaker1', {
                      ...currentSeries.speaker1,
                      voice: e.target.value,
                    })
                  }
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
                value={currentSeries.speaker1.name}
                onChange={(e) =>
                  updateSeriesField('speaker1', {
                    ...currentSeries.speaker1,
                    name: e.target.value,
                  })
                }
                placeholder="Character/Host Name"
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-white"
              />
              <input
                type="text"
                value={currentSeries.speaker1.style}
                onChange={(e) =>
                  updateSeriesField('speaker1', {
                    ...currentSeries.speaker1,
                    style: e.target.value,
                  })
                }
                placeholder="Persona/Tone (e.g. Deep noir detective)"
                className="w-full bg-zinc-900/60 border border-zinc-800/80 rounded px-2 py-1 text-[11px] text-zinc-400"
              />
            </div>

            {/* Speaker 2 Card */}
            {currentSeries.format === 'dialogue' && (
              <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-pink-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-pink-300">Speaker 2</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-pink-950 text-pink-300 border border-pink-800/40">
                      👩 Female
                    </span>
                  </div>
                  <select
                    value={currentSeries.speaker2?.voice || 'Kore'}
                    onChange={(e) =>
                      updateSeriesField('speaker2', {
                        ...(currentSeries.speaker2 || { name: 'Co-Host', role: 'Partner', style: '' }),
                        voice: e.target.value,
                      })
                    }
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
                  value={currentSeries.speaker2?.name || 'Co-Host'}
                  onChange={(e) =>
                    updateSeriesField('speaker2', {
                      ...(currentSeries.speaker2 || { role: 'Partner', style: '', voice: 'Kore' }),
                      name: e.target.value,
                    })
                  }
                  placeholder="Speaker 2 Name"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-white"
                />
                <input
                  type="text"
                  value={currentSeries.speaker2?.style || ''}
                  onChange={(e) =>
                    updateSeriesField('speaker2', {
                      ...(currentSeries.speaker2 || { name: 'Co-Host', role: 'Partner', voice: 'Kore' }),
                      style: e.target.value,
                    })
                  }
                  placeholder="Persona/Tone (e.g. Energetic analyst)"
                  className="w-full bg-zinc-900/60 border border-zinc-800/80 rounded px-2 py-1 text-[11px] text-zinc-400"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Episode Script Editor & Audio Generator (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 md:p-6 space-y-5">
            {/* Episode Title & Target Duration Slider */}
            <div className="space-y-3 pb-4 border-b border-zinc-800">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded bg-violet-600/20 text-violet-400 text-xs font-mono font-bold">
                    EPISODE {activeEpisode.episodeNumber}
                  </span>
                  <input
                    type="text"
                    value={activeEpisode.title}
                    onChange={(e) => updateActiveEpisode('title', e.target.value)}
                    placeholder="Episode Title"
                    className="text-lg font-bold text-white bg-transparent border-b border-transparent focus:border-violet-500 focus:outline-none"
                  />
                </div>

                {/* Target Duration Selector (10 to 30 mins) */}
                <div className="flex items-center gap-2 bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-xs text-zinc-400">Target Duration:</span>
                  <select
                    value={activeEpMinutes}
                    onChange={(e) => updateActiveEpisode('targetDurationMinutes', Number(e.target.value))}
                    className="bg-transparent text-xs font-bold text-cyan-300 focus:outline-none"
                  >
                    <option value={10}>10 Minutes</option>
                    <option value={15}>15 Minutes</option>
                    <option value={20}>20 Minutes</option>
                    <option value={25}>25 Minutes</option>
                    <option value={30}>30 Minutes</option>
                  </select>
                </div>
              </div>

              <textarea
                rows={2}
                value={activeEpisode.synopsis}
                onChange={(e) => updateActiveEpisode('synopsis', e.target.value)}
                placeholder="Episode premise or chapter synopsis..."
                className="w-full bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-2.5 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-violet-500"
              />

              {/* Sub-bar with word stats and AI Expand Episode Button */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                <div className="flex items-center gap-2 text-zinc-400">
                  <span className="font-mono text-[11px] text-zinc-300">
                    {activeEpWords} words (~{estimatedEpMinutes} mins)
                  </span>
                  <span>·</span>
                  <span className="text-cyan-400 font-mono text-[11px]">
                    Goal: {activeEpMinutes} mins
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleExpandEpisodeScript}
                  disabled={isExpandingEp}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-cyan-950/50 transition cursor-pointer disabled:opacity-50"
                  title="Automatically generate deep screenplay sections to fill 10-30 minutes"
                >
                  {isExpandingEp ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Wand2 className="w-3.5 h-3.5 text-cyan-200" />
                  )}
                  <span>AI Expand Script to {activeEpMinutes} Mins</span>
                </button>
              </div>
            </div>

            {/* Vocal Tags Helper Bar */}
            <div className="flex flex-wrap items-center gap-2 bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-800/60">
              <span className="text-[11px] text-zinc-400 font-medium">Insert Vocal Burst:</span>
              {[
                { tag: '<laugh>', label: '😆 laugh' },
                { tag: '<gasp>', label: '😲 gasp' },
                { tag: '<breath>', label: '💨 breath' },
                { tag: '|yeah|', label: '👍 yeah' },
                { tag: '|mhm|', label: '🤝 mhm' },
              ].map((v) => (
                <button
                  key={v.tag}
                  type="button"
                  onClick={() => insertVocalTag(v.tag)}
                  className="px-2 py-0.5 text-[11px] font-mono rounded bg-zinc-800 hover:bg-violet-600 hover:text-white text-zinc-300 transition cursor-pointer"
                >
                  {v.label}
                </button>
              ))}
            </div>

            {/* Script Editor Body */}
            {activeEpisode.scriptFormat === 'solo' ? (
              <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                  Narration Script
                </label>
                <textarea
                  rows={10}
                  value={activeEpisode.soloScript || ''}
                  onChange={(e) => updateActiveEpisode('soloScript', e.target.value)}
                  placeholder="Enter the full narration script for this chapter..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-violet-500 leading-relaxed font-sans"
                />
              </div>
            ) : (
              /* Dialogue Lines List */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Dialogue Script (Turn by Turn)
                  </label>
                  <span className="text-xs text-zinc-400">
                    {activeEpisode.dialogueLines?.length || 0} turns
                  </span>
                </div>

                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {(activeEpisode.dialogueLines || []).map((line, lIdx) => (
                    <div
                      key={line.id}
                      className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <select
                          value={line.speaker}
                          onChange={(e) => updateDialogueLine(lIdx, 'speaker', e.target.value)}
                          className={`text-xs font-bold rounded px-2.5 py-1 border ${
                            line.speaker.toLowerCase() === currentSeries.speaker1.name.toLowerCase()
                              ? 'bg-blue-950/40 border-blue-800 text-blue-300'
                              : 'bg-pink-950/40 border-pink-800 text-pink-300'
                          }`}
                        >
                          <option value={currentSeries.speaker1.name}>
                            {currentSeries.speaker1.name} (👨 Male)
                          </option>
                          {currentSeries.speaker2 && (
                            <option value={currentSeries.speaker2.name}>
                              {currentSeries.speaker2.name} (👩 Female)
                            </option>
                          )}
                        </select>

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={line.styleCue || ''}
                            onChange={(e) => updateDialogueLine(lIdx, 'styleCue', e.target.value)}
                            placeholder="Emotion / Delivery cue"
                            className="text-[11px] bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5 text-zinc-300 placeholder-zinc-600 w-36"
                          />
                          <button
                            onClick={() => removeDialogueLineFromActiveEp(lIdx)}
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
                        onChange={(e) => updateDialogueLine(lIdx, 'text', e.target.value)}
                        placeholder="Spoken words... (e.g. Look at that nebula! <gasp> |yeah|)"
                        className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg p-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500"
                      />
                    </div>
                  ))}
                </div>

                <button
                  onClick={addDialogueLineToActiveEp}
                  className="w-full py-2.5 flex items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 hover:border-violet-500 text-xs text-zinc-400 hover:text-violet-300 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add Dialogue Turn
                </button>
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
                  <span>Episode Generation Options & Ambient Soundscapes</span>
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
                    onAutoInsertVocalTags={() => {
                      if (activeEpisode.scriptFormat === 'solo') {
                        const s = (activeEpisode.soloScript || '').split('. ').map((sent, idx) => (idx % 3 === 0 && !sent.includes('<') ? `${sent}. <breath>` : sent)).join('. ');
                        updateActiveEpisode('soloScript', s);
                      } else {
                        const lines = (activeEpisode.dialogueLines || []).map((l, idx) => (idx % 2 === 0 && !l.text.includes('<') ? { ...l, text: `${l.text} <breath>` } : l));
                        updateActiveEpisode('dialogueLines', lines);
                      }
                      setFeedbackMsg({ type: 'success', text: 'Vocal bursts added to episode!' });
                    }}
                    onImportText={(txt) => {
                      if (activeEpisode.scriptFormat === 'solo') {
                        updateActiveEpisode('soloScript', txt);
                      }
                    }}
                  />
                </div>
              )}
            </div>

            {/* Bottom Episode Controls: Audio Generation & Playback */}
            <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {activeEpisode.audioBase64 ? (
                  <button
                    onClick={() => playEpisode(activeEpisode)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 transition cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Play Episode Audio</span>
                  </button>
                ) : null}

                {activeEpisode.audioBase64 ? (
                  <button
                    onClick={() =>
                      downloadBase64Audio(
                        activeEpisode.audioBase64!,
                        `${currentSeries.title}-Ep${activeEpisode.episodeNumber}.wav`
                      )
                    }
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 transition cursor-pointer"
                    title="Download episode WAV"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download WAV</span>
                  </button>
                ) : null}
              </div>

              <button
                onClick={() => renderEpisodeAudio(activeEpisode, selectedEpIndex)}
                disabled={generatingEpId === activeEpisode.id || isBatchGenerating}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-cyan-950/50 transition cursor-pointer disabled:opacity-50"
              >
                {generatingEpId === activeEpisode.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Synthesizing {activeEpMinutes}m Audio...</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" />
                    <span>
                      {activeEpisode.audioBase64
                        ? 'Re-generate Longform Audio'
                        : `Generate ${activeEpMinutes}-Min Audio (Free)`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Series Generator Modal (Supports 10-30 min and Male/Female pairing) */}
      {showAiSeriesModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                  <Wand2 className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">AI Series Producer (10 - 30 Min Episodes)</h3>
                  <p className="text-xs text-zinc-400">Generate full seasons with authentic Male and Female voices</p>
                </div>
              </div>
              <button
                onClick={() => setShowAiSeriesModal(false)}
                className="text-zinc-500 hover:text-white text-xs px-2 py-1 rounded"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">
                  Series Topic or Concept
                </label>
                <textarea
                  rows={3}
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="e.g. A thrilling investigative audio drama about a lost submarine in the Arctic, with high-stakes sonar radio dialogues..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500"
                />
              </div>

              {/* Target Episode Duration Selector */}
              <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    Episode Target Length (Min 10m - Max 30m)
                  </label>
                  <span className="text-xs font-mono font-bold text-cyan-400">
                    {aiTargetMinutes} Minutes
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 15, 20, 30].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setAiTargetMinutes(mins)}
                      className={`py-1.5 text-xs font-mono rounded-lg transition ${
                        aiTargetMinutes === mins
                          ? 'bg-cyan-500 text-zinc-950 font-bold shadow'
                          : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                      }`}
                    >
                      {mins} Mins
                    </button>
                  ))}
                </div>
              </div>

              {/* Voice Casting Gender Pairing */}
              <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-violet-400" />
                  Voice Cast Gender Combination
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Male-Female', label: '👨 Male + 👩 Female' },
                    { id: 'Male-Male', label: '👨 2x Male Voices' },
                    { id: 'Female-Female', label: '👩 2x Female Voices' },
                  ].map((pair) => (
                    <button
                      key={pair.id}
                      type="button"
                      onClick={() => setAiVoicePair(pair.id as any)}
                      className={`py-1.5 px-2 text-[11px] rounded-lg transition ${
                        aiVoicePair === pair.id
                          ? 'bg-violet-600 text-white font-bold'
                          : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                      }`}
                    >
                      {pair.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Genre</label>
                  <select
                    value={aiGenre}
                    onChange={(e) => setAiGenre(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Sci-Fi Mystery">Sci-Fi Mystery</option>
                    <option value="True Crime Thriller">True Crime Thriller</option>
                    <option value="Tech & AI Podcast">Tech & AI Podcast</option>
                    <option value="Language Learning Masterclass">Language Learning Masterclass</option>
                    <option value="Guided Sleep & Meditation">Guided Sleep & Meditation</option>
                    <option value="Historical Drama">Historical Drama</option>
                    <option value="Comedy & Satire">Comedy & Satire</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">
                    Number of Episodes
                  </label>
                  <select
                    value={aiEpisodesCount}
                    onChange={(e) => setAiEpisodesCount(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value={2}>2 Episodes (Mini Series)</option>
                    <option value={3}>3 Episodes (Standard)</option>
                    <option value={4}>4 Episodes</option>
                    <option value={5}>5 Episodes (Full Season)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <InfinityIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero Credits Required</span>
              </div>

              <button
                onClick={handleGenerateAiSeries}
                disabled={isGeneratingAiScript}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-violet-900/40 transition cursor-pointer disabled:opacity-50"
              >
                {isGeneratingAiScript ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Writing {aiTargetMinutes}-Min Scripts...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Season Scripts ({aiTargetMinutes}m)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
