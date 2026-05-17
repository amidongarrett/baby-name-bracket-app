/**
 * BracketView Component
 * Traditional March Madness bracket with horizontal flow and connecting lines
 */

"use client";

import { useRef, useState } from 'react';

export default function BracketView({ matchups, status, voterId, votedMatchupIds = [], onVoteSuccess }) {
  // Split into owner1 (top 8) and owner2 (bottom 8) matchups
  const owner1Matchups = matchups.slice(0, 8);
  const owner2Matchups = matchups.slice(8, 16);

  // Refs for each section
  const owner1R1Ref = useRef(null);
  const owner1R2Ref = useRef(null);
  const owner1R3Ref = useRef(null);
  const championshipRef = useRef(null);
  const owner2R3Ref = useRef(null);
  const owner2R2Ref = useRef(null);
  const owner2R1Ref = useRef(null);

  // Drag-to-scroll functionality
  const scrollContainerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Multiply by 2 for faster scrolling
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const scrollToRound = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  };

  return (
    <>
      {/* Quick Navigation - Sticky Below Navbar */}
      <div className="hidden md:flex gap-4 justify-center mb-6 px-4 sticky top-16 z-40 py-3">
        <button
          onClick={() => scrollToRound(owner1R1Ref)}
          className="flex items-center justify-center w-12 h-12 bg-blue-600/30 text-white rounded-lg shadow-md hover:bg-blue-600/50 hover:shadow-lg transition-all backdrop-blur-sm border border-blue-400/30"
          title="Division 1"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <button
          onClick={() => scrollToRound(championshipRef)}
          className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-yellow-500/30 to-amber-500/30 text-white rounded-lg shadow-md hover:from-yellow-500/50 hover:to-amber-500/50 hover:shadow-lg transition-all backdrop-blur-sm border border-yellow-400/30"
          title="Championship"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
          </svg>
        </button>
        <button
          onClick={() => scrollToRound(owner2R1Ref)}
          className="flex items-center justify-center w-12 h-12 bg-purple-600/30 text-white rounded-lg shadow-md hover:bg-purple-600/50 hover:shadow-lg transition-all backdrop-blur-sm border border-purple-400/30"
          title="Division 2"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* Desktop Bracket View */}
      <div className="hidden md:block">
        <div className="w-full px-4">
          <div
            ref={scrollContainerRef}
            className={`flex gap-8 overflow-x-auto pb-4 select-none ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            {/* DIVISION 1 SIDE - Left to Right */}
            
            {/* Round of 32 - Division 1 */}
            <div className="flex-shrink-0 w-[280px]" ref={owner1R1Ref}>
              <h3
                className="text-sm font-bold text-blue-600 mb-4 text-center cursor-pointer hover:text-blue-700 transition-colors"
                onClick={() => scrollToRound(owner1R1Ref)}
              >
                ROUND OF 32
              </h3>
              <div className="space-y-8">
                {owner1Matchups.map((matchup, index) => (
                  <MatchupCard
                    key={matchup._id || `owner1-${index}`}
                    matchup={matchup}
                    status={status}
                    index={index}
                    side="left"
                    onClick={() => scrollToRound(owner1R1Ref)}
                    voterId={voterId}
                    votedMatchupIds={votedMatchupIds}
                    onVoteSuccess={onVoteSuccess}
                  />
                ))}
              </div>
            </div>

            {/* Sweet 16 - Owner 1 */}
            <div className="flex-shrink-0 w-[280px]" ref={owner1R2Ref}>
              <h3
                className="text-sm font-bold text-blue-600 mb-4 text-center cursor-pointer hover:text-blue-700 transition-colors"
                onClick={() => scrollToRound(owner1R2Ref)}
              >
                SWEET 16
              </h3>
              <div className="mt-12 space-y-24">
                {[...Array(4)].map((_, i) => {
                  const matchup1 = owner1Matchups[i * 2];
                  const matchup2 = owner1Matchups[i * 2 + 1];
                  return (
                    <PlaceholderMatchup
                      key={`owner1-r2-${i}`}
                      round={2}
                      matchup1={matchup1}
                      matchup2={matchup2}
                      status={status}
                      side="left"
                      onClick={() => scrollToRound(owner1R2Ref)}
                    />
                  );
                })}
              </div>
            </div>

            {/* Elite 8 - Owner 1 */}
            <div className="flex-shrink-0 w-[280px]" ref={owner1R3Ref}>
              <h3
                className="text-sm font-bold text-blue-600 mb-4 text-center cursor-pointer hover:text-blue-700 transition-colors"
                onClick={() => scrollToRound(owner1R3Ref)}
              >
                ELITE 8
              </h3>
              <div className="mt-32 space-y-56">
                {[...Array(2)].map((_, i) => {
                  const matchup1Index = i * 4;
                  const matchup2Index = i * 4 + 2;
                  return (
                    <PlaceholderMatchup
                      key={`owner1-r3-${i}`}
                      round={3}
                      matchup1={owner1Matchups[matchup1Index]}
                      matchup2={owner1Matchups[matchup1Index + 1]}
                      matchup3={owner1Matchups[matchup2Index]}
                      matchup4={owner1Matchups[matchup2Index + 1]}
                      status={status}
                      side="left"
                      onClick={() => scrollToRound(owner1R3Ref)}
                    />
                  );
                })}
              </div>
            </div>

            {/* Final 4 - Single Column with both matchups */}
            <div className="flex-shrink-0 w-[320px]" ref={championshipRef}>
              <h3
                className="text-sm font-bold text-purple-600 mb-4 text-center cursor-pointer hover:text-purple-700 transition-colors"
                onClick={() => scrollToRound(championshipRef)}
              >
                FINAL 4
              </h3>
              <div className="flex flex-col gap-8 mt-32">
                {/* Division 1 Final 4 Matchup */}
                <div className="w-full">
                  <PlaceholderMatchup
                    round={4}
                    matchup1={owner1Matchups[0]}
                    matchup2={owner1Matchups[1]}
                    matchup3={owner1Matchups[2]}
                    matchup4={owner1Matchups[3]}
                    status={status}
                    side="center"
                    onClick={() => scrollToRound(championshipRef)}
                    isFinal4={true}
                    label="Division 1"
                  />
                </div>
                
                {/* Division 2 Final 4 Matchup */}
                <div className="w-full">
                  <PlaceholderMatchup
                    round={4}
                    matchup1={owner2Matchups[0]}
                    matchup2={owner2Matchups[1]}
                    matchup3={owner2Matchups[2]}
                    matchup4={owner2Matchups[3]}
                    status={status}
                    side="center"
                    onClick={() => scrollToRound(championshipRef)}
                    isFinal4={true}
                    label="Division 2"
                  />
                </div>

                {/* Championship Below Final 4 */}
                <div className="mt-8">
                  <h3 className="text-sm font-bold text-gray-600 mb-4 text-center">
                    CHAMPIONSHIP
                  </h3>
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border-2 border-yellow-400 p-6 text-center hover:shadow-lg transition-shadow">
                    <div className="text-3xl mb-2">🏆</div>
                    <h4 className="text-base font-bold text-gray-800 mb-1">Championship</h4>
                    <p className="text-xs text-gray-600">Division 1 vs Division 2</p>
                  </div>
                </div>
              </div>
            </div>

            {/* DIVISION 2 SIDE - Right to Left (reverse order) */}
            
            {/* Elite 8 - Division 2 */}
            <div className="flex-shrink-0 w-[280px]" ref={owner2R3Ref}>
              <h3
                className="text-sm font-bold text-purple-600 mb-4 text-center cursor-pointer hover:text-purple-700 transition-colors"
                onClick={() => scrollToRound(owner2R3Ref)}
              >
                ELITE 8
              </h3>
              <div className="mt-32 space-y-56">
                {[...Array(2)].map((_, i) => {
                  const matchup1Index = i * 4;
                  const matchup2Index = i * 4 + 2;
                  return (
                    <PlaceholderMatchup
                      key={`owner2-r3-${i}`}
                      round={3}
                      matchup1={owner2Matchups[matchup1Index]}
                      matchup2={owner2Matchups[matchup1Index + 1]}
                      matchup3={owner2Matchups[matchup2Index]}
                      matchup4={owner2Matchups[matchup2Index + 1]}
                      status={status}
                      side="right"
                      onClick={() => scrollToRound(owner2R3Ref)}
                    />
                  );
                })}
              </div>
            </div>

            {/* Sweet 16 - Division 2 */}
            <div className="flex-shrink-0 w-[280px]" ref={owner2R2Ref}>
              <h3
                className="text-sm font-bold text-purple-600 mb-4 text-center cursor-pointer hover:text-purple-700 transition-colors"
                onClick={() => scrollToRound(owner2R2Ref)}
              >
                SWEET 16
              </h3>
              <div className="mt-12 space-y-24">
                {[...Array(4)].map((_, i) => {
                  const matchup1 = owner2Matchups[i * 2];
                  const matchup2 = owner2Matchups[i * 2 + 1];
                  return (
                    <PlaceholderMatchup
                      key={`owner2-r2-${i}`}
                      round={2}
                      matchup1={matchup1}
                      matchup2={matchup2}
                      status={status}
                      side="right"
                      onClick={() => scrollToRound(owner2R2Ref)}
                    />
                  );
                })}
              </div>
            </div>

            {/* Round of 32 - Division 2 */}
            <div className="flex-shrink-0 w-[280px]" ref={owner2R1Ref}>
              <h3
                className="text-sm font-bold text-purple-600 mb-4 text-center cursor-pointer hover:text-purple-700 transition-colors"
                onClick={() => scrollToRound(owner2R1Ref)}
              >
                ROUND OF 32
              </h3>
              <div className="space-y-8">
                {owner2Matchups.map((matchup, index) => (
                  <MatchupCard
                    key={matchup._id || `owner2-${index}`}
                    matchup={matchup}
                    status={status}
                    index={index + 8}
                    side="right"
                    onClick={() => scrollToRound(owner2R1Ref)}
                    voterId={voterId}
                    votedMatchupIds={votedMatchupIds}
                    onVoteSuccess={onVoteSuccess}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden px-4">
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-700 mb-4">Round of 32</h3>
          {matchups.map((matchup, index) => (
            <MobileMatchupCard
              key={matchup._id || `mobile-${index}`}
              matchup={matchup}
              status={status}
              index={index}
              voterId={voterId}
              votedMatchupIds={votedMatchupIds}
              onVoteSuccess={onVoteSuccess}
            />
          ))}
          
          {/* Mobile Championship */}
          <div className="mt-8 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border-2 border-yellow-400 p-4 text-center">
            <h3 className="text-lg font-bold text-gray-800 mb-1">🏆 Championship</h3>
            <p className="text-gray-600 text-xs">Winner determined after voting</p>
          </div>
        </div>
      </div>
    </>
  );
}

function MatchupCard({ matchup, status, index, side = 'left', onClick, voterId, votedMatchupIds = [], onVoteSuccess }) {
  const [isVoting, setIsVoting] = useState(false);

  // All matchups arrive pre-normalised from app/page.js — read flat fields directly
  const name1       = matchup.name1  || 'TBD';
  const name2       = matchup.name2  || 'TBD';
  const seed1       = matchup.seed1  || index * 2 + 1;
  const seed2       = matchup.seed2  || index * 2 + 2;
  const placeholder1 = matchup.isPlaceholder1 || false;
  const placeholder2 = matchup.isPlaceholder2 || false;
  const name1Id     = matchup.name1Id || null;
  const name2Id     = matchup.name2Id || null;
  const matchupId   = matchup._id || matchup.id;
  const hasVoted    = votedMatchupIds.includes(matchupId);

  // Votes
  const votes1      = matchup.votes1 ?? 0;
  const votes2      = matchup.votes2 ?? 0;
  const totalVotes  = votes1 + votes2;
  const percentage1 = totalVotes > 0 ? Math.round((votes1 / totalVotes) * 100) : 0;
  const percentage2 = totalVotes > 0 ? Math.round((votes2 / totalVotes) * 100) : 0;

  // Winner / loser detection
  const winnerId  = matchup.winnerId || null;
  const winner1   = winnerId && winnerId === name1Id;
  const winner2   = winnerId && winnerId === name2Id;
  // When no winner locked yet, highlight the leader based on current vote tally
  const leading1  = !winnerId && votes1 > 0 && votes1 > votes2;
  const leading2  = !winnerId && votes2 > 0 && votes2 > votes1;

  // Row background classes
  const row1Bg = winner1  ? 'bg-green-50 dark:bg-green-950/40'
               : winner2  ? 'bg-gray-100 dark:bg-gray-800/60'
               : leading1 ? 'bg-green-50/60 dark:bg-green-950/20'
               : !placeholder1 ? 'hover:bg-blue-50 dark:hover:bg-blue-950/20'
               : 'bg-gray-50 dark:bg-gray-800/30';
  const row2Bg = winner2  ? 'bg-green-50 dark:bg-green-950/40'
               : winner1  ? 'bg-gray-100 dark:bg-gray-800/60'
               : leading2 ? 'bg-green-50/60 dark:bg-green-950/20'
               : !placeholder2 ? 'hover:bg-purple-50 dark:hover:bg-purple-950/20'
               : 'bg-gray-50 dark:bg-gray-800/30';

  // Name text classes
  const nameText1 = winner2 ? 'text-gray-400 dark:text-gray-600'
                  : winner1 ? 'text-green-800 dark:text-green-300 font-semibold'
                  : placeholder1 ? 'text-gray-400 italic'
                  : 'text-gray-900 dark:text-gray-100';
  const nameText2 = winner1 ? 'text-gray-400 dark:text-gray-600'
                  : winner2 ? 'text-green-800 dark:text-green-300 font-semibold'
                  : placeholder2 ? 'text-gray-400 italic'
                  : 'text-gray-900 dark:text-gray-100';

  // Handle vote submission
  const handleVote = async (selectedNameId, e) => {
    e.stopPropagation(); // Prevent triggering onClick
    if (!voterId || !matchupId || !selectedNameId || status !== 'active' || isVoting) return;

    setIsVoting(true);
    try {
      const response = await fetch(`http://localhost:3001/api/votes/${matchupId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voterId, selectedNameId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit vote');
      }

      // Reload tournament data to show updated vote counts
      if (onVoteSuccess) {
        await onVoteSuccess();
      }
    } catch (error) {
      console.error('Vote submission error:', error);
      alert(`Failed to submit vote: ${error.message}`);
    } finally {
      setIsVoting(false);
    }
  };

  // Determine connector positions based on side
  const isLeftSide = side === 'left';
  const connectorPos = isLeftSide ? 'left-full' : 'right-full';
  const connectorBorder = isLeftSide ? 'border-r-2' : 'border-l-2';

  return (
    <div className="relative">
      {/* Connecting Line to Next Round */}
      <div className={`absolute ${connectorPos} top-1/2 w-8 h-0.5 bg-gray-300 hidden xl:block`}></div>
      
      <div
        className="bg-white rounded border border-gray-300 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
        onClick={onClick}
      >
        {/* Name 1 row */}
        <div className={`flex items-center justify-between px-2 py-1 border-b border-gray-200 dark:border-gray-700 transition-colors ${row1Bg}`}>
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className={`text-[10px] font-bold w-5 text-center ${winner2 ? 'text-gray-400' : 'text-gray-600 dark:text-gray-400'}`}>
              {seed1}
            </span>
            {winner1 && <span className="text-[10px]">🏆</span>}
            <span className={`text-xs font-medium truncate ${nameText1}`}>
              {name1}
            </span>
          </div>
          {status === 'active' && !placeholder1 && !winnerId && (
            hasVoted
              ? <span className="ml-2 px-2 py-0.5 text-[10px] font-semibold text-green-700 bg-green-100 dark:bg-green-900/40 dark:text-green-400 rounded">✓ Voted</span>
              : <button
                  onClick={(e) => handleVote(name1Id, e)}
                  disabled={isVoting}
                  className="ml-2 px-2 py-0.5 text-[10px] font-semibold bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Vote
                </button>
          )}
          {status === 'draft' && <span className="text-[10px] text-gray-400 ml-2">-</span>}
        </div>

        {/* Vote bar for name 1 */}
        {status === 'active' && totalVotes > 0 && (
          <div className={`px-2 pb-1 ${winner2 ? 'opacity-40' : ''}`}>
            <div className="flex items-center gap-1">
              <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${percentage1}%` }} />
              </div>
              <span className="text-[9px] text-gray-600 dark:text-gray-400 font-medium w-8 text-right">
                {votes1} ({percentage1}%)
              </span>
            </div>
          </div>
        )}

        {/* Name 2 row */}
        <div className={`flex items-center justify-between px-2 py-1 transition-colors ${row2Bg}`}>
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className={`text-[10px] font-bold w-5 text-center ${winner1 ? 'text-gray-400' : 'text-gray-600 dark:text-gray-400'}`}>
              {seed2}
            </span>
            {winner2 && <span className="text-[10px]">🏆</span>}
            <span className={`text-xs font-medium truncate ${nameText2}`}>
              {name2}
            </span>
          </div>
          {status === 'active' && !placeholder2 && !winnerId && (
            hasVoted
              ? <span className="ml-2 px-2 py-0.5 text-[10px] font-semibold text-green-700 bg-green-100 dark:bg-green-900/40 dark:text-green-400 rounded">✓ Voted</span>
              : <button
                  onClick={(e) => handleVote(name2Id, e)}
                  disabled={isVoting}
                  className="ml-2 px-2 py-0.5 text-[10px] font-semibold bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Vote
                </button>
          )}
          {status === 'draft' && <span className="text-[10px] text-gray-400 ml-2">-</span>}
        </div>

        {/* Vote bar for name 2 */}
        {status === 'active' && totalVotes > 0 && (
          <div className={`px-2 pb-1 ${winner1 ? 'opacity-40' : ''}`}>
            <div className="flex items-center gap-1">
              <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 transition-all duration-300" style={{ width: `${percentage2}%` }} />
              </div>
              <span className="text-[9px] text-gray-600 dark:text-gray-400 font-medium w-8 text-right">
                {votes2} ({percentage2}%)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Vertical connector for paired matchups */}
      {index % 2 === 0 && (
        <div className={`absolute ${connectorPos} top-1/2 hidden xl:block`}>
          <div className={`w-8 h-16 ${connectorBorder} border-t-2 border-gray-300`}></div>
        </div>
      )}
      {index % 2 === 1 && (
        <div className={`absolute ${connectorPos} bottom-1/2 hidden xl:block`}>
          <div className={`w-8 h-16 ${connectorBorder} border-b-2 border-gray-300`}></div>
        </div>
      )}
    </div>
  );
}

function PlaceholderMatchup({ round, matchup1, matchup2, matchup3, matchup4, status, side = 'left', onClick, isFinal4 = false, label = '' }) {
  // All matchups are pre-normalised — name1/name2 are always strings
  const getName = (matchup, position) => {
    if (!matchup) return 'N/A';
    return (position === 1 ? matchup.name1 : matchup.name2) || 'N/A';
  };

  // For Round 2: Winner of matchup1 vs Winner of matchup2
  // For Round 3: Winner of (matchup1 vs matchup2) vs Winner of (matchup3 vs matchup4)
  // For Round 4 (Final 4): Winner from all 4 previous matchups
  let team1Text = 'TBD';
  let team2Text = 'TBD';

  if (round === 2 && matchup1 && matchup2) {
    const name1_1 = getName(matchup1, 1);
    const name1_2 = getName(matchup1, 2);
    const name2_1 = getName(matchup2, 1);
    const name2_2 = getName(matchup2, 2);
    
    team1Text = `Winner of ${name1_1} vs ${name1_2}`;
    team2Text = `Winner of ${name2_1} vs ${name2_2}`;
  } else if (round === 3 && matchup1 && matchup2 && matchup3 && matchup4) {
    const name1_1 = getName(matchup1, 1);
    const name1_2 = getName(matchup1, 2);
    const name2_1 = getName(matchup2, 1);
    const name2_2 = getName(matchup2, 2);
    const name3_1 = getName(matchup3, 1);
    const name3_2 = getName(matchup3, 2);
    const name4_1 = getName(matchup4, 1);
    const name4_2 = getName(matchup4, 2);
    
    team1Text = `Winner of (${name1_1} vs ${name1_2}) vs (${name2_1} vs ${name2_2})`;
    team2Text = `Winner of (${name3_1} vs ${name3_2}) vs (${name4_1} vs ${name4_2})`;
  } else if (round === 4 && matchup1 && matchup2 && matchup3 && matchup4) {
    team1Text = `${label} Final 4 Winner`;
    team2Text = `${label} Final 4 Winner`;
  }

  // Determine connector positions based on side
  const isLeftSide = side === 'left';
  const connectorPos = isLeftSide ? 'left-full' : 'right-full';

  // Style adjustments for Final 4
  const cardClasses = isFinal4
    ? "bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border-2 border-indigo-300 overflow-hidden opacity-90 hover:opacity-100 hover:shadow-lg transition-all cursor-pointer"
    : "bg-white rounded border border-dashed border-gray-300 overflow-hidden opacity-60 hover:opacity-80 transition-opacity cursor-pointer";

  return (
    <div className="relative">
      {/* Connecting Line to Next Round (only show for rounds 2 and 3) */}
      {round < 4 && (
        <div className={`absolute ${connectorPos} top-1/2 w-8 h-0.5 bg-gray-300 hidden xl:block`}></div>
      )}
      
      {isFinal4 && label && (
        <div className="text-xs font-semibold text-gray-600 mb-2 text-center">
          {label}
        </div>
      )}
      
      <div className={cardClasses} onClick={onClick}>
        {/* Team 1 Placeholder */}
        <div className={`flex items-center justify-between px-3 py-2 border-b border-gray-200 ${isFinal4 ? 'bg-white/50' : ''}`}>
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className={`${isFinal4 ? 'text-xs' : 'text-[10px]'} font-bold text-gray-400 w-5 text-center`}>-</span>
            <span className={`${isFinal4 ? 'text-sm' : 'text-xs'} text-gray-400 italic truncate`} title={team1Text}>
              {team1Text}
            </span>
          </div>
          <span className={`${isFinal4 ? 'text-xs' : 'text-[10px]'} text-gray-400`}>-</span>
        </div>

        {/* Team 2 Placeholder */}
        <div className={`flex items-center justify-between px-3 py-2 ${isFinal4 ? 'bg-white/30' : ''}`}>
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className={`${isFinal4 ? 'text-xs' : 'text-[10px]'} font-bold text-gray-400 w-5 text-center`}>-</span>
            <span className={`${isFinal4 ? 'text-sm' : 'text-xs'} text-gray-400 italic truncate`} title={team2Text}>
              {team2Text}
            </span>
          </div>
          <span className={`${isFinal4 ? 'text-xs' : 'text-[10px]'} text-gray-400`}>-</span>
        </div>
      </div>
    </div>
  );
}

function MobileMatchupCard({ matchup, status, index, voterId, votedMatchupIds = [], onVoteSuccess }) {
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
  const hasVoted    = votedMatchupIds.includes(matchupId);

  const votes1      = matchup.votes1 ?? 0;
  const votes2      = matchup.votes2 ?? 0;
  const totalVotes  = votes1 + votes2;
  const percentage1 = totalVotes > 0 ? Math.round((votes1 / totalVotes) * 100) : 0;
  const percentage2 = totalVotes > 0 ? Math.round((votes2 / totalVotes) * 100) : 0;

  const winnerId = matchup.winnerId || null;
  const winner1  = winnerId && winnerId === name1Id;
  const winner2  = winnerId && winnerId === name2Id;

  // Handle vote submission
  const handleVote = async (selectedNameId) => {
    if (!voterId || !matchupId || !selectedNameId || status !== 'active' || isVoting) return;

    setIsVoting(true);
    try {
      const response = await fetch(`http://localhost:3001/api/votes/${matchupId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voterId, selectedNameId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit vote');
      }

      // Reload tournament data to show updated vote counts
      if (onVoteSuccess) {
        await onVoteSuccess();
      }
    } catch (error) {
      console.error('Vote submission error:', error);
      alert(`Failed to submit vote: ${error.message}`);
    } finally {
      setIsVoting(false);
    }
  };

  const row1Bg = winner1 ? 'bg-green-50 dark:bg-green-950/30'
               : winner2 ? 'bg-gray-100 dark:bg-gray-800/50'
               : '';
  const row2Bg = winner2 ? 'bg-green-50 dark:bg-green-950/30'
               : winner1 ? 'bg-gray-100 dark:bg-gray-800/50'
               : '';

  return (
    <div className="bg-white dark:bg-gray-900 rounded border border-gray-300 dark:border-gray-700 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="bg-gray-50 dark:bg-gray-800 px-3 py-1 border-b border-gray-200 dark:border-gray-700">
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Game {index + 1}</span>
      </div>

      {/* Name 1 */}
      <div className={`px-2 py-1.5 border-b border-gray-200 dark:border-gray-700 ${row1Bg}`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className={`text-[10px] font-bold w-5 ${winner2 ? 'text-gray-400' : 'text-gray-600 dark:text-gray-400'}`}>
              {seed1}
            </span>
            {winner1 && <span className="text-[10px]">🏆</span>}
            <span className={`text-xs font-medium truncate ${
              winner1 ? 'text-green-800 dark:text-green-300 font-semibold'
              : winner2 ? 'text-gray-400 dark:text-gray-600'
              : placeholder1 ? 'text-gray-400 italic'
              : 'text-gray-900 dark:text-gray-100'
            }`}>
              {name1}
            </span>
          </div>
          {status === 'active' && !placeholder1 && !winnerId && (
            hasVoted
              ? <span className="ml-2 px-3 py-1 text-xs font-semibold text-green-700 bg-green-100 dark:bg-green-900/40 dark:text-green-400 rounded">✓ Voted</span>
              : <button
                  onClick={() => handleVote(name1Id)}
                  disabled={isVoting}
                  className="ml-2 px-3 py-1 text-xs font-semibold bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Vote
                </button>
          )}
        </div>
        {totalVotes > 0 && (
          <div className={`flex items-center gap-2 ml-6 ${winner2 ? 'opacity-40' : ''}`}>
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${percentage1}%` }} />
            </div>
            <span className="text-[10px] text-gray-600 dark:text-gray-400 font-medium">
              {votes1} ({percentage1}%)
            </span>
          </div>
        )}
      </div>

      {/* Name 2 */}
      <div className={`px-2 py-1.5 ${row2Bg}`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className={`text-[10px] font-bold w-5 ${winner1 ? 'text-gray-400' : 'text-gray-600 dark:text-gray-400'}`}>
              {seed2}
            </span>
            {winner2 && <span className="text-[10px]">🏆</span>}
            <span className={`text-xs font-medium truncate ${
              winner2 ? 'text-green-800 dark:text-green-300 font-semibold'
              : winner1 ? 'text-gray-400 dark:text-gray-600'
              : placeholder2 ? 'text-gray-400 italic'
              : 'text-gray-900 dark:text-gray-100'
            }`}>
              {name2}
            </span>
          </div>
          {status === 'active' && !placeholder2 && !winnerId && (
            hasVoted
              ? <span className="ml-2 px-3 py-1 text-xs font-semibold text-green-700 bg-green-100 dark:bg-green-900/40 dark:text-green-400 rounded">✓ Voted</span>
              : <button
                  onClick={() => handleVote(name2Id)}
                  disabled={isVoting}
                  className="ml-2 px-3 py-1 text-xs font-semibold bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Vote
                </button>
          )}
        </div>
        {totalVotes > 0 && (
          <div className={`flex items-center gap-2 ml-6 ${winner1 ? 'opacity-40' : ''}`}>
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 transition-all duration-300" style={{ width: `${percentage2}%` }} />
            </div>
            <span className="text-[10px] text-gray-600 dark:text-gray-400 font-medium">
              {votes2} ({percentage2}%)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
