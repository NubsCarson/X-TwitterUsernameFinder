'use client';

import React, { useState, useEffect } from 'react';

type Username = string;

export default function RareFinder() {
  const [isProUser, setIsProUser] = useState(false);
  const [patternType, setPatternType] = useState('numeric');
  const [noUnderscore, setNoUnderscore] = useState(false);
  const [noNumbers, setNoNumbers] = useState(false);
  const [generatedUsernames, setGeneratedUsernames] = useState<Username[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Check for stored pro status on mount
    const storedProStatus = localStorage.getItem('proStatus');
    const storedWalletAddress = localStorage.getItem('walletAddress');
    if (storedProStatus === 'true' && storedWalletAddress === window.solana?.publicKey?.toString()) {
      setIsProUser(true);
    }

    // Listen for pro status changes
    const handleProStatusChange = () => {
      const newProStatus = localStorage.getItem('proStatus');
      const newWalletAddress = localStorage.getItem('walletAddress');
      if (newProStatus === 'true' && newWalletAddress === window.solana?.publicKey?.toString()) {
        setIsProUser(true);
      } else {
        setIsProUser(false);
      }
    };

    window.addEventListener('storage', handleProStatusChange);
    return () => window.removeEventListener('storage', handleProStatusChange);
  }, []);

  const generateNumericUsernames = (noUnderscore: boolean): Username[] => {
    const usernames: Username[] = [];
    const length = Math.random() < 0.5 ? 3 : 4; // 50% chance of 3 or 4 digits
    const count = 20;
    
    for (let i = 0; i < count; i++) {
      let username = '';
      if (!noUnderscore && Math.random() < 0.3) { // 30% chance of underscore prefix
        username += '_';
      }
      
      // Generate random digits
      for (let j = 0; j < length; j++) {
        username += Math.floor(Math.random() * 10);
      }
      
      if (!noUnderscore && Math.random() < 0.3 && !username.startsWith('_')) { // 30% chance of underscore suffix
        username += '_';
      }
      
      usernames.push(username);
    }
    
    return usernames;
  };

  const generateOGUsernames = (noUnderscore: boolean): Username[] => {
    const usernames: Username[] = [];
    const length = Math.random() < 0.5 ? 3 : 4; // 50% chance of 3 or 4 letters
    const count = 20;
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    
    for (let i = 0; i < count; i++) {
      let username = '';
      if (!noUnderscore && Math.random() < 0.3) { // 30% chance of underscore prefix
        username += '_';
      }
      
      // Generate random letters
      for (let j = 0; j < length; j++) {
        username += letters.charAt(Math.floor(Math.random() * letters.length));
      }
      
      if (!noUnderscore && Math.random() < 0.3 && !username.startsWith('_')) { // 30% chance of underscore suffix
        username += '_';
      }
      
      usernames.push(username);
    }
    
    return usernames;
  };

  const getRandomLetter = () => {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    return letters.charAt(Math.floor(Math.random() * letters.length));
  };

  const getRandomNumber = () => {
    return Math.floor(Math.random() * 10).toString();
  };

  const generateSpecialUsernames = (noUnderscore: boolean, noNumbers: boolean): Username[] => {
    const usernames: Username[] = [];
    const count = 20;
    const patterns = [
      // Special patterns that are likely to be available
      () => `${getRandomLetter()}${getRandomLetter()}${noNumbers ? '' : getRandomNumber()}`,
      () => `${noNumbers ? '' : getRandomNumber()}${getRandomLetter()}${getRandomLetter()}`,
      () => `${getRandomLetter()}${noNumbers ? getRandomLetter() : getRandomNumber()}${getRandomLetter()}`,
      () => noUnderscore ? `${getRandomLetter()}${getRandomLetter()}${getRandomLetter()}` : 
            `_${getRandomLetter()}${getRandomLetter()}_`
    ];
    
    for (let i = 0; i < count; i++) {
      const pattern = patterns[Math.floor(Math.random() * patterns.length)];
      usernames.push(pattern());
    }
    
    return usernames;
  };

  const generateDictionaryUsernames = (noUnderscore: boolean, noNumbers: boolean): Username[] => {
    const words = [
      'cat', 'dog', 'fox', 'owl', 'bat', 'elk', 'bee', 'ant', 'fly',
      'sky', 'sun', 'moon', 'star', 'rain', 'wind', 'snow', 'leaf',
      'red', 'blue', 'gold', 'pink', 'gray', 'cool', 'epic', 'pure'
    ];
    
    const usernames: Username[] = [];
    const count = 20;
    
    for (let i = 0; i < count; i++) {
      let username = '';
      const word = words[Math.floor(Math.random() * words.length)];
      
      if (!noUnderscore && Math.random() < 0.3) {
        username += '_';
      }
      
      username += word;
      
      if (!noNumbers && Math.random() < 0.5) {
        username += Math.floor(Math.random() * 100);
      }
      
      if (!noUnderscore && Math.random() < 0.3 && !username.startsWith('_')) {
        username += '_';
      }
      
      usernames.push(username);
    }
    
    return usernames;
  };

  const handleGenerateUsernames = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    
    try {
      let usernames: Username[] = [];
      
      switch (patternType) {
        case 'numeric':
          usernames = generateNumericUsernames(noUnderscore);
          break;
        case 'og':
          usernames = generateOGUsernames(noUnderscore);
          break;
        case 'special':
          usernames = generateSpecialUsernames(noUnderscore, noNumbers);
          break;
        case 'dictionary':
          usernames = generateDictionaryUsernames(noUnderscore, noNumbers);
          break;
      }
      
      setGeneratedUsernames(usernames);
    } catch (error) {
      console.error('Error generating usernames:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const addToChecker = (username: string) => {
    const usernamesTextarea = document.getElementById('usernames') as HTMLTextAreaElement;
    if (usernamesTextarea) {
      const currentValue = usernamesTextarea.value;
      usernamesTextarea.value = currentValue ? `${currentValue}, ${username}` : username;
      
      // Scroll to the checker section
      document.querySelector('.left-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (isProUser) {
    return (
      <div className="premium-feature">
        <div className="premium-lock unlocked">
          <div className="pro-header">
            <h3 className="gradient-text">✨ Pro Features Unlocked</h3>
          </div>
          <p className="welcome-text">Welcome to the Rare Username Finder</p>
          <p className="feature-description">Find ultra-rare usernames using advanced patterns and algorithms</p>
          
          <div className="rare-finder-content">
            <form id="rare-finder-form" onSubmit={handleGenerateUsernames}>
              <div className="form-group">
                <label htmlFor="pattern-type" className="pattern-label">Pattern Type</label>
                <select
                  id="pattern-type"
                  value={patternType}
                  onChange={(e) => setPatternType(e.target.value)}
                  className="pattern-select"
                  style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                >
                  <option value="numeric">Numeric (3-4 digits)</option>
                  <option value="og">OG (3-4 letters)</option>
                  <option value="special">Special Patterns</option>
                  <option value="dictionary">Dictionary Words</option>
                </select>
              </div>

              <div className="filters-group">
                <label className="filter-option">
                  <input
                    type="checkbox"
                    id="filter-no-underscore"
                    checked={noUnderscore}
                    onChange={(e) => setNoUnderscore(e.target.checked)}
                  />
                  <span>No Underscores</span>
                </label>
                <label className="filter-option">
                  <input
                    type="checkbox"
                    id="filter-no-numbers"
                    checked={noNumbers}
                    onChange={(e) => setNoNumbers(e.target.checked)}
                  />
                  <span>No Numbers</span>
                </label>
              </div>

              <button type="submit" className="generate-button" disabled={isGenerating}>
                {isGenerating ? 'Generating...' : 'Generate Usernames'}
              </button>
            </form>

            {generatedUsernames.length > 0 && (
              <div id="rare-results">
                <div className="username-list">
                  {generatedUsernames.map((username, index) => (
                    <div key={index} className="username-item">
                      <span className="username-text">@{username}</span>
                      <button
                        className="check-button"
                        onClick={() => addToChecker(username)}
                      >
                        Check Availability
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-feature">
      <div className="premium-lock">
        <h3 className="premium-title">🔒 Premium Features</h3>
        <p className="welcome-text">Access the Rare Username Finder</p>
        <p className="feature-description">Find ultra-rare usernames using advanced patterns and algorithms</p>
        <button className="pay-button" onClick={() => window.handlePayment?.()}>
          Pay 0.1 SOL
        </button>
      </div>
    </div>
  );
} 