'use client';

import { useState } from 'react';
import { ASSETS, getDisplaySymbol, getLogoUrl } from '@/config/assetData';

interface AssetLogoProps {
  symbol: string;
  size?: number;
  className?: string;
}

export default function AssetLogo({ symbol, size = 32, className = '' }: AssetLogoProps) {
  const [imgError, setImgError] = useState(false);
  const asset = ASSETS[symbol];
  const bgColor = asset?.color || '#374151';
  const displaySymbol = getDisplaySymbol(symbol);
  const logoUrl = getLogoUrl(symbol);

  if (logoUrl && !imgError) {
    return (
      <img
        src={logoUrl}
        alt={displaySymbol}
        width={size}
        height={size}
        className={`rounded-full object-cover bg-white shrink-0 ${className}`}
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
        loading="lazy"
      />
    );
  }

  // Fallback: coloured circle with initials
  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold text-white shrink-0 ${className}`}
      style={{ width: size, height: size, backgroundColor: bgColor, fontSize: size * 0.35 }}
    >
      {displaySymbol.slice(0, 2)}
    </div>
  );
}
