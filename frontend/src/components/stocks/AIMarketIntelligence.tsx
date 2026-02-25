'use client';

import { useState } from 'react';
import { Brain, Settings, ChevronUp, Sparkles } from 'lucide-react';
import { useAnalysis, usePrediction } from '@/hooks/useMLApi';

export default function AIMarketIntelligence({ symbol }: { symbol: string }) {
  const { data: analysis = null, isLoading: analysisLoading } = useAnalysis(symbol);
  const { data: prediction = null, isLoading: predLoading } = usePrediction(symbol);
  const loading = analysisLoading || predLoading;
  const [expanded, setExpanded] = useState(true);

  const outlookText = String(analysis?.final_recommendation ?? 'N/A').toLowerCase();
  const outlookColor = outlookText.includes('buy')
    ? 'text-green-400'
    : outlookText.includes('sell')
    ? 'text-red-400'
    : 'text-yellow-400';

  const outlookLabel = outlookText.includes('strong')
    ? outlookText.includes('buy')
      ? 'Strongly Bullish'
      : 'Strongly Bearish'
    : outlookText.includes('buy')
    ? 'Slightly Bullish'
    : outlookText.includes('sell')
    ? 'Slightly Bearish'
    : 'Neutral';

  const confidence = analysis?.confidence
    ? Math.round(analysis.confidence * 100)
    : prediction?.confidence || 50;
  const predChange = prediction?.predicted_change?.toFixed(2) || '0.00';
  const sources = (analysis?.agent_opinions?.length || 0) + 2; // agents + ML + sentiment

  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-semibold text-white">AI Market Intelligence</h3>
          <span className="text-xs text-gray-500">— {symbol}</span>
        </div>
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-gray-500 cursor-pointer hover:text-gray-300" />
          <button onClick={() => setExpanded((e) => !e)}>
            <ChevronUp
              className={`w-4 h-4 text-gray-500 transition-transform ${expanded ? '' : 'rotate-180'}`}
            />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-full" />
          <div className="grid grid-cols-3 gap-3">
            <div className="h-20 bg-gray-700 rounded" />
            <div className="h-20 bg-gray-700 rounded" />
            <div className="h-20 bg-gray-700 rounded" />
          </div>
        </div>
      ) : (
        expanded && (
          <div className="space-y-4">
            {/* Overall outlook */}
            <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-400">OVERALL OUTLOOK</span>
              </div>
              <span className={`text-sm font-bold ${outlookColor}`}>{outlookLabel}</span>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-3 gap-3">
              {/* Confidence */}
              <div className="bg-gray-700/30 rounded-lg p-3">
                <p className="text-[10px] text-gray-500 uppercase mb-1 flex items-center gap-1">
                  🎯 Confidence
                </p>
                <p className="text-xl font-bold text-white">{confidence}%</p>
                <div className="mt-2 h-1 bg-gray-600 rounded-full">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${confidence}%` }}
                  />
                </div>
              </div>

              {/* Prediction */}
              <div className="bg-gray-700/30 rounded-lg p-3">
                <p className="text-[10px] text-gray-500 uppercase mb-1 flex items-center gap-1">
                  📈 Prediction
                </p>
                <p
                  className={`text-xl font-bold ${
                    parseFloat(predChange) >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {parseFloat(predChange) >= 0 ? '+' : ''}
                  {predChange}%
                </p>
                <p className="text-[10px] text-gray-500 mt-1">avg. predicted move</p>
              </div>

              {/* Sources */}
              <div className="bg-gray-700/30 rounded-lg p-3">
                <p className="text-[10px] text-gray-500 uppercase mb-1 flex items-center gap-1">
                  📊 Sources
                </p>
                <p className="text-xl font-bold text-white">{sources}</p>
                <p className="text-[10px] text-gray-500 mt-1">ML, Predictions, Sentiment Analysis</p>
              </div>
            </div>

            {/* Agent opinions */}
            {analysis?.agent_opinions && analysis.agent_opinions.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Agent Signals</h4>
                <div className="space-y-1.5">
                  {analysis.agent_opinions.map((op: { agent?: string; signal?: string; confidence?: number }, i: number) => (
                    <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-700/30">
                      <span className="text-xs text-gray-300">{op.agent}</span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-semibold ${
                            String(op.signal ?? '').toLowerCase().includes('buy')
                              ? 'text-green-400'
                              : String(op.signal ?? '').toLowerCase().includes('sell')
                              ? 'text-red-400'
                              : 'text-yellow-400'
                          }`}
                        >
                          {String(op.signal || '').toUpperCase()}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          ({Math.round((op.confidence || 0) * 100)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            {analysis?.summary && (
              <p className="text-xs text-gray-400 leading-relaxed border-t border-gray-700/50 pt-3">
                {analysis.summary}
              </p>
            )}
          </div>
        )
      )}
    </div>
  );
}
