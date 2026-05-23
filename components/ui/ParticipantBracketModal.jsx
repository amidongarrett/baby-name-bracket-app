'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import BracketListView from '@/components/bracket/BracketListView';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function ParticipantBracketModal({
  bracketId,
  targetEntry,
  token,
  bracketMatchups,
  nameMap,
  voteTallies,
  publishedRounds,
  activeRoundKey,
  onClose,
}) {
  const [mounted, setMounted] = useState(false);
  const [participantBracket, setParticipantBracket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!bracketId || !targetEntry?.userId) return;
    async function fetchParticipantBracket() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${BASE_URL}/api/bracket/${bracketId}/user-bracket/${targetEntry.userId}`,
          token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
        );
        if (res.status === 404) {
          setError('unavailable');
          return;
        }
        if (!res.ok) throw new Error('Failed to fetch bracket');
        const data = await res.json();
        setParticipantBracket(data);
      } catch {
        setError('error');
      } finally {
        setLoading(false);
      }
    }
    fetchParticipantBracket();
  }, [bracketId, targetEntry?.userId, token]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!mounted) return null;

  const displayName = targetEntry?.displayName || 'Participant';
  const icon = targetEntry?.icon || '👤';
  const score = participantBracket?.score ?? targetEntry?.score ?? 0;
  const maxPossible = participantBracket?.maxPossible ?? targetEntry?.maxPossible ?? 0;

  return createPortal(
    <div className="fixed inset-0 z-60 flex flex-col bg-white dark:bg-gray-950 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shrink-0">
        <button
          onClick={onClose}
          aria-label="Back to leaderboard"
          className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 transition-colors shrink-0"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Leaderboard
        </button>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-xl leading-none shrink-0">{icon}</span>
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
            {displayName}&apos;s Bracket
          </span>
          {!loading && !error && (
            <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
              {score} pts &middot; {maxPossible} max
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors shrink-0"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        )}

        {!loading && error === 'unavailable' && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
            <span className="text-4xl">🔒</span>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {displayName} hasn&apos;t locked in their bracket yet.
            </p>
          </div>
        )}

        {!loading && error === 'error' && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
            <p className="text-red-500 dark:text-red-400 text-sm">Could not load this bracket.</p>
          </div>
        )}

        {!loading && !error && participantBracket && (
          <BracketListView
            matchups={[]}
            status="active"
            voterId={targetEntry.userId}
            userBracket={participantBracket}
            viewerRole="guest"
            ownerPicks={{}}
            publishedRounds={publishedRounds}
            activeRoundKey={activeRoundKey}
            bracketMatchups={bracketMatchups}
            nameMap={nameMap}
            voteTallies={voteTallies}
          />
        )}
      </div>
    </div>,
    document.body
  );
}
