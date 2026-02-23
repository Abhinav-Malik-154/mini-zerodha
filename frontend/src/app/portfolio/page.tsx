'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Wallet, PieChart,
  ArrowUpRight, ArrowDownRight, Eye, EyeOff,
  Calendar, Clock, RefreshCw, AlertCircle,
  DollarSign, Globe, BarChart3, Download,
  ChevronDown, ChevronRight, Star, Copy
} from 'lucide-react';
import { useRealTimeData } from '@/hooks/useRealTimeData';
import { useAuth } from '@/context/AuthProvider';
import { useWallet } from '@/context/WalletProvider';
import VerificationBadge from '@/components/ui/VerificationBadge';

interface Holding {
  id: string;
  symbol: string;
  name: string;
  icon: string;
  balance: number;
  avgBuyPrice: number;
  currentPrice: number;
  value: number;
  pnl: number;
  pnlPercentage: number;
  allocation: number;
}

interface Transaction {
  id: string;
  type: 'BUY' | 'SELL';
  symbol: string;
  amount: number;
  price: number;
  value: number;
  timestamp: string;
  status: 'completed' | 'pending';
  txHash: string;
}

export default function PortfolioPage() {
  const { prices, isConnected } = useRealTimeData();
  // Safe access to localStorage
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAddress(localStorage.getItem('user_address'));
    }
  }, []);

  const { user } = useAuth();
  const { refreshBalance } = useWallet();
  const [hideBalances, setHideBalances] = useState(false);
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL'>('1M');
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Function to process trades into holdings
  const processHoldings = useCallback((trades: Transaction[]) => {
    const assets: Record<string, { balance: number; costBasis: number }> = {};
    
    // Sort oldest first for correct cost basis calculation
    const sortedTrades = [...trades].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    sortedTrades.forEach(trade => {
      const sym = trade.symbol;
      if (!assets[sym]) assets[sym] = { balance: 0, costBasis: 0 };
      
      const current = assets[sym];
      
      if (trade.type === 'BUY') {
        const totalCost = (current.balance * current.costBasis) + (trade.amount * trade.price);
        const totalAmount = current.balance + trade.amount;
        if (totalAmount > 0) {
            current.costBasis = totalCost / totalAmount;
        }
        current.balance = totalAmount;
      } else if (trade.type === 'SELL') {
        current.balance = Math.max(0, current.balance - trade.amount);
        // Cost basis per unit doesn't change on sell
      }
    });

    // Convert to Holding objects
    const newHoldings: Holding[] = Object.entries(assets)
      .filter(([_, data]) => data.balance > 0)
      .map(([symbol, data]) => {
        const priceData = prices[`${symbol}/USD`];
        const currentPrice = priceData?.price || 0;
        const value = data.balance * currentPrice;
        const pnl = value - (data.balance * data.costBasis);
        const pnlPercentage = data.costBasis > 0 ? (pnl / (data.balance * data.costBasis)) * 100 : 0;
        
        let name = symbol;
        let icon = '🪙';
        if (symbol === 'BTC') { name = 'Bitcoin'; icon = '₿'; }
        if (symbol === 'ETH') { name = 'Ethereum'; icon = 'Ξ'; }
        if (symbol === 'SOL') { name = 'Solana'; icon = '◎'; }

        return {
          id: symbol.toLowerCase(),
          symbol,
          name,
          icon,
          balance: data.balance,
          avgBuyPrice: data.costBasis,
          currentPrice,
          value,
          pnl,
          pnlPercentage,
          allocation: 0 // Will calculate later
        };
      });

    // Calculate allocation percentage
    const totalPortfolioValue = newHoldings.reduce((sum, h) => sum + h.value, 0);
    newHoldings.forEach(h => {
        h.allocation = totalPortfolioValue > 0 
           ? parseFloat(((h.value / totalPortfolioValue) * 100).toFixed(2)) 
           : 0;
    });

    return newHoldings;
  }, [prices]);

  const fetchTrades = useCallback(async () => {
    const targetAddress = user?.walletAddress || address;
    
    if (!targetAddress) {
        setHoldings([]);
        setTransactions([]);
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_BASE}/api/trades/wallet/${targetAddress}`);
      if (!res.ok) throw new Error('Failed to fetch trades');
      
      const data = await res.json();
      if (data.success) {
          // API returns { data: { trades: [...], pagination: {...} } }
          const rawTrades = Array.isArray(data.data) ? data.data : (data.data?.trades || []);

          const apiTrades: Transaction[] = rawTrades.map((t: any) => ({
              id: t._id,
              type: t.side,
              symbol: t.symbol.split('/')[0], // "BTC/USD" -> "BTC"
              amount: t.quantity,
              price: t.price,
              value: t.quantity * t.price,
              timestamp: t.verifiedAt || t.createdAt,
              status: 'completed' as const,
              txHash: t.transactionHash
          }));
          
          // Sort by newest first for display
          setTransactions(apiTrades.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
          
          // Generate holdings from trade history
          const calculatedHoldings = processHoldings(apiTrades);
          setHoldings(calculatedHoldings);
      }
    } catch (err) {
      console.error('Error fetching portfolio:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.walletAddress, address, processHoldings]);

  // Fetch real trades from API
  useEffect(() => {
    fetchTrades();
    // Listen for new trades
    const updateHandler = () => fetchTrades();
    window.addEventListener('portfolio_updated', updateHandler);
    return () => window.removeEventListener('portfolio_updated', updateHandler);
  }, [fetchTrades]);

  const handleManualRefresh = () => {
    fetchTrades();
    refreshBalance();
  };




  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
  const totalCost = holdings.reduce((sum, h) => sum + (h.balance * h.avgBuyPrice), 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPercentage = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  const chartData = [40, 65, 45, 70, 55, 80, 65, 90, 75, 85, 70, 95];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Portfolio Overview
            </h1>
            <p className="text-slate-400 mt-1 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Last updated {new Date().toLocaleTimeString()}
              {isConnected && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse ml-2" />}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setHideBalances(!hideBalances)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
            >
              {hideBalances ? 
                <EyeOff className="w-5 h-5 text-slate-400 group-hover:text-white" /> : 
                <Eye className="w-5 h-5 text-slate-400 group-hover:text-white" />
              }
            </button>
            <button 
              onClick={handleManualRefresh}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
              title="Refresh Portfolio"
            >
              <RefreshCw className={`w-5 h-5 text-slate-400 group-hover:text-white ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Portfolio Value Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Total Value Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Total Portfolio Value</p>
                <div className="mt-2 flex items-baseline gap-3">
                  <span className="text-4xl lg:text-5xl font-bold text-white">
                    {hideBalances ? '••••••' : `$${totalValue.toLocaleString()}`}
                  </span>
                  <span className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full ${
                    totalPnl >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {totalPnl >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {totalPnl >= 0 ? '+' : ''}{totalPnlPercentage.toFixed(2)}%
                  </span>
                </div>
                <p className={`text-sm mt-2 ${totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {totalPnl >= 0 ? '+' : '-'}${Math.abs(totalPnl).toLocaleString()} (24h)
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <Wallet className="w-6 h-6 text-blue-400" />
              </div>
            </div>

            {/* Mini Chart */}
            <div className="mt-6 h-16 flex items-end gap-1">
              {chartData.map((height, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-blue-500/50 to-purple-500/50 rounded-t-lg hover:from-blue-500 hover:to-purple-500 transition-all duration-300 cursor-pointer"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </motion.div>

          {/* Quick Stats Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl"
          >
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Quick Stats</h3>
            <div className="space-y-4">
              {[
                { label: 'Assets', value: holdings.length.toString() },
                { label: 'Best Performer', value: 'SOL +7.16%', trend: 'up' },
                { label: 'Worst Performer', value: 'BTC +5.64%', trend: 'up' },
                { label: 'Total Trades', value: '234' },
              ].map((stat, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">{stat.label}</span>
                  <span className={`text-sm font-medium ${
                    stat.trend === 'up' ? 'text-green-400' : 
                    stat.trend === 'down' ? 'text-red-400' : 'text-white'
                  }`}>
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center justify-between mt-8">
          <div className="flex gap-1 bg-white/5 rounded-2xl p-1 border border-white/10">
            {['1D', '1W', '1M', '3M', '1Y', 'ALL'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf as any)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  timeframe === tf
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Holdings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
          {holdings.map((holding, idx) => (
            <motion.div
              key={holding.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group bg-white/5 hover:bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-blue-500/50 transition-all duration-300 cursor-pointer"
              onClick={() => setSelectedAsset(holding.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                    {holding.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{holding.symbol}</h3>
                    <p className="text-sm text-slate-400">{holding.name}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-white">
                    {hideBalances ? '••••••' : holding.balance.toLocaleString()}
                  </span>
                  <span className="text-sm text-slate-400">≈ ${holding.value.toLocaleString()}</span>
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <span className={`text-sm font-medium flex items-center gap-1 ${
                    holding.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {holding.pnl >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {holding.pnlPercentage.toFixed(2)}%
                  </span>
                  <span className="text-xs text-slate-400">24h</span>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400">Allocation</span>
                    <span className="text-white font-medium">{holding.allocation}%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                      style={{ width: `${holding.allocation}%` }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Transactions Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-white mb-6">Recent Transactions</h2>
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Asset</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                          tx.type === 'BUY' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {tx.type === 'BUY' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{tx.symbol}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-white font-mono">{tx.amount}</td>
                      <td className="px-6 py-4 text-right text-white font-mono">${tx.price.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right text-white font-mono">${tx.value.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right text-slate-400">
                        {new Date(tx.timestamp).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <VerificationBadge verified={true} hash={tx.txHash} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}