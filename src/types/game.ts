export type CropCategory = 'GRAIN' | 'VEGETABLE' | 'FRUIT' | 'SPECIAL';

export type CropGrowthStage = 'SEED' | 'SPROUT' | 'GROWING' | 'MATURE' | 'OVERRIPE' | 'SPOILED';

export type TileType = 'FIELD' | 'UNCLAIMED' | 'FACILITY' | 'OBSTACLE';

export type FacilityType = 'WAREHOUSE' | 'FERTILIZER_PLANT' | 'PROCESSING_WORKSHOP' | 'WELL_SILO' | 'DAIRY_BARN' | 'BAKERY_MILL';

export type QualityTier = 'NORMAL' | 'HIGH' | 'PRISTINE' | 'GOLDEN';

export type SpecialTerrainType =
  | 'NONE'
  | 'WATER_SPRING'     // 湧き水・水源
  | 'FERTILE_LOAM'     // 肥沃な黒土
  | 'MINERAL_VEIN'     // 鉱床
  | 'RARE_MINERAL'     // レア鉱床
  | 'ANCIENT_FOREST';   // 古代樹林

export interface TileAutomation {
  seeder: {
    installed: boolean;
    targetCropId: string | null;
    level: number;
  };
  fertilizer: {
    installed: boolean;
    targetFertilizerId: string | null;
    level: number;
  };
  waterer: {
    installed: boolean;
    targetThreshold: number;
    level: number;
  };
  harvester: {
    installed: boolean;
    autoHarvestCount: number;
    level: number;
  };
}

export interface CropDefinition {
  id: string;
  name: string;
  category: CropCategory;
  seedPrice: number;
  growthTimeSec: number;
  waterRequirement: number;
  harvestYield: number;
  basePrice: number;
  spoilTimeSec: number;
  season: 'ALL' | 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER';
  fertilizerCompatibility: string[];
  description: string;
  emoji: string;
  primaryColor: string;
  secondaryColor: string;
}

export interface TileData {
  id: string;
  x: number;
  y: number;
  type: TileType;
  unclaimedCost: number;
  biome: 'PLAIN' | 'FERTILE' | 'WATERSIDE' | 'FOREST' | 'MOUNTAIN';
  specialTerrain: SpecialTerrainType;
  soilMoisture: number;
  fertilizerType: string | null;
  fertilizerQualityBonus: number;
  fertilizerSpeedBonus: number;
  fertilizerUsed: boolean;
  plantedCropId: string | null;
  plantedAt: number | null;
  stage: CropGrowthStage;
  growthProgress: number;
  hasWeed: boolean;
  hasPest: boolean;
  quality: QualityTier;
  matureAt: number | null;
  automation: TileAutomation;
  facility: {
    id: string;
    type: FacilityType;
    level: number;
    name: string;
  } | null;
}

export interface InventoryItem {
  id: string;
  itemId: string;
  name: string;
  category: 'SEED' | 'CROP' | 'MATERIAL' | 'FERTILIZER' | 'PROCESSED' | 'SPECIAL';
  count: number;
  quality?: QualityTier;
  icon: string;
  basePrice: number;
  description: string;
}

export interface CraftingRecipe {
  id: string;
  name: string;
  facilityType: FacilityType;
  category: 'FERTILIZER' | 'FOOD' | 'DAIRY' | 'BAKING' | 'SUPPLY';
  minLevel: number;
  durationSec: number;
  inputs: { itemId: string; name: string; count: number; icon: string }[];
  output: { itemId: string; name: string; count: number; category: InventoryItem['category']; icon: string; basePrice: number };
  description: string;
}

export interface ActiveCraftJob {
  id: string;
  recipeId: string;
  facilityId: string;
  outputName: string;
  outputIcon: string;
  outputCount: number;
  startedAt: number;
  durationSec: number;
  completed: boolean;
}

export interface MarketItemRate {
  cropId: string;
  name: string;
  category: CropCategory;
  currentPrice: number;
  basePrice: number;
  changePercent: number;
  trend: 'SURGING' | 'HIGH' | 'STABLE' | 'FALLING' | 'CRASHING';
  history: number[];
  volumeTraded: number;
  icon: string;
}

export interface AuctionListing {
  id: string;
  sellerId: string;
  sellerName: string;
  itemId: string;
  itemName: string;
  category: string;
  count: number;
  quality: QualityTier;
  icon: string;
  currentBid: number;
  buyoutPrice: number;
  highestBidderId: string | null;
  highestBidderName: string | null;
  bidsCount: number;
  endsAt: number;
  createdAt: number;
}

export interface GlobalEvent {
  id: string;
  name: string;
  theme: 'RAIN' | 'DROUGHT' | 'HARVEST_FESTIVAL' | 'PEST_ALERT' | 'WHEAT_BOOM';
  description: string;
  multiplierText: string;
  remainingSec: number;
  endsAt: number;
}

export interface OtherFarmProfile {
  id: string;
  name: string;
  ownerName: string;
  title: string;
  level: number;
  specialty: string;
  kudosCount: number;
  hasGivenKudos?: boolean;
  activePlotsCount: number;
  facilitiesCount: number;
  tiles: TileData[];
}

export interface DiscoveredItemRecord {
  itemId: string;
  name: string;
  category: string;
  icon: string;
  discoveredAt: number;
  countProduced: number;
  description: string;
}

export interface PlayerState {
  playerId: string;
  farmName: string;
  gold: number;
  level: number;
  exp: number;
  lastActiveAt: number;
  storageMaxCapacity: number;
  warehouseLevel: number;
  tiles: TileData[];
  inventory: InventoryItem[];
  craftJobs: ActiveCraftJob[];
  discoveredItems: Record<string, DiscoveredItemRecord>;
  stats: {
    cropsHarvested: number;
    goldEarned: number;
    tradesCompleted: number;
    weedsCleared: number;
    pestsExterminated: number;
    autoHarvestsCount?: number;
  };
}

export interface BatchActionResult {
  success: boolean;
  message: string;
  affectedCount: number;
  consumedGold?: number;
  consumedItems?: { itemId: string; count: number }[];
  rewardGold?: number;
  rewardItems?: InventoryItem[];
}

export interface OfflineCatchupSummary {
  offlineSec: number;
  formattedTime: string;
  cropsGrownCount: number;
  cropsMaturedCount: number;
  autoHarvestedCount: number;
  autoHarvestedItems: { name: string; count: number; icon: string }[];
  message: string;
}
