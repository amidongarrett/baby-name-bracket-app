'use client';

import { useState } from 'react';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function NameGenerator({ bracketId, excludeNames = [], onBankFilled, bankHasItems }) {
  const [selectedGender, setSelectedGender] = useState('neutral');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit() {
    if (!prompt.trim() || loading || bankHasItems) return;

    setLoading(true);
    setError(null);

    try {
      const authToken = localStorage.getItem('authToken');
      const response = await fetch(`${BASE_URL}/api/names/suggest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          gender: selectedGender,
          excludeNames,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to generate suggestions');
        return;
      }

      onBankFilled(data.suggestions);
      setPrompt('');
    } catch (err) {
      console.error('NameGenerator: suggestion request failed', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  }

  function getToggleClass(gender) {
    const base =
      'flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-medium text-sm transition-all flex-1';

    const styles = {
      girl: {
        selected: 'bg-pink-500 text-white',
        unselected: 'bg-pink-200 text-pink-600',
      },
      neutral: {
        selected: 'bg-gray-400 text-white',
        unselected: 'bg-gray-200 text-gray-500',
      },
      boy: {
        selected: 'bg-blue-500 text-white',
        unselected: 'bg-blue-200 text-blue-600',
      },
    };

    const variant = gender === selectedGender ? 'selected' : 'unselected';
    return `${base} ${styles[gender][variant]}`;
  }

  const generateButtonClass = {
    girl: 'bg-pink-500 hover:bg-pink-600 text-white',
    neutral: 'bg-gray-400 hover:bg-gray-500 text-white',
    boy: 'bg-blue-500 hover:bg-blue-600 text-white',
  }[selectedGender];

  const isDisabled = loading || bankHasItems;

  return (
    <div className="mb-4 space-y-2">
      {/* Gender toggle row */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setSelectedGender('girl')}
          className={getToggleClass('girl')}
        >
          ♀ Girl
        </button>
        <button
          type="button"
          onClick={() => setSelectedGender('neutral')}
          className={getToggleClass('neutral')}
        >
          ⚥ Neutral
        </button>
        <button
          type="button"
          onClick={() => setSelectedGender('boy')}
          className={getToggleClass('boy')}
        >
          ♂ Boy
        </button>
      </div>

      {/* Style prompt input */}
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && !isDisabled && handleSubmit()}
        placeholder="e.g. vintage botanical, strong, Irish..."
        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-foreground focus:outline-none focus:ring-2 focus:ring-foreground text-sm"
      />

      {/* Generate button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isDisabled || !prompt.trim()}
        className={`${generateButtonClass} w-full mt-1 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {loading ? 'Generating...' : 'Generate Names'}
      </button>

      {/* Disabled hint when bank has items */}
      {bankHasItems && (
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
          Add or dismiss your suggestions first
        </p>
      )}

      {/* Inline error */}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 text-center mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
