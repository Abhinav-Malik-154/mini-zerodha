'use client';

import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { useProfile } from '@/hooks/useMLApi';

export default function CompanyProfile({ symbol }: { symbol: string }) {
  const { data: profile, isLoading: loading } = useProfile(symbol);
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5 animate-pulse">
        <div className="h-5 bg-gray-700 rounded w-40 mb-4" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-700 rounded w-full" />
          <div className="h-4 bg-gray-700 rounded w-3/4" />
          <div className="h-4 bg-gray-700 rounded w-5/6" />
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const descriptionText = profile.description || 'No company description available.';
  const shortDesc = descriptionText.slice(0, 400);
  const hasMore = descriptionText.length > 400;

  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="w-5 h-5 text-blue-400" />
        <h3 className="text-base font-semibold text-white">Company Profile</h3>
      </div>

      {/* Symbol + name */}
      <div className="mb-3">
        <h4 className="text-lg font-bold text-emerald-400">{symbol} Profile</h4>
      </div>

      {/* Metadata */}
      <div className="space-y-1 mb-4 text-sm">
        <p className="text-gray-300">
          <span className="text-gray-500">Sector:</span>{' '}
          <span className="font-medium">{profile.sector}</span>
        </p>
        <p className="text-gray-300">
          <span className="text-gray-500">Industry:</span>{' '}
          <span className="font-medium">{profile.industry}</span>
        </p>
        {profile.employees > 0 && (
          <p className="text-gray-300">
            <span className="text-gray-500">Employees (FY):</span>{' '}
            <span className="font-medium">
              {profile.employees >= 1000
                ? `${(profile.employees / 1000).toFixed(0)}K`
                : profile.employees}
            </span>
          </p>
        )}
        {profile.market_cap > 0 && (
          <p className="text-gray-300">
            <span className="text-gray-500">Market Cap:</span>{' '}
            <span className="font-medium">
              ${(profile.market_cap / 1e9).toFixed(1)}B
            </span>
          </p>
        )}
        {profile.pe_ratio > 0 && (
          <p className="text-gray-300">
            <span className="text-gray-500">P/E Ratio:</span>{' '}
            <span className="font-medium">{profile.pe_ratio.toFixed(2)}</span>
          </p>
        )}
        {profile.beta > 0 && (
          <p className="text-gray-300">
            <span className="text-gray-500">Beta:</span>{' '}
            <span className="font-medium">{profile.beta.toFixed(2)}</span>
          </p>
        )}
      </div>

      {/* Description */}
      <p className="text-gray-400 text-sm leading-relaxed">
        {expanded ? descriptionText : shortDesc}
        {hasMore && !expanded && '...'}
      </p>
      {hasMore && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-blue-400 text-xs mt-1 hover:underline"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  );
}
