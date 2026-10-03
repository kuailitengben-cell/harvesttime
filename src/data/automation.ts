export interface AutomationMachineConfig {
  type: 'seeder' | 'fertilizer' | 'waterer' | 'harvester';
  name: string;
  shortName: string;
  icon: string;
  price: number;
  position: 'TOP' | 'LEFT' | 'RIGHT' | 'BOTTOM';
  positionLabel: string;
  description: string;
}

export const AUTOMATION_MACHINES: Record<string, AutomationMachineConfig> = {
  seeder: {
    type: 'seeder',
    name: '自動種植え機',
    shortName: '自動播種',
    icon: '🌱',
    price: 3500,
    position: 'TOP',
    positionLabel: '北辺（上）',
    description: '対象マスが空き地になった時、指定された種を倉庫から自動で1個消費して播種します。作物がすでにある場合は絶対に消費しません。',
  },
  fertilizer: {
    type: 'fertilizer',
    name: '自動肥料機',
    shortName: '自動施肥',
    icon: '🧪',
    price: 4200,
    position: 'LEFT',
    positionLabel: '西辺（左）',
    description: '作物が植えられた直後、指定の肥料を自動で1回だけ散布します。二重消費防止ロックが作動し無駄な消費はゼロです。',
  },
  waterer: {
    type: 'waterer',
    name: '自動水やり機',
    shortName: '自動散水',
    icon: '💧',
    price: 2800,
    position: 'RIGHT',
    positionLabel: '東辺（右）',
    description: '土壌水分が80%未満に乾燥した時、自動で水を満タンまで給水し、作物の生育停滞を防ぎます。',
  },
  harvester: {
    type: 'harvester',
    name: '自動収穫機',
    shortName: '自動収穫',
    icon: '🌾',
    price: 6500,
    position: 'BOTTOM',
    positionLabel: '南辺（下）',
    description: '作物が完熟（収穫可能）になった瞬間、自動で収穫して倉庫へ直接保管します。作物の過熟や腐敗を完全に防ぎます。',
  },
};

export interface SpecialTerrainMeta {
  type: string;
  name: string;
  icon: string;
  priceMultiplier: number;
  color: string;
  borderColor: string;
  perkDescription: string;
}

export const SPECIAL_TERRAIN_CONFIG: Record<string, SpecialTerrainMeta> = {
  NONE: {
    type: 'NONE',
    name: '標準平野',
    icon: '🌱',
    priceMultiplier: 1.0,
    color: '#334b22',
    borderColor: '#4d7c0f',
    perkDescription: '標準的な農業地帯。あらゆる作物が安定して育ちます。',
  },
  WATER_SPRING: {
    type: 'WATER_SPRING',
    name: '清流・湧水源',
    icon: '⛲',
    priceMultiplier: 1.5,
    color: '#0e7490',
    borderColor: '#06b6d4',
    perkDescription: '自然湧水により土壌水分が常時100%を維持。水やりの手間が不要で、米・スイカなどの水分要求作物の収穫量が+25%向上。',
  },
  FERTILE_LOAM: {
    type: 'FERTILE_LOAM',
    name: '肥沃な黒土',
    icon: '✨',
    priceMultiplier: 2.0,
    color: '#422006',
    borderColor: '#d97706',
    perkDescription: '有機質に富んだ最上級の黒土。全作物の成長速度が+25%向上し、黄金・極上品質の発生確率が大幅にアップ。',
  },
  MINERAL_VEIN: {
    type: 'MINERAL_VEIN',
    name: '天然鉱床',
    icon: '🪨',
    priceMultiplier: 2.5,
    color: '#475569',
    borderColor: '#94a3b8',
    perkDescription: '地表近くに鉱物が露出する岩石地帯。作物の収穫時に一定確率で「農園鉱石粉末」を副産物として採掘可能。',
  },
  RARE_MINERAL: {
    type: 'RARE_MINERAL',
    name: '古代水晶・結晶脈',
    icon: '💎',
    priceMultiplier: 5.0,
    color: '#581c87',
    borderColor: '#a855f7',
    perkDescription: '神秘の結晶が埋まる超希少鉱床。特殊作物（黄金トマト、古代種）の成長が倍速化し、鉱石採掘確率が最大化。',
  },
  ANCIENT_FOREST: {
    type: 'ANCIENT_FOREST',
    name: '原生林・古樹土壌',
    icon: '🌲',
    priceMultiplier: 1.8,
    color: '#14532d',
    borderColor: '#22c55e',
    perkDescription: '数百年手付かずの樹林地。野草や腐敗堆肥素材の発生量が増加し、高級肥料の生産拠点に適した土地。',
  },
};
