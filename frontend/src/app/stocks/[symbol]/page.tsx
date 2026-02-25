'use client';

import { useParams } from 'next/navigation';
import StockPageView from '@/components/stocks/StockPageView';

export default function StockPage() {
  const params = useParams<{ symbol: string }>();
  const symbol = (params?.symbol || 'AAPL').toUpperCase();

  return <StockPageView initialSymbol={symbol} />;
}
