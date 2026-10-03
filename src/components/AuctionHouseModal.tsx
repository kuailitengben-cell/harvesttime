import React, { useState } from 'react';
import { Gavel, Clock, PlusCircle, X, ShieldAlert, CheckCircle2, User } from 'lucide-react';
import { AuctionListing, InventoryItem } from '../types/game';
import { sound } from '../services/audio';

interface AuctionHouseModalProps {
  auctions: AuctionListing[];
  inventory: InventoryItem[];
  playerGold: number;
  playerId: string;
  onClose: () => void;
  onBuyout: (listingId: string) => void;
  onCreateListing: (params: {
    itemId: string;
    quality: string;
    count: number;
    startingBid: number;
    buyoutPrice: number;
    durationMinutes: number;
  }) => void;
}

export const AuctionHouseModal: React.FC<AuctionHouseModalProps> = ({
  auctions,
  inventory,
  playerGold,
  playerId,
  onClose,
  onBuyout,
  onCreateListing,
}) => {
  const [activeTab, setActiveTab] = useState<'LISTINGS' | 'CREATE'>('LISTINGS');

  // Create Form State
  const [selectedInventoryId, setSelectedInventoryId] = useState<string>('');
  const [listingCount, setListingCount] = useState<number>(10);
  const [startingBid, setStartingBid] = useState<number>(100);
  const [buyoutPrice, setBuyoutPrice] = useState<number>(150);
  const [durationMinutes, setDurationMinutes] = useState<number>(30);

  const selectedItem = inventory.find((i) => i.id === selectedInventoryId);
  const listingFee = Math.max(5, Math.round(startingBid * 0.05));

  const formatRemainingTime = (endsAt: number) => {
    const diff = Math.max(0, Math.floor((endsAt - Date.now()) / 1000));
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return `${mins}分${secs}秒`;
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    if (playerGold < listingFee) return;

    sound.playCoin();
    onCreateListing({
      itemId: selectedItem.itemId,
      quality: selectedItem.quality || 'NORMAL',
      count: Math.min(listingCount, selectedItem.count),
      startingBid,
      buyoutPrice,
      durationMinutes,
    });
    setActiveTab('LISTINGS');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="w-full max-w-5xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden text-stone-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Gavel className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-100 font-['M_PLUS_Rounded_1c']">プレイヤー取引オークション</h2>
              <p className="text-xs text-stone-400">
                農家同士で農産物・加工品・肥料を自由に競売・即決売買できます
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 p-1 bg-stone-950 rounded-xl border border-stone-800">
              <button
                onClick={() => {
                  sound.playClick();
                  setActiveTab('LISTINGS');
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  activeTab === 'LISTINGS'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                現在出品中 ({auctions.length})
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setActiveTab('CREATE');
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${
                  activeTab === 'CREATE'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>新しく出品</span>
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

        {/* Tab 1: Active Listings */}
        {activeTab === 'LISTINGS' && (
          <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-3">
            {auctions.length === 0 ? (
              <div className="py-20 text-center text-stone-500 text-sm">
                現在オークションに出品されている商品はありません
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {auctions.map((auc) => {
                  const isOwner = auc.sellerId === playerId;
                  const canAfford = playerGold >= auc.buyoutPrice;

                  return (
                    <div
                      key={auc.id}
                      className="p-4 bg-stone-950/70 border border-stone-800 rounded-xl flex flex-col justify-between gap-3 hover:border-stone-700 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl p-1.5 bg-stone-900 rounded-xl">{auc.icon}</span>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-stone-100 flex items-center gap-1.5">
                              {auc.itemName}
                              {auc.quality && auc.quality !== 'NORMAL' && (
                                <span className="text-[10px] text-amber-400 font-semibold">
                                  {auc.quality === 'GOLDEN' ? '★黄金' : auc.quality === 'PRISTINE' ? '★極上' : '高級'}
                                </span>
                              )}
                            </span>
                            <span className="text-xs text-stone-400 flex items-center gap-1">
                              <User className="w-3 h-3 text-stone-500" />
                              出品者: {auc.sellerName}
                              {isOwner && <span className="text-amber-400 text-[10px]">(あなた)</span>}
                            </span>
                          </div>
                        </div>

                        <span className="font-mono font-bold text-base text-stone-200">×{auc.count}</span>
                      </div>

                      {/* Prices & Timer */}
                      <div className="grid grid-cols-2 gap-2 p-2.5 bg-stone-900/80 rounded-lg text-xs font-mono">
                        <div>
                          <span className="text-stone-400 text-[10px] block font-sans">現在価格 / 入札</span>
                          <span className="text-stone-200 font-semibold">{auc.currentBid.toLocaleString()} G</span>
                          <span className="text-stone-500 text-[10px] ml-1 font-sans">({auc.bidsCount}件)</span>
                        </div>
                        <div>
                          <span className="text-amber-400 text-[10px] block font-sans">即決価格 (Buyout)</span>
                          <span className="text-amber-300 font-bold text-sm">{auc.buyoutPrice.toLocaleString()} G</span>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-stone-800/80 text-xs">
                        <span className="text-stone-400 flex items-center gap-1 font-mono text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-stone-500" />
                          残り: {formatRemainingTime(auc.endsAt)}
                        </span>

                        {!isOwner ? (
                          <button
                            onClick={() => {
                              sound.playCoin();
                              onBuyout(auc.id);
                            }}
                            disabled={!canAfford}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                              canAfford
                                ? 'bg-amber-600 hover:bg-amber-500 text-white active:scale-95'
                                : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                            }`}
                          >
                            即決購入 ({auc.buyoutPrice.toLocaleString()} G)
                          </button>
                        ) : (
                          <span className="text-[11px] text-stone-400">自分の出品物</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Create Listing Form */}
        {activeTab === 'CREATE' && (
          <form onSubmit={handleCreateSubmit} className="p-6 overflow-y-auto flex-1 flex flex-col gap-4 max-w-xl mx-auto w-full">
            <h3 className="text-sm font-bold text-stone-200">倉庫からアイテムを選んで出品</h3>

            {/* Select Item */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-stone-400">出品するアイテム</label>
              <select
                value={selectedInventoryId}
                onChange={(e) => {
                  setSelectedInventoryId(e.target.value);
                  const item = inventory.find((i) => i.id === e.target.value);
                  if (item) {
                    setListingCount(Math.min(10, item.count));
                    setStartingBid(item.basePrice * Math.min(10, item.count));
                    setBuyoutPrice(Math.round(item.basePrice * Math.min(10, item.count) * 1.3));
                  }
                }}
                className="w-full p-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 focus:outline-none focus:border-amber-500"
              >
                <option value="">選択してください...</option>
                {inventory.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.icon} {inv.name} (所持: {inv.count})
                  </option>
                ))}
              </select>
            </div>

            {selectedItem && (
              <>
                {/* Quantity */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-400">出品数量</span>
                    <span className="font-mono text-stone-200">所持数: {selectedItem.count}個</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max={selectedItem.count}
                    value={listingCount}
                    onChange={(e) => {
                      const count = Number(e.target.value);
                      setListingCount(count);
                      setStartingBid(selectedItem.basePrice * count);
                      setBuyoutPrice(Math.round(selectedItem.basePrice * count * 1.3));
                    }}
                    className="w-full p-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 font-mono"
                  />
                </div>

                {/* Starting Bid & Buyout Price */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-stone-400">開始入札価格 (G)</label>
                    <input
                      type="number"
                      min="10"
                      value={startingBid}
                      onChange={(e) => setStartingBid(Number(e.target.value))}
                      className="w-full p-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-stone-400">即決購入価格 (G)</label>
                    <input
                      type="number"
                      min={startingBid}
                      value={buyoutPrice}
                      onChange={(e) => setBuyoutPrice(Number(e.target.value))}
                      className="w-full p-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 font-mono"
                    />
                  </div>
                </div>

                {/* Duration */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-stone-400">出品掲載時間</label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full p-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200"
                  >
                    <option value={15}>15分 (短時間)</option>
                    <option value={30}>30分 (標準)</option>
                    <option value={60}>1時間</option>
                    <option value={120}>2時間</option>
                  </select>
                </div>

                {/* Listing Fee Notification */}
                <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 flex items-center justify-between text-xs">
                  <span className="text-stone-400">出品手数料 (開始価格の5%):</span>
                  <span className="font-mono font-bold text-amber-400">🪙 {listingFee} G</span>
                </div>

                <button
                  type="submit"
                  disabled={playerGold < listingFee}
                  className={`w-full py-3 rounded-xl text-sm font-bold shadow-md transition-all ${
                    playerGold >= listingFee
                      ? 'bg-amber-600 hover:bg-amber-500 text-white active:scale-98'
                      : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  {playerGold >= listingFee ? 'オークションに出品する' : '手数料のゴールドが不足しています'}
                </button>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
