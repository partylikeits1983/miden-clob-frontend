import React from 'react';
import { useDepthChart } from '../../services/hooks/useDepthChart';

interface OrderDepthChartProps {
  baseAsset?: string;
  quoteAsset?: string;
  refreshInterval?: number;
  autoRefresh?: boolean;
}

export default function OrderDepthChart({
  baseAsset = 'ETH',
  quoteAsset = 'USDC',
  refreshInterval = 2000,
  autoRefresh = true
}: OrderDepthChartProps) {
  const { data, loading, error, refresh } = useDepthChart({
    baseAsset,
    quoteAsset,
    refreshInterval,
    autoRefresh
  });

  if (loading && !data) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 h-full flex items-center justify-center">
        <div className="text-white">Loading order book...</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 h-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Order Book</h3>
          <button
            onClick={refresh}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Retry
          </button>
        </div>
        <div className="text-red-400 text-sm">
          Error loading data: {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 h-full flex items-center justify-center">
        <div className="text-gray-400">No data available</div>
      </div>
    );
  }

  const { bids, asks, spread, spread_percentage, last_price } = data;
  
  const maxTotal = Math.max(
    bids.length > 0 ? Math.max(...bids.map(b => b.total)) : 0,
    asks.length > 0 ? Math.max(...asks.map(a => a.total)) : 0
  );

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Order Book</h3>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-400">
            Spread: ${spread.toFixed(2)} ({spread_percentage.toFixed(2)}%)
          </div>
          {loading && (
            <div className="text-xs text-blue-400">Updating...</div>
          )}
          <button
            onClick={refresh}
            className="text-xs text-gray-400 hover:text-gray-300"
            title="Refresh data"
          >
            🔄
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Asks (Sell Orders) */}
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Price (USD)</span>
            <span>Amount (BTC)</span>
            <span>Total</span>
          </div>
          <div className="space-y-1">
            {asks.slice().reverse().map((ask, index) => (
              <div key={index} className="relative">
                <div
                  className="absolute inset-0 bg-red-900 opacity-20"
                  style={{ width: maxTotal > 0 ? `${(ask.total / maxTotal) * 100}%` : '0%' }}
                />
                <div className="relative flex justify-between text-sm py-1 px-2">
                  <span className="text-red-400">${ask.price.toLocaleString()}</span>
                  <span className="text-white">{ask.amount.toFixed(4)}</span>
                  <span className="text-gray-300">{ask.total.toFixed(4)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Current Price */}
        <div className="text-center py-2 border-y border-gray-700">
          <div className="text-lg font-bold text-green-400">${last_price.toLocaleString()}</div>
          <div className="text-xs text-gray-400">Last Price</div>
        </div>

        {/* Bids (Buy Orders) */}
        <div>
          <div className="space-y-1">
            {bids.map((bid, index) => (
              <div key={index} className="relative">
                <div
                  className="absolute inset-0 bg-green-900 opacity-20"
                  style={{ width: maxTotal > 0 ? `${(bid.total / maxTotal) * 100}%` : '0%' }}
                />
                <div className="relative flex justify-between text-sm py-1 px-2">
                  <span className="text-green-400">${bid.price.toLocaleString()}</span>
                  <span className="text-white">{bid.amount.toFixed(4)}</span>
                  <span className="text-gray-300">{bid.total.toFixed(4)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="border-t border-gray-700 pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-gray-400">
            <span>Total Bids:</span>
            <span className="text-green-400">
              {bids.reduce((sum, bid) => sum + bid.amount, 0).toFixed(4)} {baseAsset}
            </span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Total Asks:</span>
            <span className="text-red-400">
              {asks.reduce((sum, ask) => sum + ask.amount, 0).toFixed(4)} {baseAsset}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}