import React from 'react';
import { Sprout, CheckCircle2, ShieldCheck, Sparkles, Clock, ArrowRight } from 'lucide-react';
import { OfflineCatchupSummary } from '../types/game';
import { sound } from '../services/audio';

interface OfflineCatchupModalProps {
  summary: OfflineCatchupSummary;
  onClose: () => void;
}

export const OfflineCatchupModal: React.FC<OfflineCatchupModalProps> = ({ summary, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in select-none">
      <div className="w-full max-w-lg bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-stone-100">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-amber-700 via-amber-600 to-emerald-700 px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center text-2xl shadow-inner">
            🌱
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-100/90">
                オフライン作物理論成長同期
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-900/80 text-[10px] text-emerald-200 border border-emerald-600/50 font-semibold flex items-center gap-0.5">
                <ShieldCheck className="w-3 h-3" /> 完全保護適用
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white font-['M_PLUS_Rounded_1c']">
              おかえりなさい！
            </h2>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 flex flex-col gap-4 text-xs">
          {/* Away time pill */}
          <div className="p-3 bg-stone-950/80 rounded-xl border border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-stone-300">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>不在だった時間:</span>
            </div>
            <span className="font-mono font-bold text-sm text-amber-300">
              {summary.formattedTime}
            </span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 bg-stone-950/70 border border-stone-800 rounded-xl flex flex-col items-center text-center gap-1">
              <span className="text-[11px] text-stone-400">成長した作物</span>
              <span className="font-mono text-base font-bold text-emerald-400">
                {summary.cropsGrownCount} <span className="text-[10px] font-sans text-stone-400">区画</span>
              </span>
            </div>

            <div className="p-3 bg-stone-950/70 border border-amber-600/30 rounded-xl flex flex-col items-center text-center gap-1 bg-amber-950/20">
              <span className="text-[11px] text-amber-200">収穫可能に成長</span>
              <span className="font-mono text-base font-bold text-amber-300">
                {summary.cropsMaturedCount} <span className="text-[10px] font-sans text-amber-400/80">区画</span>
              </span>
            </div>

            <div className="p-3 bg-stone-950/70 border border-stone-800 rounded-xl flex flex-col items-center text-center gap-1">
              <span className="text-[11px] text-stone-400">自動収穫機回収</span>
              <span className="font-mono text-base font-bold text-cyan-400">
                {summary.autoHarvestedCount} <span className="text-[10px] font-sans text-stone-400">個</span>
              </span>
            </div>
          </div>

          {/* Auto-harvested items breakdown if any */}
          {summary.autoHarvestedItems && summary.autoHarvestedItems.length > 0 && (
            <div className="p-3 bg-stone-950/80 border border-stone-800 rounded-xl flex flex-col gap-2">
              <span className="text-[11px] font-semibold text-stone-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                自動収穫機によって倉庫へ搬入された作物:
              </span>
              <div className="flex flex-wrap gap-2">
                {summary.autoHarvestedItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-900 border border-stone-700/60 rounded-lg text-stone-200 font-medium"
                  >
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                    <span className="font-mono text-amber-300 font-bold">+{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Guarantee / Safe rule callout */}
          <div className="p-3 bg-emerald-950/30 border border-emerald-600/40 rounded-xl flex items-start gap-2.5 text-emerald-200/90 leading-relaxed text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-emerald-300 font-bold block mb-0.5">安全な理論成長ルール適用済み</strong>
              アプリ停止中は害虫の発生、作物の過熟・腐敗、雑草の侵入などのデメリットは一切発生せず、土壌水分と肥料に応じた理論上の成長のみが安全に加算されています。
            </div>
          </div>
        </div>

        {/* Footer Button */}
        <div className="p-4 bg-stone-950/90 border-t border-stone-800 flex justify-end">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-full sm:w-auto px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>農園を確認する</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
