import React, { useState } from 'react';
import { Droplet, Sparkles, Scissors, Bug, Sprout, FlaskConical, Trash2, X, CheckSquare } from 'lucide-react';
import { TileData, InventoryItem } from '../types/game';
import { CROPS_CATALOG } from '../data/crops';
import { sound } from '../services/audio';

interface BatchActionBarProps {
  selectedTiles: TileData[];
  allTiles: TileData[];
  inventory: InventoryItem[];
  onBatchAction: (actionType: string, options?: { seedCropId?: string; fertilizerItemId?: string }) => void;
  onSelectSpecificTiles: (tileIds: string[]) => void;
  onClearSelection: () => void;
}

export const BatchActionBar: React.FC<BatchActionBarProps> = ({
  selectedTiles,
  allTiles,
  inventory,
  onBatchAction,
  onSelectSpecificTiles,
  onClearSelection,
}) => {
  const [showSeedPicker, setShowSeedPicker] = useState(false);
  const [showFertilizerPicker, setShowFertilizerPicker] = useState(false);

  if (selectedTiles.length === 0) return null;

  // Analysis of selected tiles
  const fieldTiles = selectedTiles.filter((t) => t.type === 'FIELD');
  const dryTiles = fieldTiles.filter((t) => t.soilMoisture < 80);
  const matureTiles = fieldTiles.filter((t) => t.stage === 'MATURE' || t.stage === 'OVERRIPE');
  const weedTiles = fieldTiles.filter((t) => t.hasWeed);
  const pestTiles = fieldTiles.filter((t) => t.hasPest);
  const emptyTiles = fieldTiles.filter((t) => !t.plantedCropId && !t.hasWeed);
  const unfertilizedTiles = fieldTiles.filter((t) => !t.fertilizerType);
  const spoiledTiles = fieldTiles.filter((t) => t.stage === 'SPOILED');

  // Available seeds and fertilizers in inventory
  const seedItems = inventory.filter((i) => i.category === 'SEED' && i.count > 0);
  const fertilizerItems = inventory.filter((i) => i.category === 'FERTILIZER' && i.count > 0);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-stone-900/95 backdrop-blur-md border-t border-amber-600/30 p-2 sm:p-3 shadow-2xl">
      <div className="max-w-5xl mx-auto flex flex-col gap-2">
        {/* Top Mini Preset Filters Bar */}
        <div className="flex items-center justify-between text-xs text-stone-300 pb-1 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-400 flex items-center gap-1 font-mono text-sm">
              <CheckSquare className="w-4 h-4 text-amber-500" />
              選択中: {selectedTiles.length} マス
            </span>
            <span className="text-stone-500">|</span>
            <div className="hidden sm:flex items-center gap-1 text-[11px]">
              <button
                onClick={() => {
                  sound.playClick();
                  onSelectSpecificTiles(allTiles.filter((t) => t.type === 'FIELD').map((t) => t.id));
                }}
                className="px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors"
              >
                全畑選択
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  onSelectSpecificTiles(allTiles.filter((t) => t.type === 'FIELD' && (t.stage === 'MATURE' || t.stage === 'OVERRIPE')).map((t) => t.id));
                }}
                className="px-2 py-0.5 rounded bg-amber-900/40 hover:bg-amber-800/60 text-amber-300 transition-colors"
              >
                収穫可能のみ ({allTiles.filter((t) => t.stage === 'MATURE' || t.stage === 'OVERRIPE').length})
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  onSelectSpecificTiles(allTiles.filter((t) => t.type === 'FIELD' && t.soilMoisture < 40).map((t) => t.id));
                }}
                className="px-2 py-0.5 rounded bg-cyan-900/40 hover:bg-cyan-800/60 text-cyan-300 transition-colors"
              >
                乾燥のみ ({allTiles.filter((t) => t.type === 'FIELD' && t.soilMoisture < 40).length})
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClearSelection();
            }}
            className="flex items-center gap-1 text-stone-400 hover:text-white px-2 py-0.5 rounded hover:bg-stone-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>選択解除</span>
          </button>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none">
          {/* 一括水やり */}
          <button
            onClick={() => {
              sound.playWater();
              onBatchAction('WATER');
            }}
            disabled={dryTiles.length === 0}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all ${
              dryTiles.length > 0
                ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md active:scale-95'
                : 'bg-stone-800/60 text-stone-500 cursor-not-allowed'
            }`}
          >
            <Droplet className="w-4 h-4 text-cyan-200" />
            <span>一括水やり</span>
            {dryTiles.length > 0 && <span className="font-mono text-[11px] bg-cyan-900/60 px-1.5 py-0.2 rounded">({dryTiles.length})</span>}
          </button>

          {/* 一括収穫 */}
          <button
            onClick={() => {
              sound.playHarvest();
              onBatchAction('HARVEST');
            }}
            disabled={matureTiles.length === 0}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all ${
              matureTiles.length > 0
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md active:scale-95 ring-2 ring-amber-400/40'
                : 'bg-stone-800/60 text-stone-500 cursor-not-allowed'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>一括収穫</span>
            {matureTiles.length > 0 && <span className="font-mono text-[11px] bg-amber-900/80 px-1.5 py-0.2 rounded">({matureTiles.length})</span>}
          </button>

          {/* 一括植え付け */}
          <button
            onClick={() => {
              sound.playClick();
              setShowSeedPicker(!showSeedPicker);
              setShowFertilizerPicker(false);
            }}
            disabled={emptyTiles.length === 0 || seedItems.length === 0}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all ${
              emptyTiles.length > 0 && seedItems.length > 0
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95'
                : 'bg-stone-800/60 text-stone-500 cursor-not-allowed'
            }`}
          >
            <Sprout className="w-4 h-4 text-emerald-200" />
            <span>一括植え付け</span>
            {emptyTiles.length > 0 && <span className="font-mono text-[11px] bg-emerald-900/60 px-1.5 py-0.2 rounded">({emptyTiles.length})</span>}
          </button>

          {/* 一括施肥 */}
          <button
            onClick={() => {
              sound.playClick();
              setShowFertilizerPicker(!showFertilizerPicker);
              setShowSeedPicker(false);
            }}
            disabled={unfertilizedTiles.length === 0 || fertilizerItems.length === 0}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all ${
              unfertilizedTiles.length > 0 && fertilizerItems.length > 0
                ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md active:scale-95'
                : 'bg-stone-800/60 text-stone-500 cursor-not-allowed'
            }`}
          >
            <FlaskConical className="w-4 h-4 text-purple-200" />
            <span>一括施肥</span>
            {unfertilizedTiles.length > 0 && <span className="font-mono text-[11px] bg-purple-900/60 px-1.5 py-0.2 rounded">({unfertilizedTiles.length})</span>}
          </button>

          {/* 一括除草 */}
          {weedTiles.length > 0 && (
            <button
              onClick={() => {
                sound.playTill();
                onBatchAction('WEED');
              }}
              className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 bg-lime-700 hover:bg-lime-600 text-white shadow-md active:scale-95 transition-all"
            >
              <Scissors className="w-4 h-4 text-lime-200" />
              <span>除草 ({weedTiles.length})</span>
            </button>
          )}

          {/* 一括害虫駆除 */}
          {pestTiles.length > 0 && (
            <button
              onClick={() => {
                sound.playTill();
                onBatchAction('PEST');
              }}
              className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 bg-rose-700 hover:bg-rose-600 text-white shadow-md active:scale-95 transition-all"
            >
              <Bug className="w-4 h-4 text-rose-200" />
              <span>害虫駆除 ({pestTiles.length})</span>
            </button>
          )}

          {/* 一括堆肥化・撤去 */}
          {spoiledTiles.length > 0 && (
            <button
              onClick={() => {
                sound.playTill();
                onBatchAction('CLEAR_SPOILED');
              }}
              className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 bg-stone-700 hover:bg-stone-600 text-amber-300 shadow-md active:scale-95 transition-all"
            >
              <Trash2 className="w-4 h-4 text-amber-400" />
              <span>堆肥化・撤去 ({spoiledTiles.length})</span>
            </button>
          )}
        </div>

        {/* Seed Picker Drawer */}
        {showSeedPicker && (
          <div className="p-3 bg-stone-950 rounded-xl border border-emerald-600/40 mt-1 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-400">植える種を選択してください (空き地: {emptyTiles.length}マス)</span>
              <button onClick={() => setShowSeedPicker(false)} className="text-stone-400 hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {seedItems.map((item) => {
                const cropId = item.itemId.replace('seed_', '');
                const crop = CROPS_CATALOG[cropId];
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      sound.playPlant();
                      onBatchAction('PLANT', { seedCropId: cropId });
                      setShowSeedPicker(false);
                    }}
                    className="p-2 rounded-lg bg-stone-900 hover:bg-emerald-950 border border-stone-800 hover:border-emerald-600 flex items-center gap-2 text-left transition-colors"
                  >
                    <span className="text-xl">{item.icon}</span>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-xs font-semibold text-stone-200 truncate">{crop?.name || item.name}</span>
                      <span className="text-[10px] text-stone-400 font-mono">所持: {item.count}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Fertilizer Picker Drawer */}
        {showFertilizerPicker && (
          <div className="p-3 bg-stone-950 rounded-xl border border-purple-600/40 mt-1 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-purple-400">散布する肥料を選択してください (対象: {unfertilizedTiles.length}マス)</span>
              <button onClick={() => setShowFertilizerPicker(false)} className="text-stone-400 hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {fertilizerItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    sound.playClick();
                    onBatchAction('FERTILIZE', { fertilizerItemId: item.itemId });
                    setShowFertilizerPicker(false);
                  }}
                  className="p-2 rounded-lg bg-stone-900 hover:bg-purple-950 border border-stone-800 hover:border-purple-600 flex items-center gap-2 text-left transition-colors"
                >
                  <span className="text-xl">{item.icon}</span>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-xs font-semibold text-stone-200 truncate">{item.name}</span>
                    <span className="text-[10px] text-stone-400 font-mono">所持: {item.count} · {item.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
