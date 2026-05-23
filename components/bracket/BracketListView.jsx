"use client";

import { useState } from 'react';
import ListMatchupCard from './ListMatchupCard';

// Maps API round keys → human-readable labels
const ROUND_DISPLAY = {
  roundOf32:    'Round of 32',
  roundOf16:    'Sweet 16',
  elite8:       'Elite 8',
  final4:       'Final 4',
  championship: 'Championship',
};

const ROUND_ORDER = ['roundOf32', 'roundOf16', 'elite8', 'final4', 'championship'];

export default function BracketListView({
  matchups = [],
  status,
  voterId,
  userBracket,
  viewerRole = 'guest',
  ownerPicks = {},
  publishedRounds = [],
  activeRoundKey = 'roundOf32',
  bracketMatchups = {},
  nameMap = {},
  voteTallies = null,
  onPick,
  onLockIn,
  onResetPicks = null,
  bracketId,
  onProceedToNextRound,
}) {
  // Build per-round name vote totals from voteTallies.
  // Uses allVotes (full name→count map per slot) if available; falls back to top-2 pairs.
  const nameVotesByRound = {};
  ['roundOf32', 'roundOf16', 'elite8', 'final4', 'championship'].forEach(rk => {
    const totals = {};
    Object.values(voteTallies?.[rk] || {}).forEach(tally => {
      if (tally?.allVotes) {
        Object.entries(tally.allVotes).forEach(([nameId, count]) => {
          totals[nameId] = (totals[nameId] || 0) + count;
        });
      } else {
        if (tally?.name1Id) totals[tally.name1Id] = (totals[tally.name1Id] || 0) + (tally.name1Votes || 0);
        if (tally?.name2Id) totals[tally.name2Id] = (totals[tally.name2Id] || 0) + (tally.name2Votes || 0);
      }
    });
    nameVotesByRound[rk] = totals;
  });
  // Future-round cards use their own round's tally (not the predecessor).
  const VOTE_SOURCE_FOR_ROUND = {
    roundOf16: 'roundOf16',
    elite8: 'elite8',
    final4: 'final4',
    championship: 'championship',
  };

  const [proceedLoading, setProceedLoading] = useState(false);
  const [displayRoundKey, setDisplayRoundKey] = useState(activeRoundKey);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const getPickedSeedFromRaw = (rawMatchups, matchupIdx, pickedNameId) => {
    const m = rawMatchups?.[matchupIdx];
    if (!m || !pickedNameId) return null;
    if (m.name1Id === pickedNameId) return m.seed1 ?? null;
    if (m.name2Id === pickedNameId) return m.seed2 ?? null;
    return null;
  };

  const picks = userBracket?.picks || { roundOf32: [], roundOf16: [], elite8: [], final4: [], championship: [] };
  const isLocked = !!userBracket?.lockedAt;
  const isRoundPublished = publishedRounds.includes(activeRoundKey);

  // Derive voted count from userBracket picks for the active round
  const currentRoundPicks = picks[activeRoundKey] || [];
  const allVoted = currentRoundPicks.length > 0 && currentRoundPicks.every(p => p !== null && p !== undefined);
  const votedCount = currentRoundPicks.filter(p => p !== null && p !== undefined).length;

  // All picks across all published rounds must be filled = can lock in
  const roundsToCheck = Object.keys(bracketMatchups).filter(k => Array.isArray(bracketMatchups[k]) && bracketMatchups[k].length > 0);
  const allPicksFilled = roundsToCheck.length > 0
    ? roundsToCheck.every(rk => {
        const roundPicks = picks[rk] || [];
        return roundPicks.length > 0 && roundPicks.every(p => p !== null && p !== undefined);
      })
    : false;

  const totalPickCount = Object.values(picks).flat().filter(p => p !== null && p !== undefined).length;
  const canReset = !isLocked && totalPickCount > 0;

  // Round order helpers for display navigation
  const ROUND_FEEDER = {
    roundOf16:    'roundOf32',
    elite8:       'roundOf16',
    final4:       'elite8',
    championship: 'final4',
  };
  const ROUND_MATCHUP_COUNT = {
    roundOf32: 16, roundOf16: 8, elite8: 4, final4: 2, championship: 1,
  };

  const displayRoundIndex_ord = ROUND_ORDER.indexOf(displayRoundKey);
  const activeRoundIndex_ord  = ROUND_ORDER.indexOf(activeRoundKey);
  const isRoundPast   = displayRoundIndex_ord < activeRoundIndex_ord;
  const isRoundFuture = displayRoundIndex_ord > activeRoundIndex_ord;

  // Resolve which matchups to display — active round uses the normalized matchupGrid passed in,
  // past rounds normalize raw bracketMatchups, future rounds generate synthetic placeholders
  const displayMatchups = (() => {
    if (displayRoundKey === activeRoundKey) return matchups;

    // Past / advanced round: normalize raw matchups from bracketMatchups
    const raw = bracketMatchups[displayRoundKey] || [];
    if (raw.length > 0) {
      return raw.map((m, i) => {
        const name1Obj = m.name1 && typeof m.name1 === 'object' ? m.name1 : null;
        const name2Obj = m.name2 && typeof m.name2 === 'object' ? m.name2 : null;
        const n1 = nameMap[m.name1Id] || nameMap[name1Obj?.id];
        const n2 = nameMap[m.name2Id] || nameMap[name2Obj?.id];
        return {
          _id: m.id || m._id?.toString() || `disp-${displayRoundKey}-${i}`,
          name1: n1?.value || (typeof m.name1 === 'string' ? m.name1 : null) || name1Obj?.value || 'TBD',
          name2: n2?.value || (typeof m.name2 === 'string' ? m.name2 : null) || name2Obj?.value || 'TBD',
          name1Id: m.name1Id || name1Obj?.id || null,
          name2Id: m.name2Id || name2Obj?.id || null,
          votes1: m.votes1 ?? m.votes?.name1Votes ?? 0,
          votes2: m.votes2 ?? m.votes?.name2Votes ?? 0,
          winnerId: m.winnerId || null,
        };
      });
    }

    // Future round with no DB data yet: generate synthetic placeholder matchups from user's feeder picks
    const feederKey = ROUND_FEEDER[displayRoundKey];
    const feederPicks = feederKey ? (picks[feederKey] || []) : [];
    const count = ROUND_MATCHUP_COUNT[displayRoundKey] || 0;
    return Array.from({ length: count }, (_, i) => {
      // For final4, slot i pairs elite8 positions i and i+2 (cross-division),
      // mirroring the canvas view's feeder logic (e8[0] vs e8[2], e8[1] vs e8[3]).
      // All other rounds use consecutive pairs (i*2 and i*2+1).
      const isFinal4 = displayRoundKey === 'final4';
      const n1Idx = isFinal4 ? i : i * 2;
      const n2Idx = isFinal4 ? i + 2 : i * 2 + 1;
      const n1Id = feederPicks[n1Idx] || null;
      const n2Id = feederPicks[n2Idx] || null;
      const rawFeeder = bracketMatchups[feederKey] || [];
      return {
        _id: `ph-${displayRoundKey}-${i}`,
        name1Id: n1Id,
        name2Id: n2Id,
        name1: n1Id ? (nameMap[n1Id]?.value || 'TBD') : 'TBD',
        name2: n2Id ? (nameMap[n2Id]?.value || 'TBD') : 'TBD',
        seed1: getPickedSeedFromRaw(rawFeeder, n1Idx, n1Id),
        seed2: getPickedSeedFromRaw(rawFeeder, n2Idx, n2Id),
        votes1: (nameVotesByRound[VOTE_SOURCE_FOR_ROUND[displayRoundKey]] || {})[n1Id] ?? 0,
        votes2: (nameVotesByRound[VOTE_SOURCE_FOR_ROUND[displayRoundKey]] || {})[n2Id] ?? 0,
        winnerId: null,
        isPlaceholder: !n1Id || !n2Id,
      };
    });
  })();

  const displayRoundPicks = picks[displayRoundKey] || [];

  const votableMatchups = displayMatchups.filter(m => m.name1Id && m.name2Id);

  const nextRoundIndex = ROUND_ORDER.indexOf(activeRoundKey) + 1;
  const nextRoundKey   = ROUND_ORDER[nextRoundIndex] || null;
  const nextRoundLabel = nextRoundKey ? ROUND_DISPLAY[nextRoundKey] : null;

  const allMatchupsHaveWinners = votableMatchups.length > 0 &&
    votableMatchups.every(m => !!m.winnerId);

  // Arrow navigation state
  const displayRoundIndex = ROUND_ORDER.indexOf(displayRoundKey);
  const canGoBack    = displayRoundIndex > 0;
  const canGoForward = displayRoundIndex < ROUND_ORDER.length - 1;

  const handleProceedToNextRound = async () => {
    if (!window.confirm(`Advance to ${nextRoundLabel}? Vote-leaders will be locked in as winners.`)) return;
    setProceedLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiBase}/api/bracket/${bracketId}/proceed-to-next-round`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to advance round');
      if (onProceedToNextRound) await onProceedToNextRound();
    } catch (err) {
      console.error(err);
      alert('Could not advance to the next round. Please try again.');
    } finally {
      setProceedLoading(false);
    }
  };

  // Derive champion from bracketMatchups if available
  const championNameId = bracketMatchups.championNameId || null;
  const isTournamentComplete = status === 'completed' || !!championNameId;

  const RoundNavRow = (
    <div className="flex items-center justify-between pt-4 mb-1">
      <button
        onClick={() => setDisplayRoundKey(ROUND_ORDER[displayRoundIndex - 1])}
        disabled={!canGoBack}
        className="p-2 rounded-lg disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Previous round"
      >
        <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
      </button>
      <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200">
        {ROUND_DISPLAY[displayRoundKey] || displayRoundKey}
      </h3>
      <button
        onClick={() => setDisplayRoundKey(ROUND_ORDER[displayRoundIndex + 1])}
        disabled={!canGoForward}
        className="p-2 rounded-lg disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Next round"
      >
        <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </div>
  );

  return (
    <div className="space-y-3 px-4 pb-8">
      {/* Round navigation row */}
      {RoundNavRow}

      {isTournamentComplete ? (
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 rounded-2xl border-2 border-yellow-400 dark:border-yellow-700 p-6 text-center">
          <p className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">Tournament Complete</p>
          {championNameId && nameMap[championNameId] && (
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Champion: <span className="font-semibold text-yellow-700 dark:text-yellow-400">{nameMap[championNameId].value}</span>
            </p>
          )}
        </div>
      ) : (
        <>
          {isRoundFuture && !(bracketMatchups[displayRoundKey]?.length) && displayMatchups.length > 0 && (
            <p className="text-xs text-indigo-500 dark:text-indigo-400 text-center mt-1 mb-2 italic">
              Your predicted matchups — based on your picks so far
            </p>
          )}
          {displayMatchups.map((matchup, index) => (
            <ListMatchupCard
              key={matchup._id || matchup.id || `list-${index}`}
              matchup={matchup}
              status={status}
              index={index}
              voterId={voterId}
              userPickId={displayRoundPicks[index] || null}
              isLocked={isLocked}
              viewerRole={viewerRole}
              ownerPicks={ownerPicks}
              isRoundPublished={isRoundPast ? true : isRoundPublished}
              activeRoundKey={displayRoundKey}
              onPick={isRoundPast ? undefined : onPick}
            />
          ))}

          {/* Guest: Lock My Bracket — only when tournament is active (not yet complete) and all picks made */}
          {status === 'active' && viewerRole === 'guest' && !isTournamentComplete && !isLocked && (
            <div className="mt-4 text-center">
              {allPicksFilled ? (
                <>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    All picks made! Lock in your bracket.
                  </p>
                  <button
                    onClick={onLockIn}
                    className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-lg shadow hover:from-green-600 hover:to-emerald-600 transition-all text-sm"
                  >
                    Lock My Bracket
                  </button>
                </>
              ) : (
                <>
                  <button
                    disabled
                    className="px-6 py-2.5 bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-bold rounded-lg text-sm cursor-not-allowed"
                    title={`Pick a winner for all ${votableMatchups.length - votedCount} remaining matchup(s) in this round`}
                  >
                    Lock My Bracket
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {votedCount} / {votableMatchups.length} picks made this round
                  </p>
                </>
              )}
            </div>
          )}
          {status === 'active' && viewerRole === 'guest' && !isTournamentComplete && isLocked && (
            <div className="mt-4 text-center">
              <span className="px-4 py-2 text-sm font-semibold text-green-700 bg-green-100 dark:bg-green-900/40 dark:text-green-400 rounded-lg border border-green-300 dark:border-green-700">
                Bracket Locked In
              </span>
            </div>
          )}
          {status === 'active' && viewerRole === 'guest' && canReset && onResetPicks && (
            <div className="mt-3 text-center">
              {!showResetConfirm ? (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="px-4 py-1.5 text-xs font-semibold text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Reset Picks
                </button>
              ) : (
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Clear all your picks?</p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => { onResetPicks(); setShowResetConfirm(false); }}
                      className="px-3 py-1 text-xs font-semibold bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                      Yes, reset
                    </button>
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="px-3 py-1 text-xs font-semibold bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Owner1: Proceed to Next Round — only when viewing active round */}
          {status === 'active' && viewerRole === 'owner1' && nextRoundKey && displayRoundKey === activeRoundKey && (
            <div className="mt-4 text-center">
              {allMatchupsHaveWinners ? (
                <button
                  onClick={handleProceedToNextRound}
                  disabled={proceedLoading}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold rounded-lg shadow hover:from-blue-600 hover:to-indigo-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                >
                  {proceedLoading ? 'Advancing…' : `Proceed to ${nextRoundLabel}`}
                </button>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Waiting for winners to be set…
                </p>
              )}
            </div>
          )}

          {/* Bottom round navigation row — mirrors the top row */}
          {RoundNavRow}
        </>
      )}
    </div>
  );
}
