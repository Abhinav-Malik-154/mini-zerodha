'use client';

import { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, LineData } from 'lightweight-charts';

interface HistoryPoint {
  date: string; // ISO date
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface PredictionResult {
  predicted_price: number;
  horizon_days: number;
}

interface StockChartProps {
  history: HistoryPoint[];
  prediction?: PredictionResult;
}

export default function StockChart({ history, prediction }: StockChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || history.length === 0) return;

    // clean up previous chart if exists
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94A3B8',
        fontFamily: 'Inter, sans-serif',
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      grid: {
        vertLines: { color: '#1E293B' },
        horzLines: { color: '#1E293B' },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: '#3B82F6', width: 1, style: 1 },
        horzLine: { color: '#3B82F6', width: 1, style: 1 },
      },
      timeScale: {
        borderColor: '#1E293B',
        timeVisible: true,
        fixRightEdge: true,
      },
      rightPriceScale: {
        borderColor: '#1E293B',
      },
    });

    const lineSeries = chart.addLineSeries({ color: '#10B981' });
    const data: LineData[] = history.map((h) => ({
      time: h.date.split('T')[0],  // strip time portion for lightweight-charts
      value: h.close,
    }));
    lineSeries.setData(data);

    if (prediction && history.length > 0) {
      // create a small series from last data point to predicted date
      const lastDate = new Date(history[history.length - 1].date);
      const futureDate = new Date(lastDate);
      futureDate.setDate(futureDate.getDate() + prediction.horizon_days);
      const predSeries = chart.addLineSeries({
        color: '#EF4444',
        lineStyle: 2, // dashed
      });
      predSeries.setData([
        { time: history[history.length - 1].date.split('T')[0], value: history[history.length - 1].close },
        { time: futureDate.toISOString().split('T')[0], value: prediction.predicted_price },
      ]);
    }

    chartRef.current = chart;

    // resize handler
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [history, prediction]);

  return <div ref={chartContainerRef} className="w-full" />;
}
