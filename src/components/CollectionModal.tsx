import React, { useState } from 'react';
import { BookOpen, X, Sparkles, CheckCircle2, Lock, Award, Calendar } from 'lucide-react';
import { DiscoveredItemRecord } from '../types/game';
import { ALL_ENCYCLOPEDIA_ITEMS } from '../data/crops';
import { sound } from '../services/audio';

interface CollectionModalProps {
  discoveredItems: Record<string, DiscoveredItemRecord>;
  onClose: () => void;
}

export const CollectionModal: React.FC<CollectionModalProps> = ({
  discoveredItems,
  onClose,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  const totalItemsCount = ALL_ENCYCLOPEDIA_ITEMS.length;
  const discoveredCount = Object.keys(discoveredItems).length;
  const completionPercent = Math.round((discoveredCount / totalItemsCount) * 100);

  const categories = [
    { id: 'ALL', label: 'すべて' },
    { id: 'CROP', label: '農作物' },
    { id: 'SEED', label: '種子' },
    { id: 'PROCESSED', label: '加工・料理' },
    { id: 'FERTILIZER', label: '肥料' },
    { id: 'MATERIAL', label: '素材' },
  ];

  const filteredItems = ALL_ENCYCLOPEDIA_ITEMS.filter((item) => {
    if (activeCategory === 'ALL') return true;
    return item.category === activeCategory;
  });

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="w-full max-w-5xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden text-stone-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-100 font-['M_PLUS_Rounded_1c']">農園大百科・収穫加工図鑑</h2>
              <p className="text-xs text-stone-400">
                初めて収穫・製造・発見したアイテムが記録される永久コレクション録
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right text-xs">
              <span className="text-stone-400">収集率: </span>
              <span className="font-mono font-bold text-amber-300 tabular-nums">
                {discoveredCount} / {totalItemsCount} ({completionPercent}%)
              </span>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar & Milestone Banner */}
        <div className="px-5 py-2.5 bg-stone-950/80 border-b border-stone-800 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-stone-300">
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              <span>初発見ボーナス: 1品発見ごとに <strong>+50 G</strong> & <strong>+25 EXP</strong> 獲得！</span>
            </div>
            <span className="font-mono text-amber-400 font-bold">{completionPercent}% COMPLETE</span>
          </div>
          <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-600 to-emerald-500 transition-all duration-500 rounded-full"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-5 py-2.5 bg-stone-950/40 border-b border-stone-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                sound.playClick();
                setActiveCategory(cat.id);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeCategory === cat.id
                  ? 'bg-amber-600 text-white font-semibold shadow-sm'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="p-5 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filteredItems.map((meta) => {
            const record = discoveredItems[meta.id];
            const isDiscovered = !!record;

            return (
              <div
                key={meta.id}
                className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2.5 transition-all ${
                  isDiscovered
                    ? 'bg-stone-950/70 border-stone-800 hover:border-amber-600/60 shadow-sm'
                    : 'bg-stone-950/30 border-stone-800/40 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-3xl p-1.5 rounded-xl ${
                        isDiscovered ? 'bg-stone-900' : 'bg-stone-900/50 filter grayscale contrast-50'
                      }`}
                    >
                      {isDiscovered ? meta.icon : '❓'}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-stone-100 flex items-center gap-1.5">
                        {isDiscovered ? meta.name : '？？？（未発見）'}
                        {isDiscovered && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      </span>
                      <span className="text-[11px] text-stone-400">
                        {meta.category === 'CROP'
                          ? '農作物'
                          : meta.category === 'SEED'
                          ? '種子'
                          : meta.category === 'MATERIAL'
                          ? '資材・素材'
                          : meta.category === 'FERTILIZER'
                          ? '肥料'
                          : '加工品'}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-stone-400 line-clamp-2">
                  {isDiscovered ? meta.description : '農園で栽培・製造するか、市場で入手すると図鑑が解放されます。'}
                </p>

                {/* Footer Discovery Info */}
                <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-[11px] text-stone-400">
                  {isDiscovered && record ? (
                    <>
                      <span className="flex items-center gap-1 text-[10px] text-stone-500 font-mono">
                        <Calendar className="w-3 h-3 text-stone-600" />
                        {formatDate(record.discoveredAt)}
                      </span>
                      <span className="font-mono text-amber-300 font-bold">
                        生産累計: {record.countProduced}個
                      </span>
                    </>
                  ) : (
                    <span className="flex items-center gap-1 text-stone-500">
                      <Lock className="w-3 h-3" />
                      未登録
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
