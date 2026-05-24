'use client';

import { useState, useEffect, useRef } from 'react';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function NameGenerator({ bracketId, excludeNames = [], onGenerate, onBankFilled, bankHasItems, likedNames = [] }) {
  const [selectedGender, setSelectedGender] = useState('neutral');
  const [useLikedNames, setUseLikedNames] = useState(false);

  // --- Simple random generator state ---
  const [namePool, setNamePool] = useState({ girl: [], boy: [], neutral: [] });
  const [poolLoading, setPoolLoading] = useState(true);
  const seenNames = useRef({
    girl: new Set(),
    boy: new Set(),
    neutral: new Set(),
  });

  // --- AI suggestion state ---
  const [prompt, setPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState(null);
  const [noResults, setNoResults] = useState(false);

  // Fetch all name pools on mount
  useEffect(() => {
    const fetchAllPools = async () => {
      try {
        const [girlRes, boyRes, neutralRes] = await Promise.all([
          fetch(`${BASE_URL}/api/baby-names?gender=girl`),
          fetch(`${BASE_URL}/api/baby-names?gender=boy`),
          fetch(`${BASE_URL}/api/baby-names?gender=neutral`),
        ]);

        const [girlData, boyData, neutralData] = await Promise.all([
          girlRes.json(),
          boyRes.json(),
          neutralRes.json(),
        ]);

        setNamePool({
          girl: girlData.names || [],
          boy: boyData.names || [],
          neutral: neutralData.names || [],
        });
      } catch (err) {
        console.error('NameGenerator: failed to fetch name pools', err);
      } finally {
        setPoolLoading(false);
      }
    };

    fetchAllPools();
  }, []);

  function handleGenerate() {
    const pool = namePool[selectedGender];
    if (!pool || pool.length === 0) return;

    const seen = seenNames.current[selectedGender];
    let unseen = pool.filter((n) => !seen.has(n.name));

    if (unseen.length === 0) {
      seen.clear();
      unseen = pool;
    }

    const pick = unseen[Math.floor(Math.random() * unseen.length)];
    seen.add(pick.name);
    onGenerate(pick.name);
  }

  async function handleAiSubmit() {
    if (!prompt.trim() || aiLoading || bankHasItems) return;

    setNoResults(false);
    setAiLoading(true);
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
          likedNames: useLikedNames ? likedNames : [],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to generate suggestions');
        return;
      }

      if (data.suggestions.length === 0) {
        setNoResults(true);
      } else {
        setNoResults(false);
        onBankFilled(data.suggestions);
        setPrompt('');
      }
    } catch (err) {
      console.error('NameGenerator: suggestion request failed', err);
      setError('Failed to connect to server');
    } finally {
      setAiLoading(false);
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

  const aiDisabled = aiLoading || bankHasItems;

  return (
    <div className="mb-4 space-y-2">
      {/* Gender toggle row — shared by both features */}
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

      {/* Simple random generator */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={poolLoading || namePool[selectedGender].length === 0}
        className={`${generateButtonClass} w-full mt-1 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        Generate Name
      </button>

      {/* Divider */}
      <div className="flex items-center gap-2 py-1">
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">or get AI suggestions</span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* AI prompt input */}
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && !aiDisabled && handleAiSubmit()}
        placeholder="e.g. vintage botanical, strong, Irish..."
        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-foreground focus:outline-none focus:ring-2 focus:ring-foreground text-sm"
      />

      {noResults && (
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
          No suggestions found for this prompt — try adjusting your description.
        </p>
      )}

      {/* Liked names checkbox */}
      <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={useLikedNames}
          onChange={(e) => setUseLikedNames(e.target.checked)}
          className="rounded border-gray-300 text-foreground focus:ring-foreground"
        />
        Use my chosen names as style inspiration
      </label>

      {/* AI suggestions button */}
      <button
        type="button"
        onClick={handleAiSubmit}
        disabled={aiDisabled || !prompt.trim()}
        className={`${generateButtonClass} w-full mt-1 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {aiLoading ? 'Generating...' : 'Get AI Suggestions'}
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
