'use client';

import React, { useState } from 'react';

export default function TwitterChecker() {
  const [bearerToken, setBearerToken] = useState('');
  const [usernames, setUsernames] = useState('');
  const [results, setResults] = useState<string[]>([]);

  const handleCopy = () => {
    const textarea = document.createElement('textarea');
    textarea.value = results.join('\n');
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);

    const copyBtn = document.querySelector('.copy-btn');
    if (copyBtn) {
      const originalContent = copyBtn.innerHTML;
      copyBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check" viewBox="0 0 16 16">
          <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
        </svg>
        Copied!
      `;
      setTimeout(() => {
        copyBtn.innerHTML = originalContent;
      }, 2000);
    }
  };

  return (
    <div>
      <div className="api-key-section">
        <label>X API - Bearer Token</label>
        <div>
          <input
            type="password"
            value={bearerToken}
            onChange={(e) => setBearerToken(e.target.value)}
            placeholder="Enter your Bearer Token"
          />
          <a href="https://developer.twitter.com/en/portal/dashboard" target="_blank" rel="noopener noreferrer">
            Get Token
          </a>
        </div>
      </div>

      <div>
        <label>Usernames to Check</label>
        <textarea
          id="usernames"
          value={usernames}
          onChange={(e) => setUsernames(e.target.value)}
          placeholder="Enter usernames separated by commas or spaces (e.g., username1, username2)"
        />
      </div>

      <div className="helper-text">
        You can separate usernames using commas or spaces
      </div>

      <div className="button-group">
        <button onClick={() => console.log('Checking handles...')}>
          Check Handles
        </button>
        <button className="copy-btn" onClick={handleCopy}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-clipboard" viewBox="0 0 16 16">
            <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1z"/>
            <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0z"/>
          </svg>
          Copy All
        </button>
      </div>
    </div>
  );
} 