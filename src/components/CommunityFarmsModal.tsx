import React from 'react';
import { Users, Heart, Award, X, Sparkles, Eye } from 'lucide-react';
import { OtherFarmProfile } from '../types/game';
import { sound } from '../services/audio';

interface CommunityFarmsModalProps {
  farms: OtherFarmProfile[];
  onClose: () => void;
  onSendKudos: (farmId: string) => void;
  onVisitFarm: (farm: OtherFarmProfile) => void;
}

export const CommunityFarmsModal: React.FC<CommunityFarmsModalProps> = ({
  farms,
  onClose,
  onSendKudos,
  onVisitFarm,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="w-full max-w-4xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-stone-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-100 font-['M_PLUS_Rounded_1c']">
                近隣農家・プレイヤー農園ネットワーク
              </h2>
              <p className="text-xs text-stone-400">
                他農家の広大なワールドを訪問・見学し、経営方針を参考にできます（閲覧専用）
              </p>
            </div>
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

        {/* Farm Cards */}
        <div className="p-5 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          {farms.map((farm) => (
            <div
              key={farm.id}
              className="p-4 bg-stone-950/70 border border-stone-800 rounded-xl flex flex-col justify-between gap-3 hover:border-stone-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-950/60 border border-amber-600/40 flex items-center justify-center text-xl font-bold text-amber-300">
                    {farm.ownerName.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-stone-100">{farm.name}</span>
                    <span className="text-xs text-amber-400 font-medium flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" />
                      {farm.title} · Lv.{farm.level}
                    </span>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <span className="text-stone-400 block text-[10px]">農園規模</span>
                  <span className="font-mono font-bold text-stone-200">{farm.activePlotsCount} 区画</span>
                </div>
              </div>

              <div className="p-2.5 bg-stone-900/80 rounded-lg text-xs text-stone-300 flex flex-col gap-1">
                <span className="text-[10px] text-stone-500 font-semibold uppercase tracking-wider">
                  専門生産・ロールプレイ
                </span>
                <p className="text-stone-300 leading-relaxed">{farm.specialty}</p>
              </div>

              {/* Action Buttons: Visit World & Kudos */}
              <div className="pt-2 border-t border-stone-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    sound.playClick();
                    onVisitFarm(farm);
                  }}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>農場を見学する</span>
                </button>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-xs text-stone-400 font-mono">
                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                    <span>{farm.kudosCount}</span>
                  </div>

                  <button
                    onClick={() => {
                      sound.playCoin();
                      onSendKudos(farm.id);
                    }}
                    disabled={farm.hasGivenKudos}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                      !farm.hasGivenKudos
                        ? 'bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-200 active:scale-95'
                        : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{farm.hasGivenKudos ? '応援済' : '応援 (+35 G)'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
