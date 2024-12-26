'use client';

import WalletButton from '../Wallet/WalletButton';

export default function Header() {
  return (
    <header className="flex items-center justify-between p-4 bg-black text-white border-b border-gray-800">
      <div className="flex items-center gap-2">
        <span className="text-xl">X-</span>
        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-500 via-blue-500 to-emerald-500 bg-clip-text text-transparent">
          TwitterUsernameFinder
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <a 
          href="https://twitter.com/MoneroSolana" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
        >
          Made by @MoneroSolana
        </a>
        <div className="w-32">
          <WalletButton />
        </div>
      </div>
    </header>
  );
} 