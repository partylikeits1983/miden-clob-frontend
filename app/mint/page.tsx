"use client";

import React, { useState, useEffect } from 'react';
import { createMintConsume, mintTokensFromExistingFaucets, getTokenBalance } from '../../lib/createMintConsume';
import { createSwappNote, fetchEthPrice } from '../../lib/swappNoteCreation';

export default function MintTokensPage() {
  const [accountId, setAccountId] = useState('');
  const [mintAmount, setMintAmount] = useState(1000);
  const [tokenType, setTokenType] = useState<'USDC' | 'ETH'>('USDC');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [balances, setBalances] = useState({ USDC: BigInt(0), ETH: BigInt(0) });
  const [ethPrice, setEthPrice] = useState(0);

  // SWAPP Note creation states
  const [swappPrice, setSwappPrice] = useState(3000);
  const [swappQuantity, setSwappQuantity] = useState(0.1);
  const [isBid, setIsBid] = useState(true);

  useEffect(() => {
    // Fetch ETH price on component mount
    fetchEthPrice().then(setEthPrice).catch(console.error);
  }, []);

  const handleCreateMintConsume = async () => {
    setIsLoading(true);
    setStatus('Creating accounts and minting tokens...');
    
    try {
      await createMintConsume();
      setStatus('✅ Successfully created accounts and minted tokens!');
    } catch (error) {
      setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMintTokens = async () => {
    if (!accountId) {
      setStatus('❌ Please enter an account ID');
      return;
    }

    setIsLoading(true);
    setStatus(`Minting ${mintAmount} ${tokenType} tokens...`);
    
    try {
      await mintTokensFromExistingFaucets(accountId, tokenType, mintAmount);
      setStatus(`✅ Successfully minted ${mintAmount} ${tokenType} tokens!`);
      
      // Refresh balances
      await updateBalances();
    } catch (error) {
      setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const updateBalances = async () => {
    if (!accountId) return;
    
    try {
      const usdcBalance = await getTokenBalance(accountId, 'USDC');
      const ethBalance = await getTokenBalance(accountId, 'ETH');
      setBalances({ USDC: usdcBalance, ETH: ethBalance });
    } catch (error) {
      console.error('Error fetching balances:', error);
    }
  };

  const handleCreateSwappNote = async () => {
    if (!accountId) {
      setStatus('❌ Please enter an account ID');
      return;
    }

    setIsLoading(true);
    setStatus(`Creating ${isBid ? 'BID' : 'ASK'} SWAPP note...`);
    
    try {
      await createSwappNote(accountId, isBid, swappPrice, swappQuantity, ethPrice);
      setStatus(`✅ Successfully created ${isBid ? 'BID' : 'ASK'} SWAPP note!`);
    } catch (error) {
      setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (accountId) {
      updateBalances();
    }
  }, [accountId]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Miden CLOB - Mint Tokens & Create SWAPP Notes</h1>
        
        {/* Account ID Input */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Account Configuration</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Account ID</label>
            <input
              type="text"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Display current ETH price */}
          {ethPrice > 0 && (
            <div className="text-sm text-gray-400">
              Current ETH Price: ${ethPrice.toFixed(2)}
            </div>
          )}
        </div>

        {/* Account Balances */}
        {accountId && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Account Balances</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-700 p-4 rounded">
                <div className="text-sm text-gray-400">USDC Balance</div>
                <div className="text-lg font-semibold">{balances.USDC.toString()}</div>
              </div>
              <div className="bg-gray-700 p-4 rounded">
                <div className="text-sm text-gray-400">ETH Balance</div>
                <div className="text-lg font-semibold">{balances.ETH.toString()}</div>
              </div>
            </div>
            <button
              onClick={updateBalances}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Refresh Balances
            </button>
          </div>
        )}

        {/* Create New Account & Mint */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Create New Account & Mint Tokens</h2>
          <p className="text-gray-400 mb-4">
            This will create a new account (Alice), deploy a faucet, and mint tokens automatically.
          </p>
          <button
            onClick={handleCreateMintConsume}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-md transition-colors"
          >
            {isLoading ? 'Creating...' : 'Create Account & Mint Tokens'}
          </button>
        </div>

        {/* Mint Tokens to Existing Account */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Mint Tokens to Existing Account</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Token Type</label>
              <select
                value={tokenType}
                onChange={(e) => setTokenType(e.target.value as 'USDC' | 'ETH')}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USDC">USDC</option>
                <option value="ETH">ETH</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Amount</label>
              <input
                type="number"
                value={mintAmount}
                onChange={(e) => setMintAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleMintTokens}
                disabled={isLoading || !accountId}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-md transition-colors"
              >
                {isLoading ? 'Minting...' : 'Mint Tokens'}
              </button>
            </div>
          </div>
        </div>

        {/* Create SWAPP Note */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Create SWAPP Note</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Order Type</label>
              <select
                value={isBid ? 'bid' : 'ask'}
                onChange={(e) => setIsBid(e.target.value === 'bid')}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="bid">BID (Buy ETH with USDC)</option>
                <option value="ask">ASK (Sell ETH for USDC)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Price (USDC per ETH)</label>
              <input
                type="number"
                value={swappPrice}
                onChange={(e) => setSwappPrice(Number(e.target.value))}
                step="0.01"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Quantity (ETH)</label>
              <input
                type="number"
                value={swappQuantity}
                onChange={(e) => setSwappQuantity(Number(e.target.value))}
                step="0.001"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleCreateSwappNote}
                disabled={isLoading || !accountId}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-md transition-colors"
              >
                {isLoading ? 'Creating...' : 'Create SWAPP Note'}
              </button>
            </div>
          </div>
          
          {/* Order Summary */}
          <div className="bg-gray-700 p-4 rounded-md">
            <h3 className="font-semibold mb-2">Order Summary:</h3>
            <div className="text-sm text-gray-300">
              {isBid ? (
                <>
                  <div>Type: BUY {swappQuantity} ETH</div>
                  <div>Price: ${swappPrice} per ETH</div>
                  <div>Total Cost: ${(swappPrice * swappQuantity).toFixed(2)} USDC</div>
                </>
              ) : (
                <>
                  <div>Type: SELL {swappQuantity} ETH</div>
                  <div>Price: ${swappPrice} per ETH</div>
                  <div>Total Receive: ${(swappPrice * swappQuantity).toFixed(2)} USDC</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Status Display */}
        {status && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Status</h2>
            <div className="font-mono text-sm whitespace-pre-wrap">{status}</div>
          </div>
        )}
      </div>
    </div>
  );
}