'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRealTimeData } from '@/hooks/useRealTimeData';
import { useAuth } from '@/context/AuthProvider';
import { useWallet } from '@/context/WalletProvider'; // Fix: Import useWallet

const SYMBOLS = ['BTC/USD', 'ETH/USD', 'SOL/USD'] as const;
type Symbol = typeof SYMBOLS[number];

const SYMBOL_META: Record<Symbol, { icon: string; color: string; glow: string }> = {
  'BTC/USD': { icon: '₿', color: 'from-orange-500 to-yellow-500', glow: 'shadow-orange-500/20' },
  'ETH/USD': { icon: 'Ξ', color: 'from-blue-500 to-purple-500', glow: 'shadow-blue-500/20' },
  'SOL/USD': { icon: '◎', color: 'from-violet-500 to-pink-500', glow: 'shadow-violet-500/20' },
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
// Fix #14: set NEXT_PUBLIC_EXPECTED_CHAIN_ID in .env.local (31337=Anvil, 1=mainnet, 137=Polygon)
const EXPECTED_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_EXPECTED_CHAIN_ID || '31337', 10);

interface CardState {
  side: 'BUY' | 'SELL';
  quantity: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  message: string;
  expanded: boolean;
}

const defaultCard = (): CardState => ({
  side: 'BUY',
  quantity: '',
  status: 'idle',
  message: '',
  expanded: false,
});

function saveTrade(
  symbol: Symbol,
  side: 'BUY' | 'SELL',
  amount: number,
  price: number,
  txHash: string  // Fix #15: real hash from backend, not Math.random()
) {
  const trade = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: side,
    symbol: symbol.split('/')[0],
    amount,
    price,
    value: parseFloat((amount * price).toFixed(2)),
    timestamp: new Date().toISOString(),
    status: 'completed',
    txHash,
  };
  const existing = JSON.parse(localStorage.getItem('portfolio_trades') || '[]');
  localStorage.setItem('portfolio_trades', JSON.stringify([trade, ...existing]));
  window.dispatchEvent(new Event('portfolio_updated'));
}

