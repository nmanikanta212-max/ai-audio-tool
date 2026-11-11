import React, { useState } from 'react';
import {
  Globe,
  Languages,
  Play,
  Volume2,
  Wand2,
  Check,
  Search,
  Sparkles,
  Loader2,
  Infinity as InfinityIcon,
  Layers,
} from 'lucide-react';
import { POPULAR_LANGUAGES, AVAILABLE_VOICES, LanguageOption } from '../types/audio';
import { PlayerTrack } from './AudioPlayerBar';

interface LanguageHubProps {
  onPlayTrack: (track: PlayerTrack) => void;
  onApplyLanguageToSeries: (langName: string) => void;
}

export const LanguageHub: React.FC<LanguageHubProps> = ({
  onPlayTrack,
  onApplyLanguageToSeries,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [testingLangCode, setTestingLangCode] = useState<string | null>(null);

  // Translation tool state
  const [translateInput, setTranslateInput] = useState(
    'Host Alex: Today on our tech series, we explore how neural speech synthesizers are breaking down language barriers across the world! <laugh>'
  );
  const [translateTarget, setTranslateTarget] = useState('Spanish');
  const [translatedOutput, setTranslatedOutput] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  const filteredLanguages = POPULAR_LANGUAGES.filter((lang) => {
    const matchesSearch =
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = selectedRegion === 'All' || lang.region === selectedRegion;
    return matchesSearch && matchesRegion;
  });

  const regions = ['All', 'Americas', 'Europe', 'Asia', 'Middle East'];

  const testLanguageVoice = async (lang: LanguageOption) => {
    setTestingLangCode(lang.code);
    try {
      const res = await fetch('/api/generate-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: lang.sampleGreeting,
          voice: 'Kore',
          style: `Clear, native, fluent and natural speaker of ${lang.name}`,
          language: lang.name,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate voice demo');

      onPlayTrack({
        id: `demo-${lang.code}-${Date.now()}`,
        title: `${lang.flag} ${lang.name} Voice Demo`,
        subtitle: lang.sampleGreeting,
        audioBase64: data.audioBase64,
        mimeType: data.mimeType || 'audio/wav',
      });
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to generate voice test');
    } finally {
      setTestingLangCode(null);
    }
  };

  const handleTranslate = async () => {
    if (!translateInput.trim()) return;
    setIsTranslating(true);
    try {
      const res = await fetch('/api/translate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: translateInput,
          targetLanguage: translateTarget,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Translation failed');
      setTranslatedOutput(data.translatedText);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Translation failed');
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
      {/* Hero section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-950/70 via-indigo-950/50 to-zinc-950 border border-cyan-800/30 p-6 md:p-8 shadow-2xl">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold">
            <Globe className="w-3.5 h-3.5" />
            Global Polyglot Audio Engine · 60+ Languages
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
            Generate Audio Series in Any Language
          </h1>
          <p className="text-sm text-zinc-300 leading-relaxed">
            VoxInfinite breaks language borders. Produce localized audio series, bilingual language learning
            masterclasses, global podcasts, or translated audio dramas with 100% free unlimited generation.
          </p>
        </div>
      </div>

      {/* Language Explorer Grid */}
      <section className="space-y-5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {regions.map((reg) => (
              <button
                key={reg}
                onClick={() => setSelectedRegion(reg)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer ${
                  selectedRegion === reg
                    ? 'bg-violet-600 text-white'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                {reg}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search language or country..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredLanguages.map((lang) => {
            const isTesting = testingLangCode === lang.code;

            return (
              <div
                key={lang.code}
                className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-cyan-500/50 transition shadow-md flex flex-col justify-between gap-3 group"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{lang.flag}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                      {lang.code}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition">
                      {lang.name}
                    </h3>
                    <p className="text-xs text-zinc-400 font-medium">{lang.nativeName}</p>
                  </div>
                  <p className="text-[11px] text-zinc-400 italic line-clamp-1">
                    "{lang.sampleGreeting}"
                  </p>
                </div>

                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => testLanguageVoice(lang)}
                    disabled={isTesting}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                  >
                    {isTesting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                    <span>Listen Demo</span>
                  </button>

                  <button
                    onClick={() => onApplyLanguageToSeries(lang.name)}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-cyan-600 hover:text-white text-zinc-400 transition cursor-pointer"
                    title={`Create Series in ${lang.name}`}
                  >
                    <Layers className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Script Localization & Translation Studio */}
      <section className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-cyan-400" />
              <span>AI Script Translator & Audio Localizer</span>
            </h2>
            <p className="text-xs text-zinc-400">
              Translate audio dialogues or entire episode scripts while preserving character speaker tags and emotion cues like &lt;laugh&gt;, &lt;breath&gt;, and |yeah|.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Target:</span>
            <select
              value={translateTarget}
              onChange={(e) => setTranslateTarget(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-white"
            >
              {POPULAR_LANGUAGES.map((l) => (
                <option key={l.code} value={l.name}>
                  {l.flag} {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400">Source Script</label>
            <textarea
              rows={6}
              value={translateInput}
              onChange={(e) => setTranslateInput(e.target.value)}
              placeholder="Paste original script or dialogue..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-cyan-400">Localized Output ({translateTarget})</label>
            <textarea
              rows={6}
              readOnly
              value={translatedOutput || 'Click "Translate Script" to see localized output...'}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 focus:outline-none font-mono"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <InfinityIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero tokens deduction</span>
          </div>

          <button
            onClick={handleTranslate}
            disabled={isTranslating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-950/40 transition cursor-pointer disabled:opacity-50"
          >
            {isTranslating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Translating Script...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>Translate Script</span>
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  );
};
