import React from 'react';
import {
  Layers,
  Play,
  Sparkles,
  ArrowRight,
  Headphones,
  CheckCircle2,
  Clock,
  Mic,
  Copy,
  Trash2,
  Infinity as InfinityIcon,
} from 'lucide-react';
import { AudioSeries } from '../types/audio';
import { FEATURED_SERIES_TEMPLATES } from '../data/seriesTemplates';
import { PlayerTrack } from './AudioPlayerBar';

interface SeriesLibraryProps {
  userSeriesList: AudioSeries[];
  onSelectSeries: (series: AudioSeries) => void;
  onDeleteSeries?: (seriesId: string) => void;
  onPlayTrack: (track: PlayerTrack) => void;
  onNewSeries: () => void;
}

export const SeriesLibrary: React.FC<SeriesLibraryProps> = ({
  userSeriesList,
  onSelectSeries,
  onDeleteSeries,
  onPlayTrack,
  onNewSeries,
}) => {
  const playSeriesFirstEpisode = (series: AudioSeries) => {
    const epWithAudio = series.episodes.find((e) => e.audioBase64 || e.audioUrl);
    if (epWithAudio) {
      onPlayTrack({
        id: epWithAudio.id,
        title: `${series.title}: ${epWithAudio.title}`,
        subtitle: `${series.language} · Episode ${epWithAudio.episodeNumber}`,
        audioBase64: epWithAudio.audioBase64,
        audioUrl: epWithAudio.audioUrl,
        mimeType: epWithAudio.mimeType || 'audio/wav',
      });
    } else {
      onSelectSeries(series);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold mb-2">
            <InfinityIcon className="w-3.5 h-3.5" />
            Unlimited Audio Series Creation & Playback
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Audio Series Library</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Browse ready-made series templates, manage your custom productions, and listen to generated episodes.
          </p>
        </div>

        <button
          onClick={onNewSeries}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-900/40 transition cursor-pointer self-start md:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>Create New Series</span>
        </button>
      </div>

      {/* Your Series Section */}
      {userSeriesList.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-violet-400" />
              <span>Your Active Productions ({userSeriesList.length})</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {userSeriesList.map((series) => {
              const renderedCount = series.episodes.filter((e) => e.audioBase64 || e.audioUrl).length;

              return (
                <div
                  key={series.id}
                  className="rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-violet-500/50 p-5 space-y-4 transition shadow-lg group relative flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-violet-950/60 text-violet-300 font-bold border border-violet-800/60">
                        {series.genre}
                      </span>
                      <span className="text-[11px] text-zinc-400 font-medium">
                        {series.language}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-violet-300 transition line-clamp-1">
                        {series.title}
                      </h3>
                      <p className="text-xs text-zinc-400 line-clamp-2 mt-1">
                        {series.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-zinc-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-zinc-400" />
                        {series.episodes.length} Episodes
                      </span>
                      <span className="flex items-center gap-1">
                        <Headphones className="w-3.5 h-3.5 text-emerald-400" />
                        {renderedCount} / {series.episodes.length} Audio Ready
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                    <button
                      onClick={() => onSelectSeries(series)}
                      className="flex items-center gap-1.5 text-xs font-bold text-violet-400 hover:text-violet-300 transition cursor-pointer"
                    >
                      <span>Open in Studio</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-2">
                      {renderedCount > 0 && (
                        <button
                          onClick={() => playSeriesFirstEpisode(series)}
                          className="p-2 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white transition cursor-pointer"
                          title="Play Series"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                      )}
                      {onDeleteSeries && (
                        <button
                          onClick={() => onDeleteSeries(series.id)}
                          className="p-2 rounded-lg text-zinc-500 hover:text-red-400 transition"
                          title="Delete Series"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Featured Templates Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-400" />
              <span>Featured Series Blueprints & Templates</span>
            </h2>
            <p className="text-xs text-zinc-400">
              Pre-crafted multi-episode stories and podcast series ready to edit, cast, and generate with zero credits.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FEATURED_SERIES_TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.id}
              className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-6 space-y-4 hover:border-violet-500/50 transition shadow-xl flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-bold border border-violet-500/30">
                      {tmpl.genre}
                    </span>
                    <span className="text-xs text-zinc-400 font-semibold">{tmpl.language}</span>
                  </div>
                  <span className="text-xs font-mono text-zinc-400">
                    {tmpl.episodes.length} Episodes
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">{tmpl.title}</h3>
                  <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed">
                    {tmpl.description}
                  </p>
                </div>

                {/* Cast info */}
                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-violet-400" />
                    <span className="text-zinc-200 font-semibold">{tmpl.speaker1.name}</span>
                    <span className="text-zinc-400">({tmpl.speaker1.voice})</span>
                  </div>
                  {tmpl.speaker2 && (
                    <div className="flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-zinc-200 font-semibold">{tmpl.speaker2.name}</span>
                      <span className="text-zinc-400">({tmpl.speaker2.voice})</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {tmpl.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded bg-zinc-800/70 text-zinc-400"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => onSelectSeries(tmpl)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-violet-950/50 transition cursor-pointer"
                >
                  <span>Open in Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
