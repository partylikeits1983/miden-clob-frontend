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
  refreshInterval = 8000,
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
      <div className="bg-neutral-950 border border-zinc-800 rounded-lg p-4 h-full flex items-center justify-center">
        <div className="text-white">Loading order book...</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-neutral-950 border border-zinc-800 rounded-lg p-4 h-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Order Book</h3>
          <button
            onClick={refresh}
            className="text-sm text-orange-400 hover:text-orange-300"
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
      <div className="bg-neutral-950 border border-zinc-800 rounded-lg p-4 h-full flex items-center justify-center">
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
    <div className="bg-neutral-950 border border-zinc-800 rounded-lg p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
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

      <div className="flex flex-col flex-1 min-h-0">
        <div className="grid grid-cols-12 gap-2 text-xs text-gray-400 mb-2 flex-shrink-0 px-2">
          <span className="col-span-4">Price (USD)</span>
          <span className="col-span-4 text-center">Amount (BTC)</span>
          <span className="col-span-4 text-right">Total</span>
        </div>
        
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Asks (Sell Orders) - reversed to show highest first */}
          {asks.slice().reverse().map((ask, index) => (
            <div key={`ask-${index}`} className="relative flex-shrink-0">
              <div
                className="absolute inset-0 bg-red-900 opacity-20"
                style={{ width: maxTotal > 0 ? `${(ask.total / maxTotal) * 100}%` : '0%' }}
              />
              <div className="relative grid grid-cols-12 gap-2 text-xs py-0.5 px-2">
                <span className="col-span-4 text-red-400">${ask.price.toLocaleString()}</span>
                <span className="col-span-4 text-white text-center">{ask.amount.toFixed(4)}</span>
                <span className="col-span-4 text-gray-300 text-right">{ask.total.toFixed(4)}</span>
              </div>
            </div>
          ))}
          
          {/* Bids (Buy Orders) */}
          {bids.map((bid, index) => (
            <div key={`bid-${index}`} className="relative flex-shrink-0">
              <div
                className="absolute inset-0 bg-green-900 opacity-20"
                style={{ width: maxTotal > 0 ? `${(bid.total / maxTotal) * 100}%` : '0%' }}
              />
              <div className="relative grid grid-cols-12 gap-2 text-xs py-0.5 px-2">
                <span className="col-span-4 text-green-400">${bid.price.toLocaleString()}</span>
                <span className="col-span-4 text-white text-center">{bid.amount.toFixed(4)}</span>
                <span className="col-span-4 text-gray-300 text-right">{bid.total.toFixed(4)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="border-t border-gray-700 pt-4 space-y-2 text-sm flex-shrink-0 mt-2">
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