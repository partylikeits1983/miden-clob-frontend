import React, { useState, useEffect } from 'react';
import { createSwappNote, fetchEthPrice } from '../../lib/swappNoteCreation';

export default function BuySellPanel() {
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  
  const [accountId, setAccountId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [balances, setBalances] = useState({ USDC: BigInt(0), ETH: BigInt(0) });
  const [ethPrice, setEthPrice] = useState(0);

  useEffect(() => {
    // Fetch ETH price on component mount
    fetchEthPrice().then(setEthPrice).catch(console.error);
    
    // Load account ID from localStorage if available
    const savedAccountId = localStorage.getItem('midenAccountId');
    if (savedAccountId) {
      setAccountId(savedAccountId);
    }
  }, []);

  const updateBalances = async () => {
    if (!accountId) return;
    
    try {
      // Mock balances for now - replace with actual balance fetching
      setBalances({ USDC: BigInt(10000), ETH: BigInt(5) });
    } catch (error) {
      console.error('Error fetching balances:', error);
    }
  };

  const handleCreateSwappNote = async () => {
    if (!price || !amount) {
      setStatus('❌ Please enter price and amount');
      return;
    }

    if (!accountId) {
      setStatus('❌ Please create an account first in the Mint page');
      return;
    }

    setIsLoading(true);
    setStatus(`Creating ${activeTab === 'buy' ? 'BID' : 'ASK'} SWAPP note...`);
    
    try {
      await createSwappNote(
        accountId,
        activeTab === 'buy',
        parseFloat(price),
        parseFloat(amount),
        ethPrice
      );
      setStatus(`✅ Successfully created ${activeTab === 'buy' ? 'BID' : 'ASK'} SWAPP note!`);
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
    <div className="bg-neutral-950 border border-zinc-800 rounded-lg p-4 h-full">
      <div className="flex mb-4">
        <button
          onClick={() => setActiveTab('buy')}
          className={`flex-1 py-2 px-4 rounded-l-lg font-medium transition-colors ${
            activeTab === 'buy'
              ? 'bg-green-600 text-white'
              : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700'
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setActiveTab('sell')}
          className={`flex-1 py-2 px-4 rounded-r-lg font-medium transition-colors ${
            activeTab === 'sell'
              ? 'bg-red-600 text-white'
              : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700'
          }`}
        >
          Sell
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Price (USDC per ETH)
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="3000.00"
            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Amount (ETH)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.1"
            step="0.001"
            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="text-sm text-gray-400">
          <div className="flex justify-between">
            <span>Total:</span>
            <span>${(parseFloat(price || '0') * parseFloat(amount || '0')).toFixed(2)} USDC</span>
          </div>
        </div>

        <button
          onClick={handleCreateSwappNote}
          disabled={isLoading || !price || !amount || !accountId}
          className={`w-full py-3 rounded font-medium transition-colors ${
            activeTab === 'buy'
              ? 'bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white'
              : 'bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white'
          }`}
        >
          {isLoading
            ? 'Creating...'
            : activeTab === 'buy'
              ? 'Create Buy Order'
              : 'Create Sell Order'
          }
        </button>

        {/* Account Balances for trading */}
        {accountId && (
          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex justify-between">
              <span>USDC Balance:</span>
              <span>{balances.USDC.toString()}</span>
            </div>
            <div className="flex justify-between">
              <span>ETH Balance:</span>
              <span>{balances.ETH.toString()}</span>
            </div>
            {ethPrice > 0 && (
              <div className="flex justify-between">
                <span>Market Price:</span>
                <span>${ethPrice.toFixed(2)}</span>
              </div>
            )}
            <button
              onClick={updateBalances}
              className="text-orange-400 hover:text-orange-300 text-xs"
            >
              Refresh Balances
            </button>
          </div>
        )}

        {/* Status Display for trading */}
        {status && (
          <div className="text-xs text-gray-300 bg-zinc-900 p-2 rounded">
            {status}
          </div>
        )}
      </div>
    </div>
  );
}