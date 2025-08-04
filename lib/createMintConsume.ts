/**
 * Mint and Consume Tokens Library for Miden Network
 * TypeScript implementation based on the example provided
 */

import { ENV_CONFIG } from "./config";

/**
 * Creates accounts, faucets, and mints tokens
 * Based on the createMintConsume example
 */
export async function createMintConsume(): Promise<void> {
  if (typeof window === "undefined") {
    console.warn("createMintConsume() can only run in the browser");
    return;
  }

  try {
    // Dynamic import for browser-only execution
    const MidenSDK = await import("@demox-labs/miden-sdk");
    const { WebClient, AccountStorageMode, AccountId, NoteType } = MidenSDK;

    const nodeEndpoint = ENV_CONFIG.MIDEN_NODE_ENDPOINT;
    const client = await WebClient.createClient(nodeEndpoint);

    // 1. Sync and log block
    const state = await client.syncState();
    console.log("Latest block number:", state.blockNum());

    // 2. Create Alice's account
    console.log("Creating account for Alice…");
    const alice = await client.newWallet(AccountStorageMode.public(), true);
    console.log("Alice ID:", alice.id().toString());

    // 3. Deploy faucet
    console.log("Creating faucet…");
    const faucet = await client.newFaucet(
      AccountStorageMode.public(),
      false,
      "MID",
      8,
      BigInt(1_000_000),
    );
    console.log("Faucet ID:", faucet.id().toString());

    await client.syncState();

    // 4. Mint tokens to Alice
    await client.syncState();

    console.log("Minting tokens to Alice...");
    let mintTxRequest = client.newMintTransactionRequest(
      alice.id(),
      faucet.id(),
      NoteType.Public,
      BigInt(1000),
    );

    let txResult = await client.newTransaction(faucet.id(), mintTxRequest);

    await client.submitTransaction(txResult);

    console.log("Waiting 10 seconds for transaction confirmation...");
    await new Promise((resolve) => setTimeout(resolve, 10000));
    await client.syncState();

    // 5. Fetch minted notes
    const mintedNotes = await client.getConsumableNotes(alice.id());
    const mintedNoteIds = mintedNotes.map((n) =>
      n.inputNoteRecord().id().toString(),
    );
    console.log("Minted note IDs:", mintedNoteIds);

    // 6. Consume minted notes
    console.log("Consuming minted notes...");
    let consumeTxRequest = client.newConsumeTransactionRequest(mintedNoteIds);

    let txResult_2 = await client.newTransaction(alice.id(), consumeTxRequest);

    await client.submitTransaction(txResult_2);

    await client.syncState();
    console.log("Notes consumed.");

    // 7. Send tokens to Bob
    const bobAccountId = "0x599a54603f0cf9000000ed7a11e379";
    console.log("Sending tokens to Bob's account...");
    let sendTxRequest = client.newSendTransactionRequest(
      alice.id(),
      AccountId.fromHex(bobAccountId),
      faucet.id(),
      NoteType.Public,
      BigInt(100),
    );

    let txResult_3 = await client.newTransaction(alice.id(), sendTxRequest);

    await client.submitTransaction(txResult_3);

    console.log("Mint and consume process completed successfully! ✅");
  } catch (error) {
    console.error("Error in createMintConsume:", error);
    throw error;
  }
}

/**
 * Mints tokens using existing faucets from .env
 */
export async function mintTokensFromExistingFaucets(
  accountId: string,
  tokenType: "USDC" | "ETH",
  amount: number,
): Promise<void> {
  if (typeof window === "undefined") {
    console.warn("mintTokensFromExistingFaucets() can only run in the browser");
    return;
  }

  try {
    const MidenSDK = await import("@demox-labs/miden-sdk");
    const { WebClient, AccountId, NoteType } = MidenSDK;

    const client = await WebClient.createClient(ENV_CONFIG.MIDEN_NODE_ENDPOINT);
    await client.syncState();

    // Get the appropriate faucet ID
    const faucetId =
      tokenType === "USDC"
        ? ENV_CONFIG.USDC_FAUCET_ID
        : ENV_CONFIG.ETH_FAUCET_ID;
    const recipientId = AccountId.fromHex(accountId);
    const faucetAccountId = AccountId.fromHex(faucetId);

    console.log(
      `Minting ${amount} ${tokenType} tokens to account ${accountId}...`,
    );

    // Create mint transaction
    const mintTxRequest = client.newMintTransactionRequest(
      recipientId,
      faucetAccountId,
      NoteType.Public,
      BigInt(amount),
    );

    const txResult = await client.newTransaction(
      faucetAccountId,
      mintTxRequest,
    );
    await client.submitTransaction(txResult);

    console.log(`Successfully minted ${amount} ${tokenType} tokens! ✅`);
    console.log("Waiting for transaction confirmation...");

    // Wait for confirmation
    await new Promise((resolve) => setTimeout(resolve, 10000));
    await client.syncState();
  } catch (error) {
    console.error("Error minting tokens:", error);
    throw error;
  }
}

/**
 * Gets the balance of a specific token for an account
 */
export async function getTokenBalance(
  accountId: string,
  tokenType: "USDC" | "ETH",
): Promise<bigint> {
  if (typeof window === "undefined") {
    console.warn("getTokenBalance() can only run in the browser");
    return BigInt(0);
  }

  try {
    const MidenSDK = await import("@demox-labs/miden-sdk");
    const { WebClient, AccountId } = MidenSDK;

    const client = await WebClient.createClient(ENV_CONFIG.MIDEN_NODE_ENDPOINT);
    await client.syncState();

    const faucetId =
      tokenType === "USDC"
        ? ENV_CONFIG.USDC_FAUCET_ID
        : ENV_CONFIG.ETH_FAUCET_ID;
    const account = AccountId.fromHex(accountId);
    const faucetAccountId = AccountId.fromHex(faucetId);

    // Get account balance for the specific token
    const balance = await client.getAccountBalance(account, faucetAccountId);

    return balance;
  } catch (error) {
    console.error("Error getting token balance:", error);
    return BigInt(0);
  }
}
