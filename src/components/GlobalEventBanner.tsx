import React from 'react';
import { CloudRain, TrendingUp, AlertTriangle, Sparkles, Clock } from 'lucide-react';
import { GlobalEvent } from '../types/game';

interface GlobalEventBannerProps {
  event: GlobalEvent;
}

export const GlobalEventBanner: React.FC<GlobalEventBannerProps> = ({ event }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getThemeDetails = () => {
    switch (event.theme) {
      case 'RAIN':
        return {
          icon: <CloudRain className="w-4 h-4 text-cyan-400 shrink-0" />,
          bg: 'bg-cyan-950/40 border-cyan-800/60 text-cyan-200',
          badge: '自然給水持続中',
        };
      case 'HARVEST_FESTIVAL':
        return {
          icon: <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />,
          bg: 'bg-amber-950/40 border-amber-800/60 text-amber-200',
          badge: '野菜価格急騰中',
        };
      case 'WHEAT_BOOM':
        return {
          icon: <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />,
          bg: 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200',
          badge: '穀物取引活況',
        };
      case 'PEST_ALERT':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />,
          bg: 'bg-rose-950/40 border-rose-800/60 text-rose-200',
          badge: '害虫対策警報',
        };
      default:
        return {
          icon: <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />,
          bg: 'bg-stone-900 border-stone-800 text-stone-200',
          badge: '平穏な気候',
        };
    }
  };

  const { icon, bg, badge } = getThemeDetails();

  return (
    <aside aria-label="グローバル気象・経済イベント情報" className={`w-full py-1.5 px-3 sm:px-6 border-b text-xs flex items-center justify-between gap-3 ${bg}`}>
      <div className="flex items-center gap-2 overflow-hidden">
        {icon}
        <div className="flex items-center gap-2 truncate">
          <span className="font-semibold text-stone-100 truncate">{event.name}</span>
          <span className="text-stone-400 hidden md:inline">·</span>
          <span className="text-stone-300 hidden md:inline truncate">{event.description}</span>
          <span className="text-stone-400 hidden sm:inline">·</span>
          <span className="font-medium text-amber-300 shrink-0">{event.multiplierText}</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 text-stone-400 font-mono text-[11px] tabular-nums">
        <Clock className="w-3.5 h-3.5 text-stone-400" />
        <span>残り {formatTime(event.remainingSec)}</span>
      </div>
    </aside>
  );
};
