'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import AssetLogo from './AssetLogo';
import { POPULAR_STOCKS, POPULAR_CRYPTO, getDisplaySymbol, getAsset } from '@/config/assetData';
import { usePrefetchSymbol } from '@/hooks/useMLApi';

interface StockSearchProps {
  currentSymbol: string;
  onSearch: (symbol: string) => void;
}

export default function StockSearch({ currentSymbol, onSearch }: StockSearchProps) {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'stocks' | 'crypto'>('stocks');
  const router = useRouter();
  const prefetch = usePrefetchSymbol();

  const handleSearch = () => {
    const sym = query.trim().toUpperCase();
    if (sym) {
      onSearch(sym);
      router.push(`/stocks/${encodeURIComponent(sym)}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleQuickPick = (sym: string) => {
    onSearch(sym);
    router.push(`/stocks/${encodeURIComponent(sym)}`);
  };

  const quickList = tab === 'stocks' ? POPULAR_STOCKS : POPULAR_CRYPTO;

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            placeholder={
              tab === 'stocks'
                ? 'Enter stock symbol (e.g. AAPL, MSFT, TSLA)'
                : 'Enter crypto (e.g. BTC-USD, ETH-USD)'
            }
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800/80 border border-gray-600/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition-colors"
        >
          Search
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4">
        <div className="flex bg-gray-800/60 rounded-lg p-0.5">
          <button
            onClick={() => setTab('stocks')}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
              tab === 'stocks'
                ? 'bg-emerald-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Stocks
          </button>
          <button
            onClick={() => setTab('crypto')}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
              tab === 'crypto'
                ? 'bg-emerald-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Crypto
          </button>
        </div>
      </div>

      {/* Quick picks */}
      <div className="flex flex-wrap gap-2">
        {quickList.map((sym) => {
          const display = getDisplaySymbol(sym);
          return (
            <button
              key={sym}
              onClick={() => handleQuickPick(sym)}
              onMouseEnter={() => prefetch(sym)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                currentSymbol === sym
                  ? 'bg-emerald-600 text-white ring-1 ring-emerald-400'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
              }`}
            >
              <AssetLogo symbol={sym} size={18} />
              <span>{display}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
