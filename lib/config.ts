/**
 * Shared configuration for Miden CLOB frontend
 */

export const ENV_CONFIG = {
  USDC_FAUCET_ID: "mtst1qrh4vgtanl782gphgg7t5sz2hv57pcdv",
  ETH_FAUCET_ID: "mtst1qrh4vgtanl782gphgg7t5sz2hv57pcdv",
  MIDEN_NODE_ENDPOINT: "https://rpc.testnet.miden.io:443",
  SERVER_URL: "http://localhost:8080",
  TX_PROVER_ENDPOINT: "https://tx-prover.testnet.miden.io",
};

export const MARKET_CONFIG = {
  SPREAD_PERCENTAGE: 0.0001,
  NUM_LEVELS: 2,
  BASE_QUANTITY: 0.01,
  QUANTITY_VARIANCE: 0.1,
  PRICE_VARIANCE: 0.003,
  UPDATE_INTERVAL_SECS: 1,
};
