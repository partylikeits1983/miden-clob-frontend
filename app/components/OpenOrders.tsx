import React, { useState, useEffect } from "react";
import { ENV_CONFIG } from "../../lib/config";

interface UserOrder {
  id: string;
  note_id: string;
  side: string; // "buy" or "sell"
  price: number;
  quantity: number;
  filled_quantity: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function OpenOrders() {
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);

  // Check for account ID from localStorage
  useEffect(() => {
    const checkForAccountId = () => {
      const savedAccountId = localStorage.getItem("midenAccountId");
      if (savedAccountId !== accountId) {
        setAccountId(savedAccountId);
      }
    };

    // Initial check
    checkForAccountId();

    // Listen for storage events and custom events
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "midenAccountId") {
        checkForAccountId();
      }
    };

    const handleAccountUpdate = () => {
      checkForAccountId();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("accountUpdated", handleAccountUpdate);

    // Check periodically
    const interval = setInterval(checkForAccountId, 2000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("accountUpdated", handleAccountUpdate);
      clearInterval(interval);
    };
  }, [accountId]);

  // Fetch user orders from CLOB server
  const fetchUserOrders = async () => {
    if (!accountId) {
      setOrders([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${ENV_CONFIG.SERVER_URL}/orders/user?user_id=${encodeURIComponent(accountId)}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.error("Error fetching user orders:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch orders when account ID changes
  useEffect(() => {
    fetchUserOrders();
  }, [accountId]);

  // Auto-refresh orders every 10 seconds
  useEffect(() => {
    if (!accountId) return;

    const interval = setInterval(fetchUserOrders, 10000);
    return () => clearInterval(interval);
  }, [accountId]);

  // Listen for new order creation events
  useEffect(() => {
    const handleOrderCreated = () => {
      // Refresh orders when a new order is created
      // Add a small delay to allow the server to process the order
      setTimeout(fetchUserOrders, 2000);
    };

    window.addEventListener("orderCreated", handleOrderCreated);
    return () => window.removeEventListener("orderCreated", handleOrderCreated);
  }, []);

  const handleCancelOrder = async (orderId: string) => {
    // TODO: Implement order cancellation
    console.log("Cancel order:", orderId);
    // For now, just refresh the orders
    await fetchUserOrders();
  };


  const formatQuantity = (order: UserOrder) => {
    if (order.side === "buy") {
      // Buy order: quantity is USDC amount, we need ETH amount
      // From the raw data: quantity=4500 (USDC), price=0.00022... (wrong)
      // ETH amount = USDC amount / actual_price = 4500 / 4500 = 1 ETH
      const actualPrice = 1 / order.price; // Fix the inverted price
      const ethAmount = order.quantity / actualPrice;
      return ethAmount.toFixed(4);
    } else {
      // Sell order: quantity is already ETH amount
      const ethAmount = order.quantity;
      return ethAmount.toFixed(4);
    }
  };

  const formatPrice = (order: UserOrder) => {
    if (order.side === "buy") {
      // Buy order: price is inverted, fix it
      const actualPrice = 1 / order.price;
      return actualPrice.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } else {
      // Sell order: price is correct
      return order.price.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
  };

  const calculateTotal = (order: UserOrder) => {
    if (order.side === "buy") {
      // Buy order: total = USDC amount being offered
      return order.quantity.toFixed(2);
    } else {
      // Sell order: total = ETH amount * price
      return (order.quantity * order.price).toFixed(2);
    }
  };

  return (
    <div className="bg-neutral-950 border border-zinc-800 rounded-lg p-4 h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Open Orders</h3>
        <div className="flex items-center gap-2">
          {loading && (
            <div className="text-xs text-gray-400">Loading...</div>
          )}
          <button
            onClick={fetchUserOrders}
            className="text-sm text-orange-400 hover:text-orange-300"
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-2 bg-red-900/20 border border-red-800 rounded text-red-300 text-sm">
          {error}
        </div>
      )}

      {!accountId && (
        <div className="text-center py-8 text-gray-400">
          Please create an account in the Mint page to view your orders
        </div>
      )}

      {accountId && (
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
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-zinc-800 hover:bg-zinc-900"
                >
                  <td className="py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        order.side === "buy"
                          ? "bg-green-900 text-green-300"
                          : "bg-red-900 text-red-300"
                      }`}
                    >
                      {order.side === "buy" ? "Buy" : "Sell"}
                    </span>
                  </td>
                  <td className="text-right py-3 text-white">
                    {formatQuantity(order)} ETH
                  </td>
                  <td className="text-right py-3 text-white">
                    ${formatPrice(order)}
                  </td>
                  <td className="text-right py-3 text-white">
                    ${calculateTotal(order)}
                  </td>
                  <td className="text-right py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        order.status === "Open"
                          ? "bg-blue-900 text-blue-300"
                          : order.status === "Partial"
                            ? "bg-yellow-900 text-yellow-300"
                            : "bg-gray-900 text-gray-300"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="text-right py-3">
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      className="text-red-400 hover:text-red-300 text-xs"
                      disabled={order.status !== "Open"}
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {accountId && orders.length === 0 && !loading && !error && (
        <div className="text-center py-8 text-gray-400">
          No open orders. Create your first order using the Buy/Sell panel.
        </div>
      )}
    </div>
  );
}
