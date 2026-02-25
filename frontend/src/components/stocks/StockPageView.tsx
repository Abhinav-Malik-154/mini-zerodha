'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import MarketTicker from './MarketTicker';
import StockSearch from './StockSearch';
import StockInfoSidebar from './StockInfoSidebar';
import CandlestickStockChart from './CandlestickStockChart';
import TopStocksSidebar from './TopStocksSidebar';
import CompanyProfile from './CompanyProfile';
import AIPredictions from './AIPredictions';
import NewsAndSentiment from './NewsAndSentiment';
import TechnicalIndicators from './TechnicalIndicators';
import AIMarketIntelligence from './AIMarketIntelligence';
import AIDisclaimer from './AIDisclaimer';
import AssetLogo from './AssetLogo';
import { getAsset, getDisplaySymbol } from '@/config/assetData';
import { usePrediction, useHistory, type HistoryPoint, type PredictionResult } from '@/hooks/useMLApi';

/* ── company metadata (from shared config) ─────────── */

/* ── component ──────────────────────────────────────── */

interface StockPageViewProps {
  initialSymbol: string;
}

export default function StockPageView({ initialSymbol }: StockPageViewProps) {
  const router = useRouter();
  const [symbol, setSymbol] = useState(initialSymbol);
  const [historyOverride, setHistoryOverride] = useState<HistoryPoint[] | null>(null);
  const [followed, setFollowed] = useState(false);

  const info = getAsset(symbol);
  const displaySym = getDisplaySymbol(symbol);

  // React Query — cached, deduped, stale-while-revalidate
  const {
    data: prediction = null,
    isLoading: predLoading,
    error: predError,
  } = usePrediction(symbol);

  const {
    data: historyData = [],
    isLoading: histLoading,
  } = useHistory(symbol, '1y');

  const loading = predLoading || histLoading;
  const history = historyOverride ?? historyData;
  const error = predError ? 'Failed to load data. Is the ML backend running on port 8000?' : null;

  const handleSearch = (sym: string) => {
    setHistoryOverride(null);
    setSymbol(sym);
  };

  const handlePeriodChange = (newHistory: HistoryPoint[]) => {
    setHistoryOverride(newHistory);
  };

  const currentPrice =
    prediction?.current_price || (history.length > 0 ? history[history.length - 1].close : 0);

  return (
    <div className="min-h-screen bg-transparent -mx-4 sm:-mx-6 lg:-mx-8 -mt-10">
      {/* Market ticker bar */}
      <MarketTicker currentSymbol={symbol} />

      <div className="flex">
        {/* ── Left sidebar: Top Stocks ── */}
        <aside className="hidden xl:block w-52 shrink-0 border-r border-gray-700/30 p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-80px)] sticky top-20">
          <TopStocksSidebar currentSymbol={symbol} />
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0 p-4 space-y-4">
          {/* Search */}
          <StockSearch currentSymbol={symbol} onSearch={handleSearch} />

          {/* AI Disclaimer */}
          <AIDisclaimer />

          {/* Stock header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AssetLogo symbol={symbol} size={40} />
              <div>
                <h1 className="text-xl font-bold text-white">
                  {info.name}{' '}
                  <span className="text-gray-400 font-normal">({displaySym})</span>
                </h1>
                <p className="text-xs text-gray-500">
                  {info.sector}
                  {info.industry ? ` · ${info.industry}` : ''}
                </p>
              </div>
            </div>
            <button
              onClick={() => setFollowed((f) => !f)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                followed
                  ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
              }`}
            >
              <Star className={`w-4 h-4 ${followed ? 'fill-yellow-400' : ''}`} />
              {followed ? 'Followed' : 'Follow'}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Chart + Sidebar */}
          <div className="flex gap-4">
            {/* Chart */}
            <div className="flex-1 min-w-0">
              {loading && history.length === 0 ? (
                <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl h-[470px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
                    <p className="text-gray-400 text-sm mt-3">Loading chart data...</p>
                  </div>
                </div>
              ) : (
                <CandlestickStockChart
                  symbol={symbol}
                  history={history}
                  prediction={prediction}
                  onPeriodChange={handlePeriodChange}
                />
              )}
            </div>

            {/* Right sidebar */}
            <div className="hidden lg:block w-72 shrink-0">
              <StockInfoSidebar
                symbol={symbol}
                prediction={prediction}
                history={history}
                loading={loading}
              />
            </div>
          </div>

          {/* AI Prediction Card - below chart on mobile/tablet, show on all */}
          <div className="lg:hidden">
            <StockInfoSidebar
              symbol={symbol}
              prediction={prediction}
              history={history}
              loading={loading}
            />
          </div>

          {/* Top factors */}
          {prediction?.top_factors && prediction.top_factors.length > 0 && (
            <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Top Contributing Factors</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {prediction.top_factors.map((f, i) => (
                  <div key={i} className="bg-gray-700/30 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-400 truncate">{f.feature.replace(/_/g, ' ')}</p>
                    <p className="text-sm font-semibold text-white mt-1">{f.importance}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Company Profile | AI Predictions | News & Sentiment ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <CompanyProfile symbol={symbol} />
            <AIPredictions symbol={symbol} />
            <NewsAndSentiment symbol={symbol} />
          </div>

          {/* ── Advanced Technical & AI Analysis ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TechnicalIndicators
              symbol={symbol}
              technicals={prediction?.technicals || null}
              recommendation={prediction?.recommendation || 'HOLD'}
            />
            <AIMarketIntelligence symbol={symbol} />
          </div>
        </main>
      </div>
    </div>
  );
}
