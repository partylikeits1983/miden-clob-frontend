import React, { useState, useEffect } from 'react';
import { getTokenBalance } from '../../lib/createMintConsume';
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
  }, []);

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

    if (!price || !amount) {
      setStatus('❌ Please enter price and amount');
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
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 h-full">
      <div className="flex mb-4">
        <button
          onClick={() => setActiveTab('buy')}
          className={`flex-1 py-2 px-4 rounded-l-lg font-medium transition-colors ${
            activeTab === 'buy'
              ? 'bg-green-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setActiveTab('sell')}
          className={`flex-1 py-2 px-4 rounded-r-lg font-medium transition-colors ${
            activeTab === 'sell'
              ? 'bg-red-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Sell
        </button>
      </div>

      <div className="space-y-4">
        {/* Account ID for trading */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Account ID
          </label>
          <input
            type="text"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            placeholder="0x..."
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Price (USDC per ETH)
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="3000.00"
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
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
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
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
          disabled={isLoading || !accountId || !price || !amount}
          className={`w-full py-3 rounded font-medium transition-colors ${
            activeTab === 'buy'
              ? 'bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white'
              : 'bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white'
          }`}
        >
          {isLoading 
            ? 'Creating...' 
            : activeTab === 'buy' 
              ? 'Create Buy SWAPP Note' 
              : 'Create Sell SWAPP Note'
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
              className="text-blue-400 hover:text-blue-300 text-xs"
            >
              Refresh Balances
            </button>
          </div>
        )}

        {/* Status Display for trading */}
        {status && (
          <div className="text-xs text-gray-300 bg-gray-700 p-2 rounded">
            {status}
          </div>
        )}
      </div>
    </div>
  );
}