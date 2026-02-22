'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRealTimeData } from '@/hooks/useRealTimeData';

const SYMBOLS = ['BTC/USD', 'ETH/USD', 'SOL/USD'] as const;
type Symbol = typeof SYMBOLS[number];

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const TradeForm: React.FC = () => {
  const { prices } = useRealTimeData();
  const [symbol, setSymbol] = useState<Symbol>('BTC/USD');
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const livePrice = prices[symbol]?.price;

  const estimatedTotal = () => {
    const qty = parseFloat(quantity);
    const px = orderType === 'MARKET' ? (livePrice ?? 0) : parseFloat(price);
    if (!qty || !px) return null;
    return (qty * px).toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity || (orderType === 'LIMIT' && !price)) {
      setStatus('error');
      setMessage('Please fill in all required fields.');
      return;
    }
    setStatus('loading');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/api/trades/verify`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          symbol,
          side,
          quantity: parseFloat(quantity),
          price: orderType === 'MARKET' ? livePrice : parseFloat(price),
        }),
      });
      if (!res.ok) throw new Error('Trade failed');
      setStatus('success');
      setMessage(`${side} order for ${quantity} ${symbol} placed!`);
      setQuantity('');
      setPrice('');
      setTimeout(() => setStatus('idle'), 3000);
    } catch {
      setStatus('error');
      setMessage('Failed to place order. Please try again.');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/30 backdrop-blur-xl rounded-2xl p-6 ring-1 ring-white/10"
    >
      <h2 className="text-xl font-semibold text-white mb-5">Place Order</h2>

      {/* Symbol tabs */}
      <div className="flex gap-1 mb-5 bg-slate-700/30 rounded-xl p-1">
        {SYMBOLS.map(s => (
          <button
            key={s}
            onClick={() => setSymbol(s)}
            className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all ${
              symbol === s
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {s.split('/')[0]}
          </button>
        ))}
      </div>

      {/* Live price */}
      <div className="flex items-center justify-between mb-5">
        <span className="text-sm text-slate-400">{symbol}</span>
        <span className="text-lg font-bold text-white">
          {livePrice ? `$${livePrice.toLocaleString()}` : '—'}
        </span>
      </div>

      {/* Buy / Sell toggle */}
      <div className="flex gap-2 mb-5">
        {(['BUY', 'SELL'] as const).map(s => (
          <button
            key={s}
            onClick={() => setSide(s)}
            className={`flex-1 py-2 rounded-xl font-semibold text-sm transition-all ${
              side === s
                ? s === 'BUY'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                  : 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                : 'bg-slate-700/40 text-slate-400 hover:text-white'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Order type */}
      <div className="flex gap-2 mb-5">
        {(['MARKET', 'LIMIT'] as const).map(t => (
          <button
            key={t}
            onClick={() => setOrderType(t)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              orderType === t
                ? 'bg-slate-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {orderType === 'LIMIT' && (
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Limit Price (USD)</label>
            <input
              type="number"
              min="0"
              step="any"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder={livePrice ? livePrice.toFixed(2) : '0.00'}
              className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        )}

        <div>
          <label className="text-xs text-slate-400 mb-1 block">
            Quantity ({symbol.split('/')[0]})
          </label>
          <input
            type="number"
            min="0"
            step="any"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            placeholder="0.00"
            className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        {estimatedTotal() && (
          <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-700/20 rounded-lg px-3 py-2">
            <span>Estimated Total</span>
            <span className="text-white font-medium">${estimatedTotal()}</span>
          </div>
        )}

        <AnimatePresence>
          {status !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`text-sm rounded-xl px-3 py-2 ${
                status === 'success'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : status === 'error'
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-blue-500/20 text-blue-400'
              }`}
            >
              {status === 'loading' ? 'Placing order…' : message}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={status === 'loading'}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
            side === 'BUY'
              ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20'
              : 'bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/20'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {status === 'loading'
            ? 'Placing…'
            : `${side} ${symbol.split('/')[0]}`}
        </button>
      </form>
    </motion.div>
  );
};

export default TradeForm;