import React, { useState, useEffect } from 'react';
import { mintTokensFromExistingFaucets, getTokenBalance } from '../../lib/createMintConsume';
import { createAccountAndMint } from '../../lib/createAccountAndMint';
import { fetchEthPrice } from '../../lib/swappNoteCreation';

export default function NavigationHeader() {
  const [showMintModal, setShowMintModal] = useState(false);
  const [accountId, setAccountId] = useState('');
  const [mintAmount, setMintAmount] = useState(1000);
  const [tokenType, setTokenType] = useState<'USDC' | 'ETH'>('USDC');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [balances, setBalances] = useState({ USDC: BigInt(0), ETH: BigInt(0) });
  const [ethPrice, setEthPrice] = useState(0);
  const [mintMode, setMintMode] = useState<'existing' | 'new'>('new');

  useEffect(() => {
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

  const handleCreateNewAccountAndMint = async () => {
    setIsLoading(true);
    setStatus('Creating new account and minting tokens...');
    
    try {
      const result = await createAccountAndMint();
      if (result.success) {
        setAccountId(result.accountId);
        setStatus(`✅ ${result.message}`);
        // Update balances for the new account
        setTimeout(() => {
          updateBalances();
        }, 1000);
      } else {
        setStatus(`❌ ${result.message}`);
      }
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
      await updateBalances();
    } catch (error) {
      setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (accountId && showMintModal) {
      updateBalances();
    }
  }, [accountId, showMintModal]);

  return (
    <>
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold text-white">zkCLOB</h1>
            <nav className="flex space-x-6">
              <a href="/" className="text-gray-300 hover:text-white transition-colors">
                Trading
              </a>
              <button
                onClick={() => setShowMintModal(true)}
                className="text-gray-300 hover:text-white transition-colors"
              >
                Mint
              </button>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                Portfolio
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                History
              </a>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-300">Balance: $10,000.00</span>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors">
              Account
            </button>
          </div>
        </div>
      </header>

      {/* Mint Modal */}
      {showMintModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96 max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Mint Tokens</h2>
              <button
                onClick={() => setShowMintModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Mode Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Mint Mode
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setMintMode('new')}
                    className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                      mintMode === 'new'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Create New Account
                  </button>
                  <button
                    onClick={() => setMintMode('existing')}
                    className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                      mintMode === 'existing'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Use Existing Account
                  </button>
                </div>
              </div>

              {mintMode === 'new' ? (
                <>
                  {/* New Account Mode */}
                  <div className="bg-gray-700 p-3 rounded">
                    <p className="text-sm text-gray-300 mb-2">
                      This will create a new account, deploy a faucet, and mint 1000 MID tokens automatically.
                    </p>
                  </div>

                  <button
                    onClick={handleCreateNewAccountAndMint}
                    disabled={isLoading}
                    className="w-full py-3 rounded font-medium transition-colors bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white"
                  >
                    {isLoading ? 'Creating Account & Minting...' : 'Create Account & Mint Tokens'}
                  </button>
                </>
              ) : (
                <>
                  {/* Existing Account Mode */}
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
                      Token Type
                    </label>
                    <select
                      value={tokenType}
                      onChange={(e) => setTokenType(e.target.value as 'USDC' | 'ETH')}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="USDC">USDC</option>
                      <option value="ETH">ETH</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Amount to Mint
                    </label>
                    <input
                      type="number"
                      value={mintAmount}
                      onChange={(e) => setMintAmount(Number(e.target.value))}
                      placeholder="1000"
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <button
                    onClick={handleMintTokens}
                    disabled={isLoading || !accountId}
                    className="w-full py-3 rounded font-medium transition-colors bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white"
                  >
                    {isLoading ? 'Minting...' : `Mint ${tokenType} Tokens`}
                  </button>

                  {/* Account Balances */}
                  {accountId && (
                    <div className="text-xs text-gray-400 space-y-1 border-t border-gray-600 pt-3">
                      <div className="flex justify-between">
                        <span>USDC Balance:</span>
                        <span>{balances.USDC.toString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ETH Balance:</span>
                        <span>{balances.ETH.toString()}</span>
                      </div>
                      <button
                        onClick={updateBalances}
                        className="text-blue-400 hover:text-blue-300 text-xs"
                      >
                        Refresh Balances
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* ETH Price Display */}
              {ethPrice > 0 && (
                <div className="text-xs text-gray-500">
                  Current ETH Price: ${ethPrice.toFixed(2)}
                </div>
              )}

              {/* Status Display */}
              {status && (
                <div className="text-xs text-gray-300 bg-gray-700 p-2 rounded">
                  {status}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}