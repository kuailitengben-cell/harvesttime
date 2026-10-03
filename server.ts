import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  PlayerState,
  TileData,
  MarketItemRate,
  AuctionListing,
  GlobalEvent,
  OtherFarmProfile,
  QualityTier,
  SpecialTerrainType,
  TileAutomation,
} from './src/types/game';
import { CROPS_CATALOG, CRAFTING_RECIPES, INITIAL_INVENTORY } from './src/data/crops';
import { AUTOMATION_MACHINES, SPECIAL_TERRAIN_CONFIG } from './src/data/automation';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Procedural Deterministic Special Terrain & Biome Generator
export function getProceduralTerrain(x: number, y: number): {
  biome: TileData['biome'];
  specialTerrain: SpecialTerrainType;
  unclaimedCost: number;
} {
  const dist = Math.sqrt(x * x + y * y);

  // 2D Spatial Sine/Cosine noise for organic contiguous biome clumps
  const nx = x * 0.22;
  const ny = y * 0.22;
  const n1 = Math.sin(nx) * Math.cos(ny) + Math.sin(nx * 0.5 + ny * 0.3);
  const n2 = Math.cos(nx * 0.7 - ny * 0.7) + Math.sin(ny * 0.9);

  let biome: TileData['biome'] = 'PLAIN';
  let specialTerrain: SpecialTerrainType = 'NONE';

  if (n1 > 0.85) {
    specialTerrain = 'WATER_SPRING';
    biome = 'WATERSIDE';
  } else if (n1 < -0.85) {
    specialTerrain = 'FERTILE_LOAM';
    biome = 'FERTILE';
  } else if (n2 > 0.9) {
    specialTerrain = 'RARE_MINERAL';
    biome = 'MOUNTAIN';
  } else if (n2 > 0.6) {
    specialTerrain = 'MINERAL_VEIN';
    biome = 'MOUNTAIN';
  } else if (n1 > 0.45 && n2 < -0.4) {
    specialTerrain = 'ANCIENT_FOREST';
    biome = 'FOREST';
  } else if (dist > 18) {
    biome = (Math.abs(x) + Math.abs(y)) % 4 === 0 ? 'FOREST' : 'PLAIN';
  }

  // Distance & Special terrain pricing calculation
  const basePrice = 80;
  const distMultiplier = 1 + Math.pow(dist / 4, 1.32);
  const specialMultiplier = SPECIAL_TERRAIN_CONFIG[specialTerrain]?.priceMultiplier || 1.0;
  const unclaimedCost = Math.round(basePrice * distMultiplier * specialMultiplier);

  return { biome, specialTerrain, unclaimedCost };
}

function createDefaultAutomation(): TileAutomation {
  return {
    seeder: { installed: false, targetCropId: 'crop_wheat', level: 1 },
    fertilizer: { installed: false, targetFertilizerId: 'fertilizer_basic', level: 1 },
    waterer: { installed: false, targetThreshold: 80, level: 1 },
    harvester: { installed: false, autoHarvestCount: 0, level: 1 },
  };
}

// Generate Initial Owned Territory (Center -3..+3, 7x7 owned zone)
function createInitialPlayerTiles(): TileData[] {
  const tiles: TileData[] = [];
  const RADIUS = 3;

  for (let y = -RADIUS; y <= RADIUS; y++) {
    for (let x = -RADIUS; x <= RADIUS; x++) {
      const id = `tile_${x}_${y}`;
      const terrain = getProceduralTerrain(x, y);

      // Place core facilities at specific spots near center
      if (x === -2 && y === -2) {
        tiles.push({
          id,
          x,
          y,
          type: 'FACILITY',
          unclaimedCost: 0,
          biome: 'PLAIN',
          specialTerrain: 'NONE',
          soilMoisture: 0,
          fertilizerType: null,
          fertilizerQualityBonus: 0,
          fertilizerSpeedBonus: 1,
          fertilizerUsed: false,
          plantedCropId: null,
          plantedAt: null,
          stage: 'SEED',
          growthProgress: 0,
          hasWeed: false,
          hasPest: false,
          quality: 'NORMAL',
          matureAt: null,
          automation: createDefaultAutomation(),
          facility: {
            id: 'fac_warehouse',
            type: 'WAREHOUSE',
            level: 1,
            name: '中央大型倉庫 Lv1',
          },
        });
      } else if (x === 2 && y === -2) {
        tiles.push({
          id,
          x,
          y,
          type: 'FACILITY',
          unclaimedCost: 0,
          biome: 'PLAIN',
          specialTerrain: 'NONE',
          soilMoisture: 0,
          fertilizerType: null,
          fertilizerQualityBonus: 0,
          fertilizerSpeedBonus: 1,
          fertilizerUsed: false,
          plantedCropId: null,
          plantedAt: null,
          stage: 'SEED',
          growthProgress: 0,
          hasWeed: false,
          hasPest: false,
          quality: 'NORMAL',
          matureAt: null,
          automation: createDefaultAutomation(),
          facility: {
            id: 'fac_fertilizer_plant',
            type: 'FERTILIZER_PLANT',
            level: 1,
            name: '堆肥・有機肥料工場 Lv1',
          },
        });
      } else if (x === -2 && y === 2) {
        tiles.push({
          id,
          x,
          y,
          type: 'FACILITY',
          unclaimedCost: 0,
          biome: 'PLAIN',
          specialTerrain: 'NONE',
          soilMoisture: 0,
          fertilizerType: null,
          fertilizerQualityBonus: 0,
          fertilizerSpeedBonus: 1,
          fertilizerUsed: false,
          plantedCropId: null,
          plantedAt: null,
          stage: 'SEED',
          growthProgress: 0,
          hasWeed: false,
          hasPest: false,
          quality: 'NORMAL',
          matureAt: null,
          automation: createDefaultAutomation(),
          facility: {
            id: 'fac_workshop',
            type: 'PROCESSING_WORKSHOP',
            level: 1,
            name: '農産物加工工房 Lv1',
          },
        });
      } else if (x === 2 && y === 2) {
        tiles.push({
          id,
          x,
          y,
          type: 'FACILITY',
          unclaimedCost: 0,
          biome: 'WATERSIDE',
          specialTerrain: 'WATER_SPRING',
          soilMoisture: 100,
          fertilizerType: null,
          fertilizerQualityBonus: 0,
          fertilizerSpeedBonus: 1,
          fertilizerUsed: false,
          plantedCropId: null,
          plantedAt: null,
          stage: 'SEED',
          growthProgress: 0,
          hasWeed: false,
          hasPest: false,
          quality: 'NORMAL',
          matureAt: null,
          automation: createDefaultAutomation(),
          facility: {
            id: 'fac_well',
            type: 'WELL_SILO',
            level: 1,
            name: '地下深層井戸 Lv1',
          },
        });
      } else {
        // Standard Field
        const isStarterWheat = x === 0 && y === 0;
        const isStarterCarrot = x === 1 && y === 0;

        tiles.push({
          id,
          x,
          y,
          type: 'FIELD',
          unclaimedCost: 0,
          biome: terrain.biome,
          specialTerrain: terrain.specialTerrain,
          soilMoisture: terrain.specialTerrain === 'WATER_SPRING' ? 100 : 80,
          fertilizerType: null,
          fertilizerQualityBonus: terrain.specialTerrain === 'FERTILE_LOAM' ? 25 : 0,
          fertilizerSpeedBonus: terrain.specialTerrain === 'FERTILE_LOAM' ? 1.25 : 1,
          fertilizerUsed: false,
          plantedCropId: isStarterWheat ? 'crop_wheat' : isStarterCarrot ? 'crop_carrot' : null,
          plantedAt: isStarterWheat || isStarterCarrot ? Date.now() - 30000 : null,
          stage: isStarterWheat || isStarterCarrot ? 'GROWING' : 'SEED',
          growthProgress: isStarterWheat ? 0.75 : isStarterCarrot ? 0.5 : 0,
          hasWeed: false,
          hasPest: false,
          quality: 'NORMAL',
          matureAt: null,
          automation: createDefaultAutomation(),
          facility: null,
        });
      }
    }
  }

  return tiles;
}

