import React, { useState } from 'react';

export default function BuySellPanel() {
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 h-full">
      <div className="flex mb-4">
        <button
          onClick={() => setActiveTab('buy')}
          className={`flex-1 py-2 px-4 rounded-l-lg font-medium transition-colors ${
            activeTab === 'buy'
              ? 'bg-green-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setActiveTab('sell')}
          className={`flex-1 py-2 px-4 rounded-r-lg font-medium transition-colors ${
            activeTab === 'sell'
              ? 'bg-red-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Sell
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Price
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Amount
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="text-sm text-gray-400">
          <div className="flex justify-between">
            <span>Total:</span>
            <span>${(parseFloat(price || '0') * parseFloat(amount || '0')).toFixed(2)}</span>
          </div>
        </div>

        <button
          className={`w-full py-3 rounded font-medium transition-colors ${
            activeTab === 'buy'
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          {activeTab === 'buy' ? 'Place Buy Order' : 'Place Sell Order'}
        </button>

        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>Available:</span>
            <span>$10,000.00</span>
          </div>
          <div className="flex justify-between">
            <span>Fee:</span>
            <span>0.1%</span>
          </div>
        </div>
      </div>
    </div>
  );
}