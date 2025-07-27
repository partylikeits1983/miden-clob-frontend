export interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

export interface DepthChartData {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  spread: number;
  spread_percentage: number;
  last_price: number;
}

export interface RawSwapNoteRecord {
  id: string;
  note_id: string;
  creator_id: string;
  offered_asset_id: string;
  offered_amount: number;
  requested_asset_id: string;
  requested_amount: number;
  price: number;
  is_bid: boolean;
  note_data: string;
  status: string;
  failure_count: number;
  created_at: string;
  updated_at: string;
}

class DepthChartService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8080') {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetches processed depth chart data from the Rust backend
   */
  async getDepthChartData(
    baseAsset: string = 'ETH',
    quoteAsset: string = 'USDC'
  ): Promise<DepthChartData> {
    try {
      console.log(`Attempting to fetch depth chart data from: ${this.baseUrl}/api/depth-chart?base=${baseAsset}&quote=${quoteAsset}`);
      
      const response = await fetch(
        `${this.baseUrl}/api/depth-chart?base=${baseAsset}&quote=${quoteAsset}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // Add timeout to fail faster
          signal: AbortSignal.timeout(5000), // 5 second timeout
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Successfully fetched depth chart data from Rust backend:', data);
      
      // The Rust backend returns the data in the exact format we need
      return {
        bids: data.bids || [],
        asks: data.asks || [],
        spread: data.spread || 0,
        spread_percentage: data.spread_percentage || 0,
        last_price: data.last_price || 0
      };
    } catch (error) {
      console.warn('Rust backend not available, falling back to mock data:', error);
      // Return mock data as fallback when backend is not available
      return this.getMockDepthChartData();
    }
  }

  /**
   * Processes raw swap note records into depth chart format
   * This function mimics the Rust processing logic
   */
  processRawOrdersToDepthChart(
    rawOrders: RawSwapNoteRecord[],
    usdcFaucetId: string,
    ethFaucetId: string
  ): DepthChartData {
    const bids: Array<{ price: number; amount: number }> = [];
    const asks: Array<{ price: number; amount: number }> = [];

    // Process each order
    for (const order of rawOrders) {
      if (order.status !== 'open') continue;

      const offeredAmount = order.offered_amount;
      const requestedAmount = order.requested_amount;
      
      // Skip orders with zero amounts
      if (offeredAmount === 0 || requestedAmount === 0) continue;

      // Determine if this is a bid or ask based on asset IDs
      if (order.offered_asset_id === usdcFaucetId && order.requested_asset_id === ethFaucetId) {
        // Bid: offering USDC for ETH
        const price = offeredAmount / requestedAmount; // USDC per ETH
        const ethAmount = requestedAmount / 1e8; // Convert from smallest unit
        bids.push({ price, amount: ethAmount });
      } else if (order.offered_asset_id === ethFaucetId && order.requested_asset_id === usdcFaucetId) {
        // Ask: offering ETH for USDC
        const price = requestedAmount / offeredAmount; // USDC per ETH
        const ethAmount = offeredAmount / 1e8; // Convert from smallest unit
        asks.push({ price, amount: ethAmount });
      }
    }

    // Sort bids by price (descending - highest first)
    bids.sort((a, b) => b.price - a.price);
    
    // Sort asks by price (ascending - lowest first)
    asks.sort((a, b) => a.price - b.price);

    // Calculate cumulative totals
    const processedBids = this.calculateCumulativeTotals(bids);
    const processedAsks = this.calculateCumulativeTotals(asks);

    // Calculate spread
    const bestBid = processedBids.length > 0 ? processedBids[0].price : 0;
    const bestAsk = processedAsks.length > 0 ? processedAsks[0].price : 0;
    const spread = bestAsk - bestBid;
    const spreadPercentage = bestBid > 0 ? (spread / bestBid) * 100 : 0;
    const lastPrice = bestBid > 0 && bestAsk > 0 ? (bestBid + bestAsk) / 2 : 45234.56;

    return {
      bids: processedBids,
      asks: processedAsks,
      spread,
      spread_percentage: spreadPercentage,
      last_price: lastPrice
    };
  }

  /**
   * Calculate cumulative totals for order book entries
   */
  private calculateCumulativeTotals(orders: Array<{ price: number; amount: number }>): OrderBookEntry[] {
    let cumulativeTotal = 0;
    
    return orders.map(order => {
      cumulativeTotal += order.amount;
      return {
        price: order.price,
        amount: order.amount,
        total: cumulativeTotal
      };
    });
  }

  /**
   * Fallback mock data for development/testing
   */
  private getMockDepthChartData(): DepthChartData {
    const mockBids: OrderBookEntry[] = [
      { price: 45200, amount: 0.5, total: 0.5 },
      { price: 45150, amount: 0.8, total: 1.3 },
      { price: 45100, amount: 1.2, total: 2.5 },
      { price: 45050, amount: 0.7, total: 3.2 },
      { price: 45000, amount: 1.5, total: 4.7 },
    ];

    const mockAsks: OrderBookEntry[] = [
      { price: 45250, amount: 0.6, total: 0.6 },
      { price: 45300, amount: 0.9, total: 1.5 },
      { price: 45350, amount: 1.1, total: 2.6 },
      { price: 45400, amount: 0.8, total: 3.4 },
      { price: 45450, amount: 1.3, total: 4.7 },
    ];

    return {
      bids: mockBids,
      asks: mockAsks,
      spread: 50,
      spread_percentage: 0.11,
      last_price: 45234.56
    };
  }
}

// Export singleton instance
export const depthChartService = new DepthChartService();
export default DepthChartService;