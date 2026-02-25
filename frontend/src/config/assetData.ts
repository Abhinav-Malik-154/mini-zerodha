/* ─────────────────────────────────────────────────────
 * Shared asset metadata for stocks & crypto
 * ───────────────────────────────────────────────────── */

export type AssetType = 'stock' | 'crypto';

export interface AssetInfo {
  name: string;
  sector: string;
  industry: string;
  type: AssetType;
  logo?: string;     // direct logo URL (stock: TradingView slug, crypto: coin id)
  color: string;     // fallback bg colour
}

/* ── Master registry ─────────────────────────────────── */

export const ASSETS: Record<string, AssetInfo> = {
  /* ─ Stocks  (logo = TradingView slug) ─ */
  AAPL:  { name: 'Apple Inc.',           sector: 'Technology',             industry: 'Consumer Electronics',            type: 'stock', logo: 'apple',             color: '#A2AAAD' },
  MSFT:  { name: 'Microsoft Corp',       sector: 'Technology',             industry: 'Software—Infrastructure',         type: 'stock', logo: 'microsoft',         color: '#00A4EF' },
  GOOGL: { name: 'Alphabet Inc',         sector: 'Technology',             industry: 'Internet Content & Information',  type: 'stock', logo: 'alphabet',          color: '#4285F4' },
  AMZN:  { name: 'Amazon.com Inc',       sector: 'Consumer Cyclical',      industry: 'Internet Retail',                 type: 'stock', logo: 'amazon',            color: '#FF9900' },
  TSLA:  { name: 'Tesla Inc',            sector: 'Consumer Cyclical',      industry: 'Auto Manufacturers',              type: 'stock', logo: 'tesla',             color: '#CC0000' },
  NVDA:  { name: 'NVIDIA Corp',          sector: 'Technology',             industry: 'Semiconductors',                  type: 'stock', logo: 'nvidia',            color: '#76B900' },
  META:  { name: 'Meta Platforms',        sector: 'Technology',             industry: 'Internet Content & Information',  type: 'stock', logo: 'meta-platforms',    color: '#0668E1' },
  NFLX:  { name: 'Netflix Inc',          sector: 'Communication Services', industry: 'Entertainment',                   type: 'stock', logo: 'netflix',           color: '#E50914' },
  XOM:   { name: 'Exxon Mobil',          sector: 'Energy',                 industry: 'Oil & Gas Integrated',            type: 'stock', logo: 'exxon-mobil',       color: '#ED1B2F' },
  COST:  { name: 'Costco Wholesale',     sector: 'Consumer Defensive',     industry: 'Discount Stores',                 type: 'stock', logo: 'costco-wholesale',  color: '#E31837' },
  ORCL:  { name: 'Oracle Corp',          sector: 'Technology',             industry: 'Software—Infrastructure',         type: 'stock', logo: 'oracle',            color: '#F80000' },
  PG:    { name: 'Procter & Gamble',     sector: 'Consumer Defensive',     industry: 'Household Products',              type: 'stock', logo: 'procter-gamble',    color: '#003DA5' },
  JNJ:   { name: 'Johnson & Johnson',    sector: 'Healthcare',             industry: 'Drug Manufacturers',              type: 'stock', logo: 'johnson-johnson',   color: '#D51900' },
  UNH:   { name: 'UnitedHealth Group',   sector: 'Healthcare',             industry: 'Healthcare Plans',                type: 'stock', logo: 'unitedhealth-group',color: '#002677' },
  HD:    { name: 'Home Depot',           sector: 'Consumer Cyclical',      industry: 'Home Improvement Retail',         type: 'stock', logo: 'home-depot',        color: '#F96302' },
  ABBV:  { name: 'AbbVie Inc',           sector: 'Healthcare',             industry: 'Drug Manufacturers',              type: 'stock', logo: 'abbvie',            color: '#071D49' },
  KO:    { name: 'Coca-Cola Co',         sector: 'Consumer Defensive',     industry: 'Beverages—Non-Alcoholic',         type: 'stock', logo: 'coca-cola',         color: '#F40009' },
  JPM:   { name: 'JPMorgan Chase',       sector: 'Financial Services',     industry: 'Banks—Diversified',               type: 'stock', logo: 'jpmorgan-chase',    color: '#004785' },
  V:     { name: 'Visa Inc',             sector: 'Financial Services',     industry: 'Credit Services',                 type: 'stock', logo: 'visa',              color: '#1A1F71' },
  WMT:   { name: 'Walmart Inc',          sector: 'Consumer Defensive',     industry: 'Discount Stores',                 type: 'stock', logo: 'walmart',           color: '#0071CE' },

  /* ─ Crypto  (logo = lowercase coin ticker for crypto-icons CDN) ─ */
  'BTC-USD':  { name: 'Bitcoin',    sector: 'Cryptocurrency', industry: 'Digital Currency',  type: 'crypto', logo: 'btc',  color: '#F7931A' },
  'ETH-USD':  { name: 'Ethereum',   sector: 'Cryptocurrency', industry: 'Smart Contracts',   type: 'crypto', logo: 'eth',  color: '#627EEA' },
  'SOL-USD':  { name: 'Solana',     sector: 'Cryptocurrency', industry: 'Layer 1',           type: 'crypto', logo: 'sol',  color: '#9945FF' },
  'BNB-USD':  { name: 'BNB',        sector: 'Cryptocurrency', industry: 'Exchange Token',    type: 'crypto', logo: 'bnb',  color: '#F3BA2F' },
  'XRP-USD':  { name: 'XRP',        sector: 'Cryptocurrency', industry: 'Payments',          type: 'crypto', logo: 'xrp',  color: '#23292F' },
  'ADA-USD':  { name: 'Cardano',    sector: 'Cryptocurrency', industry: 'Layer 1',           type: 'crypto', logo: 'ada',  color: '#0033AD' },
  'DOGE-USD': { name: 'Dogecoin',   sector: 'Cryptocurrency', industry: 'Meme Coin',         type: 'crypto', logo: 'doge', color: '#C3A634' },
  'AVAX-USD': { name: 'Avalanche',  sector: 'Cryptocurrency', industry: 'Layer 1',           type: 'crypto', logo: 'avax', color: '#E84142' },
  'DOT-USD':  { name: 'Polkadot',   sector: 'Cryptocurrency', industry: 'Layer 0',           type: 'crypto', logo: 'dot',  color: '#E6007A' },
  'LINK-USD': { name: 'Chainlink',  sector: 'Cryptocurrency', industry: 'Oracle',            type: 'crypto', logo: 'link', color: '#2A5ADA' },
};

