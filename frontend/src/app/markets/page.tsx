'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Star, Search,
  Filter, ChevronDown, Info,
  BarChart2, Activity, Globe, Award,
  Zap, Sparkles, RefreshCw, AlertCircle
} from 'lucide-react';
import { useRealTimeData } from '@/hooks/useRealTimeData';
import VerificationBadge from '@/components/ui/VerificationBadge';

interface MarketAsset {
  id: string;
  rank: number;
  symbol: string;
  name: string;
  icon: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  marketCap: number;
  circulatingSupply: number;
  favorite: boolean;
  sparkline: number[];
}

export default function MarketsPage() {
  const { prices, orderBooks, recentTrades, isConnected } = useRealTimeData();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'gainers' | 'losers' | 'favorites'>('all');
  const [sortBy, setSortBy] = useState<'rank' | 'price' | 'change' | 'volume' | 'cap'>('rank');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<MarketAsset | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('favorites');
      return saved ? JSON.parse(saved) : ['BTC', 'ETH', 'SOL'];
    }
    return ['BTC', 'ETH', 'SOL'];
  });

  // Generate market data from real-time prices
  const [markets, setMarkets] = useState<MarketAsset[]>([]);

  useEffect(() => {
    // Base market data with icons and names
    const baseMarkets = [
      { id: 'bitcoin', rank: 1, symbol: 'BTC', name: 'Bitcoin', icon: '₿', circulatingSupply: 19.2e6 },
      { id: 'ethereum', rank: 2, symbol: 'ETH', name: 'Ethereum', icon: 'Ξ', circulatingSupply: 120.1e6 },
      { id: 'solana', rank: 3, symbol: 'SOL', name: 'Solana', icon: '◎', circulatingSupply: 410.1e6 },
      { id: 'binancecoin', rank: 4, symbol: 'BNB', name: 'BNB', icon: '₿', circulatingSupply: 155.1e6 },
      { id: 'ripple', rank: 5, symbol: 'XRP', name: 'XRP', icon: '✕', circulatingSupply: 53.8e9 },
      { id: 'cardano', rank: 6, symbol: 'ADA', name: 'Cardano', icon: '₳', circulatingSupply: 34.6e9 },
      { id: 'polkadot', rank: 7, symbol: 'DOT', name: 'Polkadot', icon: '●', circulatingSupply: 1.14e9 },
      { id: 'avalanche', rank: 8, symbol: 'AVAX', name: 'Avalanche', icon: '▲', circulatingSupply: 338e6 },
    ];

    // Update with real-time prices
    const updatedMarkets = baseMarkets.map(market => {
      const priceData = prices[`${market.symbol}/USD`];
      const price = priceData?.price || (market.symbol === 'BTC' ? 51234.56 : 
                                        market.symbol === 'ETH' ? 3123.45 :
                                        market.symbol === 'SOL' ? 102.34 : 
                                        market.symbol === 'BNB' ? 412.56 :
                                        market.symbol === 'XRP' ? 0.78 :
                                        market.symbol === 'ADA' ? 0.52 :
                                        market.symbol === 'DOT' ? 7.89 : 38.45);
      
      const changePercent = priceData?.change24h || (market.symbol === 'BTC' ? 2.34 :
                                                     market.symbol === 'ETH' ? -1.23 :
                                                     market.symbol === 'SOL' ? 5.67 :
                                                     market.symbol === 'BNB' ? 0.45 :
                                                     market.symbol === 'XRP' ? -0.32 :
                                                     market.symbol === 'ADA' ? 1.23 :
                                                     market.symbol === 'DOT' ? -2.34 : 3.45);
      
      const volume = priceData?.volume || Math.floor(Math.random() * 10000) + 1000;
      const marketCap = price * market.circulatingSupply;
      
      // Generate sparkline based on recent trades
      const sparkline = Array.from({ length: 8 }, (_, i) => 
        price * (1 + (Math.sin(i / 2) * 0.02) + (Math.random() * 0.01 - 0.005))
      );

      return {
        ...market,
        price,
        change24h: price * (changePercent / 100),
        changePercent24h: changePercent,
        volume24h: volume * 1e6,
        marketCap,
        favorite: favorites.includes(market.symbol),
        sparkline,
      };
    });

    setMarkets(updatedMarkets);
  }, [prices, favorites]);

  const toggleFavorite = (symbol: string) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(symbol)
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol];
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
      return newFavorites;
    });
  };

  const filteredMarkets = markets
    .filter(m => {
      if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !m.symbol.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      switch(filterType) {
        case 'gainers':
          return m.changePercent24h > 0;
        case 'losers':
          return m.changePercent24h < 0;
        case 'favorites':
          return m.favorite;
        default:
          return true;
      }
    })
    .sort((a, b) => {
      let comparison = 0;
      switch(sortBy) {
        case 'rank':
          comparison = a.rank - b.rank;
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'change':
          comparison = a.changePercent24h - b.changePercent24h;
          break;
        case 'volume':
          comparison = a.volume24h - b.volume24h;
          break;
        case 'cap':
          comparison = a.marketCap - b.marketCap;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const totalMarketCap = markets.reduce((sum, m) => sum + m.marketCap, 0);
  const totalVolume = markets.reduce((sum, m) => sum + m.volume24h, 0);
  const btcDominance = (markets.find(m => m.symbol === 'BTC')?.marketCap || 0) / totalMarketCap * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Connection Status */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Market Overview
            </h1>
            <p className="text-slate-400 mt-1 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              {filteredMarkets.length} assets tracked • Real-time data
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
              isConnected ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className={`text-sm ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                {isConnected ? 'Live' : 'Connecting'}
              </span>
            </div>
            <button className="p-2 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
              <RefreshCw className={`w-5 h-5 text-slate-400 ${!isConnected ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Market Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {[
            { label: 'Market Cap', value: `$${(totalMarketCap / 1e12).toFixed(2)}T`, change: '+2.3%', icon: Globe },
            { label: '24h Volume', value: `$${(totalVolume / 1e9).toFixed(2)}B`, change: '+5.7%', icon: Activity },
            { label: 'BTC Dominance', value: `${btcDominance.toFixed(1)}%`, change: '-0.5%', icon: Award },
            { label: 'Active Assets', value: markets.length.toString(), change: '+8', icon: BarChart2 },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10 hover:border-blue-500/50 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-xl font-bold text-white mt-1">{stat.value}</p>
                  <p className="text-xs text-green-400 mt-1">{stat.change}</p>
                </div>
                <stat.icon className="w-5 h-5 text-slate-400" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mt-8">
          <div className="flex-1 relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
            <input
              type="text"
              placeholder="Search by name or symbol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2 group"
            >
              <Filter className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" />
              <span className="hidden sm:inline">Filters</span>
            </button>

            <div className="flex gap-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-1">
              {(['all', 'gainers', 'losers', 'favorites'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                    filterType === type
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Markets Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-6 py-4 text-left">
                    <button
                      onClick={() => {
                        setSortBy('rank');
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      }}
                      className="flex items-center gap-1 text-xs font-medium text-slate-400 uppercase tracking-wider hover:text-white"
                    >
                      # {sortBy === 'rank' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <button
                      onClick={() => {
                        setSortBy('volume');
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      }}
                      className="flex items-center gap-1 text-xs font-medium text-slate-400 uppercase tracking-wider hover:text-white"
                    >
                      Asset {sortBy === 'volume' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        setSortBy('price');
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      }}
                      className="flex items-center gap-1 text-xs font-medium text-slate-400 uppercase tracking-wider hover:text-white ml-auto"
                    >
                      Price {sortBy === 'price' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        setSortBy('change');
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      }}
                      className="flex items-center gap-1 text-xs font-medium text-slate-400 uppercase tracking-wider hover:text-white ml-auto"
                    >
                      24h Change {sortBy === 'change' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        setSortBy('volume');
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      }}
                      className="flex items-center gap-1 text-xs font-medium text-slate-400 uppercase tracking-wider hover:text-white ml-auto"
                    >
                      Volume {sortBy === 'volume' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        setSortBy('cap');
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      }}
                      className="flex items-center gap-1 text-xs font-medium text-slate-400 uppercase tracking-wider hover:text-white ml-auto"
                    >
                      Market Cap {sortBy === 'cap' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-right">Last 7d</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredMarkets.map((market, idx) => (
                  <motion.tr
                    key={market.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="group hover:bg-white/5 cursor-pointer transition-colors"
                    onClick={() => setSelectedAsset(market)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-400">{market.rank}</span>
                        <button onClick={(e) => { e.stopPropagation(); toggleFavorite(market.symbol); }}>
                          {market.favorite ? (
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          ) : (
                            <Star className="w-4 h-4 text-slate-400 hover:text-yellow-400" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white shadow-lg">
                          {market.icon}
                        </div>
                        <div>
                          <p className="text-white font-semibold">{market.symbol}</p>
                          <p className="text-xs text-slate-400">{market.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-white font-mono">${market.price.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm ${
                        market.changePercent24h >= 0 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {market.changePercent24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {market.changePercent24h >= 0 ? '+' : ''}{market.changePercent24h.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-white font-mono">
                      ${(market.volume24h / 1e9).toFixed(2)}B
                    </td>
                    <td className="px-6 py-4 text-right text-white font-mono">
                      ${(market.marketCap / 1e9).toFixed(2)}B
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        {market.sparkline.map((price, i) => (
                          <div
                            key={i}
                            className="w-1.5 h-8 rounded-full bg-gradient-to-t transition-all duration-300 group-hover:scale-y-110"
                            style={{ 
                              height: `${(price / Math.max(...market.sparkline)) * 32}px`,
                              backgroundColor: market.changePercent24h >= 0 ? '#10B981' : '#EF4444'
                            }}
                          />
                        ))}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredMarkets.length === 0 && (
            <div className="py-12 text-center">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-400">No markets found matching your criteria</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Asset Details Modal */}
      <AnimatePresence>
        {selectedAsset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50"
            onClick={() => setSelectedAsset(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 rounded-3xl p-8 max-w-2xl w-full mx-4 border border-white/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xl font-bold text-white">
                    {selectedAsset.icon}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedAsset.name}</h2>
                    <p className="text-sm text-slate-400">{selectedAsset.symbol}/USD</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAsset(null)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Price</p>
                  <p className="text-2xl font-bold text-white">${selectedAsset.price.toLocaleString()}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">24h Change</p>
                  <p className={`text-2xl font-bold ${selectedAsset.changePercent24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {selectedAsset.changePercent24h >= 0 ? '+' : ''}{selectedAsset.changePercent24h.toFixed(2)}%
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Volume (24h)</p>
                  <p className="text-lg font-bold text-white">${(selectedAsset.volume24h / 1e9).toFixed(2)}B</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Market Cap</p>
                  <p className="text-lg font-bold text-white">${(selectedAsset.marketCap / 1e9).toFixed(2)}B</p>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-3">Recent Trades</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {recentTrades
                    .filter(t => t.symbol === `${selectedAsset.symbol}/USD`)
                    .slice(0, 5)
                    .map((trade, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                        <span className={`text-sm ${trade.side === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                          {trade.side}
                        </span>
                        <span className="text-sm text-white">{trade.amount} @ ${trade.price.toLocaleString()}</span>
                        <span className="text-xs text-slate-400">{new Date(trade.time).toLocaleTimeString()}</span>
                      </div>
                    ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}