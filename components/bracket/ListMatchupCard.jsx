"use client";

import { useState } from 'react';


export default function ListMatchupCard({
  matchup, status, index, voterId,
  userPickId = null, isLocked = false,
  viewerRole = 'guest', ownerPicks = {},
  isRoundPublished = false,
  activeRoundKey = 'roundOf32',
  ghostPicks = null,
  onPick
}) {
  const [isVoting, setIsVoting] = useState(false);

  // All matchups arrive pre-normalised — read flat fields directly
  const name1       = matchup.name1 || 'TBD';
  const name2       = matchup.name2 || 'TBD';
  const seed1       = matchup.seed1 || index * 2 + 1;
  const seed2       = matchup.seed2 || index * 2 + 2;
  const placeholder1 = matchup.isPlaceholder1 || false;
  const placeholder2 = matchup.isPlaceholder2 || false;
  const name1Id     = matchup.name1Id || null;
  const name2Id     = matchup.name2Id || null;
  const matchupId   = matchup._id || matchup.id;

  const votes1      = matchup.votes1 ?? 0;
  const votes2      = matchup.votes2 ?? 0;
  const totalVotes  = votes1 + votes2;
  const percentage1 = totalVotes > 0 ? Math.round((votes1 / totalVotes) * 100) : 0;
  const percentage2 = totalVotes > 0 ? Math.round((votes2 / totalVotes) * 100) : 0;

  const isOwner = viewerRole === 'owner1' || viewerRole === 'owner2';

  const picks = ownerPicks[matchupId] || {};
  const owner1Pick = picks.owner1NameId || null;
  const owner2Pick = picks.owner2NameId || null;

  // True when any owner has voted on this matchup and the current viewer is a guest
  const ownerHasVoted = !isOwner && (owner1Pick != null || owner2Pick != null);

  const userVotedNameId = isOwner
    ? (viewerRole === 'owner1' ? owner1Pick : owner2Pick)
    : (userPickId || null);
  // null === null guard: prevents false "Picked" on TBD slots where name IDs are unresolved
  const votedForName1 = name1Id != null && userVotedNameId === name1Id;
  const votedForName2 = name2Id != null && userVotedNameId === name2Id;

  const showVoteBars = (isOwner || isLocked || status === 'completed') && (status === 'active' || status === 'completed') && totalVotes > 0;

  // Guests see winner highlights only after admin publishes the round
  const effectiveWinnerId = (isOwner || isRoundPublished || status === 'completed') ? (matchup.winnerId || null) : null;
  const winner1  = effectiveWinnerId && effectiveWinnerId === name1Id;
  const winner2  = effectiveWinnerId && effectiveWinnerId === name2Id;

  // Real-time leading — owners only
  const leading1 = (isOwner || isLocked) && !effectiveWinnerId && votes1 > 0 && votes1 > votes2;
  const leading2 = (isOwner || isLocked) && !effectiveWinnerId && votes2 > 0 && votes2 > votes1;

  // Wrong pick visualization — owners never get "wrong pick" styling
  const guestWrongOnName1 = !isOwner && isRoundPublished && winner2 && votedForName1;
  const guestWrongOnName2 = !isOwner && isRoundPublished && winner1 && votedForName2;
  const hasWrongPick = guestWrongOnName1 || guestWrongOnName2;

  // Ghost pick overlay — name the user predicted to appear here but was eliminated earlier
  const name1Ghost = ghostPicks?.name1Ghost || null;
  const name2Ghost = ghostPicks?.name2Ghost || null;

  // Owners can always re-vote (to resolve conflicts) until winner is set; guests until lock-in
  const canVote = status === 'active' && !effectiveWinnerId && (
    isOwner ? true : !isLocked
  );
  const hasConflict = isOwner && owner1Pick && owner2Pick && owner1Pick !== owner2Pick;
  const dadVotedName1 = owner1Pick === name1Id;
  const dadVotedName2 = owner1Pick === name2Id;
  const momVotedName1 = owner2Pick === name1Id;
  const momVotedName2 = owner2Pick === name2Id;

  // Handle pick submission for all roles via onPick callback
  const handleVote = async (selectedNameId) => {
    if (!selectedNameId || status !== 'active' || isVoting) return;
    if (!isOwner && isLocked) return;
    if (!onPick) return;

    setIsVoting(true);
    try {
      await onPick(activeRoundKey, index, selectedNameId);
    } catch (error) {
      console.error('Pick submission error:', error);
      alert(`Failed to submit pick: ${error.message}`);
    } finally {
      setIsVoting(false);
    }
  };

  const row1Bg = winner1 ? 'bg-green-50 dark:bg-green-950/30'
               : winner2 ? 'bg-gray-100 dark:bg-gray-800/50'
               : (!hasConflict && leading1) ? 'bg-green-50/60 dark:bg-green-950/20'
               : '';
  const row2Bg = winner2 ? 'bg-green-50 dark:bg-green-950/30'
               : winner1 ? 'bg-gray-100 dark:bg-gray-800/50'
               : (!hasConflict && leading2) ? 'bg-green-50/60 dark:bg-green-950/20'
               : '';

  const cardBorder = (hasConflict || hasWrongPick)
    ? 'border-red-400 dark:border-red-500'
    : 'border-gray-300 dark:border-gray-700';

  return (
    <div className={`bg-white dark:bg-gray-900 rounded border shadow-sm overflow-hidden hover:shadow-md transition-shadow ${cardBorder}`}>
      <div className="bg-gray-50 dark:bg-gray-800 px-3 py-1 border-b border-gray-200 dark:border-gray-700">
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Game {index + 1}</span>
      </div>

      {/* Name 1 */}
      {name1Ghost && !guestWrongOnName1 && (
        <div className="text-[9px] px-2 pt-1 text-gray-500">
          You picked: <span className="line-through text-red-400">{name1Ghost}</span>
          {' → '}
          <span className="text-green-600 font-semibold">{name1}</span>
        </div>
      )}
      <div className={`px-2 py-1.5 border-b border-gray-200 dark:border-gray-700 ${row1Bg}`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className={`text-[10px] font-bold w-5 ${winner2 ? 'text-gray-400' : 'text-gray-600 dark:text-gray-400'}`}>
              {seed1}
            </span>
            {winner1 && <span className="text-[10px]">&#127942;</span>}
            <span className={`text-xs font-medium truncate ${
              winner1 ? 'text-green-800 dark:text-green-300 font-semibold'
              : winner2 ? 'text-gray-400 dark:text-gray-600'
              : placeholder1 ? 'text-gray-400 italic'
              : 'text-gray-900 dark:text-gray-100'
            }`}>
              {name1}
            </span>
            {hasConflict && dadVotedName1 && <span className="text-[10px] ml-1">&#128104;</span>}
            {hasConflict && momVotedName1 && <span className="text-[10px] ml-1">&#128105;</span>}
          </div>
          {status === 'active' && !placeholder1 && !effectiveWinnerId && (
            ownerHasVoted
              ? <span className="ml-2 px-2 py-0.5 text-[10px] font-semibold text-amber-700 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-400 rounded whitespace-nowrap">
                  Matchup in progress
                </span>
              : votedForName1
                ? <span className="ml-2 px-3 py-1 text-xs font-semibold text-green-700 bg-green-100 dark:bg-green-900/40 dark:text-green-400 rounded">Picked</span>
                : votedForName2 && canVote
                  ? <button
                      onClick={() => handleVote(name1Id)}
                      disabled={isVoting}
                      className="ml-2 px-3 py-1 text-xs font-semibold bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Change
                    </button>
                  : canVote && (
                      <button
                        onClick={() => handleVote(name1Id)}
                        disabled={isVoting}
                        className="ml-2 px-3 py-1 text-xs font-semibold bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Vote
                      </button>
                    )
          )}
          {effectiveWinnerId && votedForName1 && (
            <span className="ml-2 px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-400 rounded">Picked</span>
          )}
        </div>
        {showVoteBars && (
          <div className={`flex items-center gap-2 ml-6 ${winner2 ? 'opacity-40' : ''}`}>
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${percentage1}%` }} />
            </div>
            <span className={`text-[10px] font-medium ${leading1 ? 'text-green-600 dark:text-green-400 font-bold' : 'text-gray-600 dark:text-gray-400'}`}>
              {votes1} ({percentage1}%)
            </span>
          </div>
        )}
      </div>

      {/* Name 2 */}
      {name2Ghost && !guestWrongOnName2 && (
        <div className="text-[9px] px-2 pt-1 text-gray-500">
          You picked: <span className="line-through text-red-400">{name2Ghost}</span>
          {' → '}
          <span className="text-green-600 font-semibold">{name2}</span>
        </div>
      )}
      <div className={`px-2 py-1.5 ${row2Bg}`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className={`text-[10px] font-bold w-5 ${winner1 ? 'text-gray-400' : 'text-gray-600 dark:text-gray-400'}`}>
              {seed2}
            </span>
            {winner2 && <span className="text-[10px]">&#127942;</span>}
            <span className={`text-xs font-medium truncate ${
              winner2 ? 'text-green-800 dark:text-green-300 font-semibold'
              : winner1 ? 'text-gray-400 dark:text-gray-600'
              : placeholder2 ? 'text-gray-400 italic'
              : 'text-gray-900 dark:text-gray-100'
            }`}>
              {name2}
            </span>
            {hasConflict && dadVotedName2 && <span className="text-[10px] ml-1">&#128104;</span>}
            {hasConflict && momVotedName2 && <span className="text-[10px] ml-1">&#128105;</span>}
          </div>
          {status === 'active' && !placeholder2 && !effectiveWinnerId && !ownerHasVoted && (
            votedForName2
              ? <span className="ml-2 px-3 py-1 text-xs font-semibold text-green-700 bg-green-100 dark:bg-green-900/40 dark:text-green-400 rounded">Picked</span>
              : votedForName1 && canVote
                ? <button
                    onClick={() => handleVote(name2Id)}
                    disabled={isVoting}
                    className="ml-2 px-3 py-1 text-xs font-semibold bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Change
                  </button>
                : canVote && (
                    <button
                      onClick={() => handleVote(name2Id)}
                      disabled={isVoting}
                      className="ml-2 px-3 py-1 text-xs font-semibold bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Vote
                    </button>
                  )
          )}
          {effectiveWinnerId && votedForName2 && (
            <span className="ml-2 px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-400 rounded">Picked</span>
          )}
        </div>
        {showVoteBars && (
          <div className={`flex items-center gap-2 ml-6 ${winner1 ? 'opacity-40' : ''}`}>
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 transition-all duration-300" style={{ width: `${percentage2}%` }} />
            </div>
            <span className={`text-[10px] font-medium ${leading2 ? 'text-green-600 dark:text-green-400 font-bold' : 'text-gray-600 dark:text-gray-400'}`}>
              {votes2} ({percentage2}%)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
