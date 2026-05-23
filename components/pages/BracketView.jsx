'use client';

import { useState, useEffect, use } from 'react';
import BracketView from '@/components/bracket/BracketView';
import BracketListView from '@/components/bracket/BracketListView';
import { advanceTournamentRound } from '@/utils/api';
import { useUser } from '@/contexts/UserContext';
import { useBracket } from '@/contexts/BracketContext';
import ConfirmModal from '@/components/ui/ConfirmModal';
import LeaderboardStrip from '@/components/ui/LeaderboardStrip';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Maps bracket.currentRound display labels → API round keys
const ROUND_KEY_MAP = {
  'Round of 32':  'roundOf32',
  'Round of 16':  'roundOf16',
  'Elite 8':      'elite8',
  'Final 4':      'final4',
  'Championship': 'championship',
};

export default function BracketIdPage({ params, shareToken = null }) {
  // Next.js 15 async params pattern
  const { id: bracketId } = use(params);

  // Role is sourced from UserContext (backed by localStorage under 'userType')
  const { userType: viewerRole, token, user, isOwner } = useUser();
  const { setCurrentBracket, isOwnerOfCurrentBracket } = useBracket();

  // Returns fetch headers for my-bracket calls. Always send the Authorization header when a token is present.
  const authHeaders = () =>
    token
      ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      : { 'Content-Type': 'application/json' };

  const [bracket, setBracket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewMatchups, setPreviewMatchups] = useState([]);
  const [userBracket, setUserBracket] = useState(null);
  const [ownerPicks, setOwnerPicks] = useState({}); // { [matchupId]: { owner1NameId, owner2NameId } }
  const [publishedRounds, setPublishedRounds] = useState([]); // rounds admin has published
  const [voteTallies, setVoteTallies] = useState(null);
  const [myScore, setMyScore] = useState(null); // { score, maxPossible }
  const [showDeleteGuestModal, setShowDeleteGuestModal] = useState(false);
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('bracketViewMode');
      if (stored) return stored;
      return window.innerWidth < 768 ? 'list' : 'bracket';
    }
    return 'bracket';
  });

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('bracketViewMode', mode);
  };

  // Fetch this voter's UserBracket document using the authenticated user's token.
  const fetchUserBracket = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${BASE_URL}/api/bracket/${bracketId}/my-bracket`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUserBracket(data);
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
    if (token) fetchUserBracket();
  }, [token, user?.id]);

  // If the page was opened via a share-token invite link, register the user as a guest participant.
  useEffect(() => {
    if (!shareToken || !token || !bracketId) return;
    fetch(`${BASE_URL}/api/bracket/${bracketId}/join-share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ shareToken }),
    }).then(res => {
      if (res.ok) fetchUserBracket(); // refresh userBracket after join
    }).catch(() => {});
  }, [shareToken, token, bracketId]);

  const fetchMyScore = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${BASE_URL}/api/bracket/${bracketId}/scores`);
      if (res.ok) {
        const data = await res.json();
        const entry = (data || []).find(e => e.userId === user?.id);
        setMyScore(entry ? { score: entry.score, maxPossible: entry.maxPossible } : null);
      }
    } catch {}
  };

  const fetchVoteTallies = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/bracket/${bracketId}/vote-tallies`);
      if (res.ok) {
        const data = await res.json();
        setVoteTallies(data.tallies || null);
      }
    } catch {}
  };

  // Fetch owner picks on role change or bracket status change (all roles — guests need
  // this to derive whether any owner has voted on a matchup for the lockout UI)
  useEffect(() => {
    fetchOwnerPicks();
  }, [viewerRole, bracket?.status]);

  useEffect(() => {
    if (bracket?.status === 'active' || bracket?.status === 'completed') fetchVoteTallies();
  }, [bracket?.currentRound, bracket?.status]);
  useEffect(() => { fetchMyScore(); }, [user?.id, userBracket?.lockedAt]);

  const fetchBracket = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
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
      if (!silent) setLoading(false);
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

  const handlePick = async (round, position, selectedNameId) => {
    const savedScroll = window.scrollY;
    try {
      const res = await fetch(`${BASE_URL}/api/bracket/${bracketId}/my-bracket/pick`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ round, position, selectedNameId }),
      });
      if (res.ok) {
        setUserBracket(await res.json());
        await fetchUserBracket();
      }
    } catch (err) { console.error(err); }
    requestAnimationFrame(() => requestAnimationFrame(() =>
      window.scrollTo({ top: savedScroll, behavior: 'instant' })
    ));
  };

  const handleGuestLockIn = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/bracket/${bracketId}/my-bracket/lock`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        setUserBracket(data);
      }
    } catch {}
  };

  const handleResetPicks = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/bracket/${bracketId}/my-bracket/reset`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        setUserBracket(data);
      }
    } catch (err) {
      console.error('Reset picks error:', err);
    }
  };

  const handleDeleteGuestSession = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/bracket/${bracketId}/guest`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestId: user?.id }),
      });
      if (!res.ok) throw new Error('Failed to remove guest session');
      setUserBracket(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAdvanceRound = async () => {
    try {
      setLoading(true);
      const roundKey = ROUND_KEY_MAP[bracket?.currentRound] || 'roundOf32';
      await advanceTournamentRound(roundKey, bracketId);
      await fetchBracket();
      await fetchVoteTallies();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBracket();
    return () => setCurrentBracket(null);
  }, []);

  // Real-time polling on bracket view (active brackets only)
  useEffect(() => {
    if (bracket?.status !== 'active') return;

    let intervalId;

    const poll = async () => {
      await Promise.all([fetchBracket(true), fetchVoteTallies(), fetchOwnerPicks()]);
    };

    const startPolling = () => {
      intervalId = setInterval(poll, 9000);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        clearInterval(intervalId);
        intervalId = undefined;
      } else {
        poll();
        startPolling();
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [bracket?.status]);

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

  const normalizeMatchup = (m, i, roundKey) => {
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
      votes1: voteTallies?.[roundKey]?.[i]?.name1Votes ?? m.votes1 ?? 0,
      votes2: voteTallies?.[roundKey]?.[i]?.name2Votes ?? m.votes2 ?? 0,
      winnerId: m.winnerId || null,
      isPlaceholder1: name1Obj?.isPlaceholder || false,
      isPlaceholder2: name2Obj?.isPlaceholder || false,
      round: m.round || null,
    };
  };

  const effectivePublishedRounds = bracket?.status === 'completed'
    ? ['roundOf32', 'roundOf16', 'elite8', 'final4', 'championship']
    : publishedRounds;

  const activeRoundKey = ROUND_KEY_MAP[bracket?.currentRound] || (bracket?.status === 'completed' ? 'championship' : 'roundOf32');

  const currentRoundKey = bracket.currentRound === 'Completed'
    ? 'championship'
    : (ROUND_KEY_MAP[bracket.currentRound] || 'roundOf32');
  const rawMatchups = bracket.status === 'draft'
    ? previewMatchups
    : (bracket.matchups?.[currentRoundKey] || []);

  let matchupGrid = rawMatchups.length > 0
    ? rawMatchups.map((m, i) => normalizeMatchup(m, i, currentRoundKey))
    : Array.from({ length: 16 }, (_, i) => normalizeMatchup({
        _id: `placeholder-${i}`,
        name1: { value: 'TBD', isPlaceholder: true, seed: SEED_PAIRS[i]?.[0] || i * 2 + 1 },
        name2: { value: 'TBD', isPlaceholder: true, seed: SEED_PAIRS[i]?.[1] || i * 2 + 2 },
      }, i, currentRoundKey));

  // Derive bracket display name from owner names if available
  const bracketTitle = (bracket.owner1Name && bracket.owner2Name)
    ? `${bracket.owner1Name} & ${bracket.owner2Name}`
    : 'Tournament Bracket';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="grid grid-cols-3 items-center">
            {/* Left: title */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{bracketTitle}</h1>
            </div>

            {/* Center: leaderboard strip */}
            <div className="flex justify-center min-w-0 overflow-x-hidden">
              {bracket.status !== 'draft' && (
                <LeaderboardStrip bracketId={bracketId} currentUserId={user?.id} />
              )}
            </div>

            {/* Right: view toggle, right-aligned */}
            <div className="flex justify-end">
              {bracket.status !== 'draft' && (
                <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-sm font-medium">
                  <button
                    onClick={() => handleViewModeChange('bracket')}
                    className={`px-3 py-1.5 transition-colors ${
                      viewMode === 'bracket'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    Bracket
                  </button>
                  <button
                    onClick={() => handleViewModeChange('list')}
                    className={`px-3 py-1.5 transition-colors ${
                      viewMode === 'list'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    List
                  </button>
                </div>
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

      {/* Bracket */}
      <div className="pb-10">
        {viewMode === 'list' ? (
          <BracketListView
            matchups={matchupGrid}
            status={bracket.status}
            voterId={user?.id}
            userBracket={userBracket}
            viewerRole={viewerRole}
            ownerPicks={ownerPicks}
            publishedRounds={effectivePublishedRounds}
            activeRoundKey={activeRoundKey}
            bracketMatchups={bracket?.matchups || {}}
            nameMap={nameMap}
            voteTallies={voteTallies}
            onPick={handlePick}
            onLockIn={handleGuestLockIn}
            onResetPicks={handleResetPicks}
            bracketId={bracketId}
            onProceedToNextRound={fetchBracket}
          />
        ) : (
          <BracketView
            matchups={matchupGrid}
            status={bracket.status}
            voterId={user?.id}
            userBracket={userBracket}
            viewerRole={viewerRole}
            ownerPicks={ownerPicks}
            publishedRounds={effectivePublishedRounds}
            activeRoundKey={activeRoundKey}
            bracketMatchups={bracket?.matchups || {}}
            nameMap={nameMap}
            voteTallies={voteTallies}
            onLockIn={handleGuestLockIn}
            onResetPicks={handleResetPicks}
            onPick={handlePick}
            myScore={myScore}
          />
        )}
      </div>

      {/* Guest — delete my participation */}
      {!isOwnerOfCurrentBracket && viewerRole === 'guest' && user?.id && (
        <div className="max-w-7xl mx-auto px-4 pb-6">
          <button
            onClick={() => setShowDeleteGuestModal(true)}
            className="text-sm text-red-500 hover:text-red-700 underline"
          >
            Delete my participation
          </button>
          {showDeleteGuestModal && (
            <ConfirmModal
              title="Delete My Participation"
              message="This removes all your votes from this bracket. You will no longer be counted as a participant."
              confirmLabel="Yes, Remove"
              onConfirm={async () => {
                await handleDeleteGuestSession();
                setShowDeleteGuestModal(false);
              }}
              onCancel={() => setShowDeleteGuestModal(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}
