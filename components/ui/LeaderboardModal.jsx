'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { rankEntries } from '@/utils/rankScores';
import ParticipantBracketModal from '@/components/ui/ParticipantBracketModal';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function LeaderboardModal({
  bracketId,
  currentUserId,
  onClose,
  bracketMatchups = {},
  nameMap = {},
  voteTallies = null,
  publishedRounds = [],
  activeRoundKey = 'roundOf32',
  bracketStatus,
  token,
}) {
  const [mounted, setMounted] = useState(false);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [viewingEntry, setViewingEntry] = useState(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    async function fetchScores() {
      try {
        const res = await fetch(`${BASE_URL}/api/bracket/${bracketId}/scores`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setEntries(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchScores();
  }, [bracketId]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Leaderboard</h2>
          <button
            onClick={onClose}
            aria-label="Close leaderboard"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading && (
          <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-6">Loading…</p>
        )}

        {error && !loading && (
          <p className="text-sm text-center text-red-500 dark:text-red-400 py-6">Could not load scores.</p>
        )}

        {!loading && !error && entries.length === 0 && (
          <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-6">No participants yet.</p>
        )}

        {!loading && !error && entries.length > 0 && (
          <ol className="overflow-y-auto max-h-96 space-y-1">
            {rankEntries(entries).map((entry) => {
              const isCurrentUser = entry.userId === currentUserId;
              return (
                <li key={entry.userId}>
                  <button
                    type="button"
                    onClick={() => setViewingEntry(entry)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      isCurrentUser
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 ring-1 ring-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500 w-5 text-right shrink-0">
                      {entry.rankLabel}
                    </span>
                    <span className="text-xl leading-none shrink-0">{entry.icon || '👤'}</span>
                    <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                      {entry.displayName}
                      {isCurrentUser && (
                        <span className="ml-1 text-xs text-indigo-500 dark:text-indigo-400 font-semibold">(you)</span>
                      )}
                    </span>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{entry.score} pts</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{entry.maxPossible} max</p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        )}

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {viewingEntry && (
        <ParticipantBracketModal
          bracketId={bracketId}
          targetEntry={viewingEntry}
          token={token}
          bracketMatchups={bracketMatchups}
          nameMap={nameMap}
          voteTallies={voteTallies}
          publishedRounds={publishedRounds}
          activeRoundKey={activeRoundKey}
          bracketStatus={bracketStatus}
          onClose={() => setViewingEntry(null)}
        />
      )}
    </div>,
    document.body
  );
}
