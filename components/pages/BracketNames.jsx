'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { DragDropContext } from '@hello-pangea/dnd';
import NameGenerator from '@/components/bracket/NameGenerator';
import AiNameBank from '@/components/bracket/AiNameBank';
import DraggableNameList from '@/components/bracket/DraggableNameList';
import NameBankList from '@/components/bracket/NameBankList';
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

  // Owner display names and icons
  const [owner1DisplayName, setOwner1DisplayName] = useState('Owner 1');
  const [owner2DisplayName, setOwner2DisplayName] = useState('Owner 2');
  const [owner1Icon, setOwner1Icon] = useState('👤');
  const [owner2Icon, setOwner2Icon] = useState('👤');

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

  // Owner 2 join status and invite card state
  const [owner2UserId, setOwner2UserId] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState('idle'); // 'idle' | 'sending' | 'sent' | 'error'
  const [inviteError, setInviteError] = useState('');

  // Pending queues
  const [owner1PendingNames, setOwner1PendingNames] = useState([]);
  const [owner2PendingNames, setOwner2PendingNames] = useState([]);

  // Bank names (names beyond the 16-slot active list)
  const [owner1BankNames, setOwner1BankNames] = useState([]);
  const [owner2BankNames, setOwner2BankNames] = useState([]);

  // AI suggestion banks (ephemeral staging area, persisted to DB)
  const [owner1AiBank, setOwner1AiBank] = useState([]);
  const [owner2AiBank, setOwner2AiBank] = useState([]);

  // Dismissed AI suggestion names for the logged-in owner (persisted to DB)
  const [dismissedNames, setDismissedNames] = useState([]);

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

    // No cap error — names beyond 16 go to the Name Bank silently
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

    // No cap error — names beyond 16 go to the Name Bank silently
    setOwner2Error('');
  }, [owner2Input, owner2Names, sharedNames]);

  // Fetch bracket data from API and update state
  const fetchBracketData = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/bracket/${bracketId}`);
      if (response.ok) {
        const data = await response.json();
        setCurrentBracket(data);
        setOwner2UserId(data.owner2UserId || null);

        if (data.owner1Names || data.owner2Names || data.sharedNames) {
          const owner1Data = (data.owner1Names || []).map((item, index) => ({
            id: item.id,
            name: item.value,
            rank: index + 1,
            isShared: item.isShared || false,
            status: item.status || 'active',
          }));

          const owner2Data = (data.owner2Names || []).map((item, index) => ({
            id: item.id,
            name: item.value,
            rank: index + 1,
            isShared: item.isShared || false,
            status: item.status || 'active',
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

          setOwner1BankNames((data.owner1BankNames || []).map(item => ({ id: item.id, name: item.value })));
          setOwner2BankNames((data.owner2BankNames || []).map(item => ({ id: item.id, name: item.value })));

          setOwner1LockedIn(data.owner1LockedIn || false);
          setOwner2LockedIn(data.owner2LockedIn || false);
          setBracketStatus(data.status || 'draft');

          setOwner1DisplayName(data.owner1Name || 'Owner 1');
          setOwner2DisplayName(data.owner2Name || 'Owner 2');
          setOwner1Icon(data.owner1Icon || '👤');
          setOwner2Icon(data.owner2Icon || '👤');

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

  // Fire-and-forget helper to persist AI bank/dismissed changes to the DB
  const syncPreferences = async (patch) => {
    const authToken = localStorage.getItem('authToken');
    await fetch(`${BASE_URL}/api/names/preferences/${bracketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify(patch),
    });
    // fire-and-forget: failures are non-critical; no error surfaced to user
  };

  // Load persisted AI bank and dismissed names for the logged-in owner
  useEffect(() => {
    if (!apiConnected || !isOwner) return;
    const load = async () => {
      const authToken = localStorage.getItem('authToken');
      const res = await fetch(`${BASE_URL}/api/names/preferences/${bracketId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) return;
      const { bankNames, dismissedNames: dismissed } = await res.json();
      if (isOwner1) setOwner1AiBank(bankNames);
      if (isOwner2) setOwner2AiBank(bankNames);
      setDismissedNames(dismissed);
    };
    load();
  }, [apiConnected, isOwner1, isOwner2]);

  // Real-time polling on the names page (draft status only)
  useEffect(() => {
    if (!apiConnected || bracketStatus !== 'draft') return;

    let intervalId;

    const startPolling = () => {
      intervalId = setInterval(fetchBracketData, 5000);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        clearInterval(intervalId);
        intervalId = undefined;
      } else {
        fetchBracketData();
        startPolling();
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [apiConnected, bracketStatus]);

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

  // Send (or re-send) the Owner 2 partner invite from the names page
  const handleInviteOwner2 = async (e) => {
    e.preventDefault();
    const email = inviteEmail.trim();
    if (!email) return;
    setInviteStatus('sending');
    setInviteError('');
    try {
      const authToken = localStorage.getItem('authToken');
      const res = await fetch(`${BASE_URL}/api/brackets/${bracketId}/invite-owner2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ email }),
      });
      const body = await res.json();
      if (!res.ok) {
        setInviteError(body.error || 'Failed to send invite');
        setInviteStatus('error');
        return;
      }
      setInviteStatus('sent');
    } catch {
      setInviteError('Failed to connect to server');
      setInviteStatus('error');
    }
  };

  // Persist reordering to the API
  const handleReorder = async (owner, activeNames, bankNames) => {
    const updates = [
      ...activeNames.map((n, i) => ({ id: n.id, rank: i + 1, status: 'active' })),
      ...bankNames.map(n => ({ id: n.id, rank: null, status: 'bank' })),
    ];
    try {
      const authToken = localStorage.getItem('authToken');
      await fetch(`${BASE_URL}/api/brackets/${bracketId}/names/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ updates }),
      });
    } catch (err) {
      console.error('Reorder failed, refreshing:', err);
      await fetchBracketData();
    }
  };

  const handleOwner1DragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination } = result;

    const isSourceActive = source.droppableId === 'owner1-active';
    const isDestActive   = destination.droppableId === 'owner1-active';

    let newActive = [...owner1Names];
    let newBank   = [...owner1BankNames];

    if (isSourceActive && isDestActive) {
      // Reorder within active list
      const [moved] = newActive.splice(source.index, 1);
      newActive.splice(destination.index, 0, moved);
    } else if (isSourceActive && !isDestActive) {
      // Move active -> bank; backfill first bank name if available
      const [moved] = newActive.splice(source.index, 1);
      if (newBank.length > 0) {
        const [promoted] = newBank.splice(0, 1);
        newActive.splice(source.index, 0, promoted);
        newBank.splice(destination.index, 0, moved);
      } else {
        newBank.splice(destination.index, 0, moved);
      }
    } else if (!isSourceActive && isDestActive) {
      // Move bank -> active; displace last active to bank if at capacity
      const [moved] = newBank.splice(source.index, 1);
      if (newActive.length >= MAX_NAMES) {
        const [displaced] = newActive.splice(MAX_NAMES - 1, 1);
        newBank.push(displaced);
      }
      newActive.splice(destination.index, 0, moved);
    } else {
      // Reorder within bank
      const [moved] = newBank.splice(source.index, 1);
      newBank.splice(destination.index, 0, moved);
    }

    newActive = newActive.map((n, i) => ({ ...n, rank: i + 1 }));
    setOwner1Names(newActive);
    setOwner1BankNames(newBank);
    handleReorder('Owner 1', newActive, newBank);
  };

  const handleOwner2DragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination } = result;

    const isSourceActive = source.droppableId === 'owner2-active';
    const isDestActive   = destination.droppableId === 'owner2-active';

    let newActive = [...owner2Names];
    let newBank   = [...owner2BankNames];

    if (isSourceActive && isDestActive) {
      const [moved] = newActive.splice(source.index, 1);
      newActive.splice(destination.index, 0, moved);
    } else if (isSourceActive && !isDestActive) {
      const [moved] = newActive.splice(source.index, 1);
      if (newBank.length > 0) {
        const [promoted] = newBank.splice(0, 1);
        newActive.splice(source.index, 0, promoted);
        newBank.splice(destination.index, 0, moved);
      } else {
        newBank.splice(destination.index, 0, moved);
      }
    } else if (!isSourceActive && isDestActive) {
      const [moved] = newBank.splice(source.index, 1);
      if (newActive.length >= MAX_NAMES) {
        const [displaced] = newActive.splice(MAX_NAMES - 1, 1);
        newBank.push(displaced);
      }
      newActive.splice(destination.index, 0, moved);
    } else {
      const [moved] = newBank.splice(source.index, 1);
      newBank.splice(destination.index, 0, moved);
    }

    newActive = newActive.map((n, i) => ({ ...n, rank: i + 1 }));
    setOwner2Names(newActive);
    setOwner2BankNames(newBank);
    handleReorder('Owner 2', newActive, newBank);
  };

  // Compute excluded names per owner (inline — not stored in state)
  const owner1ExcludeNames = [
    ...owner1Names.map(n => n.name),
    ...owner1BankNames.map(n => n.name),
    ...sharedNames.map(n => n.name),
    ...(isOwner1 ? dismissedNames : []),
  ];
  const owner2ExcludeNames = [
    ...owner2Names.map(n => n.name),
    ...owner2BankNames.map(n => n.name),
    ...sharedNames.map(n => n.name),
    ...(isOwner2 ? dismissedNames : []),
  ];

  // AI bank handlers — Owner 1
  const handleOwner1BankFilled = (suggestions) => {
    setOwner1AiBank(suggestions);
    syncPreferences({ bankNames: suggestions });
  };
  const handleOwner1AiDismiss = (name) => {
    const newBank = owner1AiBank.filter(s => s.name !== name);
    const newDismissed = [...dismissedNames, name];
    setOwner1AiBank(newBank);
    setDismissedNames(newDismissed);
    syncPreferences({ bankNames: newBank, dismissedNames: newDismissed });
  };
  const handleOwner1AiAdd = async (name) => {
    const newBank = owner1AiBank.filter(s => s.name !== name);
    try {
      const response = await fetch(`${BASE_URL}/api/names`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, owner: 'Owner 1', bracketId }),
      });
      const data = await response.json();
      if (!response.ok) {
        console.error('Failed to add AI name:', data.error || 'Unknown error');
        return;
      }
      setOwner1AiBank(newBank);
      syncPreferences({ bankNames: newBank });
      await fetchBracketData();
    } catch (err) {
      console.error('Error adding AI name:', err);
    }
  };

  // AI bank handlers — Owner 2
  const handleOwner2BankFilled = (suggestions) => {
    setOwner2AiBank(suggestions);
    syncPreferences({ bankNames: suggestions });
  };
  const handleOwner2AiDismiss = (name) => {
    const newBank = owner2AiBank.filter(s => s.name !== name);
    const newDismissed = [...dismissedNames, name];
    setOwner2AiBank(newBank);
    setDismissedNames(newDismissed);
    syncPreferences({ bankNames: newBank, dismissedNames: newDismissed });
  };
  const handleOwner2AiAdd = async (name) => {
    const newBank = owner2AiBank.filter(s => s.name !== name);
    try {
      const response = await fetch(`${BASE_URL}/api/names`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, owner: 'Owner 2', bracketId }),
      });
      const data = await response.json();
      if (!response.ok) {
        console.error('Failed to add AI name:', data.error || 'Unknown error');
        return;
      }
      setOwner2AiBank(newBank);
      syncPreferences({ bankNames: newBank });
      await fetchBracketData();
    } catch (err) {
      console.error('Error adding AI name:', err);
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
              {owner1DisplayName} {owner1Icon}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {owner1Names.length} / {MAX_NAMES} names
            </p>

            {/* Input Form or Locked State */}
            {!owner1LockedIn ? (
              <>
                <NameGenerator
                  bracketId={bracketId}
                  excludeNames={owner1ExcludeNames}
                  onGenerate={(name) => setOwner1Input(name)}
                  onBankFilled={handleOwner1BankFilled}
                  bankHasItems={owner1AiBank.length > 0}
                  likedNames={owner1Names.map(n => n.name)}
                />
                <AiNameBank
                  suggestions={owner1AiBank}
                  onAdd={handleOwner1AiAdd}
                  onDismiss={handleOwner1AiDismiss}
                />
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
                  disabled={owner1Names.length < MAX_NAMES}
                  title={owner1Names.length < MAX_NAMES ? `Add ${MAX_NAMES - owner1Names.length} more name(s) to lock in` : undefined}
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
                  {owner2LockedIn ? 'Both parents ready! Bracket is active.' : `Waiting for ${owner2DisplayName} to lock in...`}
                </p>
              </div>
            )}

            {/* Names List */}
            {(!isOwner2 || (owner1LockedIn && owner2LockedIn)) ? (
              <div>
                {isOwner1 && owner1PendingNames.map(item => (
                  <div key={`owner1-pending-${item.id}`}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 mb-2">
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

                {/* Draggable active list (owner) or static list (observer) */}
                {isOwner1 ? (
                  <DragDropContext onDragEnd={handleOwner1DragEnd}>
                    <DraggableNameList
                      names={owner1Names.slice().sort((a, b) => getEffectiveRank(a, sharedNames) - getEffectiveRank(b, sharedNames))}
                      droppableId="owner1-active"
                      isOwner={true}
                      isLocked={owner1LockedIn}
                      onRemove={handleDeleteName}
                      sharedNames={sharedNames}
                    />
                    <NameBankList
                      bankNames={owner1BankNames}
                      droppableId="owner1-bank"
                      isOwner={true}
                      isLocked={owner1LockedIn}
                      onRemove={handleDeleteName}
                    />
                  </DragDropContext>
                ) : (
                  <div className="space-y-2">
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
                        </div>
                      ))}
                  </div>
                )}

                {/* Shared names not owned by Owner 1 */}
                <div className="space-y-2 mt-2">
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
                            {`Shared name - on ${owner2DisplayName}'s list`}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
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
                        First added by: <span className="font-medium">{item.addedBy === 'owner1' ? owner1DisplayName : owner2DisplayName}</span>
                      </p>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Owner 2 Column */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {owner2DisplayName} {owner2Icon}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {owner2Names.length} / {MAX_NAMES} names
            </p>

            {isOwner1 && !owner2UserId ? (
              /* Invite card — shown to Owner 1 only when no partner has joined yet */
              <div className="flex flex-col items-center justify-center py-8 px-4 gap-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  Your partner hasn't joined yet. Send them an invite to start adding names.
                </p>
                {inviteStatus === 'sent' ? (
                  <div className="w-full rounded-lg bg-green-50 dark:bg-green-900/30 px-4 py-3 text-sm font-medium text-green-700 dark:text-green-300 text-center">
                    Invite sent!
                  </div>
                ) : (
                  <form onSubmit={handleInviteOwner2} className="w-full space-y-3">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="Partner's email address"
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {inviteError && (
                      <p className="text-sm text-red-600 dark:text-red-400">{inviteError}</p>
                    )}
                    <button
                      type="submit"
                      disabled={!inviteEmail.trim() || inviteStatus === 'sending'}
                      className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {inviteStatus === 'sending' ? 'Sending...' : 'Invite a Partner'}
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <>
                {/* Input Form or Locked State */}
                {!owner2LockedIn ? (
                  <>
                    <NameGenerator
                      bracketId={bracketId}
                      excludeNames={owner2ExcludeNames}
                      onGenerate={(name) => setOwner2Input(name)}
                      onBankFilled={handleOwner2BankFilled}
                      bankHasItems={owner2AiBank.length > 0}
                      likedNames={owner2Names.map(n => n.name)}
                    />
                    <AiNameBank
                      suggestions={owner2AiBank}
                      onAdd={handleOwner2AiAdd}
                      onDismiss={handleOwner2AiDismiss}
                    />
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
                      disabled={owner2Names.length < MAX_NAMES}
                      title={owner2Names.length < MAX_NAMES ? `Add ${MAX_NAMES - owner2Names.length} more name(s) to lock in` : undefined}
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
                      {owner1LockedIn ? 'Both parents ready! Bracket is active.' : `Waiting for ${owner1DisplayName} to lock in...`}
                    </p>
                  </div>
                )}

                {/* Names List */}
                {(!isOwner1 || (owner1LockedIn && owner2LockedIn)) ? (
                  <div>
                    {isOwner2 && owner2PendingNames.map(item => (
                      <div key={`owner2-pending-${item.id}`}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 mb-2">
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

                    {/* Draggable active list (owner) or static list (observer) */}
                    {isOwner2 ? (
                      <DragDropContext onDragEnd={handleOwner2DragEnd}>
                        <DraggableNameList
                          names={owner2Names.slice().sort((a, b) => getEffectiveRank(a, sharedNames) - getEffectiveRank(b, sharedNames))}
                          droppableId="owner2-active"
                          isOwner={true}
                          isLocked={owner2LockedIn}
                          onRemove={handleDeleteName}
                          sharedNames={sharedNames}
                        />
                        <NameBankList
                          bankNames={owner2BankNames}
                          droppableId="owner2-bank"
                          isOwner={true}
                          isLocked={owner2LockedIn}
                          onRemove={handleDeleteName}
                        />
                      </DragDropContext>
                    ) : (
                      <div className="space-y-2">
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
                            </div>
                          ))}
                      </div>
                    )}

                    {/* Shared names not owned by Owner 2 */}
                    <div className="space-y-2 mt-2">
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
                                {`Shared name - on ${owner1DisplayName}'s list`}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-gray-400 dark:text-gray-600 italic py-8">
                    Hidden until both owners lock in.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
