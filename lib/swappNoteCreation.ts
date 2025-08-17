/**
 * SWAPP Note Creation Library for Miden Network
 * TypeScript implementation based on the Rust logic from CLOB/src/bin/populate.rs
 */

import { ENV_CONFIG, MARKET_CONFIG } from "./config";

/**
 * Loads the SWAPP Note Script from the external MASM file
 * @returns Promise<string> The MASM script content
 */
async function loadSwappNoteScript(): Promise<string> {
  try {
    const response = await fetch("/SWAPP.masm");
    if (!response.ok) {
      throw new Error(`Failed to load SWAPP.masm: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.error("Error loading SWAPP.masm:", error);
    throw error;
  }
}

/**
 * Creates a SWAPP note for trading on the Miden Network
 * Based on the price_to_swap_note function from CLOB/src/common.rs
 */
export async function createSwappNote(
  creatorAccountId: string,
  isBid: boolean,
  price: number,
  quantity: number,
  ethPrice?: number,
): Promise<any> {
  // Ensure this runs only in a browser context
  if (typeof window === "undefined") {
    console.warn("createSwappNote() can only run in the browser");
    return;
  }

  try {
    // Dynamic import for browser-only execution
    const MidenSDK = await import("@demox-labs/miden-sdk");
    const {
      WebClient,
      AccountId,
      NoteType,
      TransactionProver,
      NoteInputs,
      Note,
      NoteAssets,
      NoteRecipient,
      Word,
      OutputNotesArray,
      NoteExecutionHint,
      NoteTag,
      NoteMetadata,
      FeltArray,
      Felt,
      FungibleAsset,
      TransactionRequestBuilder,
      OutputNote,
    } = MidenSDK;

    const client = await WebClient.createClient(ENV_CONFIG.MIDEN_NODE_ENDPOINT);
    const prover = TransactionProver.newRemoteProver(
      ENV_CONFIG.TX_PROVER_ENDPOINT,
    );

    console.log("Latest block:", (await client.syncState()).blockNum());
    console.log("HERE");

    // Parse account IDs
    const creatorId = AccountId.fromHex(creatorAccountId);
    const usdcFaucetId = AccountId.fromBech32(ENV_CONFIG.USDC_FAUCET_ID);
    const ethFaucetId = AccountId.fromBech32(ENV_CONFIG.ETH_FAUCET_ID);

    // Calculate offered and requested assets based on bid/ask
    let offeredAsset: any;
    let requestedAsset: any;

    if (isBid) {
      // Buying ETH with USDC: offer USDC, request ETH
      const usdcAmount = BigInt(10); // Convert to smaller units
      const ethAmount = BigInt(10); // Convert to smaller units

      offeredAsset = new FungibleAsset(usdcFaucetId, usdcAmount);
      requestedAsset = new FungibleAsset(ethFaucetId, ethAmount);
    } else {
      // Selling ETH for USDC: offer ETH, request USDC
      const ethAmount = BigInt(10); // Convert to smaller units
      const usdcAmount = BigInt(10); // Convert to smaller units

      offeredAsset = new FungibleAsset(ethFaucetId, ethAmount);
      requestedAsset = new FungibleAsset(usdcFaucetId, usdcAmount);
    }

    // Generate random serial number
    const serialNumber = Word.newFromFelts([
      new Felt(BigInt(Math.floor(Math.random() * 0x1_0000_0000))),
      new Felt(BigInt(Math.floor(Math.random() * 0x1_0000_0000))),
      new Felt(BigInt(Math.floor(Math.random() * 0x1_0000_0000))),
      new Felt(BigInt(Math.floor(Math.random() * 0x1_0000_0000))),
    ]);

    // Load and compile the SWAPP note script
    const swappNoteScript = await loadSwappNoteScript();
    const script = client.compileNoteScript(swappNoteScript);

    // Create note assets
    const assets = new NoteAssets([offeredAsset]);

    // Build swap tag and P2ID tag
    const swappTag = NoteTag.fromAccountId(creatorId);
    const p2idTag = NoteTag.fromAccountId(creatorId);

    console.log("159");

    const inputs = new NoteInputs(
      new FeltArray([
        new Felt(requestedAsset.amount()),
        new Felt(BigInt(0)),
        new Felt(requestedAsset.faucetId().prefix().asInt()),
        new Felt(requestedAsset.faucetId().suffix().asInt()),
        new Felt(BigInt(swappTag.asU32())),
        new Felt(BigInt(p2idTag.asU32())),
        new Felt(BigInt(0)),
        new Felt(BigInt(0)),
        new Felt(BigInt(0)), // swap_count starts at 0
        new Felt(BigInt(0)),
        new Felt(BigInt(0)),
        new Felt(BigInt(0)),
        new Felt(creatorId.prefix().asInt()),
        new Felt(creatorId.suffix().asInt()),
      ]),
    );

    console.log("165");

    // Create note metadata
    const metadata = new NoteMetadata(
      creatorId,
      NoteType.Public,
      swappTag,
      NoteExecutionHint.always(),
    );

    // Create note recipient
    const recipient = new NoteRecipient(serialNumber, script, inputs);

    // Create the SWAPP note
    const swappNote = new Note(assets, metadata, recipient);
    console.log("HERE2", swappNote.id());

    console.log(`Creating ${isBid ? "BID" : "ASK"} SWAPP note:`);
    console.log(`- Price: ${price} USDC per ETH`);
    console.log(`- Quantity: ${quantity} ETH`);

    let transactionRequest = new TransactionRequestBuilder()
      .withOwnOutputNotes(new OutputNotesArray([OutputNote.full(swappNote)]))
      .build();

    console.log("208");

    // Create transaction
    const transaction = await client.newTransaction(
      creatorId,
      transactionRequest,
    );

    // Get transaction ID and create MidenScan link
    const txId = transaction.executedTransaction().id().toHex();
    const midenScanLink = `https://testnet.midenscan.com/tx/${txId}`;

    console.log(`Transaction ID: ${txId}`);
    console.log(`View transaction on MidenScan: ${midenScanLink}`);

    // Submit transaction
    await client.submitTransaction(transaction, prover);

    console.log("SWAPP note created and submitted successfully! ✅");

    // Return the note for potential future use
    return swappNote;
  } catch (error) {
    console.error("Error creating SWAPP note:", error);
    throw error;
  }
}

/**
 * Creates multiple SWAPP notes for market making
 * Based on the generate_and_submit_real_orders function from populate.rs
 */
export async function createMultipleSwappNotes(
  creatorAccountId: string,
  ethPrice: number,
  numLevels: number = 2,
  baseQuantity: number = 0.01,
  spreadPercentage: number = 0.0001,
): Promise<void> {
  console.log(
    `Creating ${numLevels * 2} SWAPP notes around ETH price $${ethPrice}`,
  );

  const spread = (ethPrice * spreadPercentage) / 100.0;
  const halfSpread = spread / 2.0;

  // Generate bid orders (buying ETH with USDC)
  for (let level = 0; level < numLevels; level++) {
    const priceOffset = (level + 1) * (halfSpread / numLevels);
    const priceVariance = (Math.random() - 0.5) * 0.003; // ±0.3% variance

    const bidPrice =
      (ethPrice - halfSpread - priceOffset) * (1.0 + priceVariance);
    const quantityVariance = (Math.random() - 0.5) * 0.1; // ±10% variance
    const ethQuantity = Math.max(
      0.01,
      Math.min(10.0, baseQuantity * (1.0 + quantityVariance)),
    );

    await createSwappNote(
      creatorAccountId,
      true,
      bidPrice,
      ethQuantity,
      ethPrice,
    );

    // Small delay between orders
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Generate ask orders (selling ETH for USDC)
  for (let level = 0; level < numLevels; level++) {
    const priceOffset = (level + 1) * (halfSpread / numLevels);
    const priceVariance = (Math.random() - 0.5) * 0.003; // ±0.3% variance

    const askPrice =
      (ethPrice + halfSpread + priceOffset) * (1.0 + priceVariance);
    const quantityVariance = (Math.random() - 0.5) * 0.1; // ±10% variance
    const ethQuantity = Math.max(
      0.01,
      Math.min(10.0, baseQuantity * (1.0 + quantityVariance)),
    );

    await createSwappNote(
      creatorAccountId,
      false,
      askPrice,
      ethQuantity,
      ethPrice,
    );

    // Small delay between orders
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log(`Successfully created ${numLevels * 2} SWAPP notes! ✅`);
}

/**
 * Fetches current ETH price from CoinGecko API
 * Based on the fetch_eth_price function from populate.rs
 */
export async function fetchEthPrice(): Promise<number> {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const ethPrice = data.ethereum.usd;

    console.log(`Current ETH price: $${ethPrice}`);
    return ethPrice;
  } catch (error) {
    console.error("Error fetching ETH price:", error);
    // Return a fallback price
    return 3000;
  }
}
