import React from 'react';

export default function OrderDepthChart() {
  // Mock order book data
  const mockBids = [
    { price: 45200, amount: 0.5, total: 0.5 },
    { price: 45150, amount: 0.8, total: 1.3 },
    { price: 45100, amount: 1.2, total: 2.5 },
    { price: 45050, amount: 0.7, total: 3.2 },
    { price: 45000, amount: 1.5, total: 4.7 },
  ];

  const mockAsks = [
    { price: 45250, amount: 0.6, total: 0.6 },
    { price: 45300, amount: 0.9, total: 1.5 },
    { price: 45350, amount: 1.1, total: 2.6 },
    { price: 45400, amount: 0.8, total: 3.4 },
    { price: 45450, amount: 1.3, total: 4.7 },
  ];

  const maxTotal = Math.max(
    Math.max(...mockBids.map(b => b.total)),
    Math.max(...mockAsks.map(a => a.total))
  );

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Order Book</h3>
        <div className="text-sm text-gray-400">
          Spread: $50.00 (0.11%)
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
            {mockAsks.reverse().map((ask, index) => (
              <div key={index} className="relative">
                <div 
                  className="absolute inset-0 bg-red-900 opacity-20"
                  style={{ width: `${(ask.total / maxTotal) * 100}%` }}
                />
                <div className="relative flex justify-between text-sm py-1 px-2">
                  <span className="text-red-400">${ask.price.toLocaleString()}</span>
                  <span className="text-white">{ask.amount}</span>
                  <span className="text-gray-300">{ask.total}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Current Price */}
        <div className="text-center py-2 border-y border-gray-700">
          <div className="text-lg font-bold text-green-400">$45,234.56</div>
          <div className="text-xs text-gray-400">Last Price</div>
        </div>

        {/* Bids (Buy Orders) */}
        <div>
          <div className="space-y-1">
            {mockBids.map((bid, index) => (
              <div key={index} className="relative">
                <div 
                  className="absolute inset-0 bg-green-900 opacity-20"
                  style={{ width: `${(bid.total / maxTotal) * 100}%` }}
                />
                <div className="relative flex justify-between text-sm py-1 px-2">
                  <span className="text-green-400">${bid.price.toLocaleString()}</span>
                  <span className="text-white">{bid.amount}</span>
                  <span className="text-gray-300">{bid.total}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="border-t border-gray-700 pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-gray-400">
            <span>Total Bids:</span>
            <span className="text-green-400">{mockBids.reduce((sum, bid) => sum + bid.amount, 0).toFixed(2)} BTC</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Total Asks:</span>
            <span className="text-red-400">{mockAsks.reduce((sum, ask) => sum + ask.amount, 0).toFixed(2)} BTC</span>
          </div>
        </div>
      </div>
    </div>
  );
}