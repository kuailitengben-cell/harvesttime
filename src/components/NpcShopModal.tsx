import React, { useState } from 'react';
import { Store, X, ShoppingCart, Coins } from 'lucide-react';
import { CROPS_CATALOG } from '../data/crops';
import { sound } from '../services/audio';

interface NpcShopModalProps {
  playerGold: number;
  onClose: () => void;
  onBuyItem: (itemId: string, count: number) => void;
}

export const NpcShopModal: React.FC<NpcShopModalProps> = ({
  playerGold,
  onClose,
  onBuyItem,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('GRAIN');
  const [purchaseCounts, setPurchaseCounts] = useState<Record<string, number>>({});

  const cropsList = Object.values(CROPS_CATALOG);

  // Group crops by category
  const grainSeeds = cropsList.filter((c) => c.category === 'GRAIN');
  const vegetableSeeds = cropsList.filter((c) => c.category === 'VEGETABLE');
  const fruitSeeds = cropsList.filter((c) => c.category === 'FRUIT');
  const specialSeeds = cropsList.filter((c) => c.category === 'SPECIAL');

  const supplies = [
    {
      id: 'fertilizer_basic',
      name: '有機基本肥料',
      category: 'SUPPLY',
      price: 40,
      icon: '🧪',
      desc: '畑に散布することで作物の品質が1段階向上する基本の有機肥料。',
    },
    {
      id: 'material_mineral',
      name: '農園鉱石粉末',
      category: 'SUPPLY',
      price: 30,
      icon: '🪨',
      desc: '土壌改良や高級肥料・促進剤のクラフトに使用する良質鉱物粉末。',
    },
  ];

  const getActiveItems = () => {
    switch (selectedCategory) {
      case 'GRAIN':
        return grainSeeds.map((c) => ({
          id: `seed_${c.id}`,
          name: `${c.name}の種`,
          price: c.seedPrice,
          icon: c.emoji,
          desc: c.description,
          growthTime: c.growthTimeSec,
        }));
      case 'VEGETABLE':
        return vegetableSeeds.map((c) => ({
          id: `seed_${c.id}`,
          name: `${c.name}の種`,
          price: c.seedPrice,
          icon: c.emoji,
          desc: c.description,
          growthTime: c.growthTimeSec,
        }));
      case 'FRUIT':
        return fruitSeeds.map((c) => ({
          id: `seed_${c.id}`,
          name: `${c.name}の種`,
          price: c.seedPrice,
          icon: c.emoji,
          desc: c.description,
          growthTime: c.growthTimeSec,
        }));
      case 'SPECIAL':
        return specialSeeds.map((c) => ({
          id: `seed_${c.id}`,
          name: `${c.name}の種`,
          price: c.seedPrice,
          icon: c.emoji,
          desc: c.description,
          growthTime: c.growthTimeSec,
        }));
      case 'SUPPLY':
        return supplies.map((s) => ({
          id: s.id,
          name: s.name,
          price: s.price,
          icon: s.icon,
          desc: s.desc,
          growthTime: 0,
        }));
      default:
        return [];
    }
  };

  const activeItems = getActiveItems();

  const handleBuy = (itemId: string, unitPrice: number) => {
    const count = purchaseCounts[itemId] || 1;
    const totalCost = unitPrice * count;
    if (playerGold < totalCost) return;

    sound.playCoin();
    onBuyItem(itemId, count);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="w-full max-w-4xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-stone-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-100 font-['M_PLUS_Rounded_1c']">農協中央資材店 (NPC)</h2>
              <p className="text-xs text-stone-400">
                作物の種子や肥料などの農業基本資材を公定価格で購入できます
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
          {[
            { id: 'GRAIN', label: '穀物の種' },
            { id: 'VEGETABLE', label: '野菜の種' },
            { id: 'FRUIT', label: '果物の種' },
            { id: 'SPECIAL', label: '特殊作物の種' },
            { id: 'SUPPLY', label: '肥料・資材' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                sound.playClick();
                setSelectedCategory(cat.id);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-amber-600 text-white font-semibold shadow-sm'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Shop Items Grid */}
        <div className="p-5 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {activeItems.map((item) => {
            const count = purchaseCounts[item.id] || 1;
            const totalCost = item.price * count;
            const canAfford = playerGold >= totalCost;

            return (
              <div
                key={item.id}
                className="p-3.5 bg-stone-950/70 border border-stone-800 rounded-xl flex flex-col justify-between gap-3 hover:border-stone-700 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl p-1.5 bg-stone-900 rounded-xl">{item.icon}</span>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-stone-100">{item.name}</span>
                    <span className="text-xs text-amber-400 font-mono font-bold">
                      🪙 {item.price} G <span className="text-[10px] text-stone-400 font-normal">/個</span>
                    </span>
                    {item.growthTime > 0 && (
                      <span className="text-[10px] text-stone-500 font-mono">成長時間: 約{item.growthTime}秒</span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-stone-400 line-clamp-2">{item.desc}</p>

                {/* Quantity and Buy Controls */}
                <div className="pt-2 border-t border-stone-800/80 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-400">数量</span>
                    <div className="flex items-center gap-1">
                      {[1, 5, 10].map((num) => (
                        <button
                          key={num}
                          onClick={() => {
                            sound.playClick();
                            setPurchaseCounts((prev) => ({ ...prev, [item.id]: num }));
                          }}
                          className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors ${
                            count === num
                              ? 'bg-amber-950/80 border-amber-600 text-amber-200'
                              : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleBuy(item.id, item.price)}
                    disabled={!canAfford}
                    className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all ${
                      canAfford
                        ? 'bg-amber-600 hover:bg-amber-500 text-white active:scale-95'
                        : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                    }`}
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>購入する ({totalCost.toLocaleString()} G)</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
