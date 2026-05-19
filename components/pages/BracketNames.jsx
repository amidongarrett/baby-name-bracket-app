'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import NameGenerator from '@/components/bracket/NameGenerator';
import { useUser } from '@/contexts/UserContext';
import { useBracket } from '@/contexts/BracketContext';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function getEffectiveRank(item, sharedNames) {
  if (item.isShared) {
    const shared = sharedNames.find(s => s.name === item.name);
    return shared ? shared.rank : item.rank;
  }
  return item.rank;
}

export default function BracketNamesPage({ params }) {
  const { id: bracketId } = use(params);

  // API Connection Status
  const [apiConnected, setApiConnected] = useState(false);
  const [apiChecking, setApiChecking] = useState(true);

  // Data structure: { name: string, rank: number, isShared?: boolean, addedBy?: 'owner1' | 'owner2' }
  const [owner1Names, setOwner1Names] = useState([]);
  const [owner2Names, setOwner2Names] = useState([]);
  const [sharedNames, setSharedNames] = useState([]);
  const [owner1Input, setOwner1Input] = useState('');
  const [owner2Input, setOwner2Input] = useState('');
  const [owner1Error, setOwner1Error] = useState('');
  const [owner2Error, setOwner2Error] = useState('');

  // Lock-in status tracking
  const [owner1LockedIn, setOwner1LockedIn] = useState(false);
  const [owner2LockedIn, setOwner2LockedIn] = useState(false);
  const [bracketStatus, setBracketStatus] = useState('draft');
  const [showCelebration, setShowCelebration] = useState(false);

  // Identity from BracketContext
  const { setCurrentBracket, isOwnerOfCurrentBracket, ownerRole } = useBracket();
  const isOwner = isOwnerOfCurrentBracket;
  const isOwner1 = ownerRole === 'owner1';
  const isOwner2 = ownerRole === 'owner2';
  const role = ownerRole === 'owner1' ? 'Owner 1' : ownerRole === 'owner2' ? 'Owner 2' : null;

  // Pending queues
  const [owner1PendingNames, setOwner1PendingNames] = useState([]);
  const [owner2PendingNames, setOwner2PendingNames] = useState([]);

  const MAX_NAMES = 16;

  // Cleanup on unmount
  useEffect(() => {
    return () => setCurrentBracket(null);
  }, []);

  // Check API connection on mount
  useEffect(() => {
    const checkAPIConnection = async () => {
      try {
        const response = await fetch(`${BASE_URL}/health`);
        if (response.ok) {
          const data = await response.json();
          console.log('API Health Check:', data);
          setApiConnected(true);
        } else {
          setApiConnected(false);
        }
      } catch (error) {
        console.error('API Connection Error:', error);
        setApiConnected(false);
      } finally {
        setApiChecking(false);
      }
    };

    checkAPIConnection();
  }, []);

  // Helper function for case-insensitive comparison
  const normalizeNameForComparison = (name) => name.toLowerCase().trim();

  // Real-time validation for Owner 1 input
  useEffect(() => {
    const trimmedName = owner1Input.trim();
    if (!trimmedName) {
      setOwner1Error('');
      return;
    }

    const normalizedInput = normalizeNameForComparison(trimmedName);

    const existsInShared = sharedNames.find(item => normalizeNameForComparison(item.name) === normalizedInput);
    if (existsInShared) {
      setOwner1Error(`"${existsInShared.name}" is already in the Shared Favorites list!`);
      return;
    }

    const existsInOwn = owner1Names.find(item => normalizeNameForComparison(item.name) === normalizedInput);
    if (existsInOwn) {
      setOwner1Error(`"${existsInOwn.name}" is already in your list at rank #${existsInOwn.rank}!`);
      return;
    }

    if (owner1Names.length >= MAX_NAMES) {
      setOwner1Error(`You can only add up to ${MAX_NAMES} names!`);
      return;
    }

    setOwner1Error('');
  }, [owner1Input, owner1Names, sharedNames]);

  // Real-time validation for Owner 2 input
  useEffect(() => {
    const trimmedName = owner2Input.trim();
    if (!trimmedName) {
      setOwner2Error('');
      return;
    }

    const normalizedInput = normalizeNameForComparison(trimmedName);

    const existsInShared = sharedNames.find(item => normalizeNameForComparison(item.name) === normalizedInput);
    if (existsInShared) {
      setOwner2Error(`"${existsInShared.name}" is already in the Shared Favorites list!`);
      return;
    }

    const existsInOwn = owner2Names.find(item => normalizeNameForComparison(item.name) === normalizedInput);
    if (existsInOwn) {
      setOwner2Error(`"${existsInOwn.name}" is already in your list at rank #${existsInOwn.rank}!`);
      return;
    }

    if (owner2Names.length >= MAX_NAMES) {
      setOwner2Error(`You can only add up to ${MAX_NAMES} names!`);
      return;
    }

    setOwner2Error('');
  }, [owner2Input, owner2Names, sharedNames]);

  // Fetch bracket data from API and update state
  const fetchBracketData = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/bracket/${bracketId}`);
      if (response.ok) {
        const data = await response.json();
        setCurrentBracket(data);

        if (data.owner1Names || data.owner2Names || data.sharedNames) {
          const owner1Data = (data.owner1Names || []).map((item, index) => ({
            id: item.id,
            name: item.value,
            rank: index + 1,
            isShared: item.isShared || false
          }));

          const owner2Data = (data.owner2Names || []).map((item, index) => ({
            id: item.id,
            name: item.value,
            rank: index + 1,
            isShared: item.isShared || false
          }));

          const sharedData = (data.sharedNames || []).map((item, index) => ({
            id: item.id,
            name: item.value,
            rank: index + 1,
            addedBy: item.submittedBy === 'Owner 1' ? 'owner1' : 'owner2'
          }));

          setOwner1Names(owner1Data);
          setOwner2Names(owner2Data);
          setSharedNames(sharedData);

          const pending1Data = (data.owner1PendingNames || []).map(item => ({
            id: item.id,
            name: item.value,
            submittedBy: item.submittedBy
          }));
          const pending2Data = (data.owner2PendingNames || []).map(item => ({
            id: item.id,
            name: item.value,
            submittedBy: item.submittedBy
          }));
          setOwner1PendingNames(pending1Data);
          setOwner2PendingNames(pending2Data);

          setOwner1LockedIn(data.owner1LockedIn || false);
          setOwner2LockedIn(data.owner2LockedIn || false);
          setBracketStatus(data.status || 'draft');

          if (data.owner1LockedIn && data.owner2LockedIn && data.status === 'active') {
            setShowCelebration(true);
            setTimeout(() => setShowCelebration(false), 5000);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching bracket data:', error);
    }
  };

  // Load bracket data on mount
  useEffect(() => {
    if (apiConnected) {
      fetchBracketData();
    }
  }, [apiConnected]);

  // Handle adding name for Owner 1
  const handleAddOwner1 = async (e) => {
    e.preventDefault();
    const trimmedName = owner1Input.trim();

    if (!trimmedName || owner1Error) return;

    try {
      const response = await fetch(`${BASE_URL}/api/names`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: trimmedName,
          owner: 'Owner 1',
          bracketId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setOwner1Error(data.error || 'Failed to add name');
        return;
      }

      await fetchBracketData();
      setOwner1Input('');
      setOwner1Error('');

    } catch (error) {
      console.error('Error adding name:', error);
      setOwner1Error('Failed to connect to server');
    }
  };

  // Handle adding name for Owner 2
  const handleAddOwner2 = async (e) => {
    e.preventDefault();
    const trimmedName = owner2Input.trim();

    if (!trimmedName || owner2Error) return;

    try {
      const response = await fetch(`${BASE_URL}/api/names`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: trimmedName,
          owner: 'Owner 2',
          bracketId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setOwner2Error(data.error || 'Failed to add name');
        return;
      }

      await fetchBracketData();
      setOwner2Input('');
      setOwner2Error('');

    } catch (error) {
      console.error('Error adding name:', error);
      setOwner2Error('Failed to connect to server');
    }
  };

  // Delete name from backend and refresh data
  const handleDeleteName = async (nameId) => {
    try {
      const response = await fetch(`${BASE_URL}/api/names/${nameId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bracketId })
      });

      if (response.ok) {
        await fetchBracketData();
      } else {
        const data = await response.json();
        console.error('Failed to delete name:', data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error deleting name:', error);
    }
  };

  // Remove a name from the shared list
  const handleRemoveShared = async (nameId) => {
    try {
      const removedBy = role;
      const response = await fetch(`${BASE_URL}/api/shared-names/${nameId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ removedBy, bracketId })
      });
      if (response.ok) {
        await fetchBracketData();
      } else {
        const data = await response.json();
        console.error('Failed to remove shared name:', data.error);
      }
    } catch (error) {
      console.error('Error removing shared name:', error);
    }
  };

  // Cancel a pending name transfer
  const handleRemovePending = async (nameId) => {
    try {
      const response = await fetch(`${BASE_URL}/api/pending-names/${nameId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bracketId })
      });
      if (response.ok) {
        await fetchBracketData();
      } else {
        const data = await response.json();
        console.error('Failed to remove pending name:', data.error);
      }
    } catch (error) {
      console.error('Error removing pending name:', error);
    }
  };

  // Handle lock-in for owners
  const handleLockIn = async (owner) => {
    try {
      const response = await fetch(`${BASE_URL}/api/bracket/lock-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ owner, bracketId })
      });

      if (response.ok) {
        await fetchBracketData();
      } else {
        const data = await response.json();
        console.error('Failed to lock in:', data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error locking in:', error);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-3">
            <Link href={`/bracket/${bracketId}`} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
              &larr; Back to Bracket
            </Link>
          </div>
          <div className="flex items-center justify-center gap-3 mb-4">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
              Name Submission Dashboard
            </h1>
            {/* API Connection Status Badge */}
            {!apiChecking && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className={`w-2 h-2 rounded-full ${apiConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className={`text-xs font-medium ${apiConnected ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                  {apiConnected ? 'API Connected' : 'API Offline'}
                </span>
              </div>
            )}
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {bracketStatus === 'draft'
              ? `Each parent adds up to ${MAX_NAMES} names. Duplicates automatically move to Shared Favorites!`
              : 'Both parents have locked in their names! The bracket is now active for voting.'
            }
          </p>

          {/* Celebration Message */}
          {showCelebration && (
            <div className="mt-6 mx-auto max-w-2xl bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-lg shadow-lg animate-bounce">
              <p className="text-center text-xl font-bold">
                Both parents have locked in! The tournament is now active!
              </p>
            </div>
          )}

          {/* Go to Tournament Button */}
          {owner1LockedIn && owner2LockedIn && (
            <div className="mt-6">
              <Link
                href={`/bracket/${bracketId}`}
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg font-bold rounded-xl shadow-lg hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl transition-all transform hover:scale-105"
              >
                Go to Tournament Bracket
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          )}
        </div>

        {/* Three Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Owner 1 Column */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Owner 1 (Husband)
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {owner1Names.length} / {MAX_NAMES} names
            </p>

            {/* Input Form or Locked State */}
            {!owner1LockedIn ? (
              <>
                <NameGenerator onGenerate={(name) => setOwner1Input(name)} />
                <form onSubmit={handleAddOwner1} className="mb-4">
                  <input
                    type="text"
                    value={owner1Input}
                    onChange={(e) => setOwner1Input(e.target.value)}
                    placeholder="Enter a baby name..."
                    className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-foreground focus:outline-none focus:ring-2 ${
                      owner1Error
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 dark:border-gray-700 focus:ring-foreground'
                    }`}
                  />
                  {owner1Error && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                      {owner1Error}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={!owner1Input.trim() || !!owner1Error}
                    className="mt-3 w-full px-4 py-2 bg-foreground text-background rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Name
                  </button>
                </form>

                {/* Lock In Button */}
                <button
                  onClick={() => handleLockIn('Owner 1')}
                  disabled={owner1Names.length === 0}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-bold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md mb-6"
                >
                  Lock In My Names
                </button>
              </>
            ) : (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-500 dark:border-green-600 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-400">
                  <span className="text-2xl">✅</span>
                  <span className="font-bold text-lg">Names Locked In!</span>
                </div>
                <p className="text-center text-sm text-green-600 dark:text-green-500 mt-2">
                  {owner2LockedIn ? 'Both parents ready! Bracket is active.' : 'Waiting for Wife to lock in...'}
                </p>
              </div>
            )}

            {/* Names List (sorted by rank) */}
            {(!isOwner2 || (owner1LockedIn && owner2LockedIn)) ? (
              <div className="space-y-2">
                {isOwner1 && owner1PendingNames.map(item => (
                  <div key={`owner1-pending-${item.id}`}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40 px-2 py-1 rounded">
                        PENDING
                      </span>
                      <span
                        className="text-red-700 dark:text-red-400 cursor-help"
                        title="Name will be added when list falls below 16 names.">
                        {item.name}
                      </span>
                    </div>
                    {!owner1LockedIn && (
                      <button onClick={() => handleRemovePending(item.id)}
                        className="text-red-500 hover:text-red-700 font-medium text-sm">
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                {owner1Names
                  .sort((a, b) => getEffectiveRank(a, sharedNames) - getEffectiveRank(b, sharedNames))
                  .map((item) => (
                    <div
                      key={`owner1-${item.name}`}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                        item.isShared
                          ? 'bg-purple-50 dark:bg-purple-900/30 border-2 border-purple-300 dark:border-purple-700'
                          : 'bg-gray-50 dark:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                          item.isShared
                            ? 'text-purple-600 dark:text-purple-400 bg-purple-200 dark:bg-purple-900/60'
                            : 'text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700'
                        }`}>
                          #{getEffectiveRank(item, sharedNames)}
                        </span>
                        <div className="flex items-center gap-2">
                          {item.isShared && (
                            <span className="text-purple-500" title="Shared Favorite">💜</span>
                          )}
                          <span className="text-foreground">{item.name}</span>
                        </div>
                      </div>
                      {isOwner1 && !owner1LockedIn && (
                        <button
                          onClick={() => handleDeleteName(item.id)}
                          className="text-red-500 hover:text-red-700 font-medium text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}

                {/* Shared names not owned by Owner 1 */}
                {sharedNames
                  .filter(shared => shared.addedBy === 'owner2')
                  .map((item) => (
                    <div
                      key={`owner1-shared-${item.name}`}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800/50 border border-dashed border-gray-300 dark:border-gray-700"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                            #{item.rank}
                          </span>
                          <span className="text-foreground/70">{item.name}</span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 italic ml-8">
                          Shared name - on Wife's list
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 dark:text-gray-600 italic py-8">
                Hidden until both owners lock in.
              </p>
            )}
          </div>

          {/* Shared Favorites Column */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-300 dark:border-purple-700 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-foreground mb-4 text-center">
              💜 Shared Favorites
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-center">
              {sharedNames.length} mutual favorites
            </p>

            {/* Shared Names List (sorted by rank) */}
            <div className="space-y-2">
              {sharedNames.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-500 italic py-8">
                  No shared names yet. Keep adding!
                </p>
              ) : (
                sharedNames
                  .sort((a, b) => a.rank - b.rank)
                  .map((item) => (
                    <div
                      key={`shared-${item.name}`}
                      className="px-3 py-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-purple-200 dark:border-purple-800"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/40 px-2 py-1 rounded">
                            #{item.rank}
                          </span>
                          <span className="text-foreground font-medium">{item.name}</span>
                        </div>
                        {isOwner && (isOwner1 ? !owner1LockedIn : !owner2LockedIn) && (
                          <button
                            onClick={() => handleRemoveShared(item.id)}
                            className="text-red-500 hover:text-red-700 font-medium text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 ml-12">
                        First added by: <span className="font-medium">{item.addedBy === 'owner1' ? 'Husband' : 'Wife'}</span>
                      </p>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Owner 2 Column */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Owner 2 (Wife)
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {owner2Names.length} / {MAX_NAMES} names
            </p>

            {/* Input Form or Locked State */}
            {!owner2LockedIn ? (
              <>
                <NameGenerator onGenerate={(name) => setOwner2Input(name)} />
                <form onSubmit={handleAddOwner2} className="mb-4">
                  <input
                    type="text"
                    value={owner2Input}
                    onChange={(e) => setOwner2Input(e.target.value)}
                    placeholder="Enter a baby name..."
                    className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-foreground focus:outline-none focus:ring-2 ${
                      owner2Error
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 dark:border-gray-700 focus:ring-foreground'
                    }`}
                  />
                  {owner2Error && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                      {owner2Error}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={!owner2Input.trim() || !!owner2Error}
                    className="mt-3 w-full px-4 py-2 bg-foreground text-background rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Name
                  </button>
                </form>

                {/* Lock In Button */}
                <button
                  onClick={() => handleLockIn('Owner 2')}
                  disabled={owner2Names.length === 0}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-bold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md mb-6"
                >
                  Lock In My Names
                </button>
              </>
            ) : (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-500 dark:border-green-600 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-400">
                  <span className="text-2xl">✅</span>
                  <span className="font-bold text-lg">Names Locked In!</span>
                </div>
                <p className="text-center text-sm text-green-600 dark:text-green-500 mt-2">
                  {owner1LockedIn ? 'Both parents ready! Bracket is active.' : 'Waiting for Husband to lock in...'}
                </p>
              </div>
            )}

            {/* Names List (sorted by rank) */}
            {(!isOwner1 || (owner1LockedIn && owner2LockedIn)) ? (
              <div className="space-y-2">
                {isOwner2 && owner2PendingNames.map(item => (
                  <div key={`owner2-pending-${item.id}`}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40 px-2 py-1 rounded">
                        PENDING
                      </span>
                      <span
                        className="text-red-700 dark:text-red-400 cursor-help"
                        title="Name will be added when list falls below 16 names.">
                        {item.name}
                      </span>
                    </div>
                    {!owner2LockedIn && (
                      <button onClick={() => handleRemovePending(item.id)}
                        className="text-red-500 hover:text-red-700 font-medium text-sm">
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                {owner2Names
                  .sort((a, b) => getEffectiveRank(a, sharedNames) - getEffectiveRank(b, sharedNames))
                  .map((item) => (
                    <div
                      key={`owner2-${item.name}`}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                        item.isShared
                          ? 'bg-purple-50 dark:bg-purple-900/30 border-2 border-purple-300 dark:border-purple-700'
                          : 'bg-gray-50 dark:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                          item.isShared
                            ? 'text-purple-600 dark:text-purple-400 bg-purple-200 dark:bg-purple-900/60'
                            : 'text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700'
                        }`}>
                          #{getEffectiveRank(item, sharedNames)}
                        </span>
                        <div className="flex items-center gap-2">
                          {item.isShared && (
                            <span className="text-purple-500" title="Shared Favorite">💜</span>
                          )}
                          <span className="text-foreground">{item.name}</span>
                        </div>
                      </div>
                      {isOwner2 && !owner2LockedIn && (
                        <button
                          onClick={() => handleDeleteName(item.id)}
                          className="text-red-500 hover:text-red-700 font-medium text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}

                {/* Shared names not owned by Owner 2 */}
                {sharedNames
                  .filter(shared => shared.addedBy === 'owner1')
                  .map((item) => (
                    <div
                      key={`owner2-shared-${item.name}`}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800/50 border border-dashed border-gray-300 dark:border-gray-700"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                            #{item.rank}
                          </span>
                          <span className="text-foreground/70">{item.name}</span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 italic ml-8">
                          Shared name - on Husband's list
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 dark:text-gray-600 italic py-8">
                Hidden until both owners lock in.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
