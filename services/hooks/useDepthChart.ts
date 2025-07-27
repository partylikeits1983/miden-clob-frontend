import { useState, useEffect, useCallback } from 'react';
import { depthChartService, DepthChartData } from '../depthChartService';

interface UseDepthChartOptions {
  baseAsset?: string;
  quoteAsset?: string;
  refreshInterval?: number; // in milliseconds
  autoRefresh?: boolean;
}

interface UseDepthChartReturn {
  data: DepthChartData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useDepthChart = (options: UseDepthChartOptions = {}): UseDepthChartReturn => {
  const {
    baseAsset = 'ETH',
    quoteAsset = 'USDC',
    refreshInterval = 2000, // 2 seconds default
    autoRefresh = true
  } = options;

  const [data, setData] = useState<DepthChartData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const depthData = await depthChartService.getDepthChartData(baseAsset, quoteAsset);
      setData(depthData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch depth chart data';
      setError(errorMessage);
      console.error('Error fetching depth chart data:', err);
    } finally {
      setLoading(false);
    }
  }, [baseAsset, quoteAsset]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchData();
  }, [fetchData]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchData]);

  return {
    data,
    loading,
    error,
    refresh
  };
};

export default useDepthChart;