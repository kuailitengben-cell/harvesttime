import React, { useState } from 'react';
import {
  Droplet,
  Sparkles,
  Scissors,
  Bug,
  Sprout,
  FlaskConical,
  Trash2,
  X,
  Compass,
  Cpu,
  Check,
  ChevronDown,
  Info,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { TileData, InventoryItem, SpecialTerrainType } from '../types/game';
import { CROPS_CATALOG } from '../data/crops';
import { AUTOMATION_MACHINES, SPECIAL_TERRAIN_CONFIG } from '../data/automation';
import { sound } from '../services/audio';
import { formatLargeNumber, formatExactNumber } from '../utils/numberFormat';

interface TileInspectorProps {
  tile: TileData | null;
  inventory: InventoryItem[];
  playerGold: number;
  isReadOnly?: boolean;
  onClose: () => void;
  onAction: (actionType: string, options?: { seedCropId?: string; fertilizerItemId?: string }) => void;
  onExpandLand: (tileId: string) => void;
  onOpenFacility: (facilityType: string) => void;
  onInstallMachine?: (tileId: string, machineType: string) => void;
  onConfigureMachine?: (
    tileId: string,
    config: { machineType: string; targetCropId?: string; targetFertilizerId?: string; targetThreshold?: number }
  ) => void;
}

export const TileInspector: React.FC<TileInspectorProps> = ({
  tile,
  inventory,
  playerGold,
  isReadOnly = false,
  onClose,
  onAction,
  onExpandLand,
  onOpenFacility,
  onInstallMachine,
  onConfigureMachine,
}) => {
  const [activeTab, setActiveTab] = useState<'ACTIONS' | 'AUTOMATION'>('ACTIONS');
  const [selectedSeedToPlant, setSelectedSeedToPlant] = useState<string>('crop_wheat');

  if (!tile) return null;

  const crop = tile.plantedCropId ? CROPS_CATALOG[tile.plantedCropId] : null;
  const specialMeta = SPECIAL_TERRAIN_CONFIG[tile.specialTerrain || 'NONE'];

  // Check automation machines installation
  const hasSeeder = !!tile.automation?.seeder?.installed;
  const hasFertilizer = !!tile.automation?.fertilizer?.installed;
  const hasWaterer = !!tile.automation?.waterer?.installed;
  const hasHarvester = !!tile.automation?.harvester?.installed;
  const installedCount = [hasSeeder, hasFertilizer, hasWaterer, hasHarvester].filter(Boolean).length;
  const isCompleteAutomation = installedCount === 4;

  const availableSeeds = inventory.filter((item) => item.category === 'SEED' && item.count > 0);
  const availableFertilizers = inventory.filter((item) => item.category === 'FERTILIZER' && item.count > 0);

  const getStageBadge = (stage: TileData['stage']) => {
    switch (stage) {
      case 'SEED':
        return <span className="text-stone-400">種まき完了</span>;
      case 'SPROUT':
        return <span className="text-lime-400">発芽</span>;
      case 'GROWING':
        return <span className="text-emerald-400">成長中</span>;
      case 'MATURE':
        return <span className="text-amber-300 font-bold">収穫可能！</span>;
      case 'OVERRIPE':
        return <span className="text-orange-400 font-semibold">過熟（要急ぎ収穫）</span>;
      case 'SPOILED':
        return <span className="text-rose-400 font-bold">腐敗（堆肥化可能）</span>;
    }
  };

  const getQualityBadge = (quality: TileData['quality']) => {
    switch (quality) {
      case 'GOLDEN':
        return <span className="text-amber-300 font-bold">★ 黄金品質</span>;
      case 'PRISTINE':
        return <span className="text-purple-300 font-semibold">★ 極上品</span>;
      case 'HIGH':
        return <span className="text-blue-300 font-semibold">高級品</span>;
      default:
        return <span className="text-stone-400">通常品質</span>;
    }
  };

  return (
    <div className="fixed top-14 right-3 z-30 w-88 max-w-[calc(100vw-1.5rem)] bg-stone-900/95 backdrop-blur-md rounded-2xl border border-stone-800 shadow-2xl p-4 text-stone-100 flex flex-col gap-3 max-h-[85vh] overflow-y-auto animate-in fade-in slide-in-from-right-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-2">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-amber-500" />
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-stone-200">
              区画 ({tile.x}, {tile.y})
            </span>
            <span className="text-[11px] text-stone-400">
              {tile.biome === 'FERTILE'
                ? '肥沃な平原'
                : tile.biome === 'WATERSIDE'
                ? '水辺区画'
                : tile.biome === 'FOREST'
                ? '森林地帯'
                : tile.biome === 'MOUNTAIN'
                ? '岩石鉱山'
                : '標準平地'}
            </span>
          </div>
        </div>
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition-colors"
          title="閉じる"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Special Terrain Badge (if not NONE) */}
      {specialMeta && specialMeta.type !== 'NONE' && (
        <div
          className="p-2.5 rounded-xl border flex items-start gap-2.5 text-xs"
          style={{
            backgroundColor: `${specialMeta.color}25`,
            borderColor: `${specialMeta.borderColor}70`,
          }}
        >
          <span className="text-xl shrink-0">{specialMeta.icon}</span>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-stone-100" style={{ color: specialMeta.borderColor }}>
                {specialMeta.name}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 bg-black/40 rounded text-amber-300 font-mono">
                特殊土地
              </span>
            </div>
            <p className="text-[11px] text-stone-300 leading-snug">{specialMeta.perkDescription}</p>
          </div>
        </div>
      )}

      {/* Case 1: Unclaimed Land */}
      {tile.type === 'UNCLAIMED' && (
        <div className="flex flex-col gap-3">
          <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-amber-400 font-semibold flex items-center gap-1.5">
                <span>🌱</span> 未開拓の土地
              </span>
              <span className="text-[11px] text-stone-400 font-mono">
                距離: {Math.round(Math.sqrt(tile.x * tile.x + tile.y * tile.y))} マス
              </span>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed">
              この土地を購入して開墾すると、新しい畑として作物を植えたり自動化設備を設置できます。
            </p>
            <div className="flex items-center justify-between pt-2 border-t border-stone-800/80">
              <span className="text-xs text-stone-400">開墾・購入費用</span>
              <div className="text-right">
                <span className="font-mono font-bold text-amber-300 text-sm">
                  🪙 {formatLargeNumber(tile.unclaimedCost)} G
                </span>
                <span className="text-[10px] text-stone-400 font-mono block">
                  ({formatExactNumber(tile.unclaimedCost)} G)
                </span>
              </div>
            </div>
          </div>

          {isReadOnly ? (
            <div className="p-2.5 bg-stone-950/80 rounded-xl text-center text-xs text-amber-400/90 border border-stone-800 font-medium">
              他プレイヤーの農場を見学中のため、購入・編集はできません
            </div>
          ) : (
            <button
              onClick={() => {
                sound.playTill();
                onExpandLand(tile.id);
              }}
              disabled={playerGold < tile.unclaimedCost}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 ${
                playerGold >= tile.unclaimedCost
                  ? 'bg-amber-600 hover:bg-amber-500 text-white active:scale-95'
                  : 'bg-stone-800 text-stone-500 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {playerGold >= tile.unclaimedCost
                  ? 'この土地を開墾・購入する'
                  : `ゴールド不足 (あと ${(tile.unclaimedCost - playerGold).toLocaleString()} G)`}
              </span>
            </button>
          )}
        </div>
      )}

      {/* Case 2: Facility */}
      {tile.type === 'FACILITY' && tile.facility && (
        <div className="flex flex-col gap-3">
          <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-800 flex flex-col gap-1.5">
            <span className="text-xs text-amber-400 font-semibold">{tile.facility.name}</span>
            <p className="text-xs text-stone-300">
              {tile.facility.type === 'WAREHOUSE' && '農作物の保管と所持品管理を行う施設です。'}
              {tile.facility.type === 'FERTILIZER_PLANT' && '雑草や腐敗作物をリサイクルして肥料を生成します。'}
              {tile.facility.type === 'PROCESSING_WORKSHOP' &&
                '小麦粉やトマトソース、ジャムなどの加工食品を製造します。'}
              {tile.facility.type === 'WELL_SILO' && '農場全体に給水するための地下水脈井戸です。'}
            </p>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onOpenFacility(tile.facility!.type);
            }}
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
          >
            施設を開く / 管理する
          </button>
        </div>
      )}

      {/* Case 3: Cultivated Field */}
      {tile.type === 'FIELD' && (
        <div className="flex flex-col gap-3">
          {/* Sub-tabs: Manual Actions vs 1-Tile Automation System */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-stone-950/80 rounded-xl border border-stone-800 text-xs">
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('ACTIONS');
              }}
              className={`py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'ACTIONS'
                  ? 'bg-stone-800 text-amber-300 font-bold shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              🌱 作物・農作業
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('AUTOMATION');
              }}
              className={`py-1.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'AUTOMATION'
                  ? 'bg-amber-600/90 text-white font-bold shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>自動化設備 ({installedCount}/4)</span>
            </button>
          </div>

          {/* TAB 1: ACTIONS & CROP INFO */}
          {activeTab === 'ACTIONS' && (
            <div className="flex flex-col gap-3">
              {crop ? (
                <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{crop.emoji}</span>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-stone-100">{crop.name}</span>
                        <span className="text-[11px] text-stone-400">
                          {crop.category === 'GRAIN'
                            ? '穀物'
                            : crop.category === 'VEGETABLE'
                            ? '野菜'
                            : crop.category === 'FRUIT'
                            ? '果物'
                            : '特殊作物'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right text-xs">{getStageBadge(tile.stage)}</div>
                  </div>

                  {/* Progress bar */}
                  <div className="flex flex-col gap-1 pt-1">
                    <div className="flex justify-between text-[11px] text-stone-400">
                      <span>成長進捗</span>
                      <span className="font-mono tabular-nums">{Math.round(tile.growthProgress * 100)}%</span>
                    </div>
                    <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                        style={{ width: `${tile.growthProgress * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Moisture & Quality */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-stone-800/80">
                    <div className="flex flex-col">
                      <span className="text-stone-400 text-[10px]">土壌水分</span>
                      <span
                        className={`font-mono font-medium ${
                          tile.soilMoisture < 20 ? 'text-rose-400' : 'text-cyan-400'
                        }`}
                      >
                        💧 {Math.round(tile.soilMoisture)}%
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-stone-400 text-[10px]">予想品質</span>
                      <span className="text-[11px]">{getQualityBadge(tile.quality)}</span>
                    </div>
                  </div>

                  {/* Weeds / Pests alerts */}
                  {(tile.hasWeed || tile.hasPest) && (
                    <div className="flex items-center gap-2 text-xs text-rose-300 bg-rose-950/40 p-2 rounded-lg border border-rose-800/50">
                      {tile.hasWeed && <span>🌿 雑草繁殖中 (-20% 成長)</span>}
                      {tile.hasPest && <span>🐛 害虫発生中 (品質低下)</span>}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-800 text-center flex flex-col gap-2">
                  <div>
                    <span className="text-xs text-stone-300 font-semibold block">耕作地（休耕中）</span>
                    <span className="text-[11px] text-stone-400">種を植えて作物を育てましょう</span>
                  </div>
                  <div className="text-[11px] text-cyan-400 font-mono">
                    土壌水分: 💧 {Math.round(tile.soilMoisture)}%
                  </div>

                  {/* Planting Seed Selector */}
                  {!isReadOnly && availableSeeds.length > 0 && (
                    <div className="pt-2 border-t border-stone-800/80 flex flex-col gap-1.5 text-left">
                      <label className="text-[10px] text-stone-400">植える種を選択:</label>
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedSeedToPlant}
                          onChange={(e) => setSelectedSeedToPlant(e.target.value)}
                          className="flex-1 bg-stone-900 border border-stone-700 text-stone-200 text-xs rounded-lg px-2 py-1.5"
                        >
                          {availableSeeds.map((seed) => {
                            const cropId = seed.itemId.replace('seed_', '');
                            const def = CROPS_CATALOG[cropId];
                            return (
                              <option key={seed.id} value={cropId}>
                                {seed.icon} {seed.name} (所持: {seed.count})
                              </option>
                            );
                          })}
                        </select>
                        <button
                          onClick={() => {
                            sound.playPlant();
                            onAction('PLANT', { seedCropId: selectedSeedToPlant });
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shrink-0 transition-colors"
                        >
                          植える
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action buttons */}
              {isReadOnly ? (
                <div className="p-2.5 bg-stone-950/80 rounded-xl text-center text-xs text-amber-400/90 border border-stone-800 font-medium">
                  他プレイヤーの農場を見学中のため、編集・収穫はできません（閲覧専用）
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {/* Water */}
                  {tile.soilMoisture < 90 && (
                    <button
                      onClick={() => {
                        sound.playWater();
                        onAction('WATER');
                      }}
                      className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Droplet className="w-3.5 h-3.5" />
                      <span>水をやる (水分100%へ)</span>
                    </button>
                  )}

                  {/* Harvest */}
                  {(tile.stage === 'MATURE' || tile.stage === 'OVERRIPE') && (
                    <button
                      onClick={() => {
                        sound.playHarvest();
                        onAction('HARVEST');
                      }}
                      className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-md active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>作物を収穫する (×{crop?.harvestYield})</span>
                    </button>
                  )}

                  {/* Fertilize manually if not fertilized yet */}
                  {tile.plantedCropId && !tile.fertilizerUsed && availableFertilizers.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <select
                        id="manual_fertilizer_select"
                        defaultValue={availableFertilizers[0]?.itemId}
                        className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-2.5 py-1.5 text-xs text-stone-200"
                      >
                        {availableFertilizers.map((f) => (
                          <option key={f.id} value={f.itemId}>
                            {f.icon} {f.name} (所持: {f.count})
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => {
                          const sel = (document.getElementById('manual_fertilizer_select') as HTMLSelectElement)?.value;
                          sound.playClick();
                          onAction('FERTILIZE', { fertilizerItemId: sel });
                        }}
                        className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-xs font-semibold transition-colors"
                      >
                        施肥
                      </button>
                    </div>
                  )}

                  {/* Clear Spoiled */}
                  {tile.stage === 'SPOILED' && (
                    <button
                      onClick={() => {
                        sound.playTill();
                        onAction('CLEAR_SPOILED');
                      }}
                      className="w-full py-2 bg-stone-700 hover:bg-stone-600 text-amber-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>堆肥化して撤去 (腐敗有機堆肥を獲得)</span>
                    </button>
                  )}

                  {/* Weed */}
                  {tile.hasWeed && (
                    <button
                      onClick={() => {
                        sound.playTill();
                        onAction('WEED');
                      }}
                      className="w-full py-2 bg-lime-700 hover:bg-lime-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Scissors className="w-3.5 h-3.5" />
                      <span>雑草を抜く (肥料素材を獲得)</span>
                    </button>
                  )}

                  {/* Pest */}
                  {tile.hasPest && (
                    <button
                      onClick={() => {
                        sound.playTill();
                        onAction('PEST');
                      }}
                      className="w-full py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Bug className="w-3.5 h-3.5" />
                      <span>害虫を駆除する</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: 1-TILE AUTOMATION EQUIPMENT SYSTEM */}
          {activeTab === 'AUTOMATION' && (
            <div className="flex flex-col gap-3">
              {/* Complete Automation Banner */}
              {isCompleteAutomation ? (
                <div className="p-3 bg-gradient-to-r from-amber-950/60 to-emerald-950/60 rounded-xl border border-amber-500/50 flex flex-col gap-1 shadow-md">
                  <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
                    <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span>⚡ 4辺完全自動化ループ稼働中！</span>
                  </div>
                  <p className="text-[11px] text-stone-300 leading-snug">
                    播種・施肥・散水・収穫の全行程が自動化されています。倉庫に種がある限り永久に作物を生産し続けます。
                  </p>
                </div>
              ) : (
                <div className="p-2.5 bg-stone-950/60 rounded-xl border border-stone-800 text-[11px] text-stone-300 flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p>
                    この1マスを囲む4辺に各自動機械を設置できます。必要な設備だけを部分導入することも可能です。
                  </p>
                </div>
              )}

              {/* 4-Directional Machines List */}
              <div className="flex flex-col gap-2">
                {/* 1. 自動種植え機 (TOP / 北) */}
                <div className="p-2.5 bg-stone-950/80 rounded-xl border border-stone-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🌱</span>
                      <div>
                        <span className="text-xs font-bold text-stone-200">
                          {AUTOMATION_MACHINES.seeder.name}
                        </span>
                        <span className="text-[10px] text-stone-400 block font-mono">
                          設置場所: 北辺（上）
                        </span>
                      </div>
                    </div>
                    {hasSeeder ? (
                      <span className="px-2 py-0.5 bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 text-[10px] font-bold rounded-md">
                        設置済み · 稼働中
                      </span>
                    ) : (
                      <span className="text-xs font-mono font-bold text-amber-400">
                        🪙 {formatLargeNumber(AUTOMATION_MACHINES.seeder.price)} G
                      </span>
                    )}
                  </div>

                  {hasSeeder ? (
                    <div className="pt-2 border-t border-stone-800/80 flex flex-col gap-1.5">
                      <label className="text-[10px] text-stone-400 flex items-center justify-between">
                        <span>自動播種する作物の種:</span>
                        <span className="text-[9px] text-emerald-400 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> 重複消費防止作動中
                        </span>
                      </label>
                      <select
                        disabled={isReadOnly}
                        value={tile.automation?.seeder?.targetCropId || 'crop_wheat'}
                        onChange={(e) => {
                          sound.playClick();
                          onConfigureMachine?.(tile.id, {
                            machineType: 'seeder',
                            targetCropId: e.target.value,
                          });
                        }}
                        className="w-full bg-stone-900 border border-stone-700 text-stone-200 text-xs rounded-lg px-2 py-1.5"
                      >
                        {Object.values(CROPS_CATALOG).map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.emoji} {c.name} ({c.growthTimeSec}秒)
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-stone-400 leading-snug">
                        マスが空き地になった時、指定の種を倉庫から1個安全消費して播種します。
                      </p>
                    </div>
                  ) : (
                    !isReadOnly && (
                      <button
                        onClick={() => {
                          sound.playClick();
                          onInstallMachine?.(tile.id, 'seeder');
                        }}
                        disabled={playerGold < AUTOMATION_MACHINES.seeder.price}
                        className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                          playerGold >= AUTOMATION_MACHINES.seeder.price
                            ? 'bg-emerald-700 hover:bg-emerald-600 text-white active:scale-95'
                            : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                        }`}
                      >
                        {playerGold >= AUTOMATION_MACHINES.seeder.price
                          ? '自動種植え機を購入・設置する'
                          : 'ゴールドが不足しています'}
                      </button>
                    )
                  )}
                </div>

                {/* 2. 自動肥料機 (LEFT / 西) */}
                <div className="p-2.5 bg-stone-950/80 rounded-xl border border-stone-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🧪</span>
                      <div>
                        <span className="text-xs font-bold text-stone-200">
                          {AUTOMATION_MACHINES.fertilizer.name}
                        </span>
                        <span className="text-[10px] text-stone-400 block font-mono">
                          設置場所: 西辺（左）
                        </span>
                      </div>
                    </div>
                    {hasFertilizer ? (
                      <span className="px-2 py-0.5 bg-purple-950/80 text-purple-400 border border-purple-800/80 text-[10px] font-bold rounded-md">
                        設置済み · 稼働中
                      </span>
                    ) : (
                      <span className="text-xs font-mono font-bold text-amber-400">
                        🪙 {formatLargeNumber(AUTOMATION_MACHINES.fertilizer.price)} G
                      </span>
                    )}
                  </div>

                  {hasFertilizer ? (
                    <div className="pt-2 border-t border-stone-800/80 flex flex-col gap-1.5">
                      <label className="text-[10px] text-stone-400 flex items-center justify-between">
                        <span>自動散布する肥料の種類:</span>
                        <span className="text-[9px] text-purple-400 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> 1苗1回施肥ロック
                        </span>
                      </label>
                      <select
                        disabled={isReadOnly}
                        value={tile.automation?.fertilizer?.targetFertilizerId || 'fertilizer_basic'}
                        onChange={(e) => {
                          sound.playClick();
                          onConfigureMachine?.(tile.id, {
                            machineType: 'fertilizer',
                            targetFertilizerId: e.target.value,
                          });
                        }}
                        className="w-full bg-stone-900 border border-stone-700 text-stone-200 text-xs rounded-lg px-2 py-1.5"
                      >
                        <option value="fertilizer_basic">🌱 通常有機肥料 (品質+25% · 速度+10%)</option>
                        <option value="fertilizer_speed">⚡ 速効有機液肥 (速度+50% · 品質+15%)</option>
                        <option value="fertilizer_premium">✨ 最高級ミネラル肥料 (品質+55% · 速度+25%)</option>
                      </select>
                      <p className="text-[10px] text-stone-400 leading-snug">
                        種まき直後に指定肥料を1回のみ自動散布。同じ作物への多重消費を完全に防止します。
                      </p>
                    </div>
                  ) : (
                    !isReadOnly && (
                      <button
                        onClick={() => {
                          sound.playClick();
                          onInstallMachine?.(tile.id, 'fertilizer');
                        }}
                        disabled={playerGold < AUTOMATION_MACHINES.fertilizer.price}
                        className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                          playerGold >= AUTOMATION_MACHINES.fertilizer.price
                            ? 'bg-purple-700 hover:bg-purple-600 text-white active:scale-95'
                            : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                        }`}
                      >
                        {playerGold >= AUTOMATION_MACHINES.fertilizer.price
                          ? '自動肥料機を購入・設置する'
                          : 'ゴールドが不足しています'}
                      </button>
                    )
                  )}
                </div>

                {/* 3. 自動水やり機 (RIGHT / 東) */}
                <div className="p-2.5 bg-stone-950/80 rounded-xl border border-stone-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">💧</span>
                      <div>
                        <span className="text-xs font-bold text-stone-200">
                          {AUTOMATION_MACHINES.waterer.name}
                        </span>
                        <span className="text-[10px] text-stone-400 block font-mono">
                          設置場所: 東辺（右）
                        </span>
                      </div>
                    </div>
                    {hasWaterer ? (
                      <span className="px-2 py-0.5 bg-cyan-950/80 text-cyan-400 border border-cyan-800/80 text-[10px] font-bold rounded-md">
                        設置済み · 稼働中
                      </span>
                    ) : (
                      <span className="text-xs font-mono font-bold text-amber-400">
                        🪙 {formatLargeNumber(AUTOMATION_MACHINES.waterer.price)} G
                      </span>
                    )}
                  </div>

                  {hasWaterer ? (
                    <div className="pt-2 border-t border-stone-800/80 flex flex-col gap-1.5">
                      <label className="text-[10px] text-stone-400 flex items-center justify-between">
                        <span>給水を開始する水分閾値:</span>
                        <span className="font-mono text-cyan-300 font-bold">
                          {tile.automation?.waterer?.targetThreshold || 80}% 未満
                        </span>
                      </label>
                      <div className="flex items-center gap-2">
                        {[60, 70, 80, 90].map((th) => (
                          <button
                            key={th}
                            disabled={isReadOnly}
                            onClick={() => {
                              sound.playClick();
                              onConfigureMachine?.(tile.id, {
                                machineType: 'waterer',
                                targetThreshold: th,
                              });
                            }}
                            className={`flex-1 py-1 rounded-md text-[11px] font-mono font-bold transition-all ${
                              (tile.automation?.waterer?.targetThreshold || 80) === th
                                ? 'bg-cyan-600 text-white shadow-sm'
                                : 'bg-stone-900 text-stone-400 hover:text-stone-200'
                            }`}
                          >
                            {th}%
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-stone-400 leading-snug">
                        土壌水分が指定値を下回ると自動で100%まで補水し、水切れによる成長停止を防ぎます。
                      </p>
                    </div>
                  ) : (
                    !isReadOnly && (
                      <button
                        onClick={() => {
                          sound.playClick();
                          onInstallMachine?.(tile.id, 'waterer');
                        }}
                        disabled={playerGold < AUTOMATION_MACHINES.waterer.price}
                        className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                          playerGold >= AUTOMATION_MACHINES.waterer.price
                            ? 'bg-cyan-700 hover:bg-cyan-600 text-white active:scale-95'
                            : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                        }`}
                      >
                        {playerGold >= AUTOMATION_MACHINES.waterer.price
                          ? '自動水やり機を購入・設置する'
                          : 'ゴールドが不足しています'}
                      </button>
                    )
                  )}
                </div>

                {/* 4. 自動収穫機 (BOTTOM / 南) */}
                <div className="p-2.5 bg-stone-950/80 rounded-xl border border-stone-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🌾</span>
                      <div>
                        <span className="text-xs font-bold text-stone-200">
                          {AUTOMATION_MACHINES.harvester.name}
                        </span>
                        <span className="text-[10px] text-stone-400 block font-mono">
                          設置場所: 南辺（下）
                        </span>
                      </div>
                    </div>
                    {hasHarvester ? (
                      <span className="px-2 py-0.5 bg-amber-950/80 text-amber-400 border border-amber-800/80 text-[10px] font-bold rounded-md">
                        設置済み · 稼働中
                      </span>
                    ) : (
                      <span className="text-xs font-mono font-bold text-amber-400">
                        🪙 {formatLargeNumber(AUTOMATION_MACHINES.harvester.price)} G
                      </span>
                    )}
                  </div>

                  {hasHarvester ? (
                    <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-[11px] text-stone-300">
                      <span>累計自動収穫実績:</span>
                      <span className="font-mono font-bold text-amber-300 text-xs">
                        {tile.automation?.harvester?.autoHarvestCount || 0} 回完了
                      </span>
                    </div>
                  ) : (
                    !isReadOnly && (
                      <button
                        onClick={() => {
                          sound.playClick();
                          onInstallMachine?.(tile.id, 'harvester');
                        }}
                        disabled={playerGold < AUTOMATION_MACHINES.harvester.price}
                        className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                          playerGold >= AUTOMATION_MACHINES.harvester.price
                            ? 'bg-amber-700 hover:bg-amber-600 text-white active:scale-95'
                            : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                        }`}
                      >
                        {playerGold >= AUTOMATION_MACHINES.harvester.price
                          ? '自動収穫機を購入・設置する'
                          : 'ゴールドが不足しています'}
                      </button>
                    )
                  )}
                  {hasHarvester && (
                    <p className="text-[10px] text-stone-400 leading-snug">
                      作物が収穫適期（完熟）に達した瞬間、自動で収穫して倉庫へ保管し、区画を空き地へリセットします。
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
