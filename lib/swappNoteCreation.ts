/**
 * SWAPP Note Creation Library for Miden Network
 * TypeScript implementation based on the Rust logic from CLOB/src/bin/populate.rs
 */

import { ENV_CONFIG, MARKET_CONFIG } from "./config";

/**
 * Serializes a SWAPP note for server submission using client.exportNote()
 * This uses the proper Miden SDK serialization method
 */
async function serializeNoteForServer(note: any, client: any): Promise<string> {
  try {
    // Get the note ID as a hex string
    const noteId = note.id().toString();
    console.log("Exporting note with ID:", noteId);

    // Export the note with full details including inclusion proof
    const noteExport = await client.exportNote(noteId, "Full");
    console.log("Note export result:", noteExport);

    // The noteExport should be a Uint8Array of bytes
    let noteBytes: Uint8Array;

    if (noteExport instanceof Uint8Array) {
      noteBytes = noteExport;
    } else if (Array.isArray(noteExport)) {
      noteBytes = new Uint8Array(noteExport);
    } else {
      throw new Error("Unexpected note export format");
    }

    // Convert to base64 string
    const base64String = btoa(String.fromCharCode(...noteBytes));
    console.log("Successfully serialized note to base64");
    return base64String;
  } catch (error) {
    console.error("Error serializing note:", error);
    throw new Error(`Failed to serialize note for server submission: ${error}`);
  }
}

/**
 * Submits a serialized note to the CLOB server
 * Based on the server submission logic from populate.rs lines 494-525
 */
async function submitNoteToServer(serializedNote: string): Promise<boolean> {
  try {
    const submitRequest = {
      note_data: serializedNote,
    };

    console.log("Submitting order to server...");
    const response = await fetch(`${ENV_CONFIG.SERVER_URL}/orders/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(submitRequest),
    });

    if (response.ok) {
      const result = await response.json();
      console.log("✅ Successfully submitted order to server:", result);
      return true;
    } else {
      console.warn(
        `❌ Failed to submit order to server: HTTP ${response.status}`,
      );
      const errorText = await response.text();
      console.warn("Server response:", errorText);
      return false;
    }
  } catch (error) {
    console.error("❌ Error submitting note to server:", error);
    return false;
  }
}

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

    // Parse account IDs - convert bech32 to hex first to avoid MSB issues
    const creatorId = AccountId.fromHex(creatorAccountId);

    // Convert bech32 to hex format to avoid MSB issues with direct bech32 parsing
    console.log("🔍 Converting faucet IDs from bech32 format...");
    const usdcFaucetId = AccountId.fromBech32(ENV_CONFIG.USDC_FAUCET_ID);
    const ethFaucetId = AccountId.fromBech32(ENV_CONFIG.ETH_FAUCET_ID);

    console.log("USDC Faucet ID:", usdcFaucetId.toString());
    console.log("ETH Faucet ID:", ethFaucetId.toString());
    console.log(
      "USDC prefix/suffix:",
      usdcFaucetId.prefix().asInt(),
      usdcFaucetId.suffix().asInt(),
    );
    console.log(
      "ETH prefix/suffix:",
      ethFaucetId.prefix().asInt(),
      ethFaucetId.suffix().asInt(),
    );

    // Calculate offered and requested assets based on bid/ask
    let offeredAsset: any;
    let requestedAsset: any;

    // Convert to smaller units (multiply by 1000 to match Rust implementation)
    // Following the same logic as price_to_swap_note in CLOB/src/common.rs:1240-1273
    const quantityInSmallUnits = BigInt(Math.floor(quantity));
    const priceInSmallUnits = BigInt(Math.floor(price));

    if (isBid) {
      // Buying ETH with USDC: offer quantity * price of USDC, request quantity of ETH
      // This matches the Rust logic: offered = FungibleAsset::new(*faucet_b, quantity * price)
      const usdcAmount = quantityInSmallUnits * priceInSmallUnits;
      const ethAmount = quantityInSmallUnits;

      offeredAsset = new FungibleAsset(usdcFaucetId, usdcAmount);
      requestedAsset = new FungibleAsset(ethFaucetId, ethAmount);
    } else {
      // Selling ETH for USDC: offer quantity of ETH, request quantity * price of USDC
      // This matches the Rust logic: offered = FungibleAsset::new(*faucet_a, quantity)
      const ethAmount = quantityInSmallUnits;
      const usdcAmount = quantityInSmallUnits * priceInSmallUnits;

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

    // Debug: Log the actual Felt values before creating inputs
    console.log("🔍 Requested asset faucet prefix/suffix Felt objects:");
    console.log("Prefix Felt:", requestedAsset.faucetId().prefix());
    console.log("Suffix Felt:", requestedAsset.faucetId().suffix());
    console.log("Creator prefix/suffix Felt objects:");
    console.log("Creator Prefix Felt:", creatorId.prefix());
    console.log("Creator Suffix Felt:", creatorId.suffix());

    const inputs = new NoteInputs(
      new FeltArray([
        new Felt(requestedAsset.amount()),
        new Felt(BigInt(0)),
        requestedAsset.faucetId().suffix(),
        requestedAsset.faucetId().prefix(),
        new Felt(BigInt(swappTag.asU32())),
        new Felt(BigInt(p2idTag.asU32())),
        new Felt(BigInt(0)),
        new Felt(BigInt(0)),
        new Felt(BigInt(0)), // swap_count starts at 0
        new Felt(BigInt(0)),
        new Felt(BigInt(0)),
        new Felt(BigInt(0)),
        creatorId.prefix(), // Use the Felt directly, not .asInt()
        creatorId.suffix(),
      ]),
    );

    console.log("✅ Created note inputs using Felt objects directly");

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

    // Submit transaction to blockchain
    await client.submitTransaction(transaction, prover);

    console.log(
      "SWAPP note created and submitted to blockchain successfully! ✅",
    );

    // Wait for the note to be included in a block before submitting to server
    console.log(
      "⏳ Waiting for note to be included in a block (5-6 seconds)...",
    );

     await client.syncState();

    // Wait for approximately one block time
    await new Promise((resolve) => setTimeout(resolve, 6000));

    // Sync state to get the latest block data
    await client.syncState();
    console.log("🔄 Synced client state");

    // Now try to serialize and submit the note to the CLOB server
    try {
      const serializedNote = await serializeNoteForServer(swappNote, client);
      const serverSubmissionSuccess = await submitNoteToServer(serializedNote);

      if (serverSubmissionSuccess) {
        console.log("✅ Order successfully submitted to CLOB server!");
      } else {
        console.warn(
          "⚠️ Note submitted to blockchain but failed to submit to CLOB server",
        );
      }
    } catch (serializationError) {
      console.error(
        "❌ Failed to serialize/submit note to server:",
        serializationError,
      );
      console.log("ℹ️ Note was still successfully submitted to blockchain");
      console.log(
        "💡 The note may need more time to be included in a block. You can try submitting it to the server manually later.",
      );
    }

    // Return the note for potential future use
    return swappNote;
  } catch (error) {
    console.error("Error creating SWAPP note:", error);
    throw error;
  }
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
