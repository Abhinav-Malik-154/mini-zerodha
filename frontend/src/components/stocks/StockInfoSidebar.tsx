'use client';

import { Star, ExternalLink } from 'lucide-react';

interface PredictionData {
  symbol: string;
  current_price: number;
  predicted_price: number;
  predicted_change: number;
  horizon_days: number;
  confidence: number;
  recommendation: string;
  technicals?: {
    rsi: number;
    macd: number;
    macd_signal: number;
    volatility_7d: number;
    bb_position: number;
    ma_7: number;
    ma_30: number;
  };
  top_factors?: { feature: string; importance: number }[];
  [key: string]: any;
}

interface HistoryPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Company info mapping
const COMPANY_INFO: Record<string, { name: string; sector: string; industry: string; exchange: string }> = {
  AAPL: { name: 'Apple Inc', sector: 'Technology', industry: 'Consumer Electronics', exchange: 'NASDAQ' },
  MSFT: { name: 'Microsoft Corp', sector: 'Technology', industry: 'Software—Infrastructure', exchange: 'NASDAQ' },
  GOOGL: { name: 'Alphabet Inc', sector: 'Technology', industry: 'Internet Content & Information', exchange: 'NASDAQ' },
  AMZN: { name: 'Amazon.com Inc', sector: 'Consumer Cyclical', industry: 'Internet Retail', exchange: 'NASDAQ' },
  TSLA: { name: 'Tesla Inc', sector: 'Consumer Cyclical', industry: 'Auto Manufacturers', exchange: 'NASDAQ' },
  NVDA: { name: 'NVIDIA Corp', sector: 'Technology', industry: 'Semiconductors', exchange: 'NASDAQ' },
  META: { name: 'Meta Platforms Inc', sector: 'Technology', industry: 'Internet Content & Information', exchange: 'NASDAQ' },
  NFLX: { name: 'Netflix Inc', sector: 'Communication Services', industry: 'Entertainment', exchange: 'NASDAQ' },
};

interface StockInfoProps {
  symbol: string;
  prediction: PredictionData | null;
  history: HistoryPoint[];
  loading: boolean;
}

export default function StockInfoSidebar({ symbol, prediction, history, loading }: StockInfoProps) {
  const info = COMPANY_INFO[symbol] || {
    name: symbol,
    sector: 'Unknown',
    industry: 'Unknown',
    exchange: 'NYSE',
  };

  const currentPrice = prediction?.current_price || (history.length > 0 ? history[history.length - 1].close : 0);
  const prevClose = history.length > 1 ? history[history.length - 2].close : currentPrice;
  const dayChange = currentPrice - prevClose;
  const dayChangePercent = prevClose > 0 ? (dayChange / prevClose) * 100 : 0;

  // Compute day range and 52-week range from history
  const todayData = history.length > 0 ? history[history.length - 1] : null;
  const dayLow = todayData?.low || 0;
  const dayHigh = todayData?.high || 0;

  const allHighs = history.map((h) => h.high);
  const allLows = history.map((h) => h.low);
  const weekHigh52 = allHighs.length > 0 ? Math.max(...allHighs) : 0;
  const weekLow52 = allLows.length > 0 ? Math.min(...allLows) : 0;

  const lastVolume = todayData?.volume || 0;

  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">{symbol}</h3>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <span>{info.name}</span>
            <ExternalLink className="w-3 h-3" />
            <span>· {info.exchange}</span>
          </div>
        </div>
        <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center text-gray-400">
          <Star className="w-4 h-4" />
        </div>
      </div>

      {/* Sector */}
      <p className="text-xs text-gray-500">
        {info.sector} · {info.industry}
      </p>

      {/* Price */}
      {loading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-8 bg-gray-700 rounded w-32" />
          <div className="h-4 bg-gray-700 rounded w-24" />
        </div>
      ) : (
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              {currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-gray-400 align-super">D</span>
            <span className="text-xs text-gray-400">USD</span>
          </div>
          <div className={`text-sm font-medium ${dayChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {dayChange >= 0 ? '+' : ''}
            {dayChange.toFixed(2)} {dayChangePercent >= 0 ? '+' : ''}
            {dayChangePercent.toFixed(2)}%
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs text-green-400">Market open</span>
          </div>
        </div>
      )}

      <div className="border-t border-gray-700/50" />

      {/* Day's range */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">{dayLow.toFixed(2)}</span>
          <span className="text-gray-500 font-medium">DAY&apos;S RANGE</span>
          <span className="text-gray-400">{dayHigh.toFixed(2)}</span>
        </div>
        <div className="relative h-1.5 bg-gray-700 rounded-full">
          <div
            className="absolute h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
            style={{
              left: '0%',
              width: dayHigh > dayLow ? `${((currentPrice - dayLow) / (dayHigh - dayLow)) * 100}%` : '50%',
            }}
          />
        </div>
      </div>

      {/* 52wk range */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">{weekLow52.toFixed(2)}</span>
          <span className="text-gray-500 font-medium">52WK RANGE</span>
          <span className="text-gray-400">{weekHigh52.toFixed(2)}</span>
        </div>
        <div className="relative h-1.5 bg-gray-700 rounded-full">
          <div
            className="absolute h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
            style={{
              left: '0%',
              width:
                weekHigh52 > weekLow52
                  ? `${((currentPrice - weekLow52) / (weekHigh52 - weekLow52)) * 100}%`
                  : '50%',
            }}
          />
        </div>
      </div>

      <div className="border-t border-gray-700/50" />

      {/* Key stats */}
      <div>
        <h4 className="text-sm font-semibold text-white mb-2">Key Stats</h4>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Volume</span>
            <span className="text-white font-medium">
              {(lastVolume / 1e6).toFixed(2)}M
            </span>
          </div>
          {prediction?.technicals && (
            <>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">RSI (14)</span>
                <span className="text-white font-medium">{prediction.technicals.rsi}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">MACD</span>
                <span className="text-white font-medium">{prediction.technicals.macd}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">7d Volatility</span>
                <span className="text-white font-medium">{prediction.technicals.volatility_7d}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">MA(7)</span>
                <span className="text-white font-medium">${prediction.technicals.ma_7}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">MA(30)</span>
                <span className="text-white font-medium">${prediction.technicals.ma_30}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="border-t border-gray-700/50" />

      {/* AI Prediction summary */}
      {prediction && (
        <div>
          <h4 className="text-sm font-semibold text-white mb-2">AI Prediction ({prediction.horizon_days}d)</h4>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Target</span>
              <span className="text-white font-medium">${prediction.predicted_price}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Change</span>
              <span className={`font-medium ${prediction.predicted_change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {prediction.predicted_change >= 0 ? '+' : ''}
                {prediction.predicted_change.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Confidence</span>
              <span className="text-white font-medium">{prediction.confidence}%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Signal</span>
              <span
                className={`font-bold ${
                  prediction.recommendation.toLowerCase().includes('buy')
                    ? 'text-green-400'
                    : prediction.recommendation.toLowerCase().includes('sell')
                    ? 'text-red-400'
                    : 'text-yellow-400'
                }`}
              >
                {prediction.recommendation}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