// Generate complete expansive neighbor farm tiles
function generateNeighborTiles(type: 'WHEAT' | 'FERTILIZER' | 'ORCHARD' | 'ANCIENT'): TileData[] {
  const tiles: TileData[] = [];
  const RADIUS = 6; // 13x13 massive territory for neighbor

  for (let y = -RADIUS; y <= RADIUS; y++) {
    for (let x = -RADIUS; x <= RADIUS; x++) {
      const id = `neighbor_${type}_${x}_${y}`;
      const terrain = getProceduralTerrain(x, y);

      let cropId: string | null = null;
      let stage: TileData['stage'] = 'MATURE';
      let quality: QualityTier = 'HIGH';

      if (type === 'WHEAT') {
        cropId = (x + y) % 3 === 0 ? 'crop_wheat' : (x + y) % 3 === 1 ? 'crop_corn' : 'crop_rice';
      } else if (type === 'FERTILIZER') {
        cropId = (x + y) % 2 === 0 ? 'crop_soybeans' : 'crop_potato';
      } else if (type === 'ORCHARD') {
        cropId = (x + y) % 4 === 0 ? 'crop_strawberry' : (x + y) % 4 === 1 ? 'crop_apple' : (x + y) % 4 === 2 ? 'crop_peach' : 'crop_grape';
        quality = 'PRISTINE';
      } else if (type === 'ANCIENT') {
        cropId = (x + y) % 3 === 0 ? 'crop_golden_tomato' : (x + y) % 3 === 1 ? 'crop_giant_pumpkin' : 'crop_ancient_seed';
        quality = 'GOLDEN';
      }

      const auto = createDefaultAutomation();
      // Neighbor showcase automation!
      auto.seeder.installed = true;
      auto.seeder.targetCropId = cropId;
      auto.waterer.installed = true;
      auto.harvester.installed = true;

      tiles.push({
        id,
        x,
        y,
        type: 'FIELD',
        unclaimedCost: 0,
        biome: terrain.biome,
        specialTerrain: terrain.specialTerrain,
        soilMoisture: 100,
        fertilizerType: 'fertilizer_premium',
        fertilizerQualityBonus: 40,
        fertilizerSpeedBonus: 1.25,
        fertilizerUsed: true,
        plantedCropId: cropId,
        plantedAt: Date.now() - 60000,
        stage,
        growthProgress: 1.0,
        hasWeed: false,
        hasPest: false,
        quality,
        matureAt: Date.now(),
        automation: auto,
        facility: null,
      });
    }
  }

  return tiles;
}

// Initial Discovery state seeded with basic crops
const initialDiscovered = {
  crop_wheat: {
    itemId: 'crop_wheat',
    name: '小麦',
    category: 'CROP',
    icon: '🌾',
    discoveredAt: Date.now() - 100000,
    countProduced: 3,
    description: '農園の礎となる基本穀物。',
  },
  crop_carrot: {
    itemId: 'crop_carrot',
    name: 'ニンジン',
    category: 'CROP',
    icon: '🥕',
    discoveredAt: Date.now() - 50000,
    countProduced: 3,
    description: '手軽に育つ初心者向けの根菜。',
  },
  seed_crop_wheat: {
    itemId: 'seed_crop_wheat',
    name: '小麦の種',
    category: 'SEED',
    icon: '🌾',
    discoveredAt: Date.now() - 200000,
    countProduced: 18,
    description: '耕した畑に植えて育てる基本の穀物の種。',
  },
  seed_crop_carrot: {
    itemId: 'seed_crop_carrot',
    name: 'ニンジンの種',
    category: 'SEED',
    icon: '🥕',
    discoveredAt: Date.now() - 200000,
    countProduced: 12,
    description: '手軽に早く育つ野菜の種。',
  },
};

const serverStore = {
  player: {
    playerId: 'farmer_main',
    farmName: 'あおばサンシャイン農園',
    gold: 5800,
    level: 1,
    exp: 40,
    lastActiveAt: Date.now(),
    storageMaxCapacity: 150,
    warehouseLevel: 1,
    tiles: createInitialPlayerTiles(),
    inventory: [...INITIAL_INVENTORY],
    craftJobs: [],
    discoveredItems: initialDiscovered,
    stats: {
      cropsHarvested: 0,
      goldEarned: 0,
      tradesCompleted: 0,
      weedsCleared: 0,
      pestsExterminated: 0,
      autoHarvestsCount: 0,
    },
  } as PlayerState,

  globalEvent: {
    id: 'evt_rain',
    name: '恵みの長雨（モンスーン）',
    theme: 'RAIN',
    description: '肥沃な雲が農園を覆い、畑の水分蒸発が停止。米の収穫量が+25%増加します。',
    multiplierText: '自然給水維持 · 米収穫+25%',
    remainingSec: 180,
    endsAt: Date.now() + 180 * 1000,
  } as GlobalEvent,

  marketRates: [
    { cropId: 'crop_wheat', name: '小麦', category: 'GRAIN', currentPrice: 24, basePrice: 20, changePercent: 20.0, trend: 'HIGH', history: [18, 19, 20, 21, 22, 24], volumeTraded: 380, icon: '🌾' },
    { cropId: 'crop_corn', name: 'トウモロコシ', category: 'GRAIN', currentPrice: 36, basePrice: 38, changePercent: -5.2, trend: 'STABLE', history: [40, 39, 38, 37, 36], volumeTraded: 210, icon: '🌽' },
    { cropId: 'crop_rice', name: '米', category: 'GRAIN', currentPrice: 62, basePrice: 48, changePercent: 29.2, trend: 'SURGING', history: [48, 50, 54, 58, 62], volumeTraded: 490, icon: '🍚' },
    { cropId: 'crop_carrot', name: 'ニンジン', category: 'VEGETABLE', currentPrice: 28, basePrice: 26, changePercent: 7.7, trend: 'STABLE', history: [26, 26, 27, 27, 28], volumeTraded: 250, icon: '🥕' },
    { cropId: 'crop_tomato', name: 'トマト', category: 'VEGETABLE', currentPrice: 68, basePrice: 48, changePercent: 41.7, trend: 'SURGING', history: [48, 52, 58, 62, 68], volumeTraded: 640, icon: '🍅' },
    { cropId: 'crop_strawberry', name: 'イチゴ', category: 'FRUIT', currentPrice: 110, basePrice: 85, changePercent: 29.4, trend: 'HIGH', history: [85, 90, 95, 102, 110], volumeTraded: 340, icon: '🍓' },
    { cropId: 'crop_golden_tomato', name: '黄金トマト', category: 'SPECIAL', currentPrice: 690, basePrice: 580, changePercent: 19.0, trend: 'SURGING', history: [580, 600, 625, 660, 690], volumeTraded: 55, icon: '✨🍅' },
  ] as MarketItemRate[],

  auctions: [
    {
      id: 'auc_1',
      sellerId: 'player_a',
      sellerName: '小麦専業 タクミ',
      itemId: 'crop_wheat',
      itemName: '小麦',
      category: 'CROP',
      count: 100,
      quality: 'NORMAL',
      icon: '🌾',
      currentBid: 1950,
      buyoutPrice: 2400,
      highestBidderId: null,
      highestBidderName: null,
      bidsCount: 0,
      endsAt: Date.now() + 18 * 60 * 1000,
      createdAt: Date.now() - 5 * 60 * 1000,
    },
  ] as AuctionListing[],

  communityFarms: [
    {
      id: 'farm_neighbor_1',
      name: 'タクミ大穀倉ファーム',
      ownerName: 'タクミ',
      title: '第1期 小麦ギルドマスター',
      level: 18,
      specialty: '中心から広がる巨大穀倉地帯。小麦・トウモロコシ・米の全自動化生産体制。',
      kudosCount: 240,
      hasGivenKudos: false,
      activePlotsCount: 169,
      facilitiesCount: 6,
      tiles: generateNeighborTiles('WHEAT'),
    },
    {
      id: 'farm_neighbor_2',
      name: 'ケンジ有機肥料コンビナート',
      ownerName: 'ケンジ',
      title: '土壌化学マスター',
      level: 16,
      specialty: '全プレイヤーの余剰堆肥を集約し、最高峰ミネラル肥料と窒素促進剤を精製。',
      kudosCount: 188,
      hasGivenKudos: false,
      activePlotsCount: 169,
      facilitiesCount: 7,
      tiles: generateNeighborTiles('FERTILIZER'),
    },
    {
      id: 'farm_neighbor_3',
      name: 'リサ高原サンシャイン果樹園',
      ownerName: 'リサ',
      title: 'フルーツクイーン',
      level: 21,
      specialty: 'イチゴ・ブドウ・モモ・スイカの超高糖度栽培。特製スイーツ工房を併設。',
      kudosCount: 312,
      hasGivenKudos: false,
      activePlotsCount: 169,
      facilitiesCount: 6,
      tiles: generateNeighborTiles('ORCHARD'),
    },
    {
      id: 'farm_neighbor_4',
      name: 'アオイ古代植物研究所',
      ownerName: 'アオイ',
      title: '奇跡の種子コレクター',
      level: 25,
      specialty: '黄金トマト・古代種・巨大カボチャを完全自動灌漑で育成する最先端研究農園。',
      kudosCount: 420,
      hasGivenKudos: false,
      activePlotsCount: 169,
      facilitiesCount: 8,
      tiles: generateNeighborTiles('ANCIENT'),
    },
  ] as OtherFarmProfile[],
};

