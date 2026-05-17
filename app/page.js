'use client';

import { useState, useEffect } from 'react';
import BracketView from '@/components/bracket/BracketView';
import { advanceTournamentRound } from '@/utils/api';

const generateVoterId = () =>
  'voter_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);

// Maps bracket.currentRound display labels → API round keys
const ROUND_KEY_MAP = {
  'Round of 32':  'roundOf32',
  'Round of 16':  'roundOf16',
  'Elite 8':      'elite8',
  'Final 4':      'final4',
  'Championship': 'championship',
};

export default function Home() {
  const [bracket, setBracket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [voterId, setVoterId] = useState(null);
  const [previewMatchups, setPreviewMatchups] = useState([]);
  const [votedMatchupIds, setVotedMatchupIds] = useState([]);

  // Persist voterId in localStorage
  useEffect(() => {
    const stored = localStorage.getItem('voterId');
    if (stored) {
      setVoterId(stored);
    } else {
      const newId = generateVoterId();
      localStorage.setItem('voterId', newId);
      setVoterId(newId);
    }
  }, []);

  // Fetch which matchups this voter has already voted in
  const fetchVotedMatchups = async (id) => {
    if (!id) return;
    try {
      const res = await fetch(`http://localhost:3001/api/votes/user/${id}`);
      if (res.ok) {
        const data = await res.json();
        setVotedMatchupIds(data.votedMatchupIds || []);
      }
    } catch {}
  };

  useEffect(() => {
    if (voterId) fetchVotedMatchups(voterId);
  }, [voterId]);

  const fetchBracket = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/bracket/current');
      if (!response.ok) throw new Error('Failed to fetch bracket');
      const data = await response.json();
      setBracket(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Client-side preview fallback (March Madness seeding)
  const generateClientPreviewMatchups = (bracketData) => {
    if (!bracketData || bracketData.totalNames !== 32) return [];

    // Interleave H and W by rank: [H#1, W#1, H#2, W#2, ...] so that seed 1
    // (H#1) and seed 2 (W#1) end up on opposite bracket halves and can only
    // meet in the Finals.
    const owner1 = bracketData.owner1Names || [];
    const owner2 = bracketData.owner2Names || [];
    const seenIds = new Set();
    const allNames = [];

    const maxLen = Math.max(owner1.length, owner2.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < owner1.length && !seenIds.has(owner1[i].id)) {
        seenIds.add(owner1[i].id);
        allNames.push({ id: owner1[i].id, value: owner1[i].value, submittedBy: owner1[i].submittedBy, rank: i + 1 });
      }
      if (i < owner2.length && !seenIds.has(owner2[i].id)) {
        seenIds.add(owner2[i].id);
        allNames.push({ id: owner2[i].id, value: owner2[i].value, submittedBy: owner2[i].submittedBy, rank: i + 1 });
      }
    }
    // Add any shared names not yet captured
    (bracketData.sharedNames || []).forEach((n, i) => {
      if (!seenIds.has(n.id)) {
        seenIds.add(n.id);
        allNames.push({ id: n.id, value: n.value, submittedBy: n.submittedBy, rank: i + 1, isShared: true });
      }
    });

    const seeded = allNames.map((n, i) => ({ ...n, seed: i + 1 }));
    const pairings = [
      [1,32],[16,17],[8,25],[9,24],
      [5,28],[12,21],[4,29],[13,20],
      [6,27],[11,22],[3,30],[14,19],
      [7,26],[10,23],[2,31],[15,18],
    ];
    return pairings.flatMap(([s1, s2]) => {
      const n1 = seeded.find(n => n.seed === s1);
      const n2 = seeded.find(n => n.seed === s2);
      return n1 && n2 ? [{
        _id: `preview-${s1}-${s2}`,
        name1: { value: n1.value, seed: n1.seed, submittedBy: n1.submittedBy, isPlaceholder: false },
        name2: { value: n2.value, seed: n2.seed, submittedBy: n2.submittedBy, isPlaceholder: false },
      }] : [];
    });
  };

  const fetchPreviewMatchups = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/bracket/preview');
      if (!response.ok) throw new Error('preview unavailable');
      const data = await response.json();
      if (data.canGenerate && data.preview) {
        setPreviewMatchups(data.preview);
      } else {
        setPreviewMatchups(bracket ? generateClientPreviewMatchups(bracket) : []);
      }
    } catch {
      setPreviewMatchups(bracket ? generateClientPreviewMatchups(bracket) : []);
    }
  };

  const handleLockBracket = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/bracket/lock', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to lock bracket');
      await fetchBracket();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleAdvanceRound = async () => {
    try {
      setLoading(true);
      const roundKey = ROUND_KEY_MAP[bracket?.currentRound] || 'roundOf32';
      await advanceTournamentRound(roundKey);
      await fetchBracket();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => { fetchBracket(); }, []);

  useEffect(() => {
    if (bracket?.status === 'draft') fetchPreviewMatchups();
  }, [bracket?.status, bracket?.totalNames]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm">Loading bracket…</p>
        </div>
      </div>
    );
  }
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">Error: {error}</div>;
  if (!bracket) return null;

  // Build name lookup map (used for both draft and active normalisation)
  const allNamesList = [
    ...(bracket.owner1Names || []),
    ...(bracket.owner2Names || []),
    ...(bracket.sharedNames || []),
  ];
  const nameMap = Object.fromEntries(allNamesList.map(n => [n.id, n]));

  // March Madness seed pairings in bracket order (matches server seeding algorithm)
  const SEED_PAIRS = [
    [1,32],[16,17],[8,25],[9,24],
    [5,28],[12,21],[4,29],[13,20],
    [6,27],[11,22],[3,30],[14,19],
    [7,26],[10,23],[2,31],[15,18],
  ];

  /**
   * Normalise ANY matchup format (client preview objects, server preview MatchupSchema,
   * or active-mode MatchupSchema) into the flat shape BracketView expects:
   *   { _id, name1, name2, name1Id, name2Id, seed1, seed2,
   *     votes1, votes2, winnerId, isPlaceholder1, isPlaceholder2 }
   */
  const normalizeMatchup = (m, i) => {
    // name1 may be an object (client preview) or a string/undefined (server formats)
    const name1Obj  = m.name1 && typeof m.name1 === 'object' ? m.name1 : null;
    const name2Obj  = m.name2 && typeof m.name2 === 'object' ? m.name2 : null;

    const n1 = nameMap[m.name1Id] || nameMap[name1Obj?.id];
    const n2 = nameMap[m.name2Id] || nameMap[name2Obj?.id];

    const [s1default, s2default] = SEED_PAIRS[i] || [i * 2 + 1, i * 2 + 2];

    return {
      _id: m._id || m.id || `matchup-${i}`,
      // Resolved display names — try every possible source
      name1: n1?.value || (typeof m.name1 === 'string' ? m.name1 : null) || name1Obj?.value || name1Obj?.name || 'TBD',
      name2: n2?.value || (typeof m.name2 === 'string' ? m.name2 : null) || name2Obj?.value || name2Obj?.name || 'TBD',
      // UUIDs for voting
      name1Id: m.name1Id || name1Obj?.id || null,
      name2Id: m.name2Id || name2Obj?.id || null,
      // Seeds: prefer stored value, then nested object seed, then March Madness default
      seed1: m.seed1 || name1Obj?.seed || name1Obj?.rank || s1default,
      seed2: m.seed2 || name2Obj?.seed || name2Obj?.rank || s2default,
      // Votes — normalise both nested and flat shapes
      votes1: m.votes1 ?? m.votes?.name1Votes ?? 0,
      votes2: m.votes2 ?? m.votes?.name2Votes ?? 0,
      // Winner tracking
      winnerId: m.winnerId || null,
      // Placeholder detection
      isPlaceholder1: name1Obj?.isPlaceholder || false,
      isPlaceholder2: name2Obj?.isPlaceholder || false,
    };
  };

  // For completed tournaments show the championship matchup; otherwise use current round
  const currentRoundKey = bracket.currentRound === 'Completed'
    ? 'championship'
    : (ROUND_KEY_MAP[bracket.currentRound] || 'roundOf32');
  const rawMatchups = bracket.status === 'draft'
    ? previewMatchups
    : (bracket.matchups?.[currentRoundKey] || []);

  let matchupGrid = rawMatchups.length > 0
    ? rawMatchups.map((m, i) => normalizeMatchup(m, i))
    : Array.from({ length: 16 }, (_, i) => normalizeMatchup({
        _id: `placeholder-${i}`,
        name1: { value: 'TBD', isPlaceholder: true, seed: SEED_PAIRS[i]?.[0] || i * 2 + 1 },
        name2: { value: 'TBD', isPlaceholder: true, seed: SEED_PAIRS[i]?.[1] || i * 2 + 2 },
      }, i));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tournament Bracket</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  bracket.championNameId
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700'
                    : bracket.status === 'draft'
                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700'
                      : 'bg-green-100 text-green-800 border border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700'
                }`}>
                  {bracket.championNameId
                    ? '🏆 Champion Crowned!'
                    : bracket.status === 'draft'
                      ? '📝 Draft'
                      : '🔒 Active — Voting Open'}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {bracket.totalNames ?? 0} / 32 names · {bracket.currentRound || 'Round of 32'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {bracket.status === 'draft' && (
                <button
                  onClick={handleLockBracket}
                  disabled={bracket.totalNames !== 32}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg shadow hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  🔒 Lock & Start Voting
                </button>
              )}
              {bracket.status === 'active' && (
                <span className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-sm">
                  🔒 Bracket Locked
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Champion Celebration Banner */}
      {bracket.championNameId && (
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 shadow-xl p-8 text-center mb-6">
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-10 text-9xl flex items-center justify-around pointer-events-none select-none">
              <span>🏆</span><span>⭐</span><span>🏆</span><span>⭐</span><span>🏆</span>
            </div>
            <div className="relative z-10">
              <div className="text-6xl mb-3">🏆</div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-yellow-900/70 mb-1">
                Baby Name Bracket Champion
              </p>
              <h2 className="text-5xl font-black text-yellow-900 tracking-tight mb-3">
                {nameMap[bracket.championNameId]?.value || 'Champion'}
              </h2>
              <p className="text-yellow-800 font-medium text-sm">
                Congratulations — this name won the championship! 🎉
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info banner */}
      <div className="max-w-7xl mx-auto px-4 pt-5">
        {bracket.status === 'draft' && (
          <div className="mb-4 bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-500 p-3 rounded text-sm text-blue-800 dark:text-blue-300">
            <strong>Server-Side Preview:</strong> Shows how the bracket will look once locked (March Madness seeding: 1v32, 2v31…).
            {previewMatchups.length === 0
              ? ' Add all 32 names to see the preview.'
              : ' ✅ Ready — click "Lock & Start Voting" above.'}
          </div>
        )}
        {bracket.status === 'active' && !bracket.championNameId && (
          <div className="mb-4 bg-green-50 dark:bg-green-950/30 border-l-4 border-green-500 p-3 rounded text-sm text-green-800 dark:text-green-300">
            <strong>🔒 Bracket Locked.</strong> Guests can now vote on matchups. Use <strong>Admin → Pick Winner of Round</strong> to advance when ready.
          </div>
        )}
      </div>

      {/* Bracket */}
      <div className="pb-10">
        <BracketView
          matchups={matchupGrid}
          status={bracket.status}
          voterId={voterId}
          votedMatchupIds={votedMatchupIds}
          onVoteSuccess={async () => {
            await fetchBracket();
            await fetchVotedMatchups(voterId);
          }}
        />
      </div>
    </div>
  );
}
