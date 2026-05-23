'use client';

import { useState, useEffect } from 'react';
import { rankEntries } from '@/utils/rankScores';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const INTERVAL_MS = 2500;

function phaseToAnimationStyle(phase) {
  if (phase === 'exit') {
    return { animation: 'slideOutToLeft 200ms ease-in forwards' };
  }
  if (phase === 'enter') {
    return { animation: 'slideInFromRight 200ms ease-out forwards' };
  }
  // 'idle' — no animation (also used for hard reset to index 0)
  return {};
}

export default function LeaderboardStrip({ bracketId, currentUserId }) {
  const [entries, setEntries] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState('idle'); // 'idle' | 'exit' | 'enter'

  // Fetch scores once on mount
  useEffect(() => {
    if (!bracketId) return;
    async function fetchScores() {
      try {
        const res = await fetch(`${BASE_URL}/api/bracket/${bracketId}/scores`);
        if (!res.ok) return;
        const data = await res.json();
        setEntries(data);
      } catch {
        // On error render nothing — stay empty
      }
    }
    fetchScores();
  }, [bracketId]);

  const rankedEntries = rankEntries(entries);
  const n = rankedEntries.length;

  // Auto-advance interval with swipe-left animation
  useEffect(() => {
    if (n <= 1) return;
    const id = setInterval(() => {
      setPhase('exit');
      setTimeout(() => {
        setCurrentIndex((prev) => {
          const next = prev + 1;
          if (next >= n) {
            // Hard reset — snap to first entry with no entrance animation
            setPhase('idle');
            return 0;
          }
          setPhase('enter');
          return next;
        });
      }, 200); // matches slideOutToLeft duration
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [n]);

  // Hide when no participants
  if (n === 0) return null;

  const entry = rankedEntries[currentIndex];
  const isCurrentUser = entry.userId === currentUserId;

  return (
    <div
      className="overflow-x-hidden w-64"
      aria-label="Leaderboard preview"
      aria-live="polite"
    >
      <div
        key={currentIndex}
        style={phaseToAnimationStyle(phase)}
        className="flex items-center gap-1.5 min-w-0"
      >
        <span className="text-sm font-bold text-gray-400 w-6 text-right shrink-0">
          {entry.rankLabel}
        </span>
        <span className="text-lg shrink-0">{entry.icon || '👤'}</span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate flex-1 min-w-0">
          {entry.displayName}
          {isCurrentUser && (
            <span className="ml-1 text-sm text-indigo-500 dark:text-indigo-400 font-semibold">
              (you)
            </span>
          )}
        </span>
        <span className="text-sm font-bold text-gray-800 dark:text-gray-100 shrink-0">
          {entry.score} pts
        </span>
        <span className="text-sm text-gray-400 shrink-0">{entry.maxPossible} max</span>
      </div>
    </div>
  );
}
