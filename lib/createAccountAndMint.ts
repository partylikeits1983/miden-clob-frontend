/**
 * Create Account and Mint Tokens using existing faucets
 * Creates a new account and mints tokens using the existing faucets from .env
 */

import { ENV_CONFIG } from "./config";

/**
 * Creates a new account and mints tokens using existing faucets
 */
export async function createAccountAndMint(): Promise<{
  accountId: string;
  success: boolean;
  message: string;
}> {
  if (typeof window === "undefined") {
    console.warn("createAccountAndMint() can only run in the browser");
    return {
      accountId: "",
      success: false,
      message: "Can only run in browser",
    };
  }

  try {
    // Dynamic import for browser-only execution
    const MidenSDK = await import("@demox-labs/miden-sdk");
    const { WebClient, AccountStorageMode, AccountId, NoteType } = MidenSDK;

    const client = await WebClient.createClient(ENV_CONFIG.MIDEN_NODE_ENDPOINT);

    // 1. Sync and log block
    const state = await client.syncState();
    console.log("Latest block number:", state.blockNum());

    // 2. Create new account
    console.log("Creating new account...");
    const newAccount = await client.newWallet(
      AccountStorageMode.public(),
      true,
    );
    const accountId = newAccount.id().toString();
    console.log("New Account ID:", accountId);

    await client.syncState();

    // 3. Use existing faucets from .env
    const usdcFaucetId = AccountId.fromBech32(ENV_CONFIG.USDC_FAUCET_ID);
    const ethFaucetId = AccountId.fromBech32(ENV_CONFIG.ETH_FAUCET_ID);

    // Import the counter contract
    let usdcFaucet = await client.getAccount(usdcFaucetId);
    if (!usdcFaucet) {
      console.log("here", usdcFaucetId);
      await client.importAccountById(usdcFaucetId);
      console.log("HEre2");
      await client.syncState();
      usdcFaucet = await client.getAccount(usdcFaucetId);
      if (!usdcFaucet) {
        throw new Error(`Account not found after import: ${usdcFaucetId}`);
      }
    }

    // await client.importAccountById(ethFaucetId);

    // 4. Mint USDC tokens to the new account
    console.log("Minting 1000 USDC tokens to new account...");
    let usdcMintTxRequest = client.newMintTransactionRequest(
      newAccount.id(),
      usdcFaucetId,
      NoteType.Public,
      BigInt(1000),
    );

    let usdcTxResult = await client.newTransaction(
      usdcFaucetId,
      usdcMintTxRequest,
    );
    await client.submitTransaction(usdcTxResult);

    // 5. Mint ETH tokens to the new account
    console.log("Minting 1 ETH tokens to new account...");
    let ethMintTxRequest = client.newMintTransactionRequest(
      newAccount.id(),
      ethFaucetId,
      NoteType.Public,
      BigInt(1),
    );

    let ethTxResult = await client.newTransaction(
      ethFaucetId,
      ethMintTxRequest,
    );
    await client.submitTransaction(ethTxResult);

    console.log("Waiting 10 seconds for transaction confirmation...");
    await new Promise((resolve) => setTimeout(resolve, 10000));
    await client.syncState();

    // 6. Fetch and consume minted notes
    const mintedNotes = await client.getConsumableNotes(newAccount.id());
    const mintedNoteIds = mintedNotes.map((n: any) =>
      n.inputNoteRecord().id().toString(),
    );
    console.log("Minted note IDs:", mintedNoteIds);

    if (mintedNoteIds.length > 0) {
      console.log("Consuming minted notes...");
      let consumeTxRequest = client.newConsumeTransactionRequest(mintedNoteIds);
      let consumeTxResult = await client.newTransaction(
        newAccount.id(),
        consumeTxRequest,
      );
      await client.submitTransaction(consumeTxResult);
      await client.syncState();
      console.log("Notes consumed.");
    }

    // Save account ID to localStorage for use across the application
    localStorage.setItem("midenAccountId", accountId);

    // Dispatch custom event to notify other components
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("accountUpdated"));
    }

    return {
      accountId,
      success: true,
      message: `Successfully created account ${accountId} and minted tokens!`,
    };
  } catch (error) {
    console.error("Error creating account and minting:", error);
    return {
      accountId: "",
      success: false,
      message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
