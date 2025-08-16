import React from 'react';

export default function OpenOrders() {
  // Mock open orders data
  const mockOrders = [
    { id: 1, type: 'Buy', amount: '0.5', price: '44,500', total: '22,250', status: 'Partial' },
    { id: 2, type: 'Sell', amount: '0.3', price: '46,000', total: '13,800', status: 'Open' },
    { id: 3, type: 'Buy', amount: '1.0', price: '43,800', total: '43,800', status: 'Open' },
  ];

  return (
    <div className="bg-neutral-950 border border-zinc-800 rounded-lg p-4 h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Open Orders</h3>
        <button className="text-sm text-orange-400 hover:text-orange-300">
          View All
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-zinc-800">
              <th className="text-left py-2">Type</th>
              <th className="text-right py-2">Amount</th>
              <th className="text-right py-2">Price</th>
              <th className="text-right py-2">Total</th>
              <th className="text-right py-2">Status</th>
              <th className="text-right py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {mockOrders.map((order) => (
              <tr key={order.id} className="border-b border-zinc-800 hover:bg-zinc-900">
                <td className="py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    order.type === 'Buy' 
                      ? 'bg-green-900 text-green-300' 
                      : 'bg-red-900 text-red-300'
                  }`}>
                    {order.type}
                  </span>
                </td>
                <td className="text-right py-3 text-white">{order.amount} BTC</td>
                <td className="text-right py-3 text-white">${order.price}</td>
                <td className="text-right py-3 text-white">${order.total}</td>
                <td className="text-right py-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    order.status === 'Open' 
                      ? 'bg-blue-900 text-blue-300'
                      : 'bg-yellow-900 text-yellow-300'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="text-right py-3">
                  <button className="text-red-400 hover:text-red-300 text-xs">
                    Cancel
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {mockOrders.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          No open orders
        </div>
      )}
    </div>
  );
}