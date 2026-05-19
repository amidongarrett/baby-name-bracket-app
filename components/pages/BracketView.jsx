'use client';

import { useState, useEffect, useMemo, use } from 'react';
import Link from 'next/link';
import BracketView from '@/components/bracket/BracketView';
import AdminPanel from '@/components/bracket/AdminPanel';
import { advanceTournamentRound } from '@/utils/api';
import { computeGuestPredictions } from '@/utils/guestBracket';
import { useUser } from '@/contexts/UserContext';
import { useBracket } from '@/contexts/BracketContext';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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

export default function BracketIdPage({ params }) {
  // Next.js 15 async params pattern
  const { id: bracketId } = use(params);

  // Role is sourced from UserContext (backed by localStorage under 'userType')
  const { userType: viewerRole } = useUser();
  const { setCurrentBracket, isOwnerOfCurrentBracket, adminPanelOpen, setAdminPanelOpen } = useBracket();

  const [bracket, setBracket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [voterId, setVoterId] = useState(null);
  const [previewMatchups, setPreviewMatchups] = useState([]);
  const [voteMap, setVoteMap] = useState({}); // { [matchupId]: selectedNameId }
  const [ownerPicks, setOwnerPicks] = useState({}); // { [matchupId]: { owner1NameId, owner2NameId } }
  const [lockedRounds, setLockedRounds] = useState([]);     // rounds this guest has locked in
  const [publishedRounds, setPublishedRounds] = useState([]); // rounds admin has published

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
      const res = await fetch(`${BASE_URL}/api/votes/user/${id}`);
      if (res.ok) {
        const data = await res.json();
        setVoteMap(data.voteMap || {});
        setLockedRounds(data.lockedRounds || []);
      }
    } catch {}
  };

  // Fetch owner picks (only called for owner viewers)
  const fetchOwnerPicks = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/bracket/owner-picks?bracketId=${bracketId}`);
      if (res.ok) {
        const data = await res.json();
        setOwnerPicks(data.ownerPicks || {});
      }
    } catch {}
  };

  useEffect(() => {
    if (voterId) fetchVotedMatchups(voterId);
  }, [voterId]);

  // Fetch owner picks on role change or bracket status change (all roles — guests need
  // this to derive whether any owner has voted on a matchup for the lockout UI)
  useEffect(() => {
    fetchOwnerPicks();
  }, [viewerRole, bracket?.status]);

  const fetchBracket = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/api/bracket/${bracketId}`);
      if (!response.ok) throw new Error('Failed to fetch bracket');
      const data = await response.json();
      setBracket(data);
      setCurrentBracket(data);
      setPublishedRounds(data.publishedRounds || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Client-side preview fallback — Division 1: owner1 top-8 vs owner2 bottom-8,
  // Division 2: owner2 top-8 vs owner1 bottom-8 (matches server seeding algorithm)
  const generateClientPreviewMatchups = (bracketData) => {
    if (!bracketData || bracketData.totalNames !== 32) return [];

    const owner1 = bracketData.owner1Names || [];
    const owner2 = bracketData.owner2Names || [];

    const divPairings = [
      [1, 16], [8, 9], [4, 13], [5, 12], [2, 15], [7, 10], [3, 14], [6, 11],
    ];

    const makeMatchup = (nameA, nameB, seedA, seedB, slot) => ({
      _id: `preview-div${slot >= 8 ? 2 : 1}-${seedA}-${seedB}`,
      name1: { id: nameA.id, value: nameA.value, seed: seedA, submittedBy: nameA.submittedBy, isPlaceholder: false },
      name2: { id: nameB.id, value: nameB.value, seed: seedB, submittedBy: nameB.submittedBy, isPlaceholder: false },
    });

    const matchups = [];

    // Division 1: owner1 ranks 1–8 (top) vs owner2 ranks 9–16 (bottom)
    divPairings.forEach(([s1, s2], idx) => {
      const n1 = owner1[s1 - 1];
      const n2 = owner2[s2 - 1];
      if (n1 && n2) matchups.push(makeMatchup(n1, n2, s1, s2, idx));
    });

    // Division 2: owner2 ranks 1–8 (top) vs owner1 ranks 9–16 (bottom)
    divPairings.forEach(([s1, s2], idx) => {
      const n1 = owner2[s1 - 1];
      const n2 = owner1[s2 - 1];
      if (n1 && n2) matchups.push(makeMatchup(n1, n2, s1, s2, 8 + idx));
    });

    return matchups;
  };

  const fetchPreviewMatchups = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/bracket/preview?bracketId=${bracketId}`);
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
      const response = await fetch(`${BASE_URL}/api/bracket/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bracketId }),
      });
      if (!response.ok) throw new Error('Failed to lock bracket');
      await fetchBracket();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleGuestLockIn = async (round) => {
    try {
      const res = await fetch(`${BASE_URL}/api/bracket/guest-lock-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voterId, round, bracketId }),
      });
      if (res.ok) {
        const data = await res.json();
        setLockedRounds(data.lockedRounds || []);
      }
    } catch {}
  };

  const handleSetWinner = async (matchupId, winnerId) => {
    await fetch(`${BASE_URL}/api/admin/set-winner`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchupId, winnerId, bracketId }),
    });
    await fetchBracket();
  };

  const handlePublishRound = async (round) => {
    await fetch(`${BASE_URL}/api/admin/publish-round`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ round, bracketId }),
    });
    await Promise.all([fetchBracket(), fetchVotedMatchups(voterId)]);
  };

  const handleUnlockNames = async () => {
    await fetchBracket();
  };

  const handleAdvanceRound = async () => {
    try {
      setLoading(true);
      const roundKey = ROUND_KEY_MAP[bracket?.currentRound] || 'roundOf32';
      await advanceTournamentRound(roundKey, bracketId);
      await fetchBracket();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBracket();
    return () => setCurrentBracket(null);
  }, []);

  useEffect(() => {
    if (bracket?.status === 'draft') fetchPreviewMatchups();
  }, [bracket?.status, bracket?.totalNames]);

  const guestPredictions = useMemo(() =>
    computeGuestPredictions(bracket?.matchups, voteMap, publishedRounds),
    [bracket?.matchups, voteMap, publishedRounds]
  );

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

  const allNamesList = [
    ...(bracket.owner1Names || []),
    ...(bracket.owner2Names || []),
    ...(bracket.sharedNames || []),
  ];
  const nameMap = Object.fromEntries(allNamesList.map(n => [n.id, n]));

  const SEED_PAIRS = [
    [1, 16], [8, 9], [4, 13], [5, 12], [2, 15], [7, 10], [3, 14], [6, 11],
    [1, 16], [8, 9], [4, 13], [5, 12], [2, 15], [7, 10], [3, 14], [6, 11],
  ];

  const normalizeMatchup = (m, i) => {
    const name1Obj  = m.name1 && typeof m.name1 === 'object' ? m.name1 : null;
    const name2Obj  = m.name2 && typeof m.name2 === 'object' ? m.name2 : null;

    const n1 = nameMap[m.name1Id] || nameMap[name1Obj?.id];
    const n2 = nameMap[m.name2Id] || nameMap[name2Obj?.id];

    const [s1default, s2default] = SEED_PAIRS[i] || [i * 2 + 1, i * 2 + 2];

    return {
      _id: m.id || m._id?.toString() || `matchup-${i}`,
      name1: n1?.value || (typeof m.name1 === 'string' ? m.name1 : null) || name1Obj?.value || name1Obj?.name || 'TBD',
      name2: n2?.value || (typeof m.name2 === 'string' ? m.name2 : null) || name2Obj?.value || name2Obj?.name || 'TBD',
      name1Id: m.name1Id || name1Obj?.id || null,
      name2Id: m.name2Id || name2Obj?.id || null,
      seed1: m.seed1 || name1Obj?.seed || name1Obj?.rank || s1default,
      seed2: m.seed2 || name2Obj?.seed || name2Obj?.rank || s2default,
      votes1: m.votes1 ?? m.votes?.name1Votes ?? 0,
      votes2: m.votes2 ?? m.votes?.name2Votes ?? 0,
      winnerId: m.winnerId || null,
      isPlaceholder1: name1Obj?.isPlaceholder || false,
      isPlaceholder2: name2Obj?.isPlaceholder || false,
      round: m.round || null,
    };
  };

  const activeRoundKey = ROUND_KEY_MAP[bracket?.currentRound] || 'roundOf32';

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

  // Derive bracket display name from owner names if available
  const bracketTitle = (bracket.owner1Name && bracket.owner2Name)
    ? `${bracket.owner1Name} & ${bracket.owner2Name}`
    : 'Tournament Bracket';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Link
                  href="/"
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mr-1"
                >
                  &larr; Lobby
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{bracketTitle}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  bracket.championNameId
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700'
                    : bracket.status === 'draft'
                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700'
                      : 'bg-green-100 text-green-800 border border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700'
                }`}>
                  {bracket.championNameId
                    ? 'Champion Crowned!'
                    : bracket.status === 'draft'
                      ? 'Draft'
                      : 'Active — Voting Open'}
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
                  Lock & Start Voting
                </button>
              )}
              {bracket.status === 'active' && (
                <span className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-sm">
                  Bracket Locked
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
            <div className="absolute inset-0 opacity-10 text-9xl flex items-center justify-around pointer-events-none select-none">
              <span>*</span><span>-</span><span>*</span><span>-</span><span>*</span>
            </div>
            <div className="relative z-10">
              <div className="text-6xl mb-3">Trophy</div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-yellow-900/70 mb-1">
                Baby Name Bracket Champion
              </p>
              <h2 className="text-5xl font-black text-yellow-900 tracking-tight mb-3">
                {nameMap[bracket.championNameId]?.value || 'Champion'}
              </h2>
              <p className="text-yellow-800 font-medium text-sm">
                Congratulations — this name won the championship!
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
              : ' Ready — click "Lock & Start Voting" above.'}
          </div>
        )}
        {bracket.status === 'active' && !bracket.championNameId && (
          <div className="mb-4 bg-green-50 dark:bg-green-950/30 border-l-4 border-green-500 p-3 rounded text-sm text-green-800 dark:text-green-300">
            <strong>Bracket Locked.</strong> Guests can now vote on matchups. Use <strong>Admin → Pick Winner of Round</strong> to advance when ready.
          </div>
        )}
      </div>

      {/* Admin Panel — owners only */}
      {isOwnerOfCurrentBracket && (
        <div id="admin-panel">
          <AdminPanel
            bracket={bracket}
            matchupGrid={matchupGrid}
            nameMap={nameMap}
            publishedRounds={publishedRounds}
            activeRoundKey={activeRoundKey}
            ownerPicks={ownerPicks}
            onWinnerSet={handleSetWinner}
            onPublishRound={handlePublishRound}
            onUnlockNames={handleUnlockNames}
            isOpen={adminPanelOpen}
            onToggle={() => setAdminPanelOpen(p => !p)}
          />
        </div>
      )}

      {/* Bracket */}
      <div className="pb-10">
        <BracketView
          matchups={matchupGrid}
          status={bracket.status}
          voterId={voterId}
          voteMap={voteMap}
          viewerRole={viewerRole}
          ownerPicks={ownerPicks}
          lockedRounds={lockedRounds}
          publishedRounds={publishedRounds}
          activeRoundKey={activeRoundKey}
          bracketMatchups={bracket?.matchups || {}}
          nameMap={nameMap}
          guestPredictions={guestPredictions}
          onVoteSuccess={async () => {
            const fetches = [fetchBracket(), fetchVotedMatchups(voterId)];
            if (viewerRole === 'owner1' || viewerRole === 'owner2') fetches.push(fetchOwnerPicks());
            await Promise.all(fetches);
          }}
          onGuestLockIn={() => handleGuestLockIn(activeRoundKey)}
        />
      </div>
    </div>
  );
}