function recordDiscoveredItem(itemId: string, name: string, category: string, icon: string, description: string, count = 1) {
  const player = serverStore.player;
  if (!player.discoveredItems[itemId]) {
    player.discoveredItems[itemId] = {
      itemId,
      name,
      category,
      icon,
      discoveredAt: Date.now(),
      countProduced: count,
      description,
    };
    player.gold += 50;
    player.exp += 25;
  } else {
    player.discoveredItems[itemId].countProduced += count;
  }
}

let lastClientHeartbeatAt = Date.now();

export interface OfflineCatchupSummary {
  offlineSec: number;
  formattedTime: string;
  cropsGrownCount: number;
  cropsMaturedCount: number;
  autoHarvestedCount: number;
  autoHarvestedItems: { name: string; count: number; icon: string }[];
  message: string;
}

// Theoretical Offline Catch-up Simulation (No spoil, No weeds, No pests)
function performOfflineTheoreticalCatchup(offlineSec: number): OfflineCatchupSummary {
  const player = serverStore.player;
  const now = Date.now();
  let cropsGrownCount = 0;
  let cropsMaturedCount = 0;
  let autoHarvestedCount = 0;
  const autoHarvestMap = new Map<string, { name: string; count: number; icon: string }>();

  player.tiles.forEach((tile) => {
    // 100% Protection during offline period: absolutely NO weeds or pests can spawn or affect growth
    tile.hasWeed = false;
    tile.hasPest = false;

    if (tile.type !== 'FIELD' || !tile.plantedCropId) return;

    cropsGrownCount++;
    const cropDef = CROPS_CATALOG[tile.plantedCropId];
    if (!cropDef) return;

    // 1. If already mature when player went offline, preserve as MATURE (ZERO rot)
    if (tile.stage === 'MATURE' || tile.stage === 'OVERRIPE') {
      tile.stage = 'MATURE';
      if (tile.automation?.harvester?.installed) {
        const yieldCount = cropDef.harvestYield + (tile.specialTerrain === 'FERTILE_LOAM' ? 1 : 0);
        const quality = tile.quality || 'NORMAL';
        const existing = player.inventory.find((i) => i.itemId === cropDef.id && (i.quality || 'NORMAL') === quality);
        if (existing) existing.count += yieldCount;
        else {
          player.inventory.push({
            id: `inv_${cropDef.id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            itemId: cropDef.id,
            name: cropDef.name,
            category: 'CROP',
            count: yieldCount,
            quality,
            icon: cropDef.emoji,
            basePrice: cropDef.basePrice,
            description: cropDef.description,
          });
        }
        autoHarvestedCount += yieldCount;
        const curr = autoHarvestMap.get(cropDef.name) || { name: cropDef.name, count: 0, icon: cropDef.emoji };
        curr.count += yieldCount;
        autoHarvestMap.set(cropDef.name, curr);

        tile.plantedCropId = null;
        tile.plantedAt = null;
        tile.stage = 'SEED';
        tile.growthProgress = 0;
        tile.matureAt = null;
        tile.fertilizerUsed = false;
        tile.automation.harvester.autoHarvestCount = (tile.automation.harvester.autoHarvestCount || 0) + 1;
        player.stats.cropsHarvested += yieldCount;
        player.stats.autoHarvestsCount = (player.stats.autoHarvestsCount || 0) + yieldCount;
      }
      return;
    }

    // 2. Theoretical Growth Calculation
    const specialSpeed = tile.specialTerrain === 'FERTILE_LOAM' ? 1.25 : 1.0;
    const fertSpeed = tile.fertilizerSpeedBonus || 1;
    const totalGrowthTime = cropDef.growthTimeSec / (fertSpeed * specialSpeed);

    let effectiveGrowthSec = offlineSec;
    if (tile.specialTerrain === 'WATER_SPRING' || tile.automation?.waterer?.installed) {
      tile.soilMoisture = 100;
      effectiveGrowthSec = offlineSec * 1.0;
    } else {
      const decayRate = 0.15 * (tile.biome === 'WATERSIDE' ? 0.5 : 1);
      const moistSec = Math.max(0, (tile.soilMoisture - 15) / decayRate);
      effectiveGrowthSec = Math.min(offlineSec, moistSec) * 1.0 + Math.max(0, offlineSec - moistSec) * 0.45;
      tile.soilMoisture = Math.max(0, tile.soilMoisture - decayRate * offlineSec);
    }

    const progressDelta = effectiveGrowthSec / totalGrowthTime;
    tile.growthProgress = Math.min(1.0, tile.growthProgress + progressDelta);

    if (tile.growthProgress < 0.25) tile.stage = 'SEED';
    else if (tile.growthProgress < 0.55) tile.stage = 'SPROUT';
    else if (tile.growthProgress < 1.0) tile.stage = 'GROWING';
    else {
      tile.stage = 'MATURE';
      tile.matureAt = now;
      cropsMaturedCount++;

      const qualityRoll = Math.random() * 100;
      const bonus = (tile.fertilizerQualityBonus || 0) + (tile.specialTerrain === 'FERTILE_LOAM' ? 25 : 0);
      if (qualityRoll < 5 + bonus * 0.5) tile.quality = 'GOLDEN';
      else if (qualityRoll < 20 + bonus) tile.quality = 'PRISTINE';
      else if (qualityRoll < 50 + bonus) tile.quality = 'HIGH';
      else tile.quality = 'NORMAL';

      if (tile.automation?.harvester?.installed) {
        const yieldCount = cropDef.harvestYield + (tile.specialTerrain === 'FERTILE_LOAM' ? 1 : 0);
        const quality = tile.quality || 'NORMAL';
        const existing = player.inventory.find((i) => i.itemId === cropDef.id && (i.quality || 'NORMAL') === quality);
        if (existing) existing.count += yieldCount;
        else {
          player.inventory.push({
            id: `inv_${cropDef.id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            itemId: cropDef.id,
            name: cropDef.name,
            category: 'CROP',
            count: yieldCount,
            quality,
            icon: cropDef.emoji,
            basePrice: cropDef.basePrice,
            description: cropDef.description,
          });
        }
        autoHarvestedCount += yieldCount;
        const curr = autoHarvestMap.get(cropDef.name) || { name: cropDef.name, count: 0, icon: cropDef.emoji };
        curr.count += yieldCount;
        autoHarvestMap.set(cropDef.name, curr);

        tile.plantedCropId = null;
        tile.plantedAt = null;
        tile.stage = 'SEED';
        tile.growthProgress = 0;
        tile.matureAt = null;
        tile.fertilizerUsed = false;
        tile.automation.harvester.autoHarvestCount = (tile.automation.harvester.autoHarvestCount || 0) + 1;
        player.stats.cropsHarvested += yieldCount;
        player.stats.autoHarvestsCount = (player.stats.autoHarvestsCount || 0) + yieldCount;
      }
    }
  });

  player.craftJobs.forEach((job) => {
    if (!job.completed && now >= job.startedAt + job.durationSec * 1000) {
      job.completed = true;
    }
  });

  player.lastActiveAt = now;
  lastClientHeartbeatAt = now;

  const hours = Math.floor(offlineSec / 3600);
  const mins = Math.floor((offlineSec % 3600) / 60);
  const secs = Math.floor(offlineSec % 60);
  let timeStr = `${secs}秒`;
  if (hours > 0) {
    timeStr = `${hours}時間${mins}分${secs}秒`;
  } else if (mins > 0) {
    timeStr = `${mins}分${secs}秒`;
  }

  return {
    offlineSec,
    formattedTime: timeStr,
    cropsGrownCount,
    cropsMaturedCount,
    autoHarvestedCount,
    autoHarvestedItems: Array.from(autoHarvestMap.values()),
    message: `おかえりなさい！アプリ停止中（${timeStr}）の作物理論成長が適用されました（腐敗・害虫・雑草の影響は受けていません）。${cropsMaturedCount > 0 ? ` 収穫可能: ${cropsMaturedCount}区画` : ''}${autoHarvestedCount > 0 ? ` 自動収穫: ${autoHarvestedCount}個` : ''}`,
  };
}

// Authoritative Simulation Tick (Runs across ALL player-owned tiles, even unloaded chunks!)
function advanceSimulation(forcedElapsedSec?: number, isClientOffline = false) {
  const now = Date.now();
  const elapsedSec = forcedElapsedSec !== undefined ? forcedElapsedSec : Math.max(0, (now - serverStore.player.lastActiveAt) / 1000);
  serverStore.player.lastActiveAt = now;

  const isActuallyOffline = isClientOffline || (now - lastClientHeartbeatAt > 20000);

  const player = serverStore.player;
  const isRaining = serverStore.globalEvent.theme === 'RAIN';

  // Iterate over every owned tile
  player.tiles.forEach((tile) => {
    if (tile.type !== 'FIELD') return;

    // --- 1. AUTOMATION: AUTOMATIC WATERER (自動水やり機) ---
    if (tile.automation?.waterer?.installed) {
      if (tile.soilMoisture < (tile.automation.waterer.targetThreshold || 80)) {
        tile.soilMoisture = 100;
      }
    }

    // Natural moisture or spring
    if (tile.specialTerrain === 'WATER_SPRING') {
      tile.soilMoisture = 100;
    } else if (isRaining) {
      tile.soilMoisture = Math.min(100, tile.soilMoisture + 2 * elapsedSec);
    } else {
      const moistureDecayRate = 0.15 * (tile.biome === 'WATERSIDE' ? 0.5 : 1);
      tile.soilMoisture = Math.max(0, tile.soilMoisture - moistureDecayRate * elapsedSec);
    }

    // --- 2. AUTOMATION: AUTOMATIC SEEDER (自動種植え機) ---
    // Only triggers if completely empty, not weeded, and has seeder installed
    if (tile.automation?.seeder?.installed && !tile.plantedCropId && !tile.hasWeed) {
      const targetCropId = tile.automation.seeder.targetCropId || 'crop_wheat';
      const seedItemId = `seed_${targetCropId}`;
      const seedInv = player.inventory.find((i) => i.itemId === seedItemId && i.count > 0);

      if (seedInv && CROPS_CATALOG[targetCropId]) {
        // Safe single consumption
        seedInv.count -= 1;
        tile.plantedCropId = targetCropId;
        tile.plantedAt = now;
        tile.stage = 'SEED';
        tile.growthProgress = 0;
        tile.quality = 'NORMAL';
        tile.fertilizerUsed = false;
        tile.matureAt = null;
        tile.hasPest = false;

        // Clean up empty seeds
        player.inventory = player.inventory.filter((i) => i.count > 0);
      }
    }

    // --- 3. AUTOMATION: AUTOMATIC FERTILIZER (自動肥料機) ---
    // Only triggers once per crop planting cycle (fertilizerUsed flag)
    if (tile.automation?.fertilizer?.installed && tile.plantedCropId && !tile.fertilizerUsed) {
      const targetFertId = tile.automation.fertilizer.targetFertilizerId || 'fertilizer_basic';
      const fertInv = player.inventory.find((i) => i.itemId === targetFertId && i.count > 0);

      if (fertInv) {
        fertInv.count -= 1;
        tile.fertilizerType = targetFertId;
        tile.fertilizerUsed = true; // Lock to prevent redundant consumption

        if (targetFertId === 'fertilizer_basic') {
          tile.fertilizerQualityBonus = 25;
          tile.fertilizerSpeedBonus = 1.1;
        } else if (targetFertId === 'fertilizer_premium') {
          tile.fertilizerQualityBonus = 55;
          tile.fertilizerSpeedBonus = 1.25;
        } else if (targetFertId === 'fertilizer_speed') {
          tile.fertilizerQualityBonus = 15;
          tile.fertilizerSpeedBonus = 1.5;
        }

        player.inventory = player.inventory.filter((i) => i.count > 0);
      }
    }

    // --- Crop Growth Process ---
    if (tile.plantedCropId) {
      const cropDef = CROPS_CATALOG[tile.plantedCropId];
      if (cropDef) {
        if (tile.stage !== 'MATURE' && tile.stage !== 'OVERRIPE' && tile.stage !== 'SPOILED') {
          const growthModifier = tile.soilMoisture > 15 ? 1.0 : 0.35;
          const specialSpeed = tile.specialTerrain === 'FERTILE_LOAM' ? 1.25 : 1.0;
          const totalGrowthTime = cropDef.growthTimeSec / ((tile.fertilizerSpeedBonus || 1) * specialSpeed);

          tile.growthProgress = Math.min(1.0, tile.growthProgress + (elapsedSec * growthModifier) / totalGrowthTime);

          if (tile.growthProgress < 0.25) tile.stage = 'SEED';
          else if (tile.growthProgress < 0.55) tile.stage = 'SPROUT';
          else if (tile.growthProgress < 1.0) tile.stage = 'GROWING';
          else {
            tile.stage = 'MATURE';
            tile.matureAt = now;

            const qualityRoll = Math.random() * 100;
            const bonus = (tile.fertilizerQualityBonus || 0) + (tile.specialTerrain === 'FERTILE_LOAM' ? 25 : 0);
            if (qualityRoll < 5 + bonus * 0.5) tile.quality = 'GOLDEN';
            else if (qualityRoll < 20 + bonus) tile.quality = 'PRISTINE';
            else if (qualityRoll < 50 + bonus) tile.quality = 'HIGH';
            else tile.quality = 'NORMAL';
          }
        } else if (tile.stage === 'MATURE' || tile.stage === 'OVERRIPE') {
          // If offline: NEVER spoil! Keep MATURE. Only active gameplay triggers overripe/spoilage.
          if (!isActuallyOffline && tile.matureAt) {
            const timeInMature = (now - tile.matureAt) / 1000;
            if (timeInMature > cropDef.spoilTimeSec) tile.stage = 'SPOILED';
            else if (timeInMature > cropDef.spoilTimeSec * 0.7) tile.stage = 'OVERRIPE';
          }
        }
      }
    }

    // --- 4. AUTOMATION: AUTOMATIC HARVESTER (自動収穫機) ---
    // Triggers instantly when crop reaches MATURE or OVERRIPE, safely transfers to inventory, resets tile
    if (tile.automation?.harvester?.installed && (tile.stage === 'MATURE' || tile.stage === 'OVERRIPE') && tile.plantedCropId) {
      const cropDef = CROPS_CATALOG[tile.plantedCropId];
      if (cropDef) {
        const yieldCount = cropDef.harvestYield + (tile.specialTerrain === 'FERTILE_LOAM' ? 1 : 0);
        const quality = tile.quality || 'NORMAL';

        // Add to player inventory safely
        const existing = player.inventory.find((i) => i.itemId === cropDef.id && (i.quality || 'NORMAL') === quality);
        if (existing) {
          existing.count += yieldCount;
        } else {
          player.inventory.push({
            id: `inv_${cropDef.id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            itemId: cropDef.id,
            name: cropDef.name,
            category: 'CROP',
            count: yieldCount,
            quality,
            icon: cropDef.emoji,
            basePrice: cropDef.basePrice,
            description: cropDef.description,
          });
        }

        // Mineral extraction bonus if on mineral vein
        if (tile.specialTerrain === 'MINERAL_VEIN' || tile.specialTerrain === 'RARE_MINERAL') {
          const mineralInv = player.inventory.find((i) => i.itemId === 'material_mineral');
          if (mineralInv) mineralInv.count += 1;
          else {
            player.inventory.push({
              id: `inv_mineral_${Date.now()}`,
              itemId: 'material_mineral',
              name: '農園鉱石粉末',
              category: 'MATERIAL',
              count: 1,
              icon: '🪨',
              basePrice: 25,
              description: '鉱床から採取した天然鉱石粉末。',
            });
          }
        }

        recordDiscoveredItem(cropDef.id, cropDef.name, 'CROP', cropDef.emoji, cropDef.description, yieldCount);

        // Reset field for next cycle
        tile.plantedCropId = null;
        tile.plantedAt = null;
        tile.stage = 'SEED';
        tile.growthProgress = 0;
        tile.matureAt = null;
        tile.fertilizerType = null;
        tile.fertilizerQualityBonus = 0;
        tile.fertilizerSpeedBonus = 1;
        tile.fertilizerUsed = false;
        tile.hasPest = false;

        tile.automation.harvester.autoHarvestCount = (tile.automation.harvester.autoHarvestCount || 0) + 1;
        player.stats.cropsHarvested += yieldCount;
        player.stats.autoHarvestsCount = (player.stats.autoHarvestsCount || 0) + yieldCount;
        player.exp += 15;
      }
    }
  });

  // Craft jobs
  player.craftJobs.forEach((job) => {
    if (!job.completed && now >= job.startedAt + job.durationSec * 1000) {
      job.completed = true;
    }
  });

  // Global event countdown
  if (now >= serverStore.globalEvent.endsAt) {
    rotateGlobalEvent();
  } else {
    serverStore.globalEvent.remainingSec = Math.max(0, Math.round((serverStore.globalEvent.endsAt - now) / 1000));
  }
}

function rotateGlobalEvent() {
  const events = [
    { id: 'evt_rain', name: '恵みの長雨（モンスーン）', theme: 'RAIN', description: '全農場の土壌が自然給水され、米の収穫量が+25%増加します。', multiplierText: '自然給水維持 · 米収穫+25%' },
    { id: 'evt_salad_boom', name: '世界的な生野菜・サラダ需要爆発', theme: 'HARVEST_FESTIVAL', description: '健康志向の高まりにより、野菜の世界市場価格が+40%急騰中！', multiplierText: '野菜系市場価格 +40%' },
    { id: 'evt_wheat_shortage', name: '大陸的穀物不足アラート', theme: 'WHEAT_BOOM', description: '海外需要の急増により、小麦および小麦粉の取引価格が跳ね上がっています！', multiplierText: '小麦・小麦粉価格 +50%' },
  ];
  const currentIdx = events.findIndex((e) => e.id === serverStore.globalEvent.id);
  const nextEvent = events[(currentIdx + 1) % events.length];
  serverStore.globalEvent = {
    ...nextEvent,
    theme: nextEvent.theme as GlobalEvent['theme'],
    endsAt: Date.now() + 180 * 1000,
    remainingSec: 180,
  };
}

// Periodic server market tick (every 10 seconds)
setInterval(() => {
  advanceSimulation();

  serverStore.marketRates.forEach((item) => {
    const delta = (Math.random() - 0.48) * 0.05;
    const newPrice = Math.max(Math.round(item.basePrice * 0.6), Math.round(item.currentPrice * (1 + delta)));
    item.currentPrice = newPrice;
    item.changePercent = Math.round(((item.currentPrice - item.basePrice) / item.basePrice) * 1000) / 10;
    item.history.push(newPrice);
    if (item.history.length > 8) item.history.shift();

    if (item.changePercent > 18) item.trend = 'SURGING';
    else if (item.changePercent > 5) item.trend = 'HIGH';
    else if (item.changePercent < -15) item.trend = 'CRASHING';
    else if (item.changePercent < -5) item.trend = 'FALLING';
    else item.trend = 'STABLE';
  });
}, 10000);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // === API ROUTES ===

  // 1. Get complete synchronized game state
  app.get('/api/state', (req, res) => {
    const clientLastActiveAt = req.query.clientLastActiveAt ? Number(req.query.clientLastActiveAt) : null;
    let offlineCatchup: OfflineCatchupSummary | null = null;

    const now = Date.now();
    let offlineSec = 0;
    if (clientLastActiveAt && !isNaN(clientLastActiveAt) && clientLastActiveAt > 0) {
      offlineSec = Math.max(0, (now - clientLastActiveAt) / 1000);
    } else if (serverStore.player.lastActiveAt) {
      offlineSec = Math.max(0, (now - serverStore.player.lastActiveAt) / 1000);
    }

    // Trigger theoretical catch-up if offline for at least 10 seconds
    if (offlineSec >= 10) {
      offlineCatchup = performOfflineTheoreticalCatchup(offlineSec);
    }

    advanceSimulation(undefined, false);
    lastClientHeartbeatAt = Date.now();

    // Map community farms to lightweight summaries to keep payload tiny (<10KB)
    const communitySummaries = serverStore.communityFarms.map((f) => ({
      id: f.id,
      name: f.name,
      ownerName: f.ownerName,
      title: f.title,
      level: f.level,
      specialty: f.specialty,
      kudosCount: f.kudosCount,
      hasGivenKudos: f.hasGivenKudos,
      activePlotsCount: f.activePlotsCount,
      facilitiesCount: f.facilitiesCount,
      tiles: [],
    }));

    res.json({
      player: serverStore.player,
      globalEvent: serverStore.globalEvent,
      marketRates: serverStore.marketRates,
      auctions: serverStore.auctions,
      communityFarms: communitySummaries,
      offlineCatchup,
    });
  });

  // Dedicated endpoint to stream neighbor tiles on demand when visiting
  app.get('/api/farms/:farmId/tiles', (req, res) => {
    const farm = serverStore.communityFarms.find((f) => f.id === req.params.farmId);
    if (!farm) return res.status(404).json({ success: false, message: '農場が見つかりません' });
    res.json({ success: true, tiles: farm.tiles });
  });

  // 2. Dynamic Infinite Viewport Chunk Query
  app.post('/api/tiles/chunk', (req, res) => {
    const { minX, maxX, minY, maxY } = req.body;
    const player = serverStore.player;

    const tiles: TileData[] = [];
    const ownedMap = new Map<string, TileData>();
    player.tiles.forEach((t) => ownedMap.set(`${t.x}_${t.y}`, t));

    // Clamp radius query to reasonable bounds (up to 40x40 viewport area per request)
    const clampedMinX = Math.max(-100, Math.min(100, minX || -10));
    const clampedMaxX = Math.max(-100, Math.min(100, maxX || 10));
    const clampedMinY = Math.max(-100, Math.min(100, minY || -10));
    const clampedMaxY = Math.max(-100, Math.min(100, maxY || 10));

    for (let y = clampedMinY; y <= clampedMaxY; y++) {
      for (let x = clampedMinX; x <= clampedMaxX; x++) {
        const key = `${x}_${y}`;
        if (ownedMap.has(key)) {
          tiles.push(ownedMap.get(key)!);
        } else {
          // Procedurally generate unowned tile on the fly
          const terrain = getProceduralTerrain(x, y);
          tiles.push({
            id: `tile_${x}_${y}`,
            x,
            y,
            type: 'UNCLAIMED',
            unclaimedCost: terrain.unclaimedCost,
            biome: terrain.biome,
            specialTerrain: terrain.specialTerrain,
            soilMoisture: 50,
            fertilizerType: null,
            fertilizerQualityBonus: 0,
            fertilizerSpeedBonus: 1,
            fertilizerUsed: false,
            plantedCropId: null,
            plantedAt: null,
            stage: 'SEED',
            growthProgress: 0,
            hasWeed: false,
            hasPest: false,
            quality: 'NORMAL',
            matureAt: null,
            automation: createDefaultAutomation(),
            facility: null,
          });
        }
      }
    }

    res.json({ tiles });
  });

  // 3. Farm Action (Water, Harvest, Plant, Weed, Pest, Fertilize, Clear)
  app.post('/api/farm/action', (req, res) => {
    advanceSimulation();
    const { actionType, tileIds, seedCropId, fertilizerItemId } = req.body;

    if (!Array.isArray(tileIds) || tileIds.length === 0) {
      return res.status(400).json({ success: false, message: '対象のマスが選択されていません' });
    }

    const player = serverStore.player;
    let affectedCount = 0;
    const harvestedItemsMap = new Map<string, { count: number; quality: QualityTier; name: string; icon: string; basePrice: number; desc: string }>();

    switch (actionType) {
      case 'WATER': {
        tileIds.forEach((id: string) => {
          const tile = player.tiles.find((t) => t.id === id);
          if (tile && tile.type === 'FIELD' && tile.soilMoisture < 90) {
            tile.soilMoisture = 100;
            affectedCount++;
          }
        });
        break;
      }

      case 'HARVEST': {
        tileIds.forEach((id: string) => {
          const tile = player.tiles.find((t) => t.id === id);
          if (tile && tile.type === 'FIELD' && (tile.stage === 'MATURE' || tile.stage === 'OVERRIPE')) {
            const cropDef = CROPS_CATALOG[tile.plantedCropId || ''];
            if (cropDef) {
              const yieldCount = cropDef.harvestYield + (tile.specialTerrain === 'FERTILE_LOAM' ? 1 : 0);
              const quality = tile.quality || 'NORMAL';
              const key = `${cropDef.id}_${quality}`;

              if (harvestedItemsMap.has(key)) {
                harvestedItemsMap.get(key)!.count += yieldCount;
              } else {
                harvestedItemsMap.set(key, {
                  count: yieldCount,
                  quality,
                  name: cropDef.name,
                  icon: cropDef.emoji,
                  basePrice: cropDef.basePrice,
                  desc: cropDef.description,
                });
              }

              // Mineral vein bonus
              if (tile.specialTerrain === 'MINERAL_VEIN' || tile.specialTerrain === 'RARE_MINERAL') {
                const mineralInv = player.inventory.find((i) => i.itemId === 'material_mineral');
                if (mineralInv) mineralInv.count += 1;
                else {
                  player.inventory.push({
                    id: `inv_mineral_${Date.now()}`,
                    itemId: 'material_mineral',
                    name: '農園鉱石粉末',
                    category: 'MATERIAL',
                    count: 1,
                    icon: '🪨',
                    basePrice: 25,
                    description: '鉱床から採取した天然鉱石粉末。',
                  });
                }
              }

              recordDiscoveredItem(cropDef.id, cropDef.name, 'CROP', cropDef.emoji, cropDef.description, yieldCount);

              // Reset field
              tile.plantedCropId = null;
              tile.plantedAt = null;
              tile.stage = 'SEED';
              tile.growthProgress = 0;
              tile.matureAt = null;
              tile.fertilizerType = null;
              tile.fertilizerQualityBonus = 0;
              tile.fertilizerSpeedBonus = 1;
              tile.fertilizerUsed = false;
              tile.hasPest = false;

              player.stats.cropsHarvested += yieldCount;
              player.exp += 15;
              affectedCount++;
            }
          }
        });

        harvestedItemsMap.forEach((val, key) => {
          const [cropId, qual] = key.split('_');
          const existing = player.inventory.find((i) => i.itemId === cropId && i.quality === qual);
          if (existing) {
            existing.count += val.count;
          } else {
            player.inventory.push({
              id: `inv_${cropId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              itemId: cropId,
              name: val.name,
              category: 'CROP',
              count: val.count,
              quality: val.quality,
              icon: val.icon,
              basePrice: val.basePrice,
              description: val.desc,
            });
          }
        });
        break;
      }

      case 'PLANT': {
        if (!seedCropId) return res.status(400).json({ success: false, message: '植える種が選択されていません' });
        const cropDef = CROPS_CATALOG[seedCropId];
        if (!cropDef) return res.status(400).json({ success: false, message: '無効な作物です' });

        const seedItemId = `seed_${cropDef.id}`;
        const seedInv = player.inventory.find((i) => i.itemId === seedItemId);
        if (!seedInv || seedInv.count <= 0) {
          return res.status(400).json({ success: false, message: '種の所持数が足りません' });
        }

        tileIds.forEach((id: string) => {
          if (seedInv.count <= 0) return;
          const tile = player.tiles.find((t) => t.id === id);
          if (tile && tile.type === 'FIELD' && !tile.plantedCropId && !tile.hasWeed) {
            tile.plantedCropId = cropDef.id;
            tile.plantedAt = Date.now();
            tile.stage = 'SEED';
            tile.growthProgress = 0;
            tile.quality = 'NORMAL';
            tile.fertilizerUsed = false;
            tile.hasPest = false;
            tile.matureAt = null;

            seedInv.count--;
            affectedCount++;
          }
        });

        player.inventory = player.inventory.filter((i) => i.count > 0);
        break;
      }

      case 'WEED': {
        tileIds.forEach((id: string) => {
          const tile = player.tiles.find((t) => t.id === id);
          if (tile && tile.hasWeed) {
            tile.hasWeed = false;
            player.stats.weedsCleared++;
            affectedCount++;

            recordDiscoveredItem('material_weed', '雑草', 'MATERIAL', '🌿', '畑に生える野草。堆肥の主原料。', 1);

            const weedInv = player.inventory.find((i) => i.itemId === 'material_weed');
            if (weedInv) weedInv.count += 1;
            else {
              player.inventory.push({
                id: `inv_weed_${Date.now()}`,
                itemId: 'material_weed',
                name: '雑草',
                category: 'MATERIAL',
                count: 1,
                icon: '🌿',
                basePrice: 2,
                description: '畑に生えていた雑草。堆肥・有機肥料の貴重なクラフト原料になる。',
              });
            }
          }
        });
        break;
      }

      case 'PEST': {
        tileIds.forEach((id: string) => {
          const tile = player.tiles.find((t) => t.id === id);
          if (tile && tile.hasPest) {
            tile.hasPest = false;
            player.stats.pestsExterminated++;
            affectedCount++;
          }
        });
        break;
      }

      case 'FERTILIZE': {
        if (!fertilizerItemId) return res.status(400).json({ success: false, message: '肥料が選択されていません' });
        const fertInv = player.inventory.find((i) => i.itemId === fertilizerItemId);
        if (!fertInv || fertInv.count <= 0) return res.status(400).json({ success: false, message: '肥料の所持数が足りません' });

        tileIds.forEach((id: string) => {
          if (fertInv.count <= 0) return;
          const tile = player.tiles.find((t) => t.id === id);
          if (tile && tile.type === 'FIELD' && !tile.fertilizerType) {
            tile.fertilizerType = fertilizerItemId;
            tile.fertilizerUsed = true;
            if (fertilizerItemId === 'fertilizer_basic') {
              tile.fertilizerQualityBonus = 25;
              tile.fertilizerSpeedBonus = 1.1;
            } else if (fertilizerItemId === 'fertilizer_premium') {
              tile.fertilizerQualityBonus = 55;
              tile.fertilizerSpeedBonus = 1.25;
            } else if (fertilizerItemId === 'fertilizer_speed') {
              tile.fertilizerQualityBonus = 15;
              tile.fertilizerSpeedBonus = 1.5;
            }
            fertInv.count--;
            affectedCount++;
          }
        });

        player.inventory = player.inventory.filter((i) => i.count > 0);
        break;
      }

      case 'CLEAR_SPOILED': {
        tileIds.forEach((id: string) => {
          const tile = player.tiles.find((t) => t.id === id);
          if (tile && tile.type === 'FIELD' && tile.stage === 'SPOILED') {
            tile.plantedCropId = null;
            tile.plantedAt = null;
            tile.stage = 'SEED';
            tile.growthProgress = 0;
            tile.matureAt = null;
            tile.fertilizerUsed = false;
            tile.hasPest = false;
            affectedCount++;

            recordDiscoveredItem('material_compost', '腐敗有機堆肥', 'MATERIAL', '🍂', '腐敗作物をリサイクルして得られる発酵堆肥。', 1);

            const compostInv = player.inventory.find((i) => i.itemId === 'material_compost');
            if (compostInv) compostInv.count += 1;
            else {
              player.inventory.push({
                id: `inv_compost_${Date.now()}`,
                itemId: 'material_compost',
                name: '腐敗有機堆肥',
                category: 'MATERIAL',
                count: 1,
                icon: '🍂',
                basePrice: 5,
                description: '過熟・腐敗した作物を撤去して得られた有機質。肥料工場での再生原料。',
              });
            }
          }
        });
        break;
      }

      default:
        return res.status(400).json({ success: false, message: '不明なアクションです' });
    }

    while (player.exp >= player.level * 100) {
      player.exp -= player.level * 100;
      player.level += 1;
      player.storageMaxCapacity += 25;
    }

    res.json({
      success: true,
      message: `${affectedCount}箇所の農作業を完了しました`,
      affectedCount,
      player,
    });
  });

  // 4. Land Purchase & Expansion (Arbitrary Infinite X, Y Coordinates)
  app.post('/api/land/expand', (req, res) => {
    advanceSimulation();
    const { x, y, tileId } = req.body;
    const player = serverStore.player;

    let targetX = x;
    let targetY = y;

    if (tileId && (targetX === undefined || targetY === undefined)) {
      const parts = tileId.replace('tile_', '').split('_');
      targetX = parseInt(parts[0], 10);
      targetY = parseInt(parts[1], 10);
    }

    if (isNaN(targetX) || isNaN(targetY)) {
      return res.status(400).json({ success: false, message: '座標が無効です' });
    }

    const existing = player.tiles.find((t) => t.x === targetX && t.y === targetY);
    if (existing && existing.type !== 'UNCLAIMED') {
      return res.status(400).json({ success: false, message: 'この土地はすでに所有されています' });
    }

    const terrain = getProceduralTerrain(targetX, targetY);
    if (player.gold < terrain.unclaimedCost) {
      return res.status(400).json({
        success: false,
        message: `ゴールドが不足しています (必要: ${terrain.unclaimedCost.toLocaleString()} G)`,
      });
    }

    player.gold -= terrain.unclaimedCost;

    if (existing) {
      existing.type = 'FIELD';
      existing.soilMoisture = terrain.specialTerrain === 'WATER_SPRING' ? 100 : 70;
      existing.plantedCropId = null;
      existing.growthProgress = 0;
      existing.stage = 'SEED';
      existing.automation = createDefaultAutomation();
    } else {
      player.tiles.push({
        id: `tile_${targetX}_${targetY}`,
        x: targetX,
        y: targetY,
        type: 'FIELD',
        unclaimedCost: 0,
        biome: terrain.biome,
        specialTerrain: terrain.specialTerrain,
        soilMoisture: terrain.specialTerrain === 'WATER_SPRING' ? 100 : 70,
        fertilizerType: null,
        fertilizerQualityBonus: terrain.specialTerrain === 'FERTILE_LOAM' ? 25 : 0,
        fertilizerSpeedBonus: terrain.specialTerrain === 'FERTILE_LOAM' ? 1.25 : 1,
        fertilizerUsed: false,
        plantedCropId: null,
        plantedAt: null,
        stage: 'SEED',
        growthProgress: 0,
        hasWeed: false,
        hasPest: false,
        quality: 'NORMAL',
        matureAt: null,
        automation: createDefaultAutomation(),
        facility: null,
      });
    }

    player.exp += 40;

    res.json({
      success: true,
      message: `区画（X: ${targetX}, Y: ${targetY} · ${SPECIAL_TERRAIN_CONFIG[terrain.specialTerrain].name}）を開拓しました！`,
      player,
    });
  });

  // 5. Automation Equipment Install & Configure
  app.post('/api/automation/install', (req, res) => {
    advanceSimulation();
    const { tileId, machineType } = req.body;
    const player = serverStore.player;

    const tile = player.tiles.find((t) => t.id === tileId);
    if (!tile || tile.type !== 'FIELD') {
      return res.status(404).json({ success: false, message: '有効な耕作地が見つかりません' });
    }

    const machineMeta = AUTOMATION_MACHINES[machineType];
    if (!machineMeta) {
      return res.status(400).json({ success: false, message: '未知の自動化設備です' });
    }

    if (!tile.automation) tile.automation = createDefaultAutomation();

    if (tile.automation[machineMeta.type].installed) {
      return res.status(400).json({ success: false, message: `${machineMeta.name}はすでに設置済みです` });
    }

    if (player.gold < machineMeta.price) {
      return res.status(400).json({
        success: false,
        message: `資金が不足しています (必要: ${machineMeta.price.toLocaleString()} G)`,
      });
    }

    player.gold -= machineMeta.price;
    tile.automation[machineMeta.type].installed = true;
    player.exp += 60;

    res.json({
      success: true,
      message: `${machineMeta.name}を設置しました！（-${machineMeta.price.toLocaleString()} G）`,
      player,
    });
  });

  app.post('/api/automation/configure', (req, res) => {
    advanceSimulation();
    const { tileId, machineType, targetCropId, targetFertilizerId, targetThreshold } = req.body;
    const player = serverStore.player;

    const tile = player.tiles.find((t) => t.id === tileId);
    if (!tile || !tile.automation) {
      return res.status(404).json({ success: false, message: '設備が見つかりません' });
    }

    if (machineType === 'seeder' && targetCropId) {
      tile.automation.seeder.targetCropId = targetCropId;
    } else if (machineType === 'fertilizer' && targetFertilizerId) {
      tile.automation.fertilizer.targetFertilizerId = targetFertilizerId;
    } else if (machineType === 'waterer' && targetThreshold !== undefined) {
      tile.automation.waterer.targetThreshold = targetThreshold;
    }

    res.json({
      success: true,
      message: '自動設備の動作設定を更新しました',
      player,
    });
  });

  // 6. Warehouse Upgrade
  app.post('/api/warehouse/upgrade', (req, res) => {
    advanceSimulation();
    const player = serverStore.player;
    const currentLv = player.warehouseLevel || 1;

    const upgradeCosts = [
      { level: 2, capacity: 300, goldCost: 350, minerals: 0 },
      { level: 3, capacity: 600, goldCost: 800, minerals: 4 },
      { level: 4, capacity: 1200, goldCost: 1800, minerals: 8 },
      { level: 5, capacity: 2500, goldCost: 4000, minerals: 15 },
    ];

    const nextUpgrade = upgradeCosts.find((u) => u.level === currentLv + 1);
    if (!nextUpgrade) return res.status(400).json({ success: false, message: '倉庫はすでに最高レベルです！' });

    if (player.gold < nextUpgrade.goldCost) {
      return res.status(400).json({ success: false, message: `ゴールドが不足しています (必要: ${nextUpgrade.goldCost} G)` });
    }

    if (nextUpgrade.minerals > 0) {
      const mineralInv = player.inventory.find((i) => i.itemId === 'material_mineral');
      if (!mineralInv || mineralInv.count < nextUpgrade.minerals) {
        return res.status(400).json({ success: false, message: `建築用鉱石粉末が不足しています (必要: ${nextUpgrade.minerals}個)` });
      }
      mineralInv.count -= nextUpgrade.minerals;
      player.inventory = player.inventory.filter((i) => i.count > 0);
    }

    player.gold -= nextUpgrade.goldCost;
    player.warehouseLevel = nextUpgrade.level;
    player.storageMaxCapacity = nextUpgrade.capacity;
    player.exp += 80;

    res.json({
      success: true,
      message: `倉庫をLv.${nextUpgrade.level}に増築しました！(最大収容数: ${nextUpgrade.capacity}枠)`,
      player,
    });
  });

  // 7. World Market Sell
  app.post('/api/market/sell', (req, res) => {
    advanceSimulation();
    const { itemId, quality, count } = req.body;
    const player = serverStore.player;

    const invItem = player.inventory.find((i) => i.itemId === itemId && (i.quality || 'NORMAL') === (quality || 'NORMAL'));
    if (!invItem || invItem.count < count || count <= 0) {
      return res.status(400).json({ success: false, message: '売却対象のアイテム所持数が不足しています' });
    }

    const marketRate = serverStore.marketRates.find((m) => m.cropId === itemId);
    const unitPrice = marketRate ? marketRate.currentPrice : invItem.basePrice;

    let qualityMul = 1.0;
    if (quality === 'HIGH') qualityMul = 1.35;
    else if (quality === 'PRISTINE') qualityMul = 1.75;
    else if (quality === 'GOLDEN') qualityMul = 2.5;

    let eventMul = 1.0;
    if (serverStore.globalEvent.theme === 'HARVEST_FESTIVAL' && (invItem.category === 'CROP' || (invItem.category as any) === 'VEGETABLE')) {
      eventMul = 1.4;
    } else if (serverStore.globalEvent.theme === 'WHEAT_BOOM' && (itemId === 'crop_wheat' || itemId === 'processed_flour')) {
      eventMul = 1.5;
    }

    const totalPayout = Math.round(unitPrice * qualityMul * eventMul * count);

    invItem.count -= count;
    player.inventory = player.inventory.filter((i) => i.count > 0);
    player.gold += totalPayout;
    player.stats.goldEarned += totalPayout;
    player.stats.tradesCompleted += 1;
    player.exp += Math.max(5, Math.round(totalPayout / 20));

    if (marketRate) {
      marketRate.volumeTraded += count;
      if (count >= 10) {
        marketRate.currentPrice = Math.max(Math.round(marketRate.basePrice * 0.5), Math.round(marketRate.currentPrice * 0.96));
      }
    }

    res.json({
      success: true,
      message: `${invItem.name} × ${count} を世界市場で売却し、${totalPayout.toLocaleString()} Gを獲得しました！`,
      payout: totalPayout,
      player,
      marketRates: serverStore.marketRates,
    });
  });

  // 8. NPC Shop Buy
  app.post('/api/shop/buy', (req, res) => {
    advanceSimulation();
    const { itemId, count } = req.body;
    const player = serverStore.player;

    let costPerUnit = 0;
    let name = '';
    let category: any = 'SEED';
    let icon = '📦';
    let basePrice = 0;
    let desc = '';

    if (itemId.startsWith('seed_')) {
      const cropId = itemId.replace('seed_', '');
      const crop = CROPS_CATALOG[cropId];
      if (!crop) return res.status(400).json({ success: false, message: '無効な種です' });
      costPerUnit = crop.seedPrice;
      name = `${crop.name}の種`;
      category = 'SEED';
      icon = crop.emoji;
      basePrice = crop.seedPrice;
      desc = `耕した畑に植えて育てる${crop.name}の種。`;
    } else if (itemId === 'fertilizer_basic') {
      costPerUnit = 40;
      name = '有機基本肥料';
      category = 'FERTILIZER';
      icon = '🧪';
      basePrice = 35;
      desc = '作物の品質を1段階向上させる安心の有機肥料。';
    } else if (itemId === 'material_mineral') {
      costPerUnit = 30;
      name = '農園鉱石粉末';
      category = 'MATERIAL';
      icon = '🪨';
      basePrice = 25;
      desc = '高級肥料や土壌改良に使える天然鉱石粉末。';
    } else {
      return res.status(400).json({ success: false, message: 'ショップで取り扱いのないアイテムです' });
    }

    const totalCost = costPerUnit * count;
    if (player.gold < totalCost) {
      return res.status(400).json({ success: false, message: `ゴールドが不足しています (必要: ${totalCost} G)` });
    }

    player.gold -= totalCost;
    recordDiscoveredItem(itemId, name, category, icon, desc, count);

    const existing = player.inventory.find((i) => i.itemId === itemId);
    if (existing) {
      existing.count += count;
    } else {
      player.inventory.push({
        id: `inv_${itemId}_${Date.now()}`,
        itemId,
        name,
        category,
        count,
        icon,
        basePrice,
        description: desc,
      });
    }

    res.json({
      success: true,
      message: `${name} × ${count} を購入しました (-${totalCost} G)`,
      player,
    });
  });

  // 9. Crafting Execute & Collect
  app.post('/api/craft/start', (req, res) => {
    advanceSimulation();
    const { recipeId, facilityId } = req.body;
    const player = serverStore.player;

    const recipe = CRAFTING_RECIPES.find((r) => r.id === recipeId);
    if (!recipe) return res.status(404).json({ success: false, message: 'レシピが見つかりません' });

    for (const input of recipe.inputs) {
      const invItem = player.inventory.find((i) => i.itemId === input.itemId);
      if (!invItem || invItem.count < input.count) {
        return res.status(400).json({ success: false, message: `素材不足: ${input.name} が ${input.count}個必要です` });
      }
    }

    for (const input of recipe.inputs) {
      const invItem = player.inventory.find((i) => i.itemId === input.itemId)!;
      invItem.count -= input.count;
    }
    player.inventory = player.inventory.filter((i) => i.count > 0);

    const job = {
      id: `job_${Date.now()}`,
      recipeId: recipe.id,
      facilityId: facilityId || 'fac_main',
      outputName: recipe.output.name,
      outputIcon: recipe.output.icon,
      outputCount: recipe.output.count,
      startedAt: Date.now(),
      durationSec: recipe.durationSec,
      completed: false,
    };

    player.craftJobs.push(job);
    res.json({
      success: true,
      message: `${recipe.name} の製造を開始しました！（完成まで${recipe.durationSec}秒）`,
      job,
      player,
    });
  });

  app.post('/api/craft/collect', (req, res) => {
    advanceSimulation();
    const { jobId } = req.body;
    const player = serverStore.player;

    const job = player.craftJobs.find((j) => j.id === jobId);
    if (!job) return res.status(404).json({ success: false, message: 'クラフト指示が見つかりません' });
    if (!job.completed) return res.status(400).json({ success: false, message: 'まだ加工が完了していません' });

    const recipe = CRAFTING_RECIPES.find((r) => r.id === job.recipeId);
    if (!recipe) return res.status(500).json({ success: false, message: 'レシピデータ不整合' });

    recordDiscoveredItem(recipe.output.itemId, recipe.output.name, recipe.output.category, recipe.output.icon, recipe.description, recipe.output.count);

    const existing = player.inventory.find((i) => i.itemId === recipe.output.itemId);
    if (existing) {
      existing.count += recipe.output.count;
    } else {
      player.inventory.push({
        id: `inv_${recipe.output.itemId}_${Date.now()}`,
        itemId: recipe.output.itemId,
        name: recipe.output.name,
        category: recipe.output.category,
        count: recipe.output.count,
        icon: recipe.output.icon,
        basePrice: recipe.output.basePrice,
        description: recipe.description,
      });
    }

    player.craftJobs = player.craftJobs.filter((j) => j.id !== jobId);
    player.exp += 35;

    res.json({
      success: true,
      message: `${recipe.output.name} × ${recipe.output.count} を回収し、図鑑に記録しました！`,
      player,
    });
  });

  // 10. Player Auction House
  app.post('/api/auction/create', (req, res) => {
    advanceSimulation();
    const { itemId, quality, count, startingBid, buyoutPrice, durationMinutes } = req.body;
    const player = serverStore.player;

    const invItem = player.inventory.find((i) => i.itemId === itemId && (i.quality || 'NORMAL') === (quality || 'NORMAL'));
    if (!invItem || invItem.count < count || count <= 0) {
      return res.status(400).json({ success: false, message: '出品するアイテムの所持数が不足しています' });
    }

    const listingFee = Math.max(5, Math.round(startingBid * 0.05));
    if (player.gold < listingFee) {
      return res.status(400).json({ success: false, message: `出品手数料が不足しています (必要: ${listingFee} G)` });
    }

    player.gold -= listingFee;
    invItem.count -= count;
    player.inventory = player.inventory.filter((i) => i.count > 0);

    const listing: AuctionListing = {
      id: `auc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sellerId: player.playerId,
      sellerName: player.farmName,
      itemId,
      itemName: invItem.name,
      category: invItem.category,
      count,
      quality: quality || 'NORMAL',
      icon: invItem.icon,
      currentBid: startingBid,
      buyoutPrice,
      highestBidderId: null,
      highestBidderName: null,
      bidsCount: 0,
      endsAt: Date.now() + (durationMinutes || 15) * 60 * 1000,
      createdAt: Date.now(),
    };

    serverStore.auctions.unshift(listing);
    res.json({
      success: true,
      message: `${invItem.name} × ${count} を出品しました！（出品手数料: ${listingFee} G）`,
      listing,
      player,
      auctions: serverStore.auctions,
    });
  });

  app.post('/api/auction/buyout', (req, res) => {
    advanceSimulation();
    const { listingId } = req.body;
    const player = serverStore.player;

    const listingIndex = serverStore.auctions.findIndex((a) => a.id === listingId);
    if (listingIndex === -1) return res.status(404).json({ success: false, message: '出品が見つかりません' });

    const listing = serverStore.auctions[listingIndex];
    if (listing.sellerId === player.playerId) {
      return res.status(400).json({ success: false, message: '自分の出品を買い取ることはできません' });
    }

    if (player.gold < listing.buyoutPrice) {
      return res.status(400).json({ success: false, message: `即決ゴールドが不足しています (必要: ${listing.buyoutPrice.toLocaleString()} G)` });
    }

    player.gold -= listing.buyoutPrice;
    recordDiscoveredItem(listing.itemId, listing.itemName, listing.category, listing.icon, `オークションで落札した${listing.itemName}。`, listing.count);

    const existing = player.inventory.find((i) => i.itemId === listing.itemId && (i.quality || 'NORMAL') === listing.quality);
    if (existing) {
      existing.count += listing.count;
    } else {
      player.inventory.push({
        id: `inv_${listing.itemId}_${Date.now()}`,
        itemId: listing.itemId,
        name: listing.itemName,
        category: listing.category as any,
        count: listing.count,
        quality: listing.quality,
        icon: listing.icon,
        basePrice: Math.round(listing.buyoutPrice / listing.count),
        description: `オークションで落札した${listing.itemName}。`,
      });
    }

    serverStore.auctions.splice(listingIndex, 1);
    player.stats.tradesCompleted += 1;

    res.json({
      success: true,
      message: `${listing.itemName} × ${listing.count} を即決落札しました！（-${listing.buyoutPrice.toLocaleString()} G）`,
      player,
      auctions: serverStore.auctions,
    });
  });

  // 11. Community Kudos
  app.post('/api/farms/kudos', (req, res) => {
    const { farmId } = req.body;
    const farm = serverStore.communityFarms.find((f) => f.id === farmId);
    if (!farm) return res.status(404).json({ success: false, message: '農場が見つかりません' });

    if (farm.hasGivenKudos) {
      return res.status(400).json({ success: false, message: '本日はすでに「いいね！」を送信済みです' });
    }

    farm.kudosCount += 1;
    farm.hasGivenKudos = true;

    serverStore.player.gold += 35;
    serverStore.player.exp += 20;

    res.json({
      success: true,
      message: `${farm.name} に応援を送りました！友好ギフトとして 35 G を獲得！`,
      farm,
      player: serverStore.player,
    });
  });

  // 12. Dev server vs Production static
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: Number(PORT) },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[FarmVerse] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server failed to start:', err);
});
