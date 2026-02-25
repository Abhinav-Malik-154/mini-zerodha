'use client';

import { Newspaper, ExternalLink, CheckCircle } from 'lucide-react';
import { useNews, useSentiment } from '@/hooks/useMLApi';

export default function NewsAndSentiment({ symbol }: { symbol: string }) {
  const { data: newsData, isLoading: newsLoading } = useNews(symbol);
  const { data: sentiment = null, isLoading: sentLoading } = useSentiment(symbol);

  const loading = newsLoading || sentLoading;
  const articles = newsData?.articles || [];

  const getSentimentColor = (s: string) => {
    switch (s) {
      case 'POSITIVE':
        return 'text-green-400';
      case 'NEGATIVE':
        return 'text-red-400';
      default:
        return 'text-yellow-400';
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  // Sentiment bar
  const total = sentiment
    ? sentiment.positive_count + sentiment.negative_count + sentiment.neutral_count
    : 0;
  const posPct = total > 0 ? (sentiment!.positive_count / total) * 100 : 33;
  const negPct = total > 0 ? (sentiment!.negative_count / total) * 100 : 33;
  const neuPct = 100 - posPct - negPct;

  const sentimentLabel =
    sentiment?.overall_sentiment === 'POSITIVE'
      ? 'Bullish'
      : sentiment?.overall_sentiment === 'NEGATIVE'
      ? 'Bearish'
      : 'Neutral';

  const sentimentPct = sentiment ? Math.round(sentiment.confidence * 100) : 50;

  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Newspaper className="w-5 h-5 text-yellow-400" />
        <h3 className="text-base font-semibold text-white">Latest News &amp; Sentiment</h3>
      </div>

      {/* Articles */}
      <div className="space-y-3 mb-5">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse space-y-1">
              <div className="h-4 bg-gray-700 rounded w-full" />
              <div className="h-3 bg-gray-700 rounded w-2/3" />
            </div>
          ))
        ) : articles.length === 0 ? (
          <p className="text-gray-500 text-sm">No recent news found.</p>
        ) : (
          /* eslint-disable @typescript-eslint/no-explicit-any */
          articles.map((article: any, i: number) => (
            <div
              key={i}
              className="group flex gap-3 items-start p-2 rounded-lg hover:bg-gray-700/30 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <a
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white font-medium hover:text-blue-400 transition-colors line-clamp-2 flex items-start gap-1"
                >
                  {article.title}
                  <ExternalLink className="w-3 h-3 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 text-gray-500" />
                </a>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">{formatDate(String(article.published ?? ''))}</span>
                  <span className="text-xs text-gray-600">·</span>
                  <span className="text-xs text-gray-500">{article.source}</span>
                </div>
              </div>
              <div className="shrink-0 mt-0.5">
                <CheckCircle
                  className={`w-4 h-4 ${
                    article.sentiment === 'POSITIVE'
                      ? 'text-green-400'
                      : article.sentiment === 'NEGATIVE'
                      ? 'text-red-400'
                      : 'text-gray-500'
                  }`}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Sentiment bar */}
      {sentiment && (
        <div className="border-t border-gray-700/50 pt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-white">News Sentiment</h4>
            <span className="text-sm font-medium text-white">{sentimentPct}%</span>
          </div>

          {/* Stacked bar */}
          <div className="flex h-2 rounded-full overflow-hidden mb-2">
            <div className="bg-red-500" style={{ width: `${negPct}%` }} />
            <div className="bg-emerald-500" style={{ width: `${posPct}%` }} />
            <div className="bg-gray-600" style={{ width: `${neuPct}%` }} />
          </div>

          <div className="flex justify-between text-xs text-gray-500">
            <span>Bearish</span>
            <span>Neutral</span>
            <span>Bullish</span>
          </div>

          <p className="text-xs text-gray-400 mt-2">
            Sentiment is{' '}
            <span className={getSentimentColor(sentiment.overall_sentiment)}>
              {sentimentLabel.toLowerCase()}
            </span>{' '}
            with {sentiment.positive_count} positive, {sentiment.negative_count} negative articles.
          </p>
        </div>
      )}
    </div>
  );
}
