/**
 * Account Creation and Token Minting Module
 *
 * This module provides functionality to create new Miden accounts and mint
 * initial tokens using pre-configured faucets from environment variables.
 */

import { ENV_CONFIG } from "./config";

// Constants for token amounts
const USDC_MINT_AMOUNT = BigInt(100000);
const ETH_MINT_AMOUNT = BigInt(100000);
const TRANSACTION_CONFIRMATION_DELAY = 10000; // 10 seconds

/**
 * Response type for account creation and minting operation
 */
export interface CreateAccountResult {
  accountId: string;
  success: boolean;
  message: string;
}

/**
 * Helper function to import and retrieve a faucet account
 */
async function importFaucetAccount(
  client: any,
  faucetId: any,
  faucetName: string,
): Promise<any> {
  let faucet = await client.getAccount(faucetId);

  if (!faucet) {
    console.log(`Importing ${faucetName} faucet...`);
    await client.importAccountById(faucetId);
    await client.syncState();

    faucet = await client.getAccount(faucetId);
    if (!faucet) {
      throw new Error(
        `${faucetName} faucet not found after import: ${faucetId}`,
      );
    }
    console.log(`${faucetName} faucet imported successfully`);
  }

  return faucet;
}

/**
 * Helper function to mint tokens from a faucet to a target account
 */
async function mintTokens(
  client: any,
  prover: any,
  targetAccountId: any,
  faucetId: any,
  amount: bigint,
  tokenName: string,
  NoteType: any,
): Promise<void> {
  console.log(`Minting ${amount} ${tokenName} tokens to account...`);

  const mintTxRequest = client.newMintTransactionRequest(
    targetAccountId,
    faucetId,
    NoteType.Public,
    amount,
  );

  const txResult = await client.newTransaction(faucetId, mintTxRequest);
  await client.submitTransaction(txResult, prover);

  console.log(`${tokenName} mint transaction submitted`);
}

/**
 * Helper function to consume minted notes
 */
async function consumeMintedNotes(
  client: any,
  prover: any,
  account: any,
): Promise<void> {
  const mintedNotes = await client.getConsumableNotes(account.id());
  const mintedNoteIds = mintedNotes.map((note: any) =>
    note.inputNoteRecord().id().toString(),
  );

  console.log(`Found ${mintedNoteIds.length} consumable notes`);

  if (mintedNoteIds.length > 0) {
    console.log("Consuming minted notes...");
    const consumeTxRequest = client.newConsumeTransactionRequest(mintedNoteIds);
    const consumeTxResult = await client.newTransaction(
      account.id(),
      consumeTxRequest,
    );
    await client.submitTransaction(consumeTxResult, prover);
    await client.syncState();
    console.log("Notes consumed successfully");
  }
}

/**
 * Creates a new Miden account and mints initial tokens using existing faucets
 *
 * This function performs the following operations:
 * 1. Creates a new public Miden wallet
 * 2. Imports USDC and ETH faucets from environment configuration
 * 3. Mints initial USDC and ETH tokens to the new account
 * 4. Consumes the minted notes to make tokens available
 * 5. Saves the account ID to localStorage and dispatches update event
 *
 * @returns Promise<CreateAccountResult> - Result containing account ID and operation status
 */
export async function createAccountAndMint(): Promise<CreateAccountResult> {
  // Browser-only check
  if (typeof window === "undefined") {
    console.warn("createAccountAndMint() can only run in the browser");
    return {
      accountId: "",
      success: false,
      message: "Function can only run in browser environment",
    };
  }

  try {
    // Dynamic import for browser-only execution
    const MidenSDK = await import("@demox-labs/miden-sdk");
    const {
      WebClient,
      AccountStorageMode,
      AccountId,
      NoteType,
      TransactionProver,
    } = MidenSDK;

    // Initialize Miden client and delegated prover
    const client = await WebClient.createClient(ENV_CONFIG.MIDEN_NODE_ENDPOINT);
    const prover = TransactionProver.newRemoteProver(
      ENV_CONFIG.TX_PROVER_ENDPOINT,
    );

    // Sync with latest blockchain state
    const state = await client.syncState();
    console.log("Synced to block number:", state.blockNum());

    // Create new account
    console.log("Creating new Miden account...");
    const newAccount = await client.newWallet(
      AccountStorageMode.public(),
      true,
    );
    const accountId = newAccount.id().toString();
    console.log("New Account ID:", accountId);

    await client.syncState();

    // Parse faucet IDs from environment configuration
    const usdcFaucetId = AccountId.fromBech32(ENV_CONFIG.USDC_FAUCET_ID);
    const ethFaucetId = AccountId.fromBech32(ENV_CONFIG.ETH_FAUCET_ID);

    // Import faucet accounts
    await importFaucetAccount(client, usdcFaucetId, "USDC");
    await importFaucetAccount(client, ethFaucetId, "ETH");

    // Mint tokens from both faucets
    await mintTokens(
      client,
      prover,
      newAccount.id(),
      usdcFaucetId,
      USDC_MINT_AMOUNT,
      "USDC",
      NoteType,
    );

    await mintTokens(
      client,
      prover,
      newAccount.id(),
      ethFaucetId,
      ETH_MINT_AMOUNT,
      "ETH",
      NoteType,
    );

    // Wait for transaction confirmation
    console.log(
      `Waiting ${TRANSACTION_CONFIRMATION_DELAY / 1000} seconds for transaction confirmation...`,
    );
    await new Promise((resolve) =>
      setTimeout(resolve, TRANSACTION_CONFIRMATION_DELAY),
    );
    await client.syncState();

    // Consume minted notes to make tokens available
    await consumeMintedNotes(client, prover, newAccount);

    // Persist account ID and notify application
    localStorage.setItem("midenAccountId", accountId);
    window.dispatchEvent(new CustomEvent("accountUpdated"));

    return {
      accountId,
      success: true,
      message: `Successfully created account ${accountId} and minted tokens!`,
    };
  } catch (error) {
    console.error("Error creating account and minting tokens:", error);
    return {
      accountId: "",
      success: false,
      message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
