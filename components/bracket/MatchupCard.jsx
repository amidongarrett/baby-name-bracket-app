/**
 * MatchupCard Component
 * Owns per-matchup isVoting state and handleVote async logic.
 * Derives all computed values and renders two NameCard instances.
 * Extracted verbatim from BracketView.jsx lines 659–946.
 */

"use client";

import { useState } from 'react';

import NameCard from './NameCard';

export default function MatchupCard({
  matchup, status, index, side = 'left', onClick, voterId,
  viewerRole = 'guest', ownerPicks = {},
  isLocked = false, isRoundPublished = false,
  slotHeight = 120,
  onPick,
  userPickId = null,
  name1Confirmed = true,
  name2Confirmed = true,
  name1FeederWrongPick = null,
  name2FeederWrongPick = null,
  connectorSide = null,
  round = null,
  ghostPicks = null,
}) {
  const [isVoting, setIsVoting] = useState(false);

  // All matchups arrive pre-normalised from app/page.js — read flat fields directly
  // When a slot's feeder hasn't resolved yet, override name to TBD and mark as placeholder
  const name1       = name1Confirmed ? (matchup.name1 || 'TBD') : 'TBD';
  const name2       = name2Confirmed ? (matchup.name2 || 'TBD') : 'TBD';
  const seed1       = matchup.seed1  || index * 2 + 1;
  const seed2       = matchup.seed2  || index * 2 + 2;
  const placeholder1 = !name1Confirmed || matchup.isPlaceholder1 || false;
  const placeholder2 = !name2Confirmed || matchup.isPlaceholder2 || false;
  const name1Id     = matchup.name1Id || null;
  const name2Id     = matchup.name2Id || null;
  const matchupId   = matchup._id || matchup.id;

  // Votes
  const votes1      = matchup.votes1 ?? 0;
  const votes2      = matchup.votes2 ?? 0;
  const totalVotes  = votes1 + votes2;
  const percentage1 = totalVotes > 0 ? Math.round((votes1 / totalVotes) * 100) : 0;
  const percentage2 = totalVotes > 0 ? Math.round((votes2 / totalVotes) * 100) : 0;

  const isOwner = viewerRole === 'owner1' || viewerRole === 'owner2';

  const picks = ownerPicks[matchupId] || {};
  const owner1Pick = picks.owner1NameId || null;
  const owner2Pick = picks.owner2NameId || null;

  // True when any owner has voted on this matchup and the current viewer is a guest.
  // Scoped to Round of 32 only: in Sweet 16+ owner picks are bracket-advancement decisions,
  // not in-round votes, so the guard must not suppress the guest Vote button.
  const ownerHasVoted = !isOwner
    && matchup.round === 'Round of 32'
    && (owner1Pick != null || owner2Pick != null);

  const userVotedNameId = isOwner
    ? (viewerRole === 'owner1' ? owner1Pick : owner2Pick)
    : (userPickId || null);
  // null === null guard: prevents false "Picked" on TBD slots where name IDs are unresolved
  const votedForName1 = name1Id != null && userVotedNameId === name1Id;
  const votedForName2 = name2Id != null && userVotedNameId === name2Id;

  const showVoteBars = (status === 'active' || status === 'completed') && totalVotes > 0 && (isOwner || isLocked || status === 'completed');

  // Guests see winner highlights only after admin publishes the round
  const effectiveWinnerId = (isOwner || isRoundPublished || status === 'completed') ? (matchup.winnerId || null) : null;
  const winner1 = effectiveWinnerId && effectiveWinnerId === name1Id;
  const winner2 = effectiveWinnerId && effectiveWinnerId === name2Id;

  // Real-time leading — only owners see this
  const leading1 = (isOwner || isLocked) && !effectiveWinnerId && votes1 > 0 && votes1 > votes2;
  const leading2 = (isOwner || isLocked) && !effectiveWinnerId && votes2 > 0 && votes2 > votes1;

  // Wrong pick visualization — owners never get "wrong pick" styling
  const guestWrongOnName1 = !isOwner && isRoundPublished && winner2 && votedForName1;
  const guestWrongOnName2 = !isOwner && isRoundPublished && winner1 && votedForName2;
  const hasWrongPick = guestWrongOnName1 || guestWrongOnName2;

  // Correct pick visualization — owners never get "correct pick" styling
  const guestCorrectOnName1 = !isOwner && isRoundPublished && winner1 && votedForName1;
  const guestCorrectOnName2 = !isOwner && isRoundPublished && winner2 && votedForName2;

  // Ghost pick overlay — name the user predicted to appear here but was eliminated earlier
  const name1Ghost = ghostPicks?.name1Ghost || null;
  const name2Ghost = ghostPicks?.name2Ghost || null;

  // Owners can always re-vote (to resolve conflicts) until winner is set; guests until lock-in
  // Both name slots must be confirmed before voting is permitted on this card
  const canVote = status === 'active' && !effectiveWinnerId
    && name1Confirmed && name2Confirmed
    && !isLocked;
  const hasConflict = isOwner && owner1Pick && owner2Pick && owner1Pick !== owner2Pick;
  const dadVotedName1 = owner1Pick === name1Id;
  const dadVotedName2 = owner1Pick === name2Id;
  const momVotedName1 = owner2Pick === name1Id;
  const momVotedName2 = owner2Pick === name2Id;

  // Row background classes — conflict supersedes leading highlights
  const row1Bg = winner1  ? 'bg-green-500/20 dark:bg-green-500/25'
               : winner2  ? 'bg-gray-400/20 dark:bg-gray-500/25'
               : (!hasConflict && leading1) ? 'bg-green-400/10 dark:bg-green-500/15'
               : !placeholder1 ? 'hover:bg-blue-50 dark:hover:bg-blue-950/20'
               : 'bg-gray-50 dark:bg-gray-800/30';
  const row2Bg = winner2  ? 'bg-green-500/20 dark:bg-green-500/25'
               : winner1  ? 'bg-gray-400/20 dark:bg-gray-500/25'
               : (!hasConflict && leading2) ? 'bg-green-400/10 dark:bg-green-500/15'
               : !placeholder2 ? 'hover:bg-purple-50 dark:hover:bg-purple-950/20'
               : 'bg-gray-50 dark:bg-gray-800/30';

  // Handle vote submission
  const handleVote = async (selectedNameId) => {
    if (!selectedNameId || status !== 'active' || isVoting || !onPick) return;

    // derive camelCase round key from matchup.round
    const roundKeyMap = {
      'Round of 32': 'roundOf32',
      'Round of 16': 'roundOf16',
      'Elite 8':     'elite8',
      'Final 4':     'final4',
      'Championship':'championship',
    };
    const roundKey = roundKeyMap[matchup?.round] || null;
    if (!roundKey) return;

    setIsVoting(true);
    try {
      await onPick(roundKey, index, selectedNameId);
    } catch (err) {
      console.error('Pick error:', err);
    } finally {
      setIsVoting(false);
    }
  };

  // Determine connector positions based on side (connectorSide overrides side when provided)
  const isLeftSide = connectorSide !== null ? connectorSide === 'left' : side === 'left';
  const connectorPos = isLeftSide ? 'left-full' : 'right-full';
  const connectorBorder = isLeftSide ? 'border-r-2' : 'border-l-2';

  const cardBorder = (hasConflict || hasWrongPick)
    ? 'border-red-400 dark:border-red-500'
    : 'border-gray-300 dark:border-gray-600';

  return (
    <div className="relative">
      {/* Connecting Line to Next Round */}
      <div className={`absolute ${connectorPos} top-1/2 w-8 h-0.5 bg-gray-300 hidden xl:block`}></div>

      <div
        className={`bg-white dark:bg-gray-900 rounded-lg border shadow overflow-hidden hover:shadow-md transition-shadow cursor-pointer ${cardBorder}`}
        onClick={onClick}
      >
        {/* Name 1 row */}
        <NameCard
          name={name1}
          nameId={name1Id}
          seed={seed1}
          isPlaceholder={placeholder1}
          status={status}
          isOwner={isOwner}
          canVote={canVote}
          isVoting={isVoting}
          votedForThis={votedForName1}
          votedForOther={votedForName2}
          ownerHasVoted={ownerHasVoted}
          effectiveWinnerId={effectiveWinnerId}
          isWinner={!!winner1}
          otherIsWinner={!!winner2}
          isLeading={leading1}
          hasConflict={hasConflict}
          dadVotedThis={dadVotedName1}
          momVotedThis={momVotedName1}
          guestWrong={guestWrongOnName1}
          otherName={name2}
          guestCorrect={guestCorrectOnName1}
          feederWrongPick={name1Ghost ? { guestName: name1Ghost, actualName: name1 } : (name1FeederWrongPick || null)}
          votes={votes1}
          percentage={percentage1}
          showVoteBars={showVoteBars}
          rowColor="blue"
          onVote={handleVote}
          rowBg={row1Bg}
        />

        {/* Name 2 row */}
        <NameCard
          name={name2}
          nameId={name2Id}
          seed={seed2}
          isPlaceholder={placeholder2}
          status={status}
          isOwner={isOwner}
          canVote={canVote}
          isVoting={isVoting}
          votedForThis={votedForName2}
          votedForOther={votedForName1}
          ownerHasVoted={ownerHasVoted}
          effectiveWinnerId={effectiveWinnerId}
          isWinner={!!winner2}
          otherIsWinner={!!winner1}
          isLeading={leading2}
          hasConflict={hasConflict}
          dadVotedThis={dadVotedName2}
          momVotedThis={momVotedName2}
          guestWrong={guestWrongOnName2}
          otherName={name1}
          guestCorrect={guestCorrectOnName2}
          feederWrongPick={name2Ghost ? { guestName: name2Ghost, actualName: name2 } : (name2FeederWrongPick || null)}
          votes={votes2}
          percentage={percentage2}
          showVoteBars={showVoteBars}
          rowColor="purple"
          onVote={handleVote}
          rowBg={row2Bg}
        />
      </div>

      {/* Vertical L-shape connector that bracket-pairs adjacent matchups into the next round.
          Suppressed for Elite 8 (round === 3) because each E8 card feeds a different
          Final 4 cell rather than pairing with the other E8 card on its side. */}
      {round !== 3 && index % 2 === 0 && (
        <div className={`absolute ${connectorPos} top-1/2 hidden xl:block`}>
          <div
            className={`w-8 ${connectorBorder} border-t-2 border-gray-300`}
            style={{ height: `${slotHeight / 2}px` }}
          />
        </div>
      )}
      {round !== 3 && index % 2 === 1 && (
        <div className={`absolute ${connectorPos} bottom-1/2 hidden xl:block`}>
          <div
            className={`w-8 ${connectorBorder} border-b-2 border-gray-300`}
            style={{ height: `${slotHeight / 2}px` }}
          />
        </div>
      )}
    </div>
  );
}
