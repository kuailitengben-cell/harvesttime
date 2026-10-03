import React from 'react';
import { HelpCircle, X, Sprout, TrendingUp, Gavel, Droplet, BoxSelect } from 'lucide-react';
import { sound } from '../services/audio';

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="w-full max-w-3xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-stone-100">
        <div className="px-5 py-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-100 font-['M_PLUS_Rounded_1c']">FarmVerse 遊び方＆経済手引書</h2>
              <p className="text-xs text-stone-400">
                単なる作業ではなく、プレイヤー全体で動かす本格農業経済シミュレーション
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

        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4 text-xs leading-relaxed text-stone-300">
          {/* Section 1 */}
          <div className="p-3.5 bg-stone-950/70 border border-stone-800 rounded-xl flex flex-col gap-2">
            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <BoxSelect className="w-4 h-4 text-amber-400" />
              1. 基本操作と「一括操作」システム
            </h3>
            <p>
              ・<strong>マップ移動</strong>: 画面をドラッグ（またはスワイプ）して農場全体を自由にスクロールできます。<br />
              ・<strong>拡大・縮小</strong>: マウスホイール、ピンチイン/アウト、または右上のズームボタンで視点を変更できます。<br />
              ・<strong>範囲選択（一括操作）</strong>: 右上の選択切り替えボタンを押すかShiftキーを押しながらドラッグすると、複数マスを一気に囲んで選択できます。下部に現れる<strong>一括水やり・一括収穫・一括植え付け・一括除草</strong>ボタンで、大量の畑もワンタップで快適に管理可能です。
            </p>
          </div>

          {/* Section 2 */}
          <div className="p-3.5 bg-stone-950/70 border border-stone-800 rounded-xl flex flex-col gap-2">
            <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
              <Sprout className="w-4 h-4 text-emerald-400" />
              2. 作物の成長と腐敗・リサイクル
            </h3>
            <p>
              作物は<strong>種 → 発芽 → 成長中 → 収穫可能 → 過熟 → 腐敗</strong>の順に変化します。水分が不足すると成長が遅くなり、放置しすぎると腐敗してハエが発生します。<br />
              しかし腐敗した作物も無駄にはなりません！撤去すると「<strong>腐敗有機堆肥</strong>」を獲得でき、肥料工場で高級肥料のクラフト原料として再利用可能です。抜いた雑草も同様にリサイクルできます。
            </p>
          </div>

          {/* Section 3 */}
          <div className="p-3.5 bg-stone-950/70 border border-stone-800 rounded-xl flex flex-col gap-2">
            <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              3. 世界市場（リアルタイム相場変動）
            </h3>
            <p>
              作物の売却価格は固定ではありません。全プレイヤーの出荷量や、上部に表示される<strong>グローバル気象イベント（長雨・サラダブーム・穀物不足など）</strong>によって相場が刻々と変動します。安い時期は倉庫にストックするか加工品に回し、高騰したタイミングを見計らって一気に売却しましょう！
            </p>
          </div>

          {/* Section 4 */}
          <div className="p-3.5 bg-stone-950/70 border border-stone-800 rounded-xl flex flex-col gap-2">
            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <Gavel className="w-4 h-4 text-amber-400" />
              4. プレイヤーオークションと生産チェーン
            </h3>
            <p>
              プレイヤー同士で自由にアイテムを売買できる競売所です。小麦農家が大量出荷した小麦を買い取り、工房で小麦粉に加工してレストランへ売るなど、プレイヤー同士の役割分担によって巨大な農業サプライチェーンが形成されます。
            </p>
          </div>

          {/* Section 5 */}
          <div className="p-3.5 bg-stone-950/70 border border-stone-800 rounded-xl flex flex-col gap-2">
            <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
              <span>⚙️</span>
              5. 1マス自動化設備システム（4辺フルオート）
            </h3>
            <p>
              耕作地マスをタップして「自動化設備」タブを開くと、1マスを囲む4辺に専用機械を配置できます。<br />
              ・<strong>北（上）：自動種植え機</strong> — 空き地になった時、指定の種を安全に1個消費して自動播種。作物がすでにある時は絶対に多重消費しません。<br />
              ・<strong>西（左）：自動肥料機</strong> — 種まき直後に指定の有機・速効・高級肥料を1回のみ自動散布。重複消費防止ロック付き。<br />
              ・<strong>東（右）：自動水やり機</strong> — 土壌水分が指定閾値（60%〜90%）を下回ると、自動で100%まで給水。<br />
              ・<strong>南（下）：自動収穫機</strong> — 作物が完熟した瞬間、自動で収穫して倉庫へ保管し、区画を即座に空き地へリセット。<br />
              💡 <strong>4機すべて設置すると完全自立型ループが成立！</strong> 播種→施肥→散水→収穫→再播種が永遠に自動で回る最先端ファームが完成します。
            </p>
          </div>

          {/* Section 6 */}
          <div className="p-3.5 bg-stone-950/70 border border-stone-800 rounded-xl flex flex-col gap-2">
            <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
              <span>🗺️</span>
              6. 超広大マップと特殊土地
            </h3>
            <p>
              農場は無限に広がる広大な大自然に囲まれています。マップをスワイプすると、外縁部に様々な特性を持つ土地が見つかります。<br />
              ・<strong>清流・湧水源（⛲）</strong>: 常時水分100%を自動維持。米やスイカの収穫量+25%。<br />
              ・<strong>肥沃な黒土（✨）</strong>: 成長速度+25%、極上・黄金品質の発生率が大幅UP。<br />
              ・<strong>天然鉱床・レア鉱床（🪨・💎）</strong>: 作物収穫時に貴重な「農園鉱石粉末」を採掘可能。<br />
              ・<strong>原生林・古樹土壌（🌲）</strong>: 肥料素材やオーガニック資源の宝庫。<br />
              遠くの土地ほど購入費用は上がりますが、独自の恩恵を受けられます。
            </p>
          </div>

          {/* Section 7 */}
          <div className="p-3.5 bg-stone-950/70 border border-stone-800 rounded-xl flex flex-col gap-2">
            <h3 className="text-sm font-bold text-purple-300 flex items-center gap-2">
              <span>🪙</span>
              7. 日本語巨大数値表示
            </h3>
            <p>
              農園の売上や収穫数が莫大な規模に成長しても、画面が崩れないよう「万・億・兆・京・垓...」の日本語単位でスマートに短縮表示されます。<br />
              上部の所持金カウンターをタップすると、1桁単位まで完全な正確な金額モーダルを確認できます。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