export default function QuickTrade() {
  const { prices } = useRealTimeData();
  const { token, logout } = useAuth(); // Fix: Use token from context
  const { refreshBalance } = useWallet(); // Fix: Get refreshBalance
  const [cards, setCards] = useState<Record<Symbol, CardState>>({
    'BTC/USD': defaultCard(),
    'ETH/USD': defaultCard(),
    'SOL/USD': defaultCard(),
  });

  const update = (symbol: Symbol, patch: Partial<CardState>) =>
    setCards(prev => ({ ...prev, [symbol]: { ...prev[symbol], ...patch } }));

  const handleSideClick = (symbol: Symbol, s: 'BUY' | 'SELL') => {
    const card = cards[symbol];
    // toggle collapse if clicking the already-active side
    if (card.side === s && card.expanded) {
      update(symbol, { expanded: false });
    } else {
      update(symbol, { side: s, expanded: true });
    }
  };

  const handleTrade = async (symbol: Symbol) => {
    const card = cards[symbol];
    const qty = parseFloat(card.quantity);
    if (!card.quantity || isNaN(qty) || qty <= 0) {
      update(symbol, { status: 'error', message: 'Enter a valid quantity.' });
      setTimeout(() => update(symbol, { status: 'idle' }), 2500);
      return;
    }

    // Fix #14: validate chain ID before submitting
    try {
      const eth = typeof window !== 'undefined' ? (window as any).ethereum : null;
      if (eth) {
        const chainIdHex: string = await eth.request({ method: 'eth_chainId' });
        const chainId = parseInt(chainIdHex, 16);
        if (chainId !== EXPECTED_CHAIN_ID) {
          update(symbol, {
            status: 'error',
            message: `Wrong network. Switch to chain ID ${EXPECTED_CHAIN_ID} in your wallet.`,
          });
          setTimeout(() => update(symbol, { status: 'idle' }), 4000);
          return;
        }
      }
    } catch { /* no wallet connected, skip chain check */ }

    update(symbol, { status: 'loading' });
    const livePrice = prices[symbol]?.price ?? 0;
    const ethPrice = prices['ETH/USD']?.price ?? 3000;
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      // BUY: User pays ETH from wallet (cost = qty * assetPrice / ethPrice)
      if (card.side === 'BUY') {
        const costInEth = (qty * livePrice) / ethPrice;
        update(symbol, { message: `Confirm ${costInEth.toFixed(4)} ETH payment in wallet...` });
        const eth = (window as any).ethereum;
        if (!eth) throw new Error('No wallet found');

        const accounts = await eth.request({ method: 'eth_accounts' });
        const weiValue = '0x' + BigInt(Math.round(costInEth * 1e18)).toString(16);

        await eth.request({
          method: 'eth_sendTransaction',
          params: [{
            from: accounts[0],
            to: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Anvil treasury
            value: weiValue
          }]
        });
        update(symbol, { message: 'Payment confirmed. Verifying trade...' });
      }

      // SELL: No wallet popup needed — backend sends ETH proceeds to user after verification
      if (card.side === 'SELL') {
        update(symbol, { message: 'Verifying trade...' });
      }

      const res = await fetch(`${API_BASE}/api/trades/verify`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ symbol, side: card.side, quantity: qty, price: livePrice, ethPrice }),
      });

      if (res.status === 401) { // Fix: Handle token expiration
        update(symbol, { status: 'error', message: 'Session expired. Please reconnect wallet.' });
        logout(); // Force logout
        return;
      }
      
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const errMsg = data?.error || `Server error ${res.status}`;
        update(symbol, { status: 'error', message: errMsg });
        setTimeout(() => update(symbol, { status: 'idle', message: '' }), 4000);
        return;
      }

      // Fix #15: use real transaction hash returned by backend
      const realTxHash: string = data?.data?.transactionHash || '0xpending';
      saveTrade(symbol, card.side, qty, livePrice, realTxHash);

      // Trigger UI updates
      window.dispatchEvent(new Event('portfolio_updated')); 
      refreshBalance();

      update(symbol, {
        status: 'success',
        message: `${card.side} ${qty} ${symbol.split('/')[0]} @ $${livePrice.toLocaleString()}`,
        quantity: '',
        expanded: false,
      });
    } catch (err: any) {
      update(symbol, { status: 'error', message: err?.message || 'Order failed. Try again.' });
    }
    setTimeout(() => update(symbol, { status: 'idle', message: '' }), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Quick Trade</h2>
        <span className="text-xs text-slate-400 bg-slate-700/40 px-3 py-1 rounded-full">Market Order</span>
      </div>

      {/* items-start prevents cards from stretching to the tallest sibling */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {SYMBOLS.map((symbol, i) => {
          const meta = SYMBOL_META[symbol];
          const card = cards[symbol];
          const priceData = prices[symbol];
          const isPositive = (priceData?.change24h ?? 0) >= 0;

          return (
            <motion.div
              key={symbol}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-slate-800/30 backdrop-blur-xl rounded-2xl ring-1 ring-white/10 overflow-hidden"
            >
              {/* top accent bar */}
              <div className={`bg-gradient-to-r ${meta.color} h-0.5`} />

              <div className="p-5">
                {/* Symbol + price */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center text-white font-bold text-lg shadow-lg ${meta.glow}`}>
                      {meta.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{symbol}</p>
                      <p className={`text-xs ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isPositive ? '▲' : '▼'} {Math.abs(priceData?.change24h ?? 0).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">
                      {priceData ? `$${priceData.price.toLocaleString()}` : '—'}
                    </p>
                    <p className="text-xs text-slate-400">
                      Vol: {priceData?.volume ?? '—'}
                    </p>
                  </div>
                </div>

                {/* BUY / SELL — always color-coded */}
                <div className="flex gap-2 mb-3">
                  {(['BUY', 'SELL'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => handleSideClick(symbol, s)}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                        card.side === s && card.expanded
                          ? s === 'BUY'
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                            : 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                          : s === 'BUY'
                          ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/30'
                          : 'bg-red-500/15 text-red-400 hover:bg-red-500/30'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {/* Expandable order form */}
                <AnimatePresence initial={false}>
                  {card.expanded && (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-3 pt-1 border-t border-white/5 mt-1">
                        <div className="pt-2">
                          <label className="text-xs text-slate-400 mb-1 block">
                            Quantity ({symbol.split('/')[0]})
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={card.quantity}
                            onChange={e => update(symbol, { quantity: e.target.value })}
                            placeholder="0.00"
                            autoFocus
                            className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          />
                        </div>

                        {card.quantity && !isNaN(parseFloat(card.quantity)) && priceData && (
                          <div className="text-xs text-slate-400 flex justify-between bg-slate-700/20 rounded-lg px-3 py-1.5">
                            <span>Est. Total</span>
                            <span className="text-white font-medium">
                              ${(parseFloat(card.quantity) * priceData.price).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}

                        <AnimatePresence>
                          {card.status !== 'idle' && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className={`text-xs rounded-lg px-3 py-2 ${
                                card.status === 'success'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : card.status === 'error'
                                  ? 'bg-red-500/20 text-red-400'
                                  : 'bg-blue-500/20 text-blue-400'
                              }`}
                            >
                              {card.status === 'loading' ? 'Placing order…' : card.message}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleTrade(symbol)}
                            disabled={card.status === 'loading'}
                            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${
                              card.side === 'BUY'
                                ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
                                : 'bg-red-500 hover:bg-red-400 text-white'
                            }`}
                          >
                            {card.status === 'loading' ? 'Placing…' : `Confirm ${card.side}`}
                          </button>
                          <button
                            onClick={() => update(symbol, { expanded: false, quantity: '', status: 'idle' })}
                            className="px-3 py-2 rounded-xl bg-slate-700/50 text-slate-400 hover:text-white text-sm transition-all"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Toast shown after collapse */}
                <AnimatePresence>
                  {!card.expanded && card.status === 'success' && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-2 text-xs bg-emerald-500/20 text-emerald-400 rounded-lg px-3 py-2"
                    >
                      ✓ {card.message}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
