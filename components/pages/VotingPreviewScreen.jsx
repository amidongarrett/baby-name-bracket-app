'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { useBracket } from '@/contexts/BracketContext';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function VotingPreviewScreen({ params }) {
  const { id: bracketId } = use(params);
  const router = useRouter();
  const { token } = useUser();
  const { ownerRole } = useBracket();

  const [bracket, setBracket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [waitingForPartner, setWaitingForPartner] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const authHeaders = () =>
    token
      ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      : { 'Content-Type': 'application/json' };

  const fetchBracket = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/bracket/${bracketId}`);
      if (!res.ok) throw new Error('Failed to fetch bracket');
      const data = await res.json();
      setBracket(data);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bracketId) fetchBracket();
  }, [bracketId]);

  // Derive loved name IDs from the latest vote round (reactions by the OTHER owner)
  const lovedNameIds = (() => {
    if (!bracket?.voteRounds?.length) return new Set();
    const latestRound = bracket.voteRounds[bracket.voteRounds.length - 1];
    const ids = new Set();
    for (const vote of latestRound.votes || []) {
      if (vote.reaction === 'love') ids.add(vote.nameId);
    }
    return ids;
  })();

  const handleConfirm = async () => {
    if (!ownerRole) {
      setErrorMsg('You must be logged in as an owner to confirm.');
      return;
    }

    setConfirming(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${BASE_URL}/api/bracket/confirm-preview`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ bracketId, ownerId: ownerRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to confirm.');
        return;
      }

      const data = await res.json();
      if (data.status === 'active') {
        router.push(`/bracket/${bracketId}`);
      } else {
        setWaitingForPartner(true);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setConfirming(false);
    }
  };

  const renderNameList = (names, label) => (
    <div className="flex-1 min-w-0">
      <h3 className="text-lg font-semibold text-foreground mb-4 text-center">{label}</h3>
      <div className="space-y-2">
        {(names || []).map((name, idx) => {
          const isLoved = lovedNameIds.has(name.id);
          const isShared = name.isShared;
          return (
            <div
              key={name.id}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                isShared
                  ? 'bg-purple-50 dark:bg-purple-900/30 border-2 border-purple-300 dark:border-purple-700'
                  : isLoved
                    ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-400 dark:border-green-600'
                    : 'bg-gray-50 dark:bg-gray-800'
              }`}
            >
              <span className={`text-xs font-bold px-2 py-1 rounded flex-shrink-0 ${
                isShared
                  ? 'text-purple-600 dark:text-purple-400 bg-purple-200 dark:bg-purple-900/60'
                  : 'text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700'
              }`}>
                #{idx + 1}
              </span>
              <span className="text-foreground truncate">{name.value}</span>
              {isShared && <span className="text-purple-500 flex-shrink-0" title="Shared Favorite">shared</span>}
              {isLoved && !isShared && <span className="text-green-500 flex-shrink-0" title="Loved by partner">♥</span>}
            </div>
          );
        })}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm">Loading preview...</p>
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

  const owner1Label = bracket?.owner1Name || 'Owner 1';
  const owner2Label = bracket?.owner2Name || 'Owner 2';

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-3">
            Pre-Tournament Preview
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review the final name rankings before the tournament begins. Names marked with ♥ were loved by your partner.
          </p>
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {errorMsg}
          </div>
        )}

        {/* Two-column ranked lists */}
        <div className="flex flex-col sm:flex-row gap-8 mb-10">
          {renderNameList(bracket?.owner1Names, `${owner1Label}'s Names`)}
          <div className="hidden sm:block w-px bg-gray-200 dark:bg-gray-700 self-stretch"></div>
          {renderNameList(bracket?.owner2Names, `${owner2Label}'s Names`)}
        </div>

        {/* Start Tournament button */}
        <div className="text-center">
          {waitingForPartner ? (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg text-blue-700 dark:text-blue-400 text-sm">
              Your confirmation is saved. Waiting for your partner to confirm...
            </div>
          ) : (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={confirming}
              className="px-10 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xl font-bold rounded-xl shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {confirming ? 'Confirming...' : 'Start Tournament'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
