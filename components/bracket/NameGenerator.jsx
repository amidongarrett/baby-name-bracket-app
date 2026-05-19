'use client';

import { useState, useEffect, useRef } from 'react';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function NameGenerator({ onGenerate }) {
  const [selectedGender, setSelectedGender] = useState('neutral');
  const [namePool, setNamePool] = useState({ girl: [], boy: [], neutral: [] });
  const [loading, setLoading] = useState(true);

  const seenNames = useRef({
    girl: new Set(),
    boy: new Set(),
    neutral: new Set(),
  });

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
        setLoading(false);
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

      {/* Generate button */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading || namePool[selectedGender].length === 0}
        className={`${generateButtonClass} w-full mt-3 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        Generate Name
      </button>
    </div>
  );
}
