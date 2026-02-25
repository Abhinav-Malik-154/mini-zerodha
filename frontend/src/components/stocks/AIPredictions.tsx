'use client';

import { Brain, TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';
import { usePredictMulti } from '@/hooks/useMLApi';

interface HorizonPrediction {
  current_price: number;
  predicted_price: number;
  predicted_change: number;
  horizon_days: number;
  confidence: number;
  recommendation: string;
}

interface MultiPrediction {
  '1d': HorizonPrediction;
  '7d': HorizonPrediction;
  '30d': HorizonPrediction;
}

export default function AIPredictions({ symbol }: { symbol: string }) {
  const { data: predictions = null, isLoading: loading } = usePredictMulti(symbol);

  const horizons = [
    { key: '1d' as const, label: 'Next Day', sublabel: '1 Day' },
    { key: '7d' as const, label: '1 Week', sublabel: '7 Days' },
    { key: '30d' as const, label: '1 Month', sublabel: '30 Days' },
  ];

  const getChangeColor = (change: number) =>
    change >= 0 ? 'text-green-400' : 'text-red-400';

  const getChangeBg = (change: number) =>
    change >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20';

  const getIcon = (change: number) => {
    if (change > 0.5) return <TrendingUp className="w-3 h-3" />;
    if (change < -0.5) return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-purple-400" />
        <h3 className="text-base font-semibold text-white">AI Predictions</h3>
        <span className="ml-auto flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/40 rounded text-[10px] font-medium text-emerald-400">
          <Sparkles className="w-3 h-3" />
          Real Data
        </span>
        <span className="text-xs text-gray-500">(alpha vs SPY)</span>
      </div>

      {/* Prediction cards */}
      <div className="space-y-3">
        {loading
          ? horizons.map((h) => (
              <div key={h.key} className="bg-gray-700/30 rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-20 mb-2" />
                <div className="h-6 bg-gray-700 rounded w-32" />
              </div>
            ))
          : horizons.map((h) => {
              const pred = predictions?.[h.key];
              if (!pred) return null;
              return (
                <div
                  key={h.key}
                  className={`rounded-lg p-4 border ${getChangeBg(pred.predicted_change)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-semibold ${getChangeColor(pred.predicted_change)}`}>
                      {h.label}
                    </span>
                    <span className="text-xs text-gray-500">{h.sublabel}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-white">
                      ${pred.predicted_price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span
                      className={`flex items-center gap-1 text-sm font-medium ${getChangeColor(
                        pred.predicted_change
                      )}`}
                    >
                      {getIcon(pred.predicted_change)}
                      {pred.predicted_change >= 0 ? '+' : ''}
                      {pred.predicted_change.toFixed(2)}%
                    </span>
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}
