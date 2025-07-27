'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickSeries } from 'lightweight-charts';

interface CandlestickData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface YahooFinanceData {
  chart: {
    result: Array<{
      timestamp: number[];
      indicators: {
        quote: Array<{
          open: number[];
          high: number[];
          low: number[];
          close: number[];
        }>;
      };
    }>;
  };
}

export default function TradingViewChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  
  const [priceData, setPriceData] = useState<CandlestickData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real price data from CoinGecko API (no CORS issues)
  const fetchPriceData = async () => {
    try {
      setError(null);
      
      // Using CoinGecko API for OHLC data (past 30 days)
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/ethereum/ohlc?vs_currency=usd&days=30'
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }
      
      const data: number[][] = await response.json();
      
      // CoinGecko returns [timestamp, open, high, low, close]
      const formattedData: CandlestickData[] = data.map(([timestamp, open, high, low, close]) => ({
        time: new Date(timestamp).toISOString().split('T')[0],
        open,
        high,
        low,
        close,
      }));
      
      // Remove duplicates and sort by time to ensure ascending order
      const uniqueData = formattedData.reduce((acc, current) => {
        const existing = acc.find(item => item.time === current.time);
        if (!existing) {
          acc.push(current);
        }
        return acc;
      }, [] as CandlestickData[]);
      
      // Sort by time in ascending order
      uniqueData.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
      
      setPriceData(uniqueData);
    } catch (error) {
      console.error('Error fetching price data:', error);
      setError('Failed to load chart data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPriceData();
  }, []);

  useEffect(() => {
    if (!chartContainerRef.current || priceData.length === 0) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: '#374151' },
        horzLines: { color: '#374151' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#4b5563',
      },
      timeScale: {
        borderColor: '#4b5563',
        timeVisible: true,
        secondsVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    chartRef.current = chart;

    // Create the Main Series (Candlesticks) - correct syntax from official docs
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderDownColor: '#ef4444',
      borderUpColor: '#10b981',
      wickDownColor: '#ef4444',
      wickUpColor: '#10b981',
    });

    // Set data
    candlestickSeries.setData(priceData);

    // Fit content
    chart.timeScale().fitContent();

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [priceData]);

  const currentPrice = priceData[priceData.length - 1]?.close;
  const previousPrice = priceData[priceData.length - 2]?.close;
  const priceChange = currentPrice && previousPrice ? currentPrice - previousPrice : 0;
  const priceChangePercent = currentPrice && previousPrice ? ((priceChange / previousPrice) * 100).toFixed(2) : '0.00';
  const isPositive = priceChange >= 0;

  if (loading) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 h-full flex items-center justify-center">
        <div className="text-white">Loading chart data...</div>
      </div>
    );
  }

  if (error || priceData.length === 0) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-2">{error || 'No data available'}</div>
          <button
            onClick={fetchPriceData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">ETH/USDC</h3>
        <div className="flex space-x-2">
          <span className={`text-2xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            ${currentPrice?.toLocaleString() || 'N/A'}
          </span>
          <span className={`${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}{priceChangePercent}%
          </span>
        </div>
      </div>
      
      <div className="flex justify-between text-sm text-gray-400 mb-4">
        <div>
          <span className="block">30d High</span>
          <span className="text-white">${priceData.length > 0 ? Math.max(...priceData.map(d => d.high)).toLocaleString() : 'N/A'}</span>
        </div>
        <div>
          <span className="block">30d Low</span>
          <span className="text-white">${priceData.length > 0 ? Math.min(...priceData.map(d => d.low)).toLocaleString() : 'N/A'}</span>
        </div>
        <div>
          <span className="block">Data Points</span>
          <span className="text-white">{priceData.length}</span>
        </div>
      </div>

      {/* TradingView Chart Container */}
      <div ref={chartContainerRef} className="w-full flex-1 rounded" />
    </div>
  );
}