/* ── Helpers ──────────────────────────────────────────── */

/** Strip -USD suffix for display */
export function getDisplaySymbol(symbol: string): string {
  return symbol.replace(/-USD$/i, '');
}

export function getAsset(symbol: string): AssetInfo {
  return ASSETS[symbol] || { name: symbol, sector: 'Equity', industry: '', type: 'stock', color: '#374151' };
}

export function getLogoUrl(symbol: string): string | null {
  const asset = ASSETS[symbol];
  if (!asset?.logo) return null;
  const cryptoCdn = process.env.NEXT_PUBLIC_CRYPTO_LOGO_CDN || 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@master/128/color';
  const stockCdn = process.env.NEXT_PUBLIC_STOCK_LOGO_CDN || 'https://s3-symbol-logo.tradingview.com';
  if (asset.type === 'crypto') {
    return `${cryptoCdn}/${asset.logo}.png`;
  }
  return `${stockCdn}/${asset.logo}--big.svg`;
}

export function isCrypto(symbol: string): boolean {
  return symbol.endsWith('-USD') || ASSETS[symbol]?.type === 'crypto';
}

/* ── Curated lists ────────────────────────────────────── */

export const POPULAR_STOCKS  = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX'];
export const POPULAR_CRYPTO  = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'BNB-USD', 'XRP-USD', 'ADA-USD', 'DOGE-USD', 'AVAX-USD'];
export const SIDEBAR_STOCKS  = ['XOM', 'COST', 'ORCL', 'PG', 'JNJ', 'UNH', 'HD', 'ABBV', 'KO', 'JPM'];
export const SIDEBAR_CRYPTO  = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'BNB-USD', 'XRP-USD'];
export const TICKER_SYMBOLS  = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'BTC-USD', 'ETH-USD', 'SOL-USD'];
