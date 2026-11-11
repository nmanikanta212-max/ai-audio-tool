import React from 'react';
import { Sparkles, Radio, Layers, Globe, ShieldCheck, Infinity as InfinityIcon, PlusCircle } from 'lucide-react';

interface NavbarProps {
  activeTab: 'series' | 'quick-tts' | 'library' | 'languages';
  setActiveTab: (tab: 'series' | 'quick-tts' | 'library' | 'languages') => void;
  onNewSeries: () => void;
  onOpenFreeModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onNewSeries,
  onOpenFreeModal,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 shadow-lg shadow-violet-900/30 ring-1 ring-violet-400/30">
            <Radio className="w-5 h-5 text-white animate-pulse" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-zinc-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
                VoxInfinite
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                Studio
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">
              Free AI Text-to-Audio & Series Generator
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-zinc-900/70 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => setActiveTab('series')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'series'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-900/40'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            Audio Series Studio
          </button>

          <button
            onClick={() => setActiveTab('quick-tts')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'quick-tts'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-900/40'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Quick TTS Sandbox
          </button>

          <button
            onClick={() => setActiveTab('library')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'library'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-900/40'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Radio className="w-4 h-4" />
            Series Library
          </button>

          <button
            onClick={() => setActiveTab('languages')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'languages'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-900/40'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Globe className="w-4 h-4" />
            60+ Languages
          </button>
        </nav>

        {/* Right CTA / Unlimited Credits Badge */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenFreeModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium transition cursor-pointer"
            title="Click to learn about our 100% Free Unlimited pledge"
          >
            <InfinityIcon className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold hidden sm:inline">No Credits Limit:</span>
            <span className="font-bold">100% Free</span>
          </button>

          <button
            onClick={onNewSeries}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-violet-900/30 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">New Series</span>
          </button>
        </div>
      </div>

      {/* Mobile nav strip */}
      <div className="flex md:hidden items-center justify-around border-t border-zinc-800 bg-zinc-900/90 py-2 px-2 text-[11px]">
        <button
          onClick={() => setActiveTab('series')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded ${
            activeTab === 'series' ? 'text-violet-400 font-bold' : 'text-zinc-400'
          }`}
        >
          <Layers className="w-4 h-4" />
          Series Studio
        </button>
        <button
          onClick={() => setActiveTab('quick-tts')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded ${
            activeTab === 'quick-tts' ? 'text-violet-400 font-bold' : 'text-zinc-400'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Quick TTS
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded ${
            activeTab === 'library' ? 'text-violet-400 font-bold' : 'text-zinc-400'
          }`}
        >
          <Radio className="w-4 h-4" />
          Library
        </button>
        <button
          onClick={() => setActiveTab('languages')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded ${
            activeTab === 'languages' ? 'text-violet-400 font-bold' : 'text-zinc-400'
          }`}
        >
          <Globe className="w-4 h-4" />
          Languages
        </button>
      </div>
    </header>
  );
};
