import React, { useState } from 'react';
import { Hammer, Clock, X, ChefHat, Milk, Sparkles, Wheat } from 'lucide-react';
import { CraftingRecipe, ActiveCraftJob, InventoryItem } from '../types/game';
import { CRAFTING_RECIPES } from '../data/crops';
import { sound } from '../services/audio';

interface CraftingModalProps {
  craftJobs: ActiveCraftJob[];
  inventory: InventoryItem[];
  initialFacilityType?: string;
  onClose: () => void;
  onStartCraft: (recipeId: string, facilityId: string) => void;
  onCollectCraft: (jobId: string) => void;
}

export const CraftingModal: React.FC<CraftingModalProps> = ({
  craftJobs,
  inventory,
  initialFacilityType,
  onClose,
  onStartCraft,
  onCollectCraft,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = [
    { id: 'ALL', label: 'すべてのレシピ' },
    { id: 'FERTILIZER', label: '肥料・活性剤', icon: '🧪' },
    { id: 'FOOD', label: '食品加工・ソース', icon: '🥫' },
    { id: 'DAIRY', label: '酪農・乳製品', icon: '🥛' },
    { id: 'BAKING', label: '製粉・ベーカリー', icon: '🍞' },
    { id: 'SUPPLY', label: '家畜飼料・資材', icon: '🥣' },
  ];

  const filteredRecipes = CRAFTING_RECIPES.filter((r) => {
    if (selectedCategory === 'ALL') return true;
    return r.category === selectedCategory;
  });

  const checkHasMaterials = (recipe: CraftingRecipe) => {
    return recipe.inputs.every((input) => {
      const inv = inventory.find((i) => i.itemId === input.itemId);
      return inv && inv.count >= input.count;
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="w-full max-w-5xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden text-stone-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-100 font-['M_PLUS_Rounded_1c']">
                農園総合クラフト・加工工房
              </h2>
              <p className="text-xs text-stone-400">
                収穫した作物、乳製品、堆肥を調合・調理し、高付加価値商品を生み出します
              </p>
            </div>
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

        {/* Category Tabs */}
        <div className="px-5 py-2.5 bg-stone-950/60 border-b border-stone-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                sound.playClick();
                setSelectedCategory(cat.id);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? 'bg-amber-600 text-white font-semibold shadow-sm'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
              }`}
            >
              {cat.icon && <span>{cat.icon}</span>}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Active Jobs Running Bar */}
        {craftJobs.length > 0 && (
          <div className="bg-stone-950/90 p-4 border-b border-stone-800 flex flex-col gap-2">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              稼働中の加工ライン ({craftJobs.length}ライン)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {craftJobs.map((job) => {
                const now = Date.now();
                const elapsedSec = Math.max(0, (now - job.startedAt) / 1000);
                const progress = Math.min(1.0, elapsedSec / job.durationSec);
                const isReady = job.completed || progress >= 1.0;

                return (
                  <div
                    key={job.id}
                    className="p-2.5 bg-stone-900 border border-stone-800 rounded-xl flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <span className="text-2xl">{job.outputIcon}</span>
                      <div className="flex flex-col truncate">
                        <span className="text-xs font-bold text-stone-200 truncate">
                          {job.outputName} × {job.outputCount}
                        </span>
                        <span className="text-[10px] text-stone-400 font-mono">
                          {isReady ? '完成！回収可能' : `加工中... (${Math.round(job.durationSec - elapsedSec)}秒)`}
                        </span>
                      </div>
                    </div>

                    {isReady ? (
                      <button
                        onClick={() => {
                          sound.playHarvest();
                          onCollectCraft(job.id);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md active:scale-95 transition-all shrink-0"
                      >
                        回収する
                      </button>
                    ) : (
                      <div className="w-16 h-1.5 bg-stone-800 rounded-full overflow-hidden shrink-0">
                        <div
                          className="h-full bg-amber-500 transition-all duration-300 rounded-full"
                          style={{ width: `${progress * 100}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recipes Grid */}
        <div className="p-5 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredRecipes.map((recipe) => {
            const hasMaterials = checkHasMaterials(recipe);

            return (
              <div
                key={recipe.id}
                className="p-3.5 bg-stone-950/70 border border-stone-800 rounded-xl flex flex-col justify-between gap-2.5 hover:border-stone-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-3xl p-1 bg-stone-900 rounded-xl">{recipe.output.icon}</span>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-stone-100">{recipe.name}</span>
                      <span className="text-[10px] text-stone-400 font-mono">
                        所要時間: {recipe.durationSec}秒 · 基準価格: {recipe.output.basePrice} G
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-stone-400 line-clamp-2">{recipe.description}</p>

                {/* Required Ingredients */}
                <div className="p-2 bg-stone-900/80 rounded-lg flex flex-col gap-1 text-xs">
                  <span className="text-[10px] font-semibold text-stone-400">必要素材</span>
                  <div className="flex flex-wrap gap-1.5">
                    {recipe.inputs.map((input) => {
                      const inv = inventory.find((i) => i.itemId === input.itemId);
                      const currentCount = inv ? inv.count : 0;
                      const isSatisfied = currentCount >= input.count;

                      return (
                        <div
                          key={input.itemId}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 border ${
                            isSatisfied
                              ? 'bg-stone-800/80 border-stone-700 text-stone-300'
                              : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                          }`}
                        >
                          <span>{input.icon}</span>
                          <span>{input.name}</span>
                          <span className="font-bold">({currentCount}/{input.count})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Start Button */}
                <button
                  onClick={() => {
                    sound.playPlant();
                    onStartCraft(recipe.id, recipe.facilityType);
                  }}
                  disabled={!hasMaterials}
                  className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all ${
                    hasMaterials
                      ? 'bg-amber-600 hover:bg-amber-500 text-white active:scale-95'
                      : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  <Hammer className="w-3.5 h-3.5" />
                  <span>{hasMaterials ? '製造を開始する' : '素材不足'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
