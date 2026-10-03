import React, { useState } from 'react';
import { Volume2, VolumeX, Sparkles, Coins, HelpCircle, ArrowLeft, Info, X } from 'lucide-react';
import { PlayerState, GlobalEvent } from '../types/game';
import { sound } from '../services/audio';
import { formatLargeNumber, formatExactNumber } from '../utils/numberFormat';
import farmCrestIcon from '../assets/images/farm_crest_icon_1790952241781.jpg';

interface HeaderHUDProps {
  player: PlayerState;
  globalEvent: GlobalEvent;
  activeTab: 'FARM' | 'WAREHOUSE' | 'MARKET' | 'AUCTION' | 'SHOP' | 'CRAFT' | 'COMMUNITY' | 'COLLECTION';
  setActiveTab: (tab: 'FARM' | 'WAREHOUSE' | 'MARKET' | 'AUCTION' | 'SHOP' | 'CRAFT' | 'COMMUNITY' | 'COLLECTION') => void;
  onOpenHelp: () => void;
  isVisitingNeighbor?: boolean;
  onReturnToOwnFarm?: () => void;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  player,
  globalEvent,
  activeTab,
  setActiveTab,
  onOpenHelp,
  isVisitingNeighbor,
  onReturnToOwnFarm,
}) => {
  const [muted, setMuted] = useState(sound.isMuted());
  const [showGoldDetail, setShowGoldDetail] = useState(false);

  const handleToggleSound = () => {
    const isMuted = sound.toggleMute();
    setMuted(isMuted);
    if (!isMuted) sound.playClick();
  };

  const navItems: { id: HeaderHUDProps['activeTab']; label: string; icon: string }[] = [
    { id: 'FARM', label: '農場', icon: '🌾' },
    { id: 'WAREHOUSE', label: '倉庫', icon: '📦' },
    { id: 'MARKET', label: '世界市場', icon: '📈' },
    { id: 'AUCTION', label: '競売所', icon: '⚖️' },
    { id: 'SHOP', label: '農協資材', icon: '🏪' },
    { id: 'CRAFT', label: '加工工房', icon: '🛠️' },
    { id: 'COLLECTION', label: '収穫図鑑', icon: '📖' },
    { id: 'COMMUNITY', label: '近隣農家', icon: '🏡' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-stone-900/95 backdrop-blur-md border-b border-stone-800 text-stone-100 px-3 sm:px-6 py-2 flex items-center justify-between select-none">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <img
            src={farmCrestIcon}
            alt="FarmVerse Crest"
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-lg object-cover ring-1 ring-amber-500/30 shadow-sm"
          />
          <div className="flex flex-col">
            <span className="font-bold text-base sm:text-lg tracking-tight text-amber-100 flex items-center gap-1.5 font-['M_PLUS_Rounded_1c']">
              FarmVerse <span className="text-xs font-normal text-amber-400/90 hidden md:inline">自動化＆超広大農業経済</span>
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden xl:flex items-center gap-1 p-1 bg-stone-950/60 rounded-xl border border-stone-800/80">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  sound.playClick();
                  setActiveTab(item.id);
                }}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-sm font-semibold'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800/50'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Stats & Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {isVisitingNeighbor && (
            <button
              onClick={onReturnToOwnFarm}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>自農園へ</span>
            </button>
          )}

          {/* Level */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-stone-300 px-2.5 py-1 bg-stone-800/80 rounded-lg border border-stone-700/60">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-amber-200">Lv.{player.level}</span>
            <span className="text-stone-500 text-[11px] font-mono tabular-nums">
              ({player.exp}/{player.level * 100})
            </span>
          </div>

          {/* Gold Counter (Formatted with Japanese Large Units, Click for Exact) */}
          <button
            onClick={() => {
              sound.playClick();
              setShowGoldDetail(true);
            }}
            title="タップして正確な所持金明細を表示"
            className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg shadow-inner transition-colors cursor-pointer"
          >
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="font-bold font-mono tabular-nums text-sm text-amber-300">
              {formatLargeNumber(player.gold)}{' '}
              <span className="text-[11px] font-sans font-medium text-amber-400/80">G</span>
            </span>
          </button>

          {/* Sound toggle */}
          <button
            onClick={handleToggleSound}
            title={muted ? '音声を有効化' : '音声をミュート'}
            className="p-1.5 rounded-lg bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 transition-colors"
          >
            {muted ? <VolumeX className="w-4 h-4 text-stone-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Help */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenHelp();
            }}
            title="自動化＆超広大マップ手引書"
            className="p-1.5 rounded-lg bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-amber-300" />
          </button>
        </div>
      </header>

      {/* Exact Gold Details Modal Popup */}
      {showGoldDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-stone-900 border border-amber-500/50 rounded-2xl p-5 max-w-sm w-full shadow-2xl text-stone-100 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                <Info className="w-4 h-4" />
                所持金・残高明細（1G単位）
              </span>
              <button onClick={() => setShowGoldDetail(false)} className="text-stone-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-stone-950 rounded-xl border border-stone-800 text-center flex flex-col gap-1">
              <span className="text-[11px] text-stone-400">正確な所持ゴールド残高</span>
              <span className="text-2xl font-bold font-mono text-amber-300 tabular-nums">
                {formatExactNumber(player.gold)} <span className="text-sm font-sans font-medium text-amber-400">G</span>
              </span>
              <span className="text-xs text-stone-500 font-mono mt-1">
                （短縮表示: {formatLargeNumber(player.gold)} G）
              </span>
            </div>

            <p className="text-[11px] text-stone-400 text-center">
              どれだけ金額が大きくなっても（万・億・兆・京...）内部データは1G単位で正確に維持されます。
            </p>

            <button
              onClick={() => setShowGoldDetail(false)}
              className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-semibold transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </>
  );
};
