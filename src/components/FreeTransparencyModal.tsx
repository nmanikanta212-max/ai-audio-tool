import React from 'react';
import {
  ShieldCheck,
  Infinity as InfinityIcon,
  X,
  Zap,
  Globe,
  Radio,
  Sparkles,
  Download,
  CheckCircle2,
} from 'lucide-react';

interface FreeTransparencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FreeTransparencyModal: React.FC<FreeTransparencyModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-xl w-full p-6 md:p-8 space-y-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <InfinityIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-white">
              Zero Credits Limit · 100% Free Guarantee
            </h3>
            <p className="text-xs text-zinc-400">
              Why VoxInfinite is completely free with no hidden paywalls or credit traps
            </p>
          </div>
        </div>

        {/* Feature bullets */}
        <div className="space-y-3.5">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-white">No Credit Counters or Subscriptions</h4>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Unlike services that lock you out after 5 minutes of audio, VoxInfinite has no monthly credit quotas or paywalls. Generate as many episodes and scripts as you need.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <Globe className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-white">All World Languages Supported</h4>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Generate speech and series in English, Spanish, Japanese, Hindi, French, German, Telugu, Arabic, and 60+ languages with authentic pronunciation and localization.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <Radio className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-white">Next-Gen Dual-Speaker Dialogue</h4>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Cast two unique voice actors in a single script with natural backchanneling (<span className="text-violet-300 font-mono">|yeah|</span>, <span className="text-violet-300 font-mono">|mhm|</span>) and human vocal bursts (<span className="text-violet-300 font-mono">&lt;laugh&gt;</span>, <span className="text-violet-300 font-mono">&lt;breath&gt;</span>).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <Download className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-white">Uncompressed WAV Exports</h4>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Download studio-grade 24kHz audio directly to your computer without audio watermarks or quality degradation.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-900/40 transition cursor-pointer"
        >
          Got it, Start Creating!
        </button>
      </div>
    </div>
  );
};
