'use client';

import React, { useState, useEffect } from 'react';

export default function UsernameGenerator() {
  const [provider, setProvider] = useState('openai');
  const [model, setModel] = useState('gpt-3.5-turbo');
  const [apiKey, setApiKey] = useState('');
  const [prompt, setPrompt] = useState('');
  const [numUsernames, setNumUsernames] = useState('10');
  const [generatedUsernames, setGeneratedUsernames] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const providerInfo = {
    'openai': {
      models: [
        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
        { value: 'gpt-4', label: 'GPT-4' }
      ],
      apiLink: 'https://platform.openai.com/api-keys',
      name: 'OpenAI'
    },
    'anthropic': {
      models: [
        { value: 'claude-2', label: 'Claude 2' }
      ],
      apiLink: 'https://console.anthropic.com/account/keys',
      name: 'Anthropic'
    },
    'google': {
      models: [
        { value: 'gemini-pro', label: 'Gemini Pro' }
      ],
      apiLink: 'https://makersuite.google.com/app/apikey',
      name: 'Google'
    }
  };

  const handleCopy = () => {
    const textarea = document.createElement('textarea');
    textarea.value = generatedUsernames.join(', ');
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

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value;
    setProvider(newProvider);
    setModel(providerInfo[newProvider as keyof typeof providerInfo].models[0].value);
  };

  const generateUsernames = async () => {
    if (!apiKey || !prompt || !numUsernames) {
      alert('Please fill in all fields');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-usernames', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          model,
          apiKey,
          prompt,
          numUsernames: parseInt(numUsernames),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate usernames');
      }

      const data = await response.json();
      setGeneratedUsernames(data.usernames);
    } catch (error) {
      console.error('Error generating usernames:', error);
      alert('Failed to generate usernames. Please check your API key and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const sendToChecker = () => {
    const checkInput = document.getElementById('usernames') as HTMLTextAreaElement;
    if (checkInput) {
      checkInput.value = generatedUsernames.join(', ');
      document.querySelector('.left-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div>
      <div className="api-key-section">
        <div>
          <label>AI Provider</label>
          <select value={provider} onChange={handleProviderChange}>
            {Object.entries(providerInfo).map(([key, info]) => (
              <option key={key} value={key}>{info.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label>AI Model</label>
          <select value={model} onChange={(e) => setModel(e.target.value)}>
            {providerInfo[provider as keyof typeof providerInfo].models.map(model => (
              <option key={model.value} value={model.value}>{model.label}</option>
            ))}
          </select>
        </div>

        <label>API Key</label>
        <div>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your API Key"
          />
          <a 
            href={providerInfo[provider as keyof typeof providerInfo].apiLink} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            Get {providerInfo[provider as keyof typeof providerInfo].name} API Key
          </a>
        </div>
      </div>

      <div>
        <label>Generation Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter a theme or description for username generation"
        />
      </div>

      <div>
        <label>Number of Usernames</label>
        <input
          type="number"
          min="1"
          max="100"
          value={numUsernames}
          onChange={(e) => setNumUsernames(e.target.value)}
        />
      </div>

      <div className="button-group">
        <button 
          onClick={generateUsernames}
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating...' : 'Generate Usernames'}
        </button>
        {generatedUsernames.length > 0 && (
          <>
            <button className="copy-btn" onClick={handleCopy}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-clipboard" viewBox="0 0 16 16">
                <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1z"/>
                <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0z"/>
              </svg>
              Copy All
            </button>
            <button className="send-to-checker" onClick={sendToChecker}>
              Send to Checker
            </button>
          </>
        )}
      </div>

      {generatedUsernames.length > 0 && (
        <div className="generated-usernames">
          <textarea
            className="generated-text"
            value={generatedUsernames.join(', ')}
            readOnly
          />
        </div>
      )}
    </div>
  );
} 