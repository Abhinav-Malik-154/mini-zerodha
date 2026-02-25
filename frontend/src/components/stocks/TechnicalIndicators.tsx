'use client';

import { Activity, RefreshCw } from 'lucide-react';

interface TechnicalData {
  rsi: number;
  macd: number;
  macd_signal: number;
  volatility_7d: number;
  bb_position: number;
  ma_7: number;
  ma_30: number;
}

interface Props {
  symbol: string;
  technicals: TechnicalData | null;
  recommendation: string;
}

export default function TechnicalIndicators({ symbol, technicals, recommendation }: Props) {
  if (!technicals) return null;

  const signalText = recommendation?.toLowerCase().includes('buy')
    ? 'Strong Buy'
    : recommendation?.toLowerCase().includes('sell')
    ? 'Strong Sell'
    : 'Neutral';

  const signalColor = recommendation?.toLowerCase().includes('buy')
    ? 'text-green-400'
    : recommendation?.toLowerCase().includes('sell')
    ? 'text-red-400'
    : 'text-yellow-400';

  // RSI interpretation
  const rsiSignal =
    technicals.rsi > 70
      ? { label: 'Overbought', color: 'text-red-400' }
      : technicals.rsi < 30
      ? { label: 'Oversold', color: 'text-green-400' }
      : { label: 'Neutral', color: 'text-yellow-400' };

  // MACD interpretation
  const macdSignal =
    technicals.macd > technicals.macd_signal
      ? { label: 'Bullish', color: 'text-green-400' }
      : { label: 'Bearish', color: 'text-red-400' };

  // BB position interpretation
  const bbSignal =
    technicals.bb_position > 0.8
      ? { label: 'Overbought', color: 'text-red-400' }
      : technicals.bb_position < 0.2
      ? { label: 'Oversold', color: 'text-green-400' }
      : { label: 'Neutral', color: 'text-yellow-400' };

  const indicators = [
    {
      name: 'RSI (14)',
      value: technicals.rsi.toFixed(1),
      signal: rsiSignal.label,
      signalColor: rsiSignal.color,
      bar: technicals.rsi,
      barMax: 100,
    },
    {
      name: 'MACD',
      value: technicals.macd.toFixed(4),
      signal: macdSignal.label,
      signalColor: macdSignal.color,
      bar: 50 + (technicals.macd > 0 ? 25 : -25),
      barMax: 100,
    },
    {
      name: 'Bollinger Position',
      value: (technicals.bb_position * 100).toFixed(1) + '%',
      signal: bbSignal.label,
      signalColor: bbSignal.color,
      bar: technicals.bb_position * 100,
      barMax: 100,
    },
    {
      name: 'Volatility (7d)',
      value: technicals.volatility_7d.toFixed(2) + '%',
      signal: technicals.volatility_7d > 3 ? 'High' : technicals.volatility_7d > 1.5 ? 'Medium' : 'Low',
      signalColor:
        technicals.volatility_7d > 3
          ? 'text-red-400'
          : technicals.volatility_7d > 1.5
          ? 'text-yellow-400'
          : 'text-green-400',
      bar: Math.min(technicals.volatility_7d * 10, 100),
      barMax: 100,
    },
  ];

  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-400" />
          <h3 className="text-base font-semibold text-white">Technical Indicators</h3>
          <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/40 rounded text-[10px] font-medium text-purple-400">
            Pipeline
          </span>
        </div>
        <RefreshCw className="w-4 h-4 text-gray-500 cursor-pointer hover:text-gray-300 transition-colors" />
      </div>

      {/* Overall signal */}
      <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">🎯 OVERALL SIGNAL</span>
        </div>
        <span className={`text-sm font-bold ${signalColor}`}>{signalText}</span>
      </div>

      <p className="text-xs text-gray-500 mb-4">
        Multiple indicators {signalText.toLowerCase().includes('buy') ? 'confirm bullish' : signalText.toLowerCase().includes('sell') ? 'confirm bearish' : 'show mixed'} trend
      </p>

      {/* Indicator rows */}
      <div className="space-y-3">
        {indicators.map((ind) => (
          <div key={ind.name}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400 flex items-center gap-1.5">
                <span className="text-gray-600">📊</span>
                {ind.name}
              </span>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium ${ind.signalColor}`}>{ind.signal}</span>
                <span className="text-xs font-semibold text-white w-14 text-right">{ind.value}</span>
              </div>
            </div>
            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(Math.max(ind.bar, 2), 100)}%`,
                  background:
                    ind.bar > 70
                      ? 'linear-gradient(90deg, #10B981, #F59E0B, #EF4444)'
                      : ind.bar > 30
                      ? 'linear-gradient(90deg, #10B981, #F59E0B)'
                      : '#10B981',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* MAs */}
      <div className="mt-4 pt-3 border-t border-gray-700/50 grid grid-cols-2 gap-3">
        <div className="bg-gray-700/30 rounded-lg p-2.5 text-center">
          <p className="text-[10px] text-gray-500 uppercase">MA(7)</p>
          <p className="text-sm font-semibold text-white">${technicals.ma_7.toFixed(2)}</p>
        </div>
        <div className="bg-gray-700/30 rounded-lg p-2.5 text-center">
          <p className="text-[10px] text-gray-500 uppercase">MA(30)</p>
          <p className="text-sm font-semibold text-white">${technicals.ma_30.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
