'use client';

import { useState, useEffect } from 'react';
import BracketView from '@/components/bracket/BracketView';
import { advanceTournamentRound } from '@/utils/api';

// Generate a unique voter ID
const generateVoterId = () => {
  return 'voter_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
};

export default function TournamentPage() {
  const [bracket, setBracket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [voterId, setVoterId] = useState(null);
  const [previewMatchups, setPreviewMatchups] = useState([]);

  // Initialize voterId from localStorage on mount
  useEffect(() => {
    const storedVoterId = localStorage.getItem('voterId');
    if (storedVoterId) {
      setVoterId(storedVoterId);
    } else {
      const newVoterId = generateVoterId();
      localStorage.setItem('voterId', newVoterId);
      setVoterId(newVoterId);
    }
  }, []);

  const fetchBracket = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/bracket/current');
      if (!response.ok) throw new Error('Failed to fetch bracket');
      const data = await response.json();
      console.log('Bracket data received:', data);
      console.log('All names:', data.allNames);
      setBracket(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Generate client-side preview matchups from bracket names (temporary until backend endpoint is ready)
  const generateClientPreviewMatchups = (bracketData) => {
    if (!bracketData || bracketData.totalNames !== 32) {
      return [];
    }

    // Collect all names with their metadata
    const allNames = [];
    
    // Add owner1 names
    if (bracketData.owner1Names) {
      bracketData.owner1Names.forEach((name, index) => {
        if (!name.isShared) {
          allNames.push({
            id: name.id || name._id,
            value: name.value,
            submittedBy: name.submittedBy,
            rank: index + 1
          });
        }
      });
    }
    
    // Add owner2 names
    if (bracketData.owner2Names) {
      bracketData.owner2Names.forEach((name, index) => {
        if (!name.isShared) {
          allNames.push({
            id: name.id || name._id,
            value: name.value,
            submittedBy: name.submittedBy,
            rank: index + 1
          });
        }
      });
    }
    
    // Add shared names
    if (bracketData.sharedNames) {
      bracketData.sharedNames.forEach((name, index) => {
        allNames.push({
          id: name.id || name._id,
          value: name.value,
          submittedBy: name.submittedBy,
          rank: index + 1,
          isShared: true
        });
      });
    }

    // Simple seeding: assign seeds 1-32 based on order
    const seededNames = allNames.map((name, index) => ({
      ...name,
      seed: index + 1
    }));

    // Generate matchups using March Madness pairing (1v32, 2v31, etc.)
    const matchups = [];
    const pairings = [
      [1, 32], [16, 17], [8, 25], [9, 24],
      [5, 28], [12, 21], [4, 29], [13, 20],
      [6, 27], [11, 22], [3, 30], [14, 19],
      [7, 26], [10, 23], [2, 31], [15, 18]
    ];

    pairings.forEach(([seed1, seed2]) => {
      const name1 = seededNames.find(n => n.seed === seed1);
      const name2 = seededNames.find(n => n.seed === seed2);
      
      if (name1 && name2) {
        matchups.push({
          _id: `preview-${seed1}-${seed2}`,
          name1: {
            value: name1.value,
            seed: name1.seed,
            submittedBy: name1.submittedBy,
            isPlaceholder: false
          },
          name2: {
            value: name2.value,
            seed: name2.seed,
            submittedBy: name2.submittedBy,
            isPlaceholder: false
          }
        });
      }
    });

    return matchups;
  };

  // Fetch preview matchups from server when in draft mode
  const fetchPreviewMatchups = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/bracket/preview');
      if (!response.ok) {
        console.warn('Preview endpoint not available yet - using client-side preview');
        // Use client-side preview generation as fallback
        if (bracket) {
          const clientPreview = generateClientPreviewMatchups(bracket);
          setPreviewMatchups(clientPreview);
        }
        return;
      }
      const data = await response.json();
      if (data.canGenerate && data.preview) {
        setPreviewMatchups(data.preview);
      } else {
        // Fallback to client-side preview
        if (bracket) {
          const clientPreview = generateClientPreviewMatchups(bracket);
          setPreviewMatchups(clientPreview);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch preview matchups - using client-side preview:', err);
      // Fallback to client-side preview
      if (bracket) {
        const clientPreview = generateClientPreviewMatchups(bracket);
        setPreviewMatchups(clientPreview);
      }
    }
  };

  const handleLockBracket = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/bracket/lock', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to lock bracket');
      // Trigger full data state refresh
      await fetchBracket();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleAdvanceRound = async () => {
    try {
      setLoading(true);
      // Pass the current round string to advance to next round
      const currentRound = 'roundOf32'; // For now, hardcoded as Round of 32
      await advanceTournamentRound(currentRound);
      // Trigger full data state refresh to show updated matchups
      await fetchBracket();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBracket();
  }, []);

  // Fetch preview matchups when bracket status is draft
  useEffect(() => {
    if (bracket?.status === 'draft') {
      fetchPreviewMatchups();
    }
  }, [bracket?.status, bracket?.totalNames]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!bracket) return <div>No bracket data</div>;

  // Use server-provided preview matchups for draft mode, actual matchups for active mode
  let matchupGrid = bracket.status === 'draft'
    ? previewMatchups
    : (bracket.matchups?.roundOf32 || []);
  
  // Fallback: If no matchups exist, create 16 placeholder matchups for better UX
  if (matchupGrid.length === 0) {
    matchupGrid = Array.from({ length: 16 }, (_, i) => ({
      _id: `placeholder-${i}`,
      name1: { value: 'TBD', isPlaceholder: true, seed: i * 2 + 1 },
      name2: { value: 'TBD', isPlaceholder: true, seed: i * 2 + 2 },
    }));
  }
  
  console.log('Matchup grid:', matchupGrid);
  console.log('Bracket status:', bracket.status);
  console.log('Preview matchups:', previewMatchups);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Baby Name Tournament
              </h1>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  bracket.status === 'draft'
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                    : 'bg-green-100 text-green-800 border border-green-300'
                }`}>
                  Status: {bracket.status.charAt(0).toUpperCase() + bracket.status.slice(1)}
                </span>
                <span className="text-gray-500 text-sm">
                  Round of 32
                </span>
              </div>
            </div>
            
            {bracket.status === 'draft' && (
              <button
                onClick={handleLockBracket}
                disabled={bracket.totalNames !== 32}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                🔒 Lock Bracket & Start Voting
              </button>
            )}
            
            {bracket.status === 'active' && (
              <div className="flex items-center gap-3">
                <div className="px-6 py-3 bg-gray-100 text-gray-600 font-semibold rounded-lg border-2 border-gray-300">
                  🔒 Bracket Locked - Voting Active
                </div>
                <button
                  onClick={handleAdvanceRound}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg shadow-md hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
                >
                  ⚡ Advance to Next Round
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bracket View Section */}
      <div className="py-8">
        <div className="max-w-7xl mx-auto">
          {bracket.status === 'draft' && (
            <div className="mb-6 px-4">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="text-sm text-blue-800">
                  <strong>Server-Side Preview:</strong> This shows how the bracket will look once locked.
                  Matchups use March Madness seeding algorithm (1v32, 2v31, 8v25, etc.) calculated by the server.
                  {previewMatchups.length === 0 ? (
                    <span className="block mt-1 text-blue-600">
                      Add 32 names to see the preview matchups.
                    </span>
                  ) : (
                    <span className="block mt-1 text-green-700 font-semibold">
                      ✅ Ready to lock! Click "Lock Bracket & Start Voting" above to activate voting.
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
          
          {bracket.status === 'active' && (
            <div className="mb-6 px-4">
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <p className="text-sm text-green-800">
                  <strong>🔒 Bracket Locked:</strong> Names are permanently locked. Guests can now vote on matchups!
                </p>
              </div>
            </div>
          )}
          
          <BracketView
            matchups={matchupGrid}
            status={bracket.status}
            voterId={voterId}
            onVoteSuccess={fetchBracket}
          />
        </div>
      </div>
    </div>
  );
}
