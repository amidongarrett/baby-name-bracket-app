'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import BracketListView from '@/components/bracket/BracketListView';
import BracketView from '@/components/bracket/BracketView';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const ROUND_KEY_MAP = {
  'Round of 32':  'roundOf32',
  'Round of 16':  'roundOf16',
  'Elite 8':      'elite8',
  'Final 4':      'final4',
  'Championship': 'championship',
};

const SEED_PAIRS = [
  [1, 16], [8, 9], [4, 13], [5, 12], [2, 15], [7, 10], [3, 14], [6, 11],
  [1, 16], [8, 9], [4, 13], [5, 12], [2, 15], [7, 10], [3, 14], [6, 11],
];

export default function ParticipantBracketModal({
  bracketId,
  targetEntry,
  token,
  bracketMatchups,
  nameMap,
  voteTallies,
  publishedRounds,
  activeRoundKey,
  bracketStatus,
  onClose,
}) {
  const [mounted, setMounted] = useState(false);
  const [participantBracket, setParticipantBracket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('list');

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

  // Bug 2 fix: for completed brackets (or any read-only view), always start at
  // 'championship' so all rounds are navigable and the championship is not hidden.
  const isCompleted = bracketStatus === 'completed' || !!bracketMatchups?.championNameId;
  const effectiveActiveRoundKey = isCompleted ? 'championship' : (activeRoundKey || 'roundOf32');

  const effectivePublishedRounds = isCompleted
    ? ['roundOf32', 'roundOf16', 'elite8', 'final4', 'championship']
    : publishedRounds;

  // Build a normalized matchupGrid for the bracket tree view (read-only).
  // Mirrors the normalizeMatchup + matchupGrid derivation in pages/BracketView.jsx.
  const normalizeMatchup = (m, i, roundKey) => {
    const name1Obj = m.name1 && typeof m.name1 === 'object' ? m.name1 : null;
    const name2Obj = m.name2 && typeof m.name2 === 'object' ? m.name2 : null;
    const n1 = nameMap[m.name1Id] || nameMap[name1Obj?.id];
    const n2 = nameMap[m.name2Id] || nameMap[name2Obj?.id];
    const [s1default, s2default] = SEED_PAIRS[i] || [i * 2 + 1, i * 2 + 2];
    return {
      _id: m.id || m._id?.toString() || `matchup-${i}`,
      name1: n1?.value || (typeof m.name1 === 'string' ? m.name1 : null) || name1Obj?.value || 'TBD',
      name2: n2?.value || (typeof m.name2 === 'string' ? m.name2 : null) || name2Obj?.value || 'TBD',
      name1Id: m.name1Id || name1Obj?.id || null,
      name2Id: m.name2Id || name2Obj?.id || null,
      seed1: m.seed1 || name1Obj?.seed || s1default,
      seed2: m.seed2 || name2Obj?.seed || s2default,
      votes1: voteTallies?.[roundKey]?.[i]?.name1Votes ?? m.votes1 ?? 0,
      votes2: voteTallies?.[roundKey]?.[i]?.name2Votes ?? m.votes2 ?? 0,
      winnerId: m.winnerId || null,
      isPlaceholder1: name1Obj?.isPlaceholder || false,
      isPlaceholder2: name2Obj?.isPlaceholder || false,
      round: m.round || null,
    };
  };

  const currentRoundKey = effectiveActiveRoundKey;
  const rawMatchups = bracketMatchups?.[currentRoundKey] || [];
  const matchupGrid = rawMatchups.length > 0
    ? rawMatchups.map((m, i) => normalizeMatchup(m, i, currentRoundKey))
    : Array.from({ length: 16 }, (_, i) => normalizeMatchup({
        _id: `placeholder-${i}`,
        name1: { value: 'TBD', isPlaceholder: true, seed: SEED_PAIRS[i]?.[0] || i * 2 + 1 },
        name2: { value: 'TBD', isPlaceholder: true, seed: SEED_PAIRS[i]?.[1] || i * 2 + 2 },
      }, i, currentRoundKey));

  return createPortal(
    <div className="fixed inset-0 z-60 flex flex-col bg-white dark:bg-gray-950 overflow-hidden">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shrink-0">
        <div className="px-4 py-5">
          <div className="grid grid-cols-3 items-center">
            {/* Left: back button */}
            <div className="flex justify-start">
              <button
                onClick={onClose}
                aria-label="Back to leaderboard"
                className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 transition-colors"
              >
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                Leaderboard
              </button>
            </div>

            {/* Center: participant icon, name, score */}
            <div className="flex flex-col items-center gap-0.5 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xl leading-none shrink-0">{icon}</span>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                  {displayName}
                </span>
              </div>
              {!loading && !error && (
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {score} pts &middot; {maxPossible} max
                </span>
              )}
            </div>

            {/* Right: bracket / list view toggle */}
            <div className="flex justify-end">
              <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-sm font-medium">
                <button
                  onClick={() => setViewMode('bracket')}
                  className={`px-3 py-1.5 transition-colors ${
                    viewMode === 'bracket'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  Bracket
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 transition-colors ${
                    viewMode === 'list'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  List
                </button>
              </div>
            </div>
          </div>
        </div>
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
          viewMode === 'bracket' ? (
            <BracketView
              matchups={matchupGrid}
              status={bracketStatus || 'active'}
              voterId={targetEntry.userId}
              userBracket={participantBracket}
              viewerRole="guest"
              ownerPicks={{}}
              publishedRounds={effectivePublishedRounds}
              activeRoundKey={effectiveActiveRoundKey}
              bracketMatchups={bracketMatchups}
              nameMap={nameMap}
              voteTallies={voteTallies}
              myScore={{ score, maxPossible }}
            />
          ) : (
            <BracketListView
              matchups={matchupGrid}
              status={bracketStatus || 'active'}
              voterId={targetEntry.userId}
              userBracket={participantBracket}
              viewerRole="guest"
              ownerPicks={{}}
              publishedRounds={effectivePublishedRounds}
              activeRoundKey={effectiveActiveRoundKey}
              bracketMatchups={bracketMatchups}
              nameMap={nameMap}
              voteTallies={voteTallies}
            />
          )
        )}
      </div>
    </div>,
    document.body
  );
}
