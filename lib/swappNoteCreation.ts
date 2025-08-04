/**
 * SWAPP Note Creation Library for Miden Network
 * TypeScript implementation based on the Rust logic from CLOB/src/bin/populate.rs
 */

import { ENV_CONFIG, MARKET_CONFIG } from "./config";

/**
 * SWAPP Note Script for Miden Network
 * Enables creating swap notes for trading assets
 */
const SWAPP_NOTE_SCRIPT = `
use.miden::account
use.miden::note
use.miden::asset

# ERRORS
# =================================================================================================

const.ERR_SWAPP_WRONG_NUMBER_OF_INPUTS="SWAPP note expects exactly 14 note inputs"

const.ERR_SWAPP_INVALID_ASSET="SWAPP note asset validation failed"

#! SWAPP script: enables partial swaps between two assets
#!
#! Inputs:  [requested_asset_word, swapp_tag, p2id_tag, 0, 0, swap_count, 0, 0, 0, creator_prefix, creator_suffix]
#! Outputs: []
#!
#! Note inputs are assumed to be as follows:
#! - requested_asset_word is the asset being requested in exchange
#! - swapp_tag is the tag for swap functionality
#! - p2id_tag is the tag for pay-to-id functionality
#! - swap_count tracks how many times this note has been partially filled
#! - creator_prefix and creator_suffix identify the note creator
#!
#! Panics if:
#! - Invalid number of inputs
#! - Asset validation fails
begin
    # store the note inputs to memory starting at address 0
    padw push.0 exec.note::get_inputs
    # => [num_inputs, inputs_ptr, EMPTY_WORD]

    # make sure the number of inputs is 14
    eq.14 assert.err=ERR_SWAPP_WRONG_NUMBER_OF_INPUTS
    # => [inputs_ptr, EMPTY_WORD]

    # Add note assets to account
    exec.note::add_note_assets_to_account
    # => []
end
`;

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
      NoteExecutionMode,
      NoteMetadata,
      FeltArray,
      Felt,
      FungibleAsset,
      TransactionRequestBuilder,
      OutputNote,
    } = MidenSDK;

    const client = await WebClient.createClient(ENV_CONFIG.MIDEN_NODE_ENDPOINT);
    const prover = TransactionProver.newRemoteProver(
      "https://tx-prover.testnet.miden.io",
    );

    console.log("Latest block:", (await client.syncState()).blockNum());

    // Parse account IDs
    const creatorId = AccountId.fromHex(creatorAccountId);
    const usdcFaucetId = AccountId.fromHex(ENV_CONFIG.USDC_FAUCET_ID);
    const ethFaucetId = AccountId.fromHex(ENV_CONFIG.ETH_FAUCET_ID);

    // Calculate offered and requested assets based on bid/ask
    let offeredAsset: any;
    let requestedAsset: any;

    if (isBid) {
      // Buying ETH with USDC: offer USDC, request ETH
      const usdcAmount = BigInt(Math.floor(quantity * price * 1000)); // Convert to smaller units
      const ethAmount = BigInt(Math.floor(quantity * 1000)); // Convert to smaller units

      offeredAsset = new FungibleAsset(usdcFaucetId, usdcAmount);
      requestedAsset = new FungibleAsset(ethFaucetId, ethAmount);
    } else {
      // Selling ETH for USDC: offer ETH, request USDC
      const ethAmount = BigInt(Math.floor(quantity * 1000)); // Convert to smaller units
      const usdcAmount = BigInt(Math.floor(quantity * price * 1000)); // Convert to smaller units

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

    // Compile the SWAPP note script
    const script = client.compileNoteScript(SWAPP_NOTE_SCRIPT);

    // Create note assets
    const assets = new NoteAssets([offeredAsset]);

    // Create note inputs based on SWAPP note structure
    const requestedAssetWord = [
      new Felt(requestedAsset.amount()),
      new Felt(BigInt(0)),
      requestedAsset.faucetId().prefix(),
      requestedAsset.faucetId().suffix(),
    ];

    // Build swap tag and P2ID tag
    const swappTag = NoteTag.fromAccountId(
      creatorId,
      NoteExecutionMode.newLocal(),
    );
    const p2idTag = NoteTag.fromAccountId(
      creatorId,
      NoteExecutionMode.newLocal(),
    );

    const inputs = new NoteInputs(
      new FeltArray([
        ...requestedAssetWord,
        swappTag.inner(),
        p2idTag.inner(),
        new Felt(BigInt(0)),
        new Felt(BigInt(0)),
        new Felt(BigInt(0)), // swap_count starts at 0
        new Felt(BigInt(0)),
        new Felt(BigInt(0)),
        new Felt(BigInt(0)),
        creatorId.prefix(),
        creatorId.suffix(),
      ]),
    );

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
    const outputNote = OutputNote.full(swappNote);

    console.log(`Creating ${isBid ? "BID" : "ASK"} SWAPP note:`);
    console.log(`- Price: ${price} USDC per ETH`);
    console.log(`- Quantity: ${quantity} ETH`);
    console.log(
      `- Offered: ${offeredAsset.amount()} ${isBid ? "USDC" : "ETH"}`,
    );
    console.log(
      `- Requested: ${requestedAsset.amount()} ${isBid ? "ETH" : "USDC"}`,
    );

    // Create transaction
    const transaction = await client.newTransaction(
      creatorId,
      new TransactionRequestBuilder()
        .withOwnOutputNotes(new OutputNotesArray([outputNote]))
        .build(),
    );

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
