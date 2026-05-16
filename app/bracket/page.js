'use client';

import { useState, useEffect } from 'react';

export default function BracketPage() {
  // Data structure: { name: string, rank: number, addedBy?: 'owner1' | 'owner2' }
  const [owner1Names, setOwner1Names] = useState([]);
  const [owner2Names, setOwner2Names] = useState([]);
  const [sharedNames, setSharedNames] = useState([]);
  const [owner1Input, setOwner1Input] = useState('');
  const [owner2Input, setOwner2Input] = useState('');
  const [owner1Error, setOwner1Error] = useState('');
  const [owner2Error, setOwner2Error] = useState('');

  const MAX_NAMES = 16;

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

    // Check if name already exists in shared list
    const existsInShared = sharedNames.find(item => normalizeNameForComparison(item.name) === normalizedInput);
    if (existsInShared) {
      setOwner1Error(`"${existsInShared.name}" is already in the Shared Favorites list!`);
      return;
    }

    // Check if name already exists in Owner 1's list
    const existsInOwn = owner1Names.find(item => normalizeNameForComparison(item.name) === normalizedInput);
    if (existsInOwn) {
      setOwner1Error(`"${existsInOwn.name}" is already in your list at rank #${existsInOwn.rank}!`);
      return;
    }

    // Check if Owner 1 has reached the limit
    if (owner1Names.length >= MAX_NAMES) {
      setOwner1Error(`You can only add up to ${MAX_NAMES} names!`);
      return;
    }

    // No errors
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

    // Check if name already exists in shared list
    const existsInShared = sharedNames.find(item => normalizeNameForComparison(item.name) === normalizedInput);
    if (existsInShared) {
      setOwner2Error(`"${existsInShared.name}" is already in the Shared Favorites list!`);
      return;
    }

    // Check if name already exists in Owner 2's list
    const existsInOwn = owner2Names.find(item => normalizeNameForComparison(item.name) === normalizedInput);
    if (existsInOwn) {
      setOwner2Error(`"${existsInOwn.name}" is already in your list at rank #${existsInOwn.rank}!`);
      return;
    }

    // Check if Owner 2 has reached the limit
    if (owner2Names.length >= MAX_NAMES) {
      setOwner2Error(`You can only add up to ${MAX_NAMES} names!`);
      return;
    }

    // No errors
    setOwner2Error('');
  }, [owner2Input, owner2Names, sharedNames]);

  // Handle adding name for Owner 1
  const handleAddOwner1 = (e) => {
    e.preventDefault();
    const trimmedName = owner1Input.trim();
    
    if (!trimmedName || owner1Error) return;
    
    const normalizedInput = normalizeNameForComparison(trimmedName);

    // DUPLICATE RULE: Check if name exists in Owner 2's list (case-insensitive)
    const existsInOwner2 = owner2Names.find(item => normalizeNameForComparison(item.name) === normalizedInput);
    if (existsInOwner2) {
      // Remove from Owner 2's list (they added it first, so they were the original)
      setOwner2Names(owner2Names.filter(item => normalizeNameForComparison(item.name) !== normalizedInput));
      
      // Add to shared list with metadata showing Owner 2 added it first
      // Use the ORIGINAL casing from Owner 2's entry
      const nextSharedRank = sharedNames.length + 1;
      setSharedNames([...sharedNames, { 
        name: existsInOwner2.name, // Use Owner 2's original casing
        rank: nextSharedRank,
        addedBy: 'owner2' // Owner 2 added it first
      }]);
      
      setOwner1Input('');
      return;
    }

    // Add to Owner 1's list with rank
    const nextRank = owner1Names.length + 1;
    setOwner1Names([...owner1Names, { name: trimmedName, rank: nextRank }]);
    setOwner1Input('');
  };

  // Handle adding name for Owner 2
  const handleAddOwner2 = (e) => {
    e.preventDefault();
    const trimmedName = owner2Input.trim();
    
    if (!trimmedName || owner2Error) return;
    
    const normalizedInput = normalizeNameForComparison(trimmedName);

    // DUPLICATE RULE: Check if name exists in Owner 1's list (case-insensitive)
    const existsInOwner1 = owner1Names.find(item => normalizeNameForComparison(item.name) === normalizedInput);
    if (existsInOwner1) {
      // Remove from Owner 1's list (they added it first, so they were the original)
      setOwner1Names(owner1Names.filter(item => normalizeNameForComparison(item.name) !== normalizedInput));
      
      // Add to shared list with metadata showing Owner 1 added it first
      // Use the ORIGINAL casing from Owner 1's entry
      const nextSharedRank = sharedNames.length + 1;
      setSharedNames([...sharedNames, { 
        name: existsInOwner1.name, // Use Owner 1's original casing
        rank: nextSharedRank,
        addedBy: 'owner1' // Owner 1 added it first
      }]);
      
      setOwner2Input('');
      return;
    }

    // Add to Owner 2's list with rank
    const nextRank = owner2Names.length + 1;
    setOwner2Names([...owner2Names, { name: trimmedName, rank: nextRank }]);
    setOwner2Input('');
  };

  // Remove name from owner lists and recalculate ranks
  const removeFromOwner1 = (name) => {
    const filtered = owner1Names.filter(item => item.name !== name);
    // Recalculate ranks
    const reranked = filtered.map((item, index) => ({ ...item, rank: index + 1 }));
    setOwner1Names(reranked);
  };

  const removeFromOwner2 = (name) => {
    const filtered = owner2Names.filter(item => item.name !== name);
    // Recalculate ranks
    const reranked = filtered.map((item, index) => ({ ...item, rank: index + 1 }));
    setOwner2Names(reranked);
  };

  const removeFromShared = (name) => {
    const filtered = sharedNames.filter(item => item.name !== name);
    // Recalculate ranks
    const reranked = filtered.map((item, index) => ({ ...item, rank: index + 1 }));
    setSharedNames(reranked);
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-4">
            Name Submission Dashboard
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Each parent adds up to {MAX_NAMES} names. Duplicates automatically move to Shared Favorites!
          </p>
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

            {/* Input Form */}
            <form onSubmit={handleAddOwner1} className="mb-6">
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

            {/* Names List (sorted by rank) */}
            <div className="space-y-2">
              {owner1Names
                .sort((a, b) => a.rank - b.rank)
                .map((item) => (
                  <div
                    key={`owner1-${item.name}`}
                    className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                        #{item.rank}
                      </span>
                      <span className="text-foreground">{item.name}</span>
                    </div>
                    <button
                      onClick={() => removeFromOwner1(item.name)}
                      className="text-red-500 hover:text-red-700 font-medium text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
            </div>
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
                        <button
                          onClick={() => removeFromShared(item.name)}
                          className="text-red-500 hover:text-red-700 font-medium text-sm"
                        >
                          Remove
                        </button>
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

            {/* Input Form */}
            <form onSubmit={handleAddOwner2} className="mb-6">
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

            {/* Names List (sorted by rank) */}
            <div className="space-y-2">
              {owner2Names
                .sort((a, b) => a.rank - b.rank)
                .map((item) => (
                  <div
                    key={`owner2-${item.name}`}
                    className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                        #{item.rank}
                      </span>
                      <span className="text-foreground">{item.name}</span>
                    </div>
                    <button
                      onClick={() => removeFromOwner2(item.name)}
                      className="text-red-500 hover:text-red-700 font-medium text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
