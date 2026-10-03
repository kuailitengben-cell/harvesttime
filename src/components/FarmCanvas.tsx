import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize2, MousePointer, BoxSelect, ArrowLeft, Eye, Compass } from 'lucide-react';
import { TileData } from '../types/game';
import { CROPS_CATALOG } from '../data/crops';
import { SPECIAL_TERRAIN_CONFIG } from '../data/automation';
import { formatLargeNumber } from '../utils/numberFormat';
import { sound } from '../services/audio';

interface FarmCanvasProps {
  tiles: TileData[];
  selectedTileIds: string[];
  onSelectTiles: (tileIds: string[]) => void;
  onTileClick: (tile: TileData) => void;
  isMultiSelectMode: boolean;
  setIsMultiSelectMode: (mode: boolean) => void;
  visitorFarmName?: string | null;
  onReturnToOwnFarm?: () => void;
  onViewportChange?: (minX: number, maxX: number, minY: number, maxY: number) => void;
}

function safeRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
  } else {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}

export const FarmCanvas: React.FC<FarmCanvasProps> = ({
  tiles,
  selectedTileIds,
  onSelectTiles,
  onTileClick,
  isMultiSelectMode,
  setIsMultiSelectMode,
  visitorFarmName,
  onReturnToOwnFarm,
  onViewportChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const TILE_SIZE = 96;

  // Camera Viewport State (Smooth scale from 0.15x to 2.2x)
  const [camera, setCamera] = useState({
    x: 0,
    y: 0,
    zoom: 0.85,
  });

  const [hoveredCoords, setHoveredCoords] = useState<{ x: number; y: number } | null>(null);

  // Interaction State
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const cameraStartRef = useRef({ x: 0, y: 0 });
  const isBoxSelectingRef = useRef(false);
  const boxSelectStartRef = useRef<{ x: number; y: number } | null>(null);
  const boxSelectCurrentRef = useRef<{ x: number; y: number } | null>(null);
  const hasMovedSignificantlyRef = useRef(false);

  // Animation Frame
  const animationFrameIdRef = useRef<number | null>(null);
  const flyAngleRef = useRef(0);
  const lastViewportQueryRef = useRef<string>('');

  // Center camera on initial mount
  useEffect(() => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      const cw = clientWidth > 0 ? clientWidth : window.innerWidth;
      const ch = clientHeight > 0 ? clientHeight : window.innerHeight;
      setCamera({
        x: Math.round(cw / 2 - TILE_SIZE / 2),
        y: Math.round(ch / 2 - TILE_SIZE / 2),
        zoom: 0.85,
      });
    }
  }, []);

  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    const zoom = camera.zoom || 0.85;
    return {
      x: (screenX - camera.x) / zoom,
      y: (screenY - camera.y) / zoom,
    };
  }, [camera]);

  const worldToTile = useCallback((worldX: number, worldY: number) => {
    return {
      tileX: Math.floor(worldX / TILE_SIZE),
      tileY: Math.floor(worldY / TILE_SIZE),
    };
  }, []);

  // Viewport chunk querying for expansive/infinite exploration
  useEffect(() => {
    if (!onViewportChange || !containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    if (clientWidth <= 0 || clientHeight <= 0) return;

    const topLeft = screenToWorld(0, 0);
    const bottomRight = screenToWorld(clientWidth, clientHeight);

    const minX = Math.floor(topLeft.x / TILE_SIZE) - 2;
    const maxX = Math.ceil(bottomRight.x / TILE_SIZE) + 2;
    const minY = Math.floor(topLeft.y / TILE_SIZE) - 2;
    const maxY = Math.ceil(bottomRight.y / TILE_SIZE) + 2;

    if (isNaN(minX) || isNaN(maxX) || isNaN(minY) || isNaN(maxY)) return;

    const queryKey = `${minX}_${maxX}_${minY}_${maxY}`;
    if (queryKey !== lastViewportQueryRef.current) {
      lastViewportQueryRef.current = queryKey;
      onViewportChange(minX, maxX, minY, maxY);
    }
  }, [camera, screenToWorld, onViewportChange]);

  // Main Canvas Render
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    flyAngleRef.current += 0.05;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    try {
      // Apply Camera Transform (with NaN safeguards)
      const camX = isNaN(camera.x) ? 0 : camera.x;
      const camY = isNaN(camera.y) ? 0 : camera.y;
      const camZoom = isNaN(camera.zoom) || camera.zoom <= 0 ? 0.85 : camera.zoom;
      ctx.translate(camX, camY);
      ctx.scale(camZoom, camZoom);

    // Compute Visible World Bounds for Viewport Culling (ensures 60fps)
    const viewLeft = -camera.x / camera.zoom - TILE_SIZE;
    const viewTop = -camera.y / camera.zoom - TILE_SIZE;
    const viewRight = (width - camera.x) / camera.zoom + TILE_SIZE;
    const viewBottom = (height - camera.y) / camera.zoom + TILE_SIZE;

    // Draw Ambient Ground Backdrop
    ctx.fillStyle = '#1e2918';
    ctx.fillRect(viewLeft - 100, viewTop - 100, (viewRight - viewLeft) + 200, (viewBottom - viewTop) + 200);

    // Grid Origin marker at (0, 0)
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.25)';
    ctx.lineWidth = 2;
    ctx.strokeRect(-2, -2, TILE_SIZE + 4, TILE_SIZE + 4);

    // Render Tiles
    tiles.forEach((tile) => {
      const tx = tile.x * TILE_SIZE;
      const ty = tile.y * TILE_SIZE;

      // Viewport culling
      if (tx + TILE_SIZE < viewLeft || tx > viewRight || ty + TILE_SIZE < viewTop || ty > viewBottom) {
        return;
      }

      const isSelected = selectedTileIds.includes(tile.id);
      const isCompleteAutomation =
        tile.automation?.seeder?.installed &&
        tile.automation?.fertilizer?.installed &&
        tile.automation?.waterer?.installed &&
        tile.automation?.harvester?.installed;

      ctx.save();
      ctx.translate(tx, ty);

      if (tile.type === 'UNCLAIMED') {
        // --- UNCLAIMED LAND WITH SPECIAL TERRAIN ---
        const special = SPECIAL_TERRAIN_CONFIG[tile.specialTerrain || 'NONE'];
        ctx.fillStyle = special?.color || '#2d471e';
        ctx.fillRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4);

        // Dashed border
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = special?.borderColor || '#84cc16';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(3, 3, TILE_SIZE - 6, TILE_SIZE - 6);
        ctx.setLineDash([]);

        // Special Terrain Biome visual motif
        if (tile.specialTerrain === 'WATER_SPRING') {
          ctx.fillStyle = '#06b6d4';
          ctx.beginPath();
          ctx.arc(TILE_SIZE / 2, TILE_SIZE / 2 - 8, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.font = '16px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('⛲', TILE_SIZE / 2, TILE_SIZE / 2 - 2);
        } else if (tile.specialTerrain === 'FERTILE_LOAM') {
          ctx.fillStyle = '#78350f';
          ctx.beginPath();
          ctx.ellipse(TILE_SIZE / 2, TILE_SIZE / 2 - 6, 20, 12, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.font = '16px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('✨', TILE_SIZE / 2, TILE_SIZE / 2);
        } else if (tile.specialTerrain === 'MINERAL_VEIN') {
          ctx.font = '20px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🪨', TILE_SIZE / 2, TILE_SIZE / 2 - 2);
        } else if (tile.specialTerrain === 'RARE_MINERAL') {
          ctx.font = '22px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('💎', TILE_SIZE / 2, TILE_SIZE / 2 - 2);
        } else if (tile.specialTerrain === 'ANCIENT_FOREST') {
          ctx.font = '22px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🌲', TILE_SIZE / 2, TILE_SIZE / 2 - 2);
        }

        // Price badge in center with large-unit formatting
        if (!visitorFarmName) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
          ctx.beginPath();
          safeRoundRect(ctx, 10, TILE_SIZE - 30, TILE_SIZE - 20, 20, 6);
          ctx.fill();
          ctx.fillStyle = '#fde047';
          ctx.font = 'bold 10px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`🪙 ${formatLargeNumber(tile.unclaimedCost)}G`, TILE_SIZE / 2, TILE_SIZE - 16);
        }
      } else if (tile.type === 'FACILITY' && tile.facility) {
        // --- FACILITY ---
        ctx.fillStyle = '#3f2e1e';
        ctx.fillRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4);

        const fac = tile.facility;
        if (fac.type === 'WAREHOUSE') {
          ctx.fillStyle = '#991b1b';
          ctx.fillRect(16, 26, TILE_SIZE - 32, 54);
          ctx.fillStyle = '#7f1d1d';
          ctx.beginPath();
          ctx.moveTo(10, 28);
          ctx.lineTo(TILE_SIZE / 2, 8);
          ctx.lineTo(TILE_SIZE - 10, 28);
          ctx.closePath();
          ctx.fill();
          ctx.font = '22px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('📦', TILE_SIZE / 2, 62);
        } else if (fac.type === 'FERTILIZER_PLANT') {
          ctx.fillStyle = '#582f0e';
          ctx.fillRect(18, 30, TILE_SIZE - 36, 50);
          ctx.font = '20px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🧪', TILE_SIZE / 2, 66);
        } else if (fac.type === 'PROCESSING_WORKSHOP') {
          ctx.fillStyle = '#475569';
          ctx.fillRect(18, 24, TILE_SIZE - 36, 56);
          ctx.font = '20px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('⚙️', TILE_SIZE / 2, 62);
        } else if (fac.type === 'WELL_SILO') {
          ctx.fillStyle = '#0284c7';
          ctx.beginPath();
          ctx.arc(TILE_SIZE / 2, TILE_SIZE / 2, 24, 0, Math.PI * 2);
          ctx.fill();
          ctx.font = '20px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('💧', TILE_SIZE / 2, 54);
        }

        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.beginPath();
        safeRoundRect(ctx, 8, TILE_SIZE - 20, TILE_SIZE - 16, 16, 4);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Lv.${fac.level} ${fac.name.substring(0, 6)}`, TILE_SIZE / 2, TILE_SIZE - 8);
      } else {
        // --- FIELD PLOT (畑) ---
        const isMoist = tile.soilMoisture > 20;
        ctx.fillStyle = isMoist ? '#3a2312' : '#78533b';
        ctx.fillRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4);

        // Furrows
        ctx.fillStyle = isMoist ? '#2b190c' : '#5c3a23';
        for (let i = 12; i < TILE_SIZE - 8; i += 16) {
          ctx.fillRect(8, i, TILE_SIZE - 16, 3);
        }

        // Special terrain indicator on field
        if (tile.specialTerrain && tile.specialTerrain !== 'NONE') {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.fillRect(3, 3, TILE_SIZE - 6, TILE_SIZE - 6);
        }

        // Fertilizer applied indicator
        if (tile.fertilizerType) {
          ctx.fillStyle =
            tile.fertilizerType === 'fertilizer_premium'
              ? '#fbbf24'
              : tile.fertilizerType === 'fertilizer_speed'
              ? '#38bdf8'
              : '#86efac';
          ctx.fillRect(10, 8, 4, 4);
          ctx.fillRect(TILE_SIZE - 14, 10, 4, 4);
        }

        // --- CROP RENDERING ---
        if (tile.plantedCropId) {
          const crop = CROPS_CATALOG[tile.plantedCropId];
          const stage = tile.stage;

          if (stage === 'SEED') {
            ctx.fillStyle = '#1c1917';
            ctx.beginPath();
            ctx.arc(TILE_SIZE / 2 - 8, TILE_SIZE / 2, 3, 0, Math.PI * 2);
            ctx.arc(TILE_SIZE / 2 + 8, TILE_SIZE / 2, 3, 0, Math.PI * 2);
            ctx.arc(TILE_SIZE / 2, TILE_SIZE / 2 - 4, 3.5, 0, Math.PI * 2);
            ctx.fill();
          } else if (stage === 'SPROUT') {
            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.ellipse(TILE_SIZE / 2 - 7, TILE_SIZE / 2 - 4, 7, 4, -Math.PI / 4, 0, Math.PI * 2);
            ctx.ellipse(TILE_SIZE / 2 + 7, TILE_SIZE / 2 - 4, 7, 4, Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#15803d';
            ctx.fillRect(TILE_SIZE / 2 - 1.5, TILE_SIZE / 2 - 2, 3, 10);
          } else if (stage === 'GROWING') {
            ctx.fillStyle = '#16a34a';
            ctx.beginPath();
            ctx.arc(TILE_SIZE / 2, TILE_SIZE / 2, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = crop ? crop.primaryColor : '#4ade80';
            ctx.beginPath();
            ctx.arc(TILE_SIZE / 2, TILE_SIZE / 2 - 5, 8, 0, Math.PI * 2);
            ctx.fill();
          } else if (stage === 'MATURE') {
            ctx.save();
            ctx.shadowColor = '#fbbf24';
            ctx.shadowBlur = 10;
            ctx.font = '36px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(crop?.emoji || '🌾', TILE_SIZE / 2, TILE_SIZE / 2);
            ctx.restore();

            if (tile.quality && tile.quality !== 'NORMAL') {
              ctx.fillStyle =
                tile.quality === 'GOLDEN'
                  ? '#eab308'
                  : tile.quality === 'PRISTINE'
                  ? '#a855f7'
                  : '#3b82f6';
              ctx.beginPath();
              ctx.arc(TILE_SIZE - 16, 16, 6, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 8px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText('★', TILE_SIZE - 16, 19);
            }
          } else if (stage === 'OVERRIPE') {
            ctx.font = '32px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(crop?.emoji || '🌾', TILE_SIZE / 2, TILE_SIZE / 2 + 4);
            ctx.font = '14px sans-serif';
            ctx.fillText('⚠️', TILE_SIZE - 16, 18);
          } else if (stage === 'SPOILED') {
            ctx.fillStyle = '#451a03';
            ctx.beginPath();
            ctx.ellipse(TILE_SIZE / 2, TILE_SIZE / 2 + 6, 18, 10, 0, 0, Math.PI * 2);
            ctx.fill();

            const flyDist = 18;
            const flyX1 = TILE_SIZE / 2 + Math.cos(flyAngleRef.current) * flyDist;
            const flyY1 = TILE_SIZE / 2 + Math.sin(flyAngleRef.current) * (flyDist * 0.6);
            ctx.fillStyle = '#1c1917';
            ctx.beginPath();
            ctx.arc(flyX1, flyY1, 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.font = '10px sans-serif';
            ctx.fillStyle = '#ea580c';
            ctx.textAlign = 'center';
            ctx.fillText('腐敗', TILE_SIZE / 2, TILE_SIZE - 12);
          }

          if (stage === 'SEED' || stage === 'SPROUT' || stage === 'GROWING') {
            const barW = TILE_SIZE - 28;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(14, TILE_SIZE - 12, barW, 5);
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(14, TILE_SIZE - 12, barW * tile.growthProgress, 5);
          }
        }

        // Weeds / Pests
        if (tile.hasWeed) {
          ctx.font = '18px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🌿', 18, 22);
        }
        if (tile.hasPest) {
          ctx.font = '18px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🐛', TILE_SIZE - 18, 24);
        }

        // Moisture gauge
        if (tile.soilMoisture < 25) {
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 9px sans-serif';
          ctx.fillText('渇水', 18, TILE_SIZE - 8);
        }

        // --- AUTOMATION EQUIPMENT BORDER OVERLAYS ---
        // 1. Seeder (Top / 北)
        if (tile.automation?.seeder?.installed) {
          ctx.fillStyle = '#15803d';
          ctx.fillRect(TILE_SIZE / 2 - 12, 0, 24, 8);
          ctx.fillStyle = '#86efac';
          ctx.font = '9px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🌱', TILE_SIZE / 2, 7);
        }

        // 2. Fertilizer (Left / 西)
        if (tile.automation?.fertilizer?.installed) {
          ctx.fillStyle = '#7e22ce';
          ctx.fillRect(0, TILE_SIZE / 2 - 12, 8, 24);
          ctx.fillStyle = '#e9d5ff';
          ctx.font = '9px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🧪', 4, TILE_SIZE / 2 + 3);
        }

        // 3. Waterer (Right / 東)
        if (tile.automation?.waterer?.installed) {
          ctx.fillStyle = '#0369a1';
          ctx.fillRect(TILE_SIZE - 8, TILE_SIZE / 2 - 12, 8, 24);
          ctx.fillStyle = '#bae6fd';
          ctx.font = '9px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('💧', TILE_SIZE - 4, TILE_SIZE / 2 + 3);
        }

        // 4. Harvester (Bottom / 南)
        if (tile.automation?.harvester?.installed) {
          ctx.fillStyle = '#b45309';
          ctx.fillRect(TILE_SIZE / 2 - 12, TILE_SIZE - 8, 24, 8);
          ctx.fillStyle = '#fef08a';
          ctx.font = '9px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🌾', TILE_SIZE / 2, TILE_SIZE - 1);
        }

        // Complete Automation circuit aura
        if (isCompleteAutomation) {
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(4, 4, TILE_SIZE - 8, TILE_SIZE - 8);
        }
      }

      // --- SELECTION HIGHLIGHT ---
      if (isSelected) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#f59e0b';
        ctx.strokeRect(3, 3, TILE_SIZE - 6, TILE_SIZE - 6);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(2, 2, 6, 6);
        ctx.fillRect(TILE_SIZE - 8, 2, 6, 6);
        ctx.fillRect(2, TILE_SIZE - 8, 6, 6);
        ctx.fillRect(TILE_SIZE - 8, TILE_SIZE - 8, 6, 6);
      }

      ctx.restore();
    });

    // Box Select Marquee
    if (isBoxSelectingRef.current && boxSelectStartRef.current && boxSelectCurrentRef.current) {
      const start = boxSelectStartRef.current;
      const current = boxSelectCurrentRef.current;
      const x = Math.min(start.x, current.x);
      const y = Math.min(start.y, current.y);
      const w = Math.abs(current.x - start.x);
      const h = Math.abs(current.y - start.y);

      ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
      ctx.fillRect(x, y, w, h);
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
    }
    } catch (err) {
      console.error('[FarmCanvas render loop error]:', err);
    } finally {
      ctx.restore();
    }

    animationFrameIdRef.current = requestAnimationFrame(render);
  }, [camera, tiles, selectedTileIds, visitorFarmName]);

  // Canvas Resize observer
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const dpr = window.devicePixelRatio || 1;
      const cw = container.clientWidth > 0 ? container.clientWidth : window.innerWidth;
      const ch = container.clientHeight > 0 ? container.clientHeight : window.innerHeight;
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
      canvas.style.width = `${cw}px`;
      canvas.style.height = `${ch}px`;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    animationFrameIdRef.current = requestAnimationFrame(render);
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [render]);

  // Pointer Event Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    isDraggingRef.current = true;
    hasMovedSignificantlyRef.current = false;
    dragStartRef.current = { x: screenX, y: screenY };
    cameraStartRef.current = { x: camera.x, y: camera.y };

    if (!visitorFarmName && (isMultiSelectMode || e.shiftKey)) {
      isBoxSelectingRef.current = true;
      const worldPos = screenToWorld(screenX, screenY);
      boxSelectStartRef.current = worldPos;
      boxSelectCurrentRef.current = worldPos;
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const worldPos = screenToWorld(screenX, screenY);
    const tileCoords = worldToTile(worldPos.x, worldPos.y);
    setHoveredCoords({ x: tileCoords.tileX, y: tileCoords.tileY });

    if (!isDraggingRef.current) return;

    const dx = screenX - dragStartRef.current.x;
    const dy = screenY - dragStartRef.current.y;

    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      hasMovedSignificantlyRef.current = true;
    }

    if (isBoxSelectingRef.current) {
      boxSelectCurrentRef.current = worldPos;
    } else {
      setCamera((prev) => ({
        ...prev,
        x: cameraStartRef.current.x + dx,
        y: cameraStartRef.current.y + dy,
      }));
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    if (isBoxSelectingRef.current && boxSelectStartRef.current && boxSelectCurrentRef.current) {
      const start = boxSelectStartRef.current;
      const current = boxSelectCurrentRef.current;
      const minX = Math.min(start.x, current.x);
      const maxX = Math.max(start.x, current.x);
      const minY = Math.min(start.y, current.y);
      const maxY = Math.max(start.y, current.y);

      const enclosedIds: string[] = [];
      tiles.forEach((tile) => {
        const tx = tile.x * TILE_SIZE;
        const ty = tile.y * TILE_SIZE;
        const overlaps = tx + TILE_SIZE > minX && tx < maxX && ty + TILE_SIZE > minY && ty < maxY;
        if (overlaps && tile.type !== 'UNCLAIMED') {
          enclosedIds.push(tile.id);
        }
      });

      if (enclosedIds.length > 0) {
        sound.playClick();
        onSelectTiles(enclosedIds);
      }
    } else if (!hasMovedSignificantlyRef.current) {
      const worldPos = screenToWorld(screenX, screenY);
      const tileCoords = worldToTile(worldPos.x, worldPos.y);

      const clickedTile = tiles.find((t) => t.x === tileCoords.tileX && t.y === tileCoords.tileY);
      if (clickedTile) {
        sound.playClick();
        onTileClick(clickedTile);
      }
    }

    isDraggingRef.current = false;
    isBoxSelectingRef.current = false;
    boxSelectStartRef.current = null;
    boxSelectCurrentRef.current = null;
  };

  // Ultra-Smooth Exponential Wheel Zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * -0.0018;
    const currentZoom = camera.zoom;
    const newZoom = Math.min(2.5, Math.max(0.12, currentZoom * (1 + zoomDelta)));

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setCamera((prev) => ({
      x: mouseX - (mouseX - prev.x) * (newZoom / prev.zoom),
      y: mouseY - (mouseY - prev.y) * (newZoom / prev.zoom),
      zoom: newZoom,
    }));
  };

  const handleZoom = (factor: number) => {
    sound.playClick();
    setCamera((prev) => {
      const newZoom = Math.min(2.5, Math.max(0.12, prev.zoom * factor));
      const container = containerRef.current;
      const cx = (container?.clientWidth || 800) / 2;
      const cy = (container?.clientHeight || 600) / 2;
      return {
        x: cx - (cx - prev.x) * (newZoom / prev.zoom),
        y: cy - (cy - prev.y) * (newZoom / prev.zoom),
        zoom: newZoom,
      };
    });
  };

  const handleResetCamera = () => {
    sound.playClick();
    const container = containerRef.current;
    if (container) {
      setCamera({
        x: container.clientWidth / 2 - TILE_SIZE / 2,
        y: container.clientHeight / 2 - TILE_SIZE / 2,
        zoom: 0.85,
      });
    }
  };

  const distFromCenter = hoveredCoords
    ? Math.round(Math.sqrt(hoveredCoords.x * hoveredCoords.x + hoveredCoords.y * hoveredCoords.y))
    : 0;

  return (
    <div ref={containerRef} className="relative w-full h-full flex-1 overflow-hidden bg-stone-950 touch-none">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/* Visitor Banner */}
      {visitorFarmName && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-stone-900/95 backdrop-blur-md px-4 py-2 rounded-xl border border-amber-500/60 shadow-2xl flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-200">
              【他農園見学中】{visitorFarmName} (閲覧専用)
            </span>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              if (onReturnToOwnFarm) onReturnToOwnFarm();
            }}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-md transition-all active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>自農園へ戻る</span>
          </button>
        </div>
      )}

      {/* Floating HUD Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10 bg-stone-900/90 backdrop-blur-md p-1.5 rounded-xl border border-stone-800 shadow-xl">
        {!visitorFarmName && (
          <>
            <button
              onClick={() => {
                sound.playClick();
                setIsMultiSelectMode(!isMultiSelectMode);
              }}
              title={isMultiSelectMode ? '範囲ドラッグ選択中' : '通常選択モード'}
              className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
                isMultiSelectMode
                  ? 'bg-amber-600 text-white font-bold'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              {isMultiSelectMode ? <BoxSelect className="w-5 h-5" /> : <MousePointer className="w-5 h-5" />}
            </button>
            <div className="h-px bg-stone-800 my-0.5" />
          </>
        )}

        <button
          onClick={() => handleZoom(1.25)}
          title="ズームイン (+)"
          className="p-2 rounded-lg text-stone-300 hover:text-white hover:bg-stone-800 transition-colors"
        >
          <ZoomIn className="w-5 h-5" />
        </button>

        <button
          onClick={() => handleZoom(0.8)}
          title="ズームアウト (-)"
          className="p-2 rounded-lg text-stone-300 hover:text-white hover:bg-stone-800 transition-colors"
        >
          <ZoomOut className="w-5 h-5" />
        </button>

        <button
          onClick={handleResetCamera}
          title="農園中央 (X:0, Y:0) へ視点をリセット"
          className="p-2 rounded-lg text-stone-300 hover:text-white hover:bg-stone-800 transition-colors"
        >
          <Maximize2 className="w-5 h-5" />
        </button>
      </div>

      {/* Real-time World Coordinates & Compass HUD */}
      {hoveredCoords && (
        <div className="absolute bottom-4 left-4 z-10 bg-stone-900/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-stone-800 text-[11px] font-mono text-stone-300 flex items-center gap-2.5 shadow-md">
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span>
            座標: <strong>X: {hoveredCoords.x}, Y: {hoveredCoords.y}</strong>
          </span>
          <span className="text-stone-500">|</span>
          <span>中心から {distFromCenter}マス</span>
          <span className="text-stone-500">|</span>
          <span className="text-amber-400/90">{Math.round(camera.zoom * 100)}%</span>
        </div>
      )}

      {/* Multi-select hint pill */}
      {!visitorFarmName && isMultiSelectMode && (
        <div className="absolute top-4 left-4 z-10 bg-amber-950/90 border border-amber-600/60 text-amber-200 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 shadow-lg">
          <BoxSelect className="w-4 h-4 text-amber-400" />
          <span>画面上をドラッグして複数マスを範囲選択できます</span>
        </div>
      )}
    </div>
  );
};
