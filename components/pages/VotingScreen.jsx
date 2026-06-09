'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { useBracket } from '@/contexts/BracketContext';
import VoteNameCard from '@/components/bracket/VoteNameCard';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function VotingScreen({ params }) {
  const { id: bracketId } = use(params);
  const router = useRouter();
  const { token, user } = useUser();
  useBracket();

  const [bracket, setBracket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [waitingForPartner, setWaitingForPartner] = useState(false);

  // Map<nameId, { reaction: 'love'|'like'|'hate'|null, suggestion: string|null }>
  const [reactions, setReactions] = useState({});

  const ownerRole = (() => {
    if (!bracket || !user) return null;
    if (user.id === bracket.owner1UserId) return 'owner1';
    if (user.id === bracket.owner2UserId) return 'owner2';
    return null;
  })();

  // The names belonging to the OTHER owner — the ones this owner votes on
  const otherOwnerNames = (() => {
    if (!bracket) return [];
    if (ownerRole === 'owner1') return bracket.owner2Names || [];
    if (ownerRole === 'owner2') return bracket.owner1Names || [];
    return [];
  })();

  const currentCycle = bracket?.voteRounds?.length > 0
    ? bracket.voteRounds[bracket.voteRounds.length - 1].cycle
    : 1;

  const authHeaders = () =>
    token
      ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      : { 'Content-Type': 'application/json' };

  // Fetch bracket and pre-fill prior reactions
  const fetchData = async () => {
    try {
      setLoading(true);
      const [bracketRes, votesRes] = await Promise.all([
        fetch(`${BASE_URL}/api/bracket/${bracketId}`),
        fetch(`${BASE_URL}/api/bracket/votes?bracketId=${bracketId}`, { headers: authHeaders() }),
      ]);

      if (!bracketRes.ok) throw new Error('Failed to fetch bracket');
      const bracketData = await bracketRes.json();
      setBracket(bracketData);

      // Pre-fill reactions from the latest cycle
      if (votesRes.ok) {
        const votesData = await votesRes.json();
        const cycles = votesData.cycles || [];
        if (cycles.length > 0) {
          const latestCycle = cycles[cycles.length - 1];
          const myVotes = (latestCycle.votes || []).filter(v => v.voterId === ownerRole);
          const prefilled = {};
          for (const v of myVotes) {
            prefilled[v.nameId] = { reaction: v.reaction, suggestion: v.suggestion || '' };
          }
          setReactions(prefilled);
        }
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bracketId) fetchData();
  }, [bracketId, ownerRole]);

  const handleReact = (nameId, reaction) => {
    setReactions(prev => ({
      ...prev,
      [nameId]: { ...prev[nameId], reaction, suggestion: reaction === 'like' ? (prev[nameId]?.suggestion || '') : '' },
    }));
  };

  const handleSuggest = (nameId, text) => {
    setReactions(prev => ({
      ...prev,
      [nameId]: { ...prev[nameId], suggestion: text },
    }));
  };

  const handleSavePicks = async () => {
    if (!ownerRole) {
      setErrorMsg('You must be logged in as an owner to vote.');
      return;
    }

    const votes = otherOwnerNames
      .filter(n => reactions[n.id]?.reaction)
      .map(n => ({
        nameId: n.id,
        reaction: reactions[n.id].reaction,
        suggestion: reactions[n.id]?.suggestion || null,
      }));

    setSaving(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${BASE_URL}/api/bracket/votes/submit`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ bracketId, ownerId: ownerRole, cycle: currentCycle, votes }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to save votes.');
        return;
      }

      const data = await res.json();

      if (!data.bothSubmitted) {
        setWaitingForPartner(true);
        return;
      }

      if (data.nextStatus === 'preview') {
        router.push(`/bracket/${bracketId}/preview`);
      } else if (data.nextStatus === 'voting') {
        // Another cycle needed — redirect to names page with hated flag
        router.push(`/bracket/${bracketId}/names?hated=true`);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm">Loading voting screen...</p>
        </div>
      </div>
    );
  }

  if (errorMsg && !bracket) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        Error: {errorMsg}
      </div>
    );
  }

  const partnerDisplayName = ownerRole === 'owner1'
    ? (bracket?.owner2Name || 'Your Partner')
    : (bracket?.owner1Name || 'Your Partner');

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-3">
            React to {partnerDisplayName}'s Names
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Love, Like, or Hate each name. Your reactions help shape the final list before the tournament begins.
          </p>
          {currentCycle > 1 && (
            <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400 font-medium">
              Voting cycle {currentCycle} — prior reactions are pre-filled.
            </p>
          )}
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {errorMsg}
          </div>
        )}

        {/* Waiting for partner banner */}
        {waitingForPartner && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg text-blue-700 dark:text-blue-400 text-sm text-center">
            Your picks are saved. Waiting for {partnerDisplayName} to submit their reactions...
          </div>
        )}

        {/* Name cards */}
        {!waitingForPartner && (
          <>
            <div className="space-y-3 mb-8">
              {otherOwnerNames.length === 0 ? (
                <p className="text-center text-gray-500 italic py-8">No names to react to yet.</p>
              ) : (
                otherOwnerNames.map(nameObj => (
                  <VoteNameCard
                    key={nameObj.id}
                    name={nameObj.value}
                    reaction={reactions[nameObj.id]?.reaction || null}
                    suggestion={reactions[nameObj.id]?.suggestion || ''}
                    onReact={(r) => handleReact(nameObj.id, r)}
                    onSuggest={(t) => handleSuggest(nameObj.id, t)}
                  />
                ))
              )}
            </div>

            {/* Save Picks button */}
            <div className="sticky bottom-6">
              <button
                type="button"
                onClick={handleSavePicks}
                disabled={saving || otherOwnerNames.length === 0}
                className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg font-bold rounded-xl shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Picks'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
