import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { HeaderHUD } from './components/HeaderHUD';
import { GlobalEventBanner } from './components/GlobalEventBanner';
import { FarmCanvas } from './components/FarmCanvas';
import { BatchActionBar } from './components/BatchActionBar';
import { TileInspector } from './components/TileInspector';
import { WarehouseModal } from './components/WarehouseModal';
import { WorldMarketModal } from './components/WorldMarketModal';
import { AuctionHouseModal } from './components/AuctionHouseModal';
import { NpcShopModal } from './components/NpcShopModal';
import { CraftingModal } from './components/CraftingModal';
import { CommunityFarmsModal } from './components/CommunityFarmsModal';
import { CollectionModal } from './components/CollectionModal';
import { HelpModal } from './components/HelpModal';
import { OfflineCatchupModal } from './components/OfflineCatchupModal';
import {
  PlayerState,
  GlobalEvent,
  MarketItemRate,
  AuctionListing,
  OtherFarmProfile,
  TileData,
  InventoryItem,
  OfflineCatchupSummary,
} from './types/game';
import { sound } from './services/audio';
import { safeStorage } from './utils/storage';

export default function App() {
  const [player, setPlayer] = useState<PlayerState | null>(null);
  const [globalEvent, setGlobalEvent] = useState<GlobalEvent | null>(null);
  const [marketRates, setMarketRates] = useState<MarketItemRate[]>([]);
  const [auctions, setAuctions] = useState<AuctionListing[]>([]);
  const [communityFarms, setCommunityFarms] = useState<OtherFarmProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // UI Navigation & View Modals
  const [activeTab, setActiveTab] = useState<
    'FARM' | 'WAREHOUSE' | 'MARKET' | 'AUCTION' | 'SHOP' | 'CRAFT' | 'COMMUNITY' | 'COLLECTION'
  >('FARM');
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Visiting other player's farm mode
  const [visitedFarm, setVisitedFarm] = useState<OtherFarmProfile | null>(null);

  // Selection & Inspector
  const [selectedTileIds, setSelectedTileIds] = useState<string[]>([]);
  const [inspectedTile, setInspectedTile] = useState<TileData | null>(null);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState<boolean>(false);
  const inspectedTileIdRef = useRef<string | null>(null);

  // Quick jump targeting
  const [marketPreselectCropId, setMarketPreselectCropId] = useState<string | undefined>();
  const [craftPreselectFacility, setCraftPreselectFacility] = useState<string | undefined>();

  // Dynamic Chunk Tiles Cache for Infinite Territory Exploration
  const [chunkTilesMap, setChunkTilesMap] = useState<Map<string, TileData>>(new Map());

  const handleViewportChange = useCallback(
    async (minX: number, maxX: number, minY: number, maxY: number) => {
      if (visitedFarm) return;
      try {
        const res = await fetch('/api/tiles/chunk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ minX, maxX, minY, maxY }),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.tiles)) {
            setChunkTilesMap((prev) => {
              const next = new Map(prev);
              data.tiles.forEach((t: TileData) => {
                next.set(`${t.x}_${t.y}`, t);
              });
              return next;
            });
          }
        }
      } catch (err) {
        console.error('Failed to query viewport chunk tiles:', err);
      }
    },
    [visitedFarm]
  );

  // Feedback Toast Notification
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Offline Theoretical Growth Catch-up Modal state
  const [offlineCatchupData, setOfflineCatchupData] = useState<OfflineCatchupSummary | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 3200);
  };

  // Sync state with server (smart update to prevent tile inspector re-render blinking)
  const fetchState = useCallback(async (isInitialOrResume = false) => {
    try {
      let url = '/api/state';
      if (isInitialOrResume) {
        const lastActiveStr = safeStorage.getItem('farmverse_last_active');
        if (lastActiveStr) {
          url += `?clientLastActiveAt=${lastActiveStr}`;
        }
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPlayer(data.player);
        setGlobalEvent(data.globalEvent);
        setMarketRates(data.marketRates || []);
        setAuctions(data.auctions || []);
        setCommunityFarms(data.communityFarms || []);

        // Record heartbeat safely
        safeStorage.setItem('farmverse_last_active', String(Date.now()));

        // Show offline catchup summary modal and toast if returned
        if (data.offlineCatchup && data.offlineCatchup.offlineSec >= 10) {
          setOfflineCatchupData(data.offlineCatchup);
          showToast(data.offlineCatchup.message, 'success');
        }

        // Keep inspected tile up to date only when state actually changed
        if (inspectedTileIdRef.current && !visitedFarm) {
          const fresh = data.player.tiles.find((t: TileData) => t.id === inspectedTileIdRef.current);
          if (fresh) {
            setInspectedTile((prev) => {
              if (
                !prev ||
                prev.type !== fresh.type ||
                prev.stage !== fresh.stage ||
                prev.plantedCropId !== fresh.plantedCropId ||
                prev.fertilizerType !== fresh.fertilizerType ||
                Math.abs(prev.soilMoisture - fresh.soilMoisture) > 2 ||
                Math.abs(prev.growthProgress - fresh.growthProgress) > 0.05 ||
                prev.hasWeed !== fresh.hasWeed ||
                prev.hasPest !== fresh.hasPest ||
                JSON.stringify(prev.automation) !== JSON.stringify(fresh.automation)
              ) {
                return fresh;
              }
              return prev; // keep reference to prevent flickering
            });
          }
        }
      }
    } catch (err) {
      console.error('Failed to sync game state:', err);
    } finally {
      setLoading(false);
    }
  }, [visitedFarm]);

  // Initial load & Polling interval + visibility / offline resume detection
  useEffect(() => {
    fetchState(true);

    const interval = setInterval(() => {
      fetchState(false);
      safeStorage.setItem('farmverse_last_active', String(Date.now()));
    }, 2500);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchState(true);
      } else {
        safeStorage.setItem('farmverse_last_active', String(Date.now()));
      }
    };

    const handleBeforeUnload = () => {
      safeStorage.setItem('farmverse_last_active', String(Date.now()));
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [fetchState]);

  // Tile Selection Handler
  const handleTileClick = (tile: TileData) => {
    if (visitedFarm) {
      // In visitor mode: single inspection only (read-only)
      setSelectedTileIds([tile.id]);
      setInspectedTile(tile);
      inspectedTileIdRef.current = tile.id;
      return;
    }

    if (isMultiSelectMode) {
      if (selectedTileIds.includes(tile.id)) {
        setSelectedTileIds(selectedTileIds.filter((id) => id !== tile.id));
      } else {
        setSelectedTileIds([...selectedTileIds, tile.id]);
      }
    } else {
      setSelectedTileIds([tile.id]);
      setInspectedTile(tile);
      inspectedTileIdRef.current = tile.id;
    }
  };

  // Farm Action API Execution
  const handleFarmAction = async (
    actionType: string,
    options?: { seedCropId?: string; fertilizerItemId?: string }
  ) => {
    if (!player || selectedTileIds.length === 0 || visitedFarm) return;

    try {
      const res = await fetch('/api/farm/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType,
          tileIds: selectedTileIds,
          seedCropId: options?.seedCropId,
          fertilizerItemId: options?.fertilizerItemId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPlayer(data.player);
        showToast(data.message, 'success');
        if (inspectedTile) {
          const updated = data.player.tiles.find((t: TileData) => t.id === inspectedTile.id);
          if (updated) setInspectedTile(updated);
        }
      } else {
        showToast(data.message || '操作を実行できませんでした', 'error');
      }
    } catch {
      showToast('通信エラーが発生しました', 'error');
    }
  };

  // Land Expansion Purchase
  const handleExpandLand = async (tileId: string) => {
    try {
      const res = await fetch('/api/land/expand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tileId }),
      });
      const data = await res.json();
      if (data.success) {
        setPlayer(data.player);
        showToast(data.message, 'success');
        const updated = data.player.tiles.find((t: TileData) => t.id === tileId);
        if (updated) setInspectedTile(updated);
        // Clear from chunk map so player.tiles overrides cleanly
        setChunkTilesMap((prev) => {
          const next = new Map(prev);
          const parts = tileId.replace('tile_', '').split('_');
          next.delete(`${parts[0]}_${parts[1]}`);
          return next;
        });
      } else {
        showToast(data.message || '土地の開拓に失敗しました', 'error');
      }
    } catch {
      showToast('通信エラーが発生しました', 'error');
    }
  };

  // Automation Equipment Handlers
  const handleInstallMachine = async (tileId: string, machineType: string) => {
    try {
      const res = await fetch('/api/automation/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tileId, machineType }),
      });
      const data = await res.json();
      if (data.success) {
        setPlayer(data.player);
        showToast(data.message, 'success');
        const updated = data.player.tiles.find((t: TileData) => t.id === tileId);
        if (updated) setInspectedTile(updated);
      } else {
        showToast(data.message || '設備の設置に失敗しました', 'error');
      }
    } catch {
      showToast('通信エラーが発生しました', 'error');
    }
  };

  const handleConfigureMachine = async (
    tileId: string,
    config: { machineType: string; targetCropId?: string; targetFertilizerId?: string; targetThreshold?: number }
  ) => {
    try {
      const res = await fetch('/api/automation/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tileId, ...config }),
      });
      const data = await res.json();
      if (data.success) {
        setPlayer(data.player);
        showToast(data.message, 'success');
        const updated = data.player.tiles.find((t: TileData) => t.id === tileId);
        if (updated) setInspectedTile(updated);
      } else {
        showToast(data.message || '設定の更新に失敗しました', 'error');
      }
    } catch {
      showToast('通信エラーが発生しました', 'error');
    }
  };

  // Warehouse Upgrade
  const handleUpgradeWarehouse = async () => {
    try {
      const res = await fetch('/api/warehouse/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        setPlayer(data.player);
        showToast(data.message, 'success');
      } else {
        showToast(data.message || '倉庫の増築に失敗しました', 'error');
      }
    } catch {
      showToast('通信エラーが発生しました', 'error');
    }
  };

  // World Market Sell
  const handleSellToMarket = async (itemId: string, quality: string, count: number) => {
    try {
      const res = await fetch('/api/market/sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, quality, count }),
      });
      const data = await res.json();
      if (data.success) {
        setPlayer(data.player);
        setMarketRates(data.marketRates);
        showToast(data.message, 'success');
      } else {
        showToast(data.message || '売却処理に失敗しました', 'error');
      }
    } catch {
      showToast('通信エラーが発生しました', 'error');
    }
  };

  // NPC Shop Buy
  const handleBuyFromShop = async (itemId: string, count: number) => {
    try {
      const res = await fetch('/api/shop/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, count }),
      });
      const data = await res.json();
      if (data.success) {
        setPlayer(data.player);
        showToast(data.message, 'success');
      } else {
        showToast(data.message || '購入処理に失敗しました', 'error');
      }
    } catch {
      showToast('通信エラーが発生しました', 'error');
    }
  };

  // Crafting Start & Collect
  const handleStartCraft = async (recipeId: string, facilityId: string) => {
    try {
      const res = await fetch('/api/craft/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId, facilityId }),
      });
      const data = await res.json();
      if (data.success) {
        setPlayer(data.player);
        showToast(data.message, 'success');
      } else {
        showToast(data.message || 'クラフトを開始できませんでした', 'error');
      }
    } catch {
      showToast('通信エラーが発生しました', 'error');
    }
  };

  const handleCollectCraft = async (jobId: string) => {
    try {
      const res = await fetch('/api/craft/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();
      if (data.success) {
        setPlayer(data.player);
        showToast(data.message, 'success');
      } else {
        showToast(data.message || '回収処理に失敗しました', 'error');
      }
    } catch {
      showToast('通信エラーが発生しました', 'error');
    }
  };

  // Auction Buyout & Create
  const handleAuctionBuyout = async (listingId: string) => {
    try {
      const res = await fetch('/api/auction/buyout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId }),
      });
      const data = await res.json();
      if (data.success) {
        setPlayer(data.player);
        setAuctions(data.auctions);
        showToast(data.message, 'success');
      } else {
        showToast(data.message || '落札処理に失敗しました', 'error');
      }
    } catch {
      showToast('通信エラーが発生しました', 'error');
    }
  };

  const handleCreateAuctionListing = async (params: {
    itemId: string;
    quality: string;
    count: number;
    startingBid: number;
    buyoutPrice: number;
    durationMinutes: number;
  }) => {
    try {
      const res = await fetch('/api/auction/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (data.success) {
        setPlayer(data.player);
        setAuctions(data.auctions);
        showToast(data.message, 'success');
      } else {
        showToast(data.message || '出品処理に失敗しました', 'error');
      }
    } catch {
      showToast('通信エラーが発生しました', 'error');
    }
  };

  // Neighbor Kudos & World Visit
  const handleSendKudos = async (farmId: string) => {
    try {
      const res = await fetch('/api/farms/kudos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmId }),
      });
      const data = await res.json();
      if (data.success) {
        setPlayer(data.player);
        setCommunityFarms((prev) =>
          prev.map((f) => (f.id === farmId ? { ...f, kudosCount: f.kudosCount + 1, hasGivenKudos: true } : f))
        );
        showToast(data.message, 'success');
      } else {
        showToast(data.message || '応援処理に失敗しました', 'error');
      }
    } catch {
      showToast('通信エラーが発生しました', 'error');
    }
  };

  const handleVisitFarmWorld = async (farm: OtherFarmProfile) => {
    try {
      let targetFarm = farm;
      if (!farm.tiles || farm.tiles.length === 0) {
        const res = await fetch(`/api/farms/${farm.id}/tiles`);
        if (res.ok) {
          const data = await res.json();
          targetFarm = { ...farm, tiles: data.tiles };
        }
      }
      setVisitedFarm(targetFarm);
      setSelectedTileIds([]);
      setInspectedTile(null);
      inspectedTileIdRef.current = null;
      setActiveTab('FARM');
      showToast(`${farm.name} のワールドへ訪問しました（閲覧専用）`, 'info');
    } catch {
      showToast('農園ワールドの読み込みに失敗しました', 'error');
    }
  };

  const handleReturnToOwnFarm = () => {
    setVisitedFarm(null);
    setSelectedTileIds([]);
    setInspectedTile(null);
    inspectedTileIdRef.current = null;
    showToast('自分の農場へ戻りました', 'info');
  };

  if (loading || !player || !globalEvent) {
    return (
      <div
        className="w-full h-full min-h-screen bg-stone-950 flex flex-col items-center justify-center text-stone-200 gap-4 p-6 select-none"
        style={{ backgroundColor: '#0c0a09' }}
      >
        <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="font-semibold text-sm text-amber-200 font-['M_PLUS_Rounded_1c']">
            FarmVerse 農業経済ワールドへ接続中...
          </span>
          <span className="text-xs text-stone-500">オフライン中の作物理論成長を同期中</span>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            fetchState(true);
          }}
          className="mt-3 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-2"
        >
          <span>接続を再試行・農園へ入場</span>
        </button>
      </div>
    );
  }

  // Active display tiles (Own farm + dynamically explored unclaimed chunks vs Visited neighbor farm)
  const displayTiles = useMemo(() => {
    if (visitedFarm) return visitedFarm.tiles;
    if (!player) return [];

    const ownedMap = new Map<string, TileData>();
    player.tiles.forEach((t) => ownedMap.set(`${t.x}_${t.y}`, t));

    const combined: TileData[] = [...player.tiles];
    chunkTilesMap.forEach((chunkTile, key) => {
      if (!ownedMap.has(key)) {
        combined.push(chunkTile);
      }
    });

    return combined;
  }, [visitedFarm, player, chunkTilesMap]);

  const selectedTiles = displayTiles.filter((t) => selectedTileIds.includes(t.id));

  return (
    <div className="w-full h-screen flex flex-col bg-stone-950 text-stone-100 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. Header HUD */}
      <HeaderHUD
        player={player}
        globalEvent={globalEvent}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenHelp={() => setShowHelpModal(true)}
        isVisitingNeighbor={!!visitedFarm}
        onReturnToOwnFarm={handleReturnToOwnFarm}
      />

      {/* 2. Global Event Dynamic Banner */}
      <GlobalEventBanner event={globalEvent} />

      {/* 3. Main 2D Canvas Farm Area */}
      <main className="relative flex-1 w-full h-full overflow-hidden flex flex-col">
        <FarmCanvas
          tiles={displayTiles}
          selectedTileIds={selectedTileIds}
          onSelectTiles={(ids) => {
            setSelectedTileIds(ids);
            if (ids.length === 1) {
              const single = displayTiles.find((t) => t.id === ids[0]);
              setInspectedTile(single || null);
              inspectedTileIdRef.current = ids[0];
            } else {
              setInspectedTile(null);
              inspectedTileIdRef.current = null;
            }
          }}
          onTileClick={handleTileClick}
          isMultiSelectMode={isMultiSelectMode}
          setIsMultiSelectMode={setIsMultiSelectMode}
          visitorFarmName={visitedFarm ? visitedFarm.name : null}
          onReturnToOwnFarm={handleReturnToOwnFarm}
          onViewportChange={handleViewportChange}
        />

        {/* 4. Batch Action Floating Bottom Bar (hidden in visitor mode) */}
        {!visitedFarm && (
          <BatchActionBar
            selectedTiles={selectedTiles}
            allTiles={player.tiles}
            inventory={player.inventory}
            onBatchAction={handleFarmAction}
            onSelectSpecificTiles={(ids) => setSelectedTileIds(ids)}
            onClearSelection={() => {
              setSelectedTileIds([]);
              setInspectedTile(null);
              inspectedTileIdRef.current = null;
            }}
          />
        )}

        {/* 5. Tile Inspector HUD */}
        {inspectedTile && selectedTileIds.length <= 1 && (
          <TileInspector
            tile={inspectedTile}
            inventory={player.inventory}
            playerGold={player.gold}
            isReadOnly={!!visitedFarm}
            onClose={() => {
              setInspectedTile(null);
              inspectedTileIdRef.current = null;
            }}
            onAction={handleFarmAction}
            onExpandLand={handleExpandLand}
            onOpenFacility={(facType) => {
              if (facType === 'WAREHOUSE') setActiveTab('WAREHOUSE');
              else if (facType === 'FERTILIZER_PLANT' || facType === 'PROCESSING_WORKSHOP') {
                setCraftPreselectFacility(facType);
                setActiveTab('CRAFT');
              }
            }}
            onInstallMachine={handleInstallMachine}
            onConfigureMachine={handleConfigureMachine}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav aria-label="モバイル下部ナビゲーション" className="xl:hidden bg-stone-900/95 border-t border-stone-800 text-stone-300 py-1 px-1 flex items-center justify-around z-20">
        {[
          { id: 'FARM', label: '農場', icon: '🌾' },
          { id: 'WAREHOUSE', label: '倉庫', icon: '📦' },
          { id: 'MARKET', label: '世界市場', icon: '📈' },
          { id: 'AUCTION', label: '競売', icon: '⚖️' },
          { id: 'SHOP', label: '農協', icon: '🏪' },
          { id: 'CRAFT', label: '工房', icon: '🛠️' },
          { id: 'COLLECTION', label: '図鑑', icon: '📖' },
          { id: 'COMMUNITY', label: '近隣', icon: '🏡' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => {
              sound.playClick();
              setActiveTab(item.id as any);
            }}
            className={`flex flex-col items-center py-1 px-1.5 rounded-lg text-[10px] transition-colors ${
              activeTab === item.id ? 'text-amber-400 font-bold bg-amber-950/40' : 'text-stone-400 hover:text-white'
            }`}
          >
            <span className="text-base leading-none mb-0.5">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Floating Feedback Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-xs font-semibold shadow-2xl flex items-center gap-2 border animate-in fade-in slide-in-from-top-2 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-600 text-emerald-200'
              : toastMessage.type === 'error'
              ? 'bg-rose-950/90 border-rose-600 text-rose-200'
              : 'bg-stone-900/90 border-stone-700 text-stone-200'
          }`}
        >
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* MODALS */}
      {activeTab === 'WAREHOUSE' && (
        <WarehouseModal
          inventory={player.inventory}
          maxCapacity={player.storageMaxCapacity}
          warehouseLevel={player.warehouseLevel || 1}
          playerGold={player.gold}
          onClose={() => setActiveTab('FARM')}
          onOpenMarketForCrop={(cropId, quality) => {
            setMarketPreselectCropId(cropId);
            setActiveTab('MARKET');
          }}
          onOpenAuctionForCrop={() => {
            setActiveTab('AUCTION');
          }}
          onUpgradeWarehouse={handleUpgradeWarehouse}
        />
      )}

      {activeTab === 'MARKET' && (
        <WorldMarketModal
          marketRates={marketRates}
          inventory={player.inventory}
          globalEvent={globalEvent}
          initialSelectedCropId={marketPreselectCropId}
          onClose={() => {
            setMarketPreselectCropId(undefined);
            setActiveTab('FARM');
          }}
          onSellToMarket={handleSellToMarket}
        />
      )}

      {activeTab === 'AUCTION' && (
        <AuctionHouseModal
          auctions={auctions}
          inventory={player.inventory}
          playerGold={player.gold}
          playerId={player.playerId}
          onClose={() => setActiveTab('FARM')}
          onBuyout={handleAuctionBuyout}
          onCreateListing={handleCreateAuctionListing}
        />
      )}

      {activeTab === 'SHOP' && (
        <NpcShopModal
          playerGold={player.gold}
          onClose={() => setActiveTab('FARM')}
          onBuyItem={handleBuyFromShop}
        />
      )}

      {activeTab === 'CRAFT' && (
        <CraftingModal
          craftJobs={player.craftJobs}
          inventory={player.inventory}
          initialFacilityType={craftPreselectFacility}
          onClose={() => {
            setCraftPreselectFacility(undefined);
            setActiveTab('FARM');
          }}
          onStartCraft={handleStartCraft}
          onCollectCraft={handleCollectCraft}
        />
      )}

      {activeTab === 'COLLECTION' && (
        <CollectionModal
          discoveredItems={player.discoveredItems || {}}
          onClose={() => setActiveTab('FARM')}
        />
      )}

      {activeTab === 'COMMUNITY' && (
        <CommunityFarmsModal
          farms={communityFarms}
          onClose={() => setActiveTab('FARM')}
          onSendKudos={handleSendKudos}
          onVisitFarm={handleVisitFarmWorld}
        />
      )}

      {showHelpModal && (
        <HelpModal onClose={() => setShowHelpModal(false)} />
      )}

      {/* Offline Theoretical Growth Report Modal */}
      {offlineCatchupData && (
        <OfflineCatchupModal
          summary={offlineCatchupData}
          onClose={() => setOfflineCatchupData(null)}
        />
      )}
    </div>
  );
}
