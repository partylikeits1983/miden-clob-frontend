import React from 'react';

export default function NavigationHeader() {
  return (
    <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <h1 className="text-xl font-bold text-white">zkCLOB</h1>
          <nav className="flex space-x-6">
            <a href="#" className="text-gray-300 hover:text-white transition-colors">
              Markets
            </a>
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
  );
}