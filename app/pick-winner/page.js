'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const ROUND_KEY_MAP = {
  'Round of 32':  'roundOf32',
  'Round of 16':  'roundOf16',
  'Elite 8':      'elite8',
  'Final 4':      'final4',
  'Championship': 'championship',
};

export default function PickWinnerPage() {
  const [bracket, setBracket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeOwner, setActiveOwner] = useState(null); // 'owner1' | 'owner2'
  // picks: { [matchupId]: { owner1: nameId | null, owner2: nameId | null } }
  const [picks, setPicks] = useState({});
  const [advancing, setAdvancing] = useState(false);

  // Hydrate picks and auto-select owner from userType on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('parentPicks');
      if (stored) setPicks(JSON.parse(stored));
    } catch {}
    const storedType = localStorage.getItem('userType');
    if (storedType === 'owner1' || storedType === 'owner2') {
      setActiveOwner(storedType);
    }
  }, []);

  // Persist picks whenever they change
  useEffect(() => {
    if (Object.keys(picks).length > 0) {
      localStorage.setItem('parentPicks', JSON.stringify(picks));
    }
  }, [picks]);

  const fetchBracket = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3001/api/bracket/current');
      if (!res.ok) throw new Error('Failed to fetch bracket');
      setBracket(await res.json());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBracket(); }, []);

  // ── Derived data ──────────────────────────────────────────────────────────

  const nameMap = {};
  if (bracket) {
    [...(bracket.owner1Names || []), ...(bracket.owner2Names || []), ...(bracket.sharedNames || [])]
      .forEach(n => { nameMap[n.id] = n; });
  }

  const currentRoundKey = ROUND_KEY_MAP[bracket?.currentRound] || 'roundOf32';

  const matchups = bracket?.status === 'active'
    ? (bracket.matchups?.[currentRoundKey] || []).map((m) => {
        const n1 = nameMap[m.name1Id];
        const n2 = nameMap[m.name2Id];
        return {
          ...m,
          name1Value: n1?.value || 'TBD',
          name2Value: n2?.value || 'TBD',
          votes1: m.votes?.name1Votes || 0,
          votes2: m.votes?.name2Votes || 0,
        };
      })
    : [];

  const getStatus = (matchup) => {
    const p = picks[matchup._id];
    if (!p?.owner1 && !p?.owner2) return 'unpicked';
    if (p?.owner1 && p?.owner2) return p.owner1 === p.owner2 ? 'agreed' : 'disagreed';
    return 'partial';
  };

  const agreedCount    = matchups.filter(m => getStatus(m) === 'agreed').length;
  const disagreedCount = matchups.filter(m => getStatus(m) === 'disagreed').length;
  const allAgreed      = matchups.length > 0 && agreedCount === matchups.length;

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleResetPicks = async () => {
    // Clear local picks immediately
    localStorage.removeItem('parentPicks');
    setPicks({});
    // Also undo the last round advancement on the backend so winnerId fields are cleared
    try {
      await fetch('http://localhost:3001/api/bracket/reset-round', { method: 'POST' });
      await fetchBracket();
    } catch {
      // If the endpoint isn't available yet, silently ignore — local reset still works
    }
  };

  const handlePick = (matchupId, nameId) => {
    if (!activeOwner) return;
    setPicks(prev => ({
      ...prev,
      [matchupId]: { ...prev[matchupId], [activeOwner]: nameId },
    }));
  };

  const handleAdvance = async () => {
    if (!allAgreed) return;
    setAdvancing(true);
    try {
      const roundKey = ROUND_KEY_MAP[bracket?.currentRound] || 'roundOf32';
      const res = await fetch('http://localhost:3001/api/bracket/advance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ round: roundKey }),
      });
      if (!res.ok) throw new Error('Failed to advance round');
      localStorage.removeItem('parentPicks');
      setPicks({});
      await fetchBracket();
    } catch (err) {
      setError(err.message);
    } finally {
      setAdvancing(false);
    }
  };

  // ── States: loading / error / not active ─────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading bracket…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        Error: {error}
      </div>
    );
  }

  if (bracket?.status !== 'active') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="text-6xl">🔒</div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Bracket Not Active Yet</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm">
          Both parents need to lock in their names before picking round winners.
        </p>
        <Link
          href="/bracket"
          className="mt-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
        >
          Go to Names Dashboard
        </Link>
      </div>
    );
  }

  // Tournament is complete — show champion screen instead of pick UI
  if (bracket?.championNameId) {
    const championName = [...(bracket.owner1Names || []), ...(bracket.owner2Names || []), ...(bracket.sharedNames || [])]
      .find(n => n.id === bracket.championNameId);
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-100 dark:from-gray-950 dark:to-gray-900 flex flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="text-8xl animate-bounce">🏆</div>
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 mb-2">
            Baby Name Bracket Champion
          </p>
          <h1 className="text-6xl font-black text-gray-900 dark:text-white tracking-tight mb-3">
            {championName?.value || 'Champion'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm">
            The tournament is complete! 🎉 This name won the championship.
          </p>
        </div>
        <Link
          href="/"
          className="mt-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-lg shadow-lg transition-colors"
        >
          View Final Bracket
        </Link>
      </div>
    );
  }

  // ── Main UI ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* Page header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Pick Winner — {bracket?.currentRound || 'Round of 32'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Both parents pick a winner for every matchup. Once you agree, the round can advance.
          </p>

          {/* Progress summary + reset */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5 font-medium text-green-700 dark:text-green-400">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                {agreedCount} agreed
              </span>
              {disagreedCount > 0 && (
                <span className="flex items-center gap-1.5 font-medium text-orange-600 dark:text-orange-400">
                  <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
                  {disagreedCount} disagreed
                </span>
              )}
              <span className="text-gray-400">
                {matchups.length - agreedCount - disagreedCount} unpicked
              </span>
            </div>
            {Object.keys(picks).length > 0 && (
              <button
                onClick={handleResetPicks}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                🔄 Reset Round Picks
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        {/* Owner selector */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Who are you?
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'owner1', label: '👨 Husband', activeColor: 'bg-blue-600 border-blue-600 text-white shadow-md', hoverColor: 'hover:border-blue-400' },
              { id: 'owner2', label: '👩 Wife',    activeColor: 'bg-purple-600 border-purple-600 text-white shadow-md', hoverColor: 'hover:border-purple-400' },
            ].map(({ id, label, activeColor, hoverColor }) => (
              <button
                key={id}
                onClick={() => setActiveOwner(id)}
                className={`py-3 px-4 rounded-lg font-semibold text-sm transition-all border-2 ${
                  activeOwner === id
                    ? activeColor
                    : `bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 ${hoverColor}`
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {!activeOwner && (
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
              Select your role above to start picking winners.
            </p>
          )}
        </div>

        {/* Matchup cards */}
        {matchups.map((matchup, index) => {
          const status    = getStatus(matchup);
          const pick      = picks[matchup._id] || {};
          const totalVotes = matchup.votes1 + matchup.votes2;
          const pct1      = totalVotes > 0 ? Math.round((matchup.votes1 / totalVotes) * 100) : 50;
          const pct2      = 100 - pct1;

          const cardBorder = {
            agreed:   'border-green-400  dark:border-green-600  bg-green-50  dark:bg-green-950/30',
            disagreed:'border-orange-400 dark:border-orange-600 bg-orange-50 dark:bg-orange-950/30',
            partial:  'border-gray-200   dark:border-gray-700   bg-white     dark:bg-gray-900',
            unpicked: 'border-gray-200   dark:border-gray-700   bg-white     dark:bg-gray-900',
          }[status];

          const renderNameOption = (nameId, nameValue, votes, pct, colorScheme) => {
            const isPickedByOwner1 = pick.owner1 === nameId;
            const isPickedByOwner2 = pick.owner2 === nameId;
            const isHighlighted    = isPickedByOwner1 || isPickedByOwner2;
            const { border, bg, bar, hoverBorder } = colorScheme;

            return (
              <button
                onClick={() => handlePick(matchup._id, nameId)}
                disabled={!activeOwner}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                  isHighlighted
                    ? `${border} ${bg}`
                    : `border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 ${activeOwner ? hoverBorder : ''}`
                } disabled:cursor-default`}
              >
                {/* Name + vote count */}
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900 dark:text-white">{nameValue}</span>
                  <span className="text-xs font-bold text-gray-500 tabular-nums">
                    {votes} vote{votes !== 1 ? 's' : ''} · {pct}%
                  </span>
                </div>

                {/* Vote bar */}
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                  <div className={`h-full ${bar} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                </div>

                {/* Picker badges */}
                <div className="flex gap-2 min-h-[20px]">
                  {isPickedByOwner1 && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
                      👨 Husband
                    </span>
                  )}
                  {isPickedByOwner2 && (
                    <span className="text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-medium">
                      👩 Wife
                    </span>
                  )}
                </div>
              </button>
            );
          };

          return (
            <div key={matchup._id} className={`rounded-xl border-2 p-4 transition-all ${cardBorder}`}>
              {/* Card header */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Game {index + 1}
                </span>
                <div>
                  {status === 'agreed' && (
                    <span className="text-xs font-semibold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-2.5 py-1 rounded-full">
                      ✅ Agreed
                    </span>
                  )}
                  {status === 'disagreed' && (
                    <span className="text-xs font-semibold text-orange-700 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/40 px-2.5 py-1 rounded-full">
                      ⚠️ Disagreement — keep talking!
                    </span>
                  )}
                  {status === 'partial' && (
                    <span className="text-xs text-gray-400">
                      Waiting for {!pick.owner1 ? 'Husband' : 'Wife'}…
                    </span>
                  )}
                </div>
              </div>

              {/* Option 1 */}
              {renderNameOption(matchup.name1Id, matchup.name1Value, matchup.votes1, pct1, {
                border: 'border-blue-500',
                bg: 'bg-blue-50 dark:bg-blue-950/40',
                bar: 'bg-blue-500',
                hoverBorder: 'hover:border-blue-300 dark:hover:border-blue-600',
              })}

              <div className="text-center text-xs font-bold text-gray-300 dark:text-gray-600 my-2">VS</div>

              {/* Option 2 */}
              {renderNameOption(matchup.name2Id, matchup.name2Value, matchup.votes2, pct2, {
                border: 'border-purple-500',
                bg: 'bg-purple-50 dark:bg-purple-950/40',
                bar: 'bg-purple-500',
                hoverBorder: 'hover:border-purple-300 dark:hover:border-purple-600',
              })}
            </div>
          );
        })}

        {/* Advance CTA */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
          {allAgreed ? (
            <button
              onClick={handleAdvance}
              disabled={advancing}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-lg rounded-xl shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {advancing ? 'Advancing Round…' : '🚀 Confirm & Advance to Next Round'}
            </button>
          ) : (
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {disagreedCount > 0
                  ? `⚠️ ${disagreedCount} matchup${disagreedCount !== 1 ? 's' : ''} in disagreement — both parents must pick the same winner.`
                  : `Both parents must pick a winner for all ${matchups.length} matchups to advance.`
                }
              </p>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden max-w-xs mx-auto">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${matchups.length > 0 ? (agreedCount / matchups.length) * 100 : 0}%` }}
                />
              </div>
              <p className="text-xs text-gray-400">
                {agreedCount} of {matchups.length} matchups agreed
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
