/**
 * Shared configuration for Miden CLOB frontend
 */

export const ENV_CONFIG = {
  USDC_FAUCET_ID: "mtst1qr8tclqegm7q2gpggsshun4m4q60wusa",
  ETH_FAUCET_ID: "mtst1qpdn79q7lmr2vgpns7jxjq4xcceucqkf",
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
