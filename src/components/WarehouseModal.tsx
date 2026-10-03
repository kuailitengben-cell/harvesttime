import React, { useState } from 'react';
import { Package, X, ArrowUpRight, Gavel, Hammer, ArrowUpCircle } from 'lucide-react';
import { InventoryItem } from '../types/game';
import { sound } from '../services/audio';

interface WarehouseModalProps {
  inventory: InventoryItem[];
  maxCapacity: number;
  warehouseLevel: number;
  playerGold: number;
  onClose: () => void;
  onOpenMarketForCrop: (itemId: string, quality?: string) => void;
  onOpenAuctionForCrop: (item: InventoryItem) => void;
  onUpgradeWarehouse: () => void;
}

export const WarehouseModal: React.FC<WarehouseModalProps> = ({
  inventory,
  maxCapacity,
  warehouseLevel,
  playerGold,
  onClose,
  onOpenMarketForCrop,
  onOpenAuctionForCrop,
  onUpgradeWarehouse,
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [showUpgradePanel, setShowUpgradePanel] = useState(false);

  const totalCount = inventory.reduce((acc, item) => acc + item.count, 0);

  const filteredItems = inventory.filter((item) => {
    if (activeFilter === 'ALL') return true;
    return item.category === activeFilter;
  });

  const categories = [
    { id: 'ALL', label: 'すべて' },
    { id: 'CROP', label: '作物' },
    { id: 'SEED', label: '種' },
    { id: 'PROCESSED', label: '加工品' },
    { id: 'FERTILIZER', label: '肥料' },
    { id: 'MATERIAL', label: '素材' },
  ];

  const upgradeLevels = [
    { level: 2, capacity: 300, goldCost: 350, minerals: 0, title: '中規模木造倉庫' },
    { level: 3, capacity: 600, goldCost: 800, minerals: 4, title: '煉瓦造り大倉庫' },
    { level: 4, capacity: 1200, goldCost: 1800, minerals: 8, title: '地下低温貯蔵コンビナート' },
    { level: 5, capacity: 2500, goldCost: 4000, minerals: 15, title: '全自動サイロ式巨大倉庫' },
  ];

  const nextUpgrade = upgradeLevels.find((u) => u.level === warehouseLevel + 1);
  const mineralCount = inventory.find((i) => i.itemId === 'material_mineral')?.count || 0;
  const canAffordUpgrade = nextUpgrade
    ? playerGold >= nextUpgrade.goldCost && mineralCount >= nextUpgrade.minerals
    : false;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="w-full max-w-4xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-stone-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-stone-100 font-['M_PLUS_Rounded_1c']">
                  農場倉庫インベントリ
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-stone-800 text-amber-300 font-mono text-xs font-semibold border border-stone-700">
                  Lv.{warehouseLevel}
                </span>
              </div>
              <p className="text-xs text-stone-400">
                収穫した作物、種、クラフト素材、加工品を保管しています
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="text-right text-xs">
                <span className="text-stone-400">収容数: </span>
                <span className="font-mono font-bold text-amber-300 tabular-nums">
                  {totalCount} / {maxCapacity}
                </span>
              </div>
              <button
                onClick={() => {
                  sound.playClick();
                  setShowUpgradePanel(!showUpgradePanel);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  showUpgradePanel
                    ? 'bg-amber-600 text-white'
                    : 'bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-600/40'
                }`}
              >
                <ArrowUpCircle className="w-3.5 h-3.5" />
                <span>倉庫増築</span>
              </button>
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

        {/* Upgrade Drawer Panel */}
        {showUpgradePanel && (
          <div className="px-5 py-4 bg-stone-950 border-b border-amber-600/30 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Hammer className="w-4 h-4" />
                倉庫の増築・保管スロット拡張
              </span>
              <button onClick={() => setShowUpgradePanel(false)} className="text-xs text-stone-400 hover:text-white">✕</button>
            </div>

            {nextUpgrade ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl bg-stone-900 border border-stone-800">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-stone-200">
                    Lv.{nextUpgrade.level} {nextUpgrade.title}
                  </span>
                  <span className="text-xs text-emerald-400 font-mono">
                    収容容量: {maxCapacity}枠 → <strong>{nextUpgrade.capacity}枠</strong> (+{nextUpgrade.capacity - maxCapacity})
                  </span>
                  <div className="flex items-center gap-3 text-xs text-stone-400 pt-1">
                    <span>必要資金: <strong className="text-amber-300 font-mono">🪙 {nextUpgrade.goldCost} G</strong></span>
                    {nextUpgrade.minerals > 0 && (
                      <span>必要素材: 🪨 鉱石粉末 {nextUpgrade.minerals}個 (所持: {mineralCount})</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    sound.playCoin();
                    onUpgradeWarehouse();
                    setShowUpgradePanel(false);
                  }}
                  disabled={!canAffordUpgrade}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shrink-0 ${
                    canAffordUpgrade
                      ? 'bg-amber-600 hover:bg-amber-500 text-white active:scale-95 shadow-amber-900/30'
                      : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  {canAffordUpgrade ? '今すぐ増築する' : '増築資材が不足しています'}
                </button>
              </div>
            ) : (
              <div className="text-xs text-stone-400 p-2 text-center">
                倉庫はすでに最高レベル（Lv.{warehouseLevel}）に達しています！
              </div>
            )}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="px-5 py-2.5 bg-stone-950/60 border-b border-stone-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                sound.playClick();
                setActiveFilter(cat.id);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeFilter === cat.id
                  ? 'bg-amber-600 text-white font-semibold shadow-sm'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Inventory Item Grid */}
        <div className="p-5 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filteredItems.length === 0 ? (
            <div className="col-span-full py-16 text-center text-stone-500 text-sm">
              保管されているアイテムはありません
            </div>
          ) : (
            filteredItems.map((item) => {
              const isCropOrProcessed = item.category === 'CROP' || item.category === 'PROCESSED';

              return (
                <div
                  key={item.id}
                  className="p-3.5 bg-stone-950/70 border border-stone-800/90 rounded-xl flex flex-col justify-between gap-2.5 hover:border-stone-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-3xl p-1 bg-stone-900 rounded-lg">{item.icon}</span>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-stone-200 flex items-center gap-1">
                          {item.name}
                          {item.quality && item.quality !== 'NORMAL' && (
                            <span className="text-[10px] font-semibold text-amber-400">
                              {item.quality === 'GOLDEN' ? '★黄金' : item.quality === 'PRISTINE' ? '★極上' : '高級'}
                            </span>
                          )}
                        </span>
                        <span className="text-[11px] text-stone-400">
                          {item.category === 'CROP'
                            ? '農作物'
                            : item.category === 'SEED'
                            ? '種子'
                            : item.category === 'MATERIAL'
                            ? '素材'
                            : item.category === 'FERTILIZER'
                            ? '肥料'
                            : '加工品'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-bold text-sm text-stone-100 tabular-nums">×{item.count}</span>
                    </div>
                  </div>

                  <p className="text-xs text-stone-400 line-clamp-2">{item.description}</p>

                  <div className="pt-2 border-t border-stone-800/60 flex items-center justify-between gap-2 text-xs">
                    <span className="text-stone-400 font-mono text-[11px]">
                      基準値: {item.basePrice} G
                    </span>

                    {isCropOrProcessed && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            sound.playClick();
                            onOpenMarketForCrop(item.itemId, item.quality);
                          }}
                          title="世界市場で売却"
                          className="px-2 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors"
                        >
                          <ArrowUpRight className="w-3 h-3" />
                          <span>世界市場</span>
                        </button>

                        <button
                          onClick={() => {
                            sound.playClick();
                            onOpenAuctionForCrop(item);
                          }}
                          title="オークションに出品"
                          className="px-2 py-1 bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-800/60 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors"
                        >
                          <Gavel className="w-3 h-3" />
                          <span>出品</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
