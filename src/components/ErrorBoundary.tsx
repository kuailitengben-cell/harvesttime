import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[FarmVerse ErrorBoundary caught an error]:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-screen bg-stone-950 flex flex-col items-center justify-center text-stone-100 p-6 select-none">
          <div className="max-w-md w-full p-6 bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl flex flex-col items-center text-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-100 mb-1 font-['M_PLUS_Rounded_1c']">
                農園の描画で一時的な問題が発生しました
              </h2>
              <p className="text-xs text-stone-400 leading-relaxed">
                画面の再読み込みを行うことで、最新の安全なセーブデータから農場を復帰できます。
              </p>
            </div>
            {this.state.error && (
              <pre className="text-[10px] text-stone-400 font-mono bg-stone-950 p-2.5 rounded-lg max-h-24 overflow-auto w-full text-left border border-stone-800">
                {this.state.error.message || String(this.state.error)}
              </pre>
            )}
            <button
              onClick={() => {
                window.location.reload();
              }}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>農場を再読み込みして復帰</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
