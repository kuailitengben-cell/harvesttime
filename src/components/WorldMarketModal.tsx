import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, X, ArrowUpRight, DollarSign, Sparkles } from 'lucide-react';
import { MarketItemRate, InventoryItem, GlobalEvent } from '../types/game';
import { sound } from '../services/audio';
import farmMarketBanner from '../assets/images/farm_market_banner_1790952222997.jpg';

interface WorldMarketModalProps {
  marketRates: MarketItemRate[];
  inventory: InventoryItem[];
  globalEvent: GlobalEvent;
  initialSelectedCropId?: string;
  onClose: () => void;
  onSellToMarket: (itemId: string, quality: string, count: number) => void;
}

export const WorldMarketModal: React.FC<WorldMarketModalProps> = ({
  marketRates,
  inventory,
  globalEvent,
  initialSelectedCropId,
  onClose,
  onSellToMarket,
}) => {
  const [selectedCropId, setSelectedCropId] = useState<string>(
    initialSelectedCropId || marketRates[0]?.cropId || 'crop_wheat'
  );
  const [sellCount, setSellCount] = useState<number>(1);
  const [selectedQuality, setSelectedQuality] = useState<string>('NORMAL');

  const selectedMarketRate = marketRates.find((m) => m.cropId === selectedCropId);

  // Available inventory items for this crop
  const inventoryMatches = inventory.filter((i) => i.itemId === selectedCropId && i.count > 0);
  const currentInvItem = inventoryMatches.find((i) => (i.quality || 'NORMAL') === selectedQuality) || inventoryMatches[0];
  const maxAvailable = currentInvItem ? currentInvItem.count : 0;

  // Multiplier calculation
  let qualityMul = 1.0;
  if (selectedQuality === 'HIGH') qualityMul = 1.35;
  else if (selectedQuality === 'PRISTINE') qualityMul = 1.75;
  else if (selectedQuality === 'GOLDEN') qualityMul = 2.5;

  let eventMul = 1.0;
  if (globalEvent.theme === 'HARVEST_FESTIVAL' && selectedMarketRate?.category === 'VEGETABLE') {
    eventMul = 1.4;
  } else if (globalEvent.theme === 'WHEAT_BOOM' && (selectedCropId === 'crop_wheat' || selectedCropId === 'processed_flour')) {
    eventMul = 1.5;
  }

  const unitPrice = selectedMarketRate ? selectedMarketRate.currentPrice : 20;
  const totalPayout = Math.round(unitPrice * qualityMul * eventMul * Math.min(sellCount, maxAvailable));

  const handleExecuteSell = () => {
    if (!currentInvItem || maxAvailable <= 0) return;
    sound.playCoin();
    onSellToMarket(selectedCropId, selectedQuality, Math.min(sellCount, maxAvailable));
    setSellCount(1);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="w-full max-w-5xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-stone-100">
        {/* Banner with generated image */}
        <div className="relative h-28 sm:h-36 w-full overflow-hidden border-b border-stone-800 shrink-0">
          <img
            src={farmMarketBanner}
            alt="World Farm Market Banner"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent flex items-end justify-between p-4 sm:p-6">
            <div>
              <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">グローバル・アグリ・エクスチェンジ</span>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-['M_PLUS_Rounded_1c']">世界農産物市場</h2>
              <p className="text-xs text-stone-300">
                全プレイヤーの生産と販売によって変動するリアルタイム相場
              </p>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-1.5 rounded-lg bg-stone-900/80 text-stone-300 hover:text-white hover:bg-stone-800 transition-colors backdrop-blur-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Event Market Ticker */}
        <div className="bg-amber-950/30 border-b border-amber-800/40 px-5 py-2 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-stone-300">世界気象トレンド: </span>
            <span className="font-semibold text-amber-200">{globalEvent.name}</span>
            <span className="text-amber-400">({globalEvent.multiplierText})</span>
          </div>
          <span className="text-[11px] text-stone-400 font-mono">10秒ごとにサーバー価格更新</span>
        </div>

        {/* Content Body: Split into Price List (Left) and Sell Station (Right) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left Column: Live Commodity Board */}
          <div className="lg:col-span-7 border-b lg:border-b-0 lg:border-r border-stone-800 overflow-y-auto p-4 flex flex-col gap-2">
            <h3 className="text-xs font-semibold text-stone-400 px-1">取引銘柄・リアルタイム相場</h3>

            <div className="flex flex-col gap-1.5">
              {marketRates.map((item) => {
                const isSelected = selectedCropId === item.cropId;
                const isPositive = item.changePercent > 0;
                const isNegative = item.changePercent < 0;

                return (
                  <button
                    key={item.cropId}
                    onClick={() => {
                      sound.playClick();
                      setSelectedCropId(item.cropId);
                    }}
                    className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all text-left ${
                      isSelected
                        ? 'bg-stone-800 border-amber-500 shadow-md ring-1 ring-amber-500/40'
                        : 'bg-stone-950/60 border-stone-800/70 hover:bg-stone-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.icon}</span>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-stone-100">{item.name}</span>
                        <span className="text-[11px] text-stone-400 font-mono">
                          基準値: {item.basePrice} G · 取引量: {item.volumeTraded}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Mini Sparkline */}
                      <div className="hidden sm:flex items-center h-6 w-16">
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 60 20">
                          {item.history.length > 1 && (
                            <polyline
                              fill="none"
                              stroke={isPositive ? '#10b981' : isNegative ? '#f43f5e' : '#94a3b8'}
                              strokeWidth="2"
                              points={item.history
                                .map((val, idx) => {
                                  const min = Math.min(...item.history);
                                  const max = Math.max(...item.history);
                                  const range = max - min || 1;
                                  const x = (idx / (item.history.length - 1)) * 60;
                                  const y = 20 - ((val - min) / range) * 16 - 2;
                                  return `${x},${y}`;
                                })
                                .join(' ')}
                            />
                          )}
                        </svg>
                      </div>

                      {/* Current Price & % */}
                      <div className="text-right">
                        <span className="text-sm font-bold font-mono text-amber-300 block">
                          {item.currentPrice} <span className="text-[10px] text-amber-400">G</span>
                        </span>
                        <span
                          className={`text-[11px] font-mono font-medium flex items-center justify-end gap-0.5 ${
                            isPositive ? 'text-emerald-400' : isNegative ? 'text-rose-400' : 'text-stone-400'
                          }`}
                        >
                          {isPositive ? <TrendingUp className="w-3 h-3" /> : isNegative ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                          {isPositive ? '+' : ''}{item.changePercent}%
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Direct Sell Trading Station */}
          <div className="lg:col-span-5 p-5 bg-stone-950/40 flex flex-col justify-between gap-4 overflow-y-auto">
            {selectedMarketRate ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 pb-3 border-b border-stone-800">
                  <span className="text-4xl p-2 bg-stone-900 rounded-xl">{selectedMarketRate.icon}</span>
                  <div>
                    <h4 className="text-base font-bold text-stone-100">{selectedMarketRate.name} 納品窓口</h4>
                    <span className="text-xs text-stone-400">
                      倉庫内在庫: <strong className="text-stone-200 font-mono">{maxAvailable} 個</strong>
                    </span>
                  </div>
                </div>

                {/* Quality Selector */}
                {inventoryMatches.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-stone-400">売却する品質グレード</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {inventoryMatches.map((inv) => {
                        const q = inv.quality || 'NORMAL';
                        const isQSelected = selectedQuality === q;
                        return (
                          <button
                            key={q}
                            onClick={() => {
                              sound.playClick();
                              setSelectedQuality(q);
                            }}
                            className={`p-2 rounded-lg text-xs font-semibold border flex flex-col text-left transition-colors ${
                              isQSelected
                                ? 'bg-amber-950/60 border-amber-500 text-amber-200'
                                : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                            }`}
                          >
                            <span>{q === 'GOLDEN' ? '★黄金' : q === 'PRISTINE' ? '★極上' : q === 'HIGH' ? '高級' : '通常'}</span>
                            <span className="text-[10px] font-mono text-stone-500">所持: {inv.count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sell Quantity Controls */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-400">売却数量</span>
                    <span className="font-mono font-bold text-stone-200">{sellCount} 個</span>
                  </div>

                  <input
                    type="range"
                    min="1"
                    max={Math.max(1, maxAvailable)}
                    value={sellCount}
                    disabled={maxAvailable === 0}
                    onChange={(e) => setSellCount(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />

                  <div className="flex items-center gap-1.5">
                    {[1, 5, 10, maxAvailable].map((preset, idx) => (
                      <button
                        key={idx}
                        disabled={maxAvailable === 0 || preset > maxAvailable}
                        onClick={() => {
                          sound.playClick();
                          setSellCount(Math.min(preset, maxAvailable));
                        }}
                        className="flex-1 py-1 rounded bg-stone-900 hover:bg-stone-800 border border-stone-800 text-xs font-mono text-stone-300 disabled:opacity-40 transition-colors"
                      >
                        {preset === maxAvailable ? '全量' : `${preset}個`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Breakdown Calculation */}
                <div className="p-3 bg-stone-900/90 rounded-xl border border-stone-800 flex flex-col gap-1.5 text-xs">
                  <div className="flex justify-between text-stone-400">
                    <span>市場単価</span>
                    <span className="font-mono text-stone-200">{unitPrice} G</span>
                  </div>
                  {qualityMul > 1 && (
                    <div className="flex justify-between text-amber-400">
                      <span>品質ボーナス</span>
                      <span className="font-mono">×{qualityMul}</span>
                    </div>
                  )}
                  {eventMul > 1 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>気象・イベント特需</span>
                      <span className="font-mono">×{eventMul}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-stone-800 flex justify-between items-center text-sm font-bold">
                    <span className="text-stone-200">受取予定額</span>
                    <span className="font-mono text-amber-300 text-base">🪙 {totalPayout.toLocaleString()} G</span>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Execute Sell Button */}
            <button
              onClick={handleExecuteSell}
              disabled={maxAvailable === 0}
              className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition-all ${
                maxAvailable > 0
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-98 shadow-emerald-900/30'
                  : 'bg-stone-800 text-stone-500 cursor-not-allowed'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>
                {maxAvailable > 0 ? `世界市場へ売却 (+${totalPayout.toLocaleString()} G)` : '倉庫に在庫がありません'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
