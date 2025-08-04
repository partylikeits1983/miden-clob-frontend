/**
 * Shared configuration for Miden CLOB frontend
 */

export const ENV_CONFIG = {
  USDC_FAUCET_ID: "0x9f79cc38536bb120342549f49c0d60",
  ETH_FAUCET_ID: "0x5154599567cddc201bca5404fb1a9d",
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
