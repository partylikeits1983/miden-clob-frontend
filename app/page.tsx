"use client";

import NavigationHeader from "./components/NavigationHeader";
import BuySellPanel from "./components/BuySellPanel";
import TradingViewChart from "./components/TradingViewChart";
import OpenOrders from "./components/OpenOrders";
import OrderDepthChart from "./components/OrderDepthChart";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation Header */}
      <NavigationHeader />

      {/* Main Trading Layout */}
      <div className="flex h-[calc(100vh-80px)] gap-4 p-4">
        {/* Left Panel - Buy/Sell */}
        <div className="w-80 flex-shrink-0">
          <BuySellPanel />
        </div>

        {/* Center Panel - Charts and Orders */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Top - TradingView Chart */}
          <div className="flex-1">
            <TradingViewChart />
          </div>

          {/* Bottom - Open Orders */}
          <div className="h-64">
            <OpenOrders />
          </div>
        </div>

        {/* Right Panel - Order Depth Chart */}
        <div className="w-96 flex-shrink-0">
          <OrderDepthChart />
        </div>
      </div>
    </div>
  );
}
