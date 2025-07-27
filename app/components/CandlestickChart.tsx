import React from 'react';

export default function CandlestickChart() {
  // Mock candlestick data
  const mockData = [
    { open: 100, high: 110, low: 95, close: 105, time: '09:00' },
    { open: 105, high: 115, low: 100, close: 112, time: '10:00' },
    { open: 112, high: 118, low: 108, close: 115, time: '11:00' },
    { open: 115, high: 120, low: 110, close: 108, time: '12:00' },
    { open: 108, high: 113, low: 105, close: 111, time: '13:00' },
  ];

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">BTC/USD</h3>
        <div className="flex space-x-2">
          <span className="text-2xl font-bold text-green-400">$45,234.56</span>
          <span className="text-green-400">+2.34%</span>
        </div>
      </div>
      
      <div className="flex justify-between text-sm text-gray-400 mb-4">
        <div>
          <span className="block">24h High</span>
          <span className="text-white">$46,123.45</span>
        </div>
        <div>
          <span className="block">24h Low</span>
          <span className="text-white">$44,567.89</span>
        </div>
        <div>
          <span className="block">Volume</span>
          <span className="text-white">1,234.56 BTC</span>
        </div>
      </div>

      {/* Mock Chart Area */}
      <div className="bg-gray-900 rounded p-4 h-64 flex items-end justify-between">
        {mockData.map((candle, index) => {
          const isGreen = candle.close > candle.open;
          const bodyHeight = Math.abs(candle.close - candle.open) * 2;
          const wickTop = (candle.high - Math.max(candle.open, candle.close)) * 2;
          const wickBottom = (Math.min(candle.open, candle.close) - candle.low) * 2;
          
          return (
            <div key={index} className="flex flex-col items-center">
              <div className="text-xs text-gray-400 mb-2">{candle.time}</div>
              <div className="flex flex-col items-center">
                {/* Top wick */}
                <div 
                  className={`w-0.5 ${isGreen ? 'bg-green-400' : 'bg-red-400'}`}
                  style={{ height: `${wickTop}px` }}
                />
                {/* Body */}
                <div 
                  className={`w-4 ${isGreen ? 'bg-green-400' : 'bg-red-400'}`}
                  style={{ height: `${Math.max(bodyHeight, 2)}px` }}
                />
                {/* Bottom wick */}
                <div 
                  className={`w-0.5 ${isGreen ? 'bg-green-400' : 'bg-red-400'}`}
                  style={{ height: `${wickBottom}px` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between mt-4 text-sm">
        <button className="text-gray-400 hover:text-white">1m</button>
        <button className="text-gray-400 hover:text-white">5m</button>
        <button className="text-white bg-blue-600 px-2 py-1 rounded">15m</button>
        <button className="text-gray-400 hover:text-white">1h</button>
        <button className="text-gray-400 hover:text-white">4h</button>
        <button className="text-gray-400 hover:text-white">1d</button>
      </div>
    </div>
  );
}