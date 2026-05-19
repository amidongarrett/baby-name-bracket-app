/**
 * BracketView Component
 * Traditional March Madness bracket with horizontal flow and connecting lines
 */

"use client";

import { useRef, useState } from 'react';
import MatchupCard from './MatchupCard';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Derives the current vote leader from a raw feeder matchup.
 * Returns { nameId, name, seed } or null (tied / no votes).
 * @param {object} feeder  - raw entry from bracketMatchups.roundOf32 or roundOf16
 * @param {object} nameMap - nameId → { value } display map
 * @param {number} slotBase - the ordinal index of this feeder in its round array,
 *                            used to derive seeds when the feeder is a raw API object.
 */
function getFeederLeader(feeder, nameMap, slotBase) {
  if (!feeder) return null;

  const n1Votes = feeder.votes?.name1Votes ?? 0;
  const n2Votes = feeder.votes?.name2Votes ?? 0;

  // Determine which side is the leader
  let leadSide; // 'name1' | 'name2' | null
  if (feeder.winnerId) {
    // Official winner takes precedence
    if (feeder.winnerId === feeder.name1Id) leadSide = 'name1';
    else if (feeder.winnerId === feeder.name2Id) leadSide = 'name2';
    else return null; // winnerId doesn't match either slot — defensive
  } else if (n1Votes > n2Votes) {
    leadSide = 'name1';
  } else if (n2Votes > n1Votes) {
    leadSide = 'name2';
  } else if (feeder.name1Id) {
    // Tied (including 0-0): fall back to name1 as the tie-break so the slot
    // never shows TBD due to an equal-vote state after a vote change.
    leadSide = 'name1';
  } else {
    return null; // no candidates at all — genuinely unknown
  }

  if (leadSide === 'name1') {
    return {
      nameId: feeder.name1Id || null,
      name:   nameMap[feeder.name1Id]?.value || 'TBD',
      seed:   slotBase * 2 + 1,
    };
  } else {
    return {
      nameId: feeder.name2Id || null,
      name:   nameMap[feeder.name2Id]?.value || 'TBD',
      seed:   slotBase * 2 + 2,
    };
  }
}

function getFeederWrongPick(feeder, leader, voteMap, nameMap) {
  if (!feeder || !leader || !feeder.winnerId) return null;
  const feederId = feeder.id || feeder._id?.toString();
  const guestVotedId = voteMap[feederId];
  if (!guestVotedId || guestVotedId === feeder.winnerId) return null;
  const guestName = nameMap[guestVotedId]?.value;
  if (!guestName) return null;
  return { guestName, actualName: leader.name };
}

export default function BracketView({
  matchups, status, voterId,
  voteMap = {}, viewerRole = 'guest', ownerPicks = {},
  lockedRounds = [], publishedRounds = [],
  activeRoundKey = 'roundOf32',
  bracketMatchups = {}, nameMap = {}, guestPredictions = {},
  onVoteSuccess, onGuestLockIn
}) {
  // Split into owner1 (top 8) and owner2 (bottom 8) matchups.
  // In R32 mode matchupGrid has 16 entries. In later rounds it has fewer
  // (e.g. 8 in R16), so owner2Matchups would be empty — handled below.
  const owner1Matchups = matchups.slice(0, 8);
  const owner2Matchups = matchups.slice(8, 16);

  // When a later round is active, build a lightweight normalized view of the
  // completed R32 matchups (read-only, winner already set) for the R32 columns.
  // Uses bracketMatchups.roundOf32 (raw from API) + nameMap for display values.
  const completedR32 = (activeRoundKey !== 'roundOf32' && bracketMatchups.roundOf32?.length > 0)
    ? bracketMatchups.roundOf32.map((m, idx) => ({
        _id:    m.id || m._id?.toString() || `r32-hist-${idx}`,
        name1:  nameMap[m.name1Id]?.value || 'TBD',
        name2:  nameMap[m.name2Id]?.value || 'TBD',
        name1Id: m.name1Id || null,
        name2Id: m.name2Id || null,
        seed1:  idx * 2 + 1,
        seed2:  idx * 2 + 2,
        votes1: m.votes?.name1Votes ?? 0,
        votes2: m.votes?.name2Votes ?? 0,
        winnerId: m.winnerId || null,
        isPlaceholder1: false,
        isPlaceholder2: false,
      }))
    : null;


  // Top-level owner flag (used when passing to PlaceholderMatchup)
  const isOwner = viewerRole === 'owner1' || viewerRole === 'owner2';
  const isGuest = !isOwner;

  const SLOT_HEIGHT = 130; // px per R32 slot
  const TOTAL_HEIGHT = 8 * SLOT_HEIGHT; // 1040px — shared by ALL round columns
  const F4_CARD_HEIGHT       = 88;  // approximate rendered height of a two-row F4 / Championship card (px)
  const F4_LABEL_HEIGHT      = 20;  // height of the outer "Division 1 / 2 / CHAMPIONSHIP" label div (text-xs + mb-1)
  const CHAMP_SUBTITLE_HEIGHT = 24; // extra "Division 1 vs Division 2" subtitle inside the Championship card (text-xs + mb-2)
  // Elite 8 cards sit in flex items-center rows of height 4*SLOT_HEIGHT (520px).
  // Top E8 card center = 2*SLOT_HEIGHT = 260px; bottom E8 card center = 6*SLOT_HEIGHT = 780px.
  // F4 wrapper top is positioned so that: wrapper_top + F4_LABEL_HEIGHT + F4_CARD_HEIGHT/2 = E8 card center.
  const F4_DIV1_TOP = 2 * SLOT_HEIGHT - F4_LABEL_HEIGHT - F4_CARD_HEIGHT / 2; // 196px
  const F4_DIV2_TOP = 6 * SLOT_HEIGHT - F4_LABEL_HEIGHT - F4_CARD_HEIGHT / 2; // 716px
  // Championship card body bottom = wrapper_top + outer label + inner subtitle + card body
  const CHAMP_BODY_BOTTOM = TOTAL_HEIGHT / 2 - SLOT_HEIGHT / 2 + F4_LABEL_HEIGHT + CHAMP_SUBTITLE_HEIGHT + F4_CARD_HEIGHT;

  // Guest lock-in / publish state — hoisted here so per-round flags aren't recomputed inside loops
  const isLockedIn      = lockedRounds.includes(activeRoundKey);
  const isRoundPublished = publishedRounds.includes(activeRoundKey);
  const isR16Published  = publishedRounds.includes('roundOf16');
  const isR16Locked     = lockedRounds.includes('roundOf16');
  const isE8Published   = publishedRounds.includes('elite8');
  const isE8Locked      = lockedRounds.includes('elite8');

  // Count how many current-round matchups the guest has voted on
  const votableMatchups = matchups.filter(m => m.name1Id && m.name2Id);
  const votedCount = votableMatchups.filter(m => voteMap[m._id || m.id]).length;
  const allVoted = votableMatchups.length > 0 && votedCount === votableMatchups.length;

  // Refs for each section
  const owner1R1Ref = useRef(null);
  const owner1R2Ref = useRef(null);
  const owner1R3Ref = useRef(null);
  const championshipRef = useRef(null);
  const owner2R3Ref = useRef(null);
  const owner2R2Ref = useRef(null);
  const owner2R1Ref = useRef(null);

  // Drag-to-scroll: horizontal drag scrolls the bracket container,
  // vertical drag scrolls the page — both work within the same drag area.
  const scrollContainerRef = useRef(null);
  const [isDragging, setIsDragging]   = useState(false);
  const dragDir      = useRef(null);   // 'h' | 'v' | null
  const startXRef    = useRef(0);
  const startYRef    = useRef(0);      // updated each frame for incremental vertical scroll
  const scrollLeftRef = useRef(0);

  const handleMouseDown = (e) => {
    if (!scrollContainerRef.current) return;
    dragDir.current = null;
    setIsDragging(true);
    startXRef.current     = e.pageX - scrollContainerRef.current.offsetLeft;
    startYRef.current     = e.clientY;  // clientY: viewport-relative, unaffected by page scroll
    scrollLeftRef.current = scrollContainerRef.current.scrollLeft;
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !scrollContainerRef.current) return;

    const dx = Math.abs(e.pageX - (startXRef.current + scrollContainerRef.current.offsetLeft));
    const dy = Math.abs(e.clientY - startYRef.current);

    // Wait for at least 4 px of movement before committing to a direction
    if (!dragDir.current) {
      if (dx < 4 && dy < 4) return;
      dragDir.current = dy > dx ? 'v' : 'h';
    }

    if (dragDir.current === 'v') {
      // Vertical: scroll the page by the incremental clientY delta each frame.
      // Must use clientY (viewport-relative) — pageY includes window.scrollY,
      // so using pageY here creates a feedback loop where each scroll call
      // changes the next pageY reading and the screen oscillates.
      const delta = startYRef.current - e.clientY;
      startYRef.current = e.clientY;
      window.scrollBy(0, delta);
      return;
    }

    // Horizontal: scroll the bracket container
    e.preventDefault();
    const x    = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragDir.current = null;
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    dragDir.current = null;
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

      {/* Bracket View */}
        <div className="w-full px-4">
          <div
            ref={scrollContainerRef}
            className={`flex gap-8 overflow-x-auto pb-64 select-none ${
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
              <div className="flex flex-col" style={{ height: `${TOTAL_HEIGHT}px` }}>
                {(completedR32 ? completedR32.slice(0, 8) : owner1Matchups).map((matchup, index) => (
                  <div
                    key={matchup._id || `owner1-${index}`}
                    style={{ height: `${SLOT_HEIGHT}px` }}
                    className="flex items-center"
                  >
                    <div className="relative w-full">
                      <MatchupCard
                        matchup={matchup}
                        status={status}
                        index={index}
                        side="left"
                        slotHeight={SLOT_HEIGHT}
                        voterId={voterId}
                        voteMap={voteMap}
                        viewerRole={viewerRole}
                        ownerPicks={ownerPicks}
                        isLockedIn={isLockedIn}
                        isRoundPublished={completedR32 ? true : isRoundPublished}
                        onVoteSuccess={onVoteSuccess}
                      />
                    </div>
                  </div>
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
              <div className="flex flex-col" style={{ height: `${TOTAL_HEIGHT}px` }}>
                {[...Array(4)].map((_, i) => {
                  // In R32 mode: PlaceholderMatchup shows who might face each other here
                  const matchup1 = owner1Matchups[i * 2];
                  const matchup2 = owner1Matchups[i * 2 + 1];
                  // In R16 mode: Div1 R16 matchups live at indices 0–3.
                  // Show a live MatchupCard as soon as R16 matchup data exists (the admin
                  // has advanced the round), regardless of which key activeRoundKey holds.
                  const activeMatchup = matchups[i];
                  const r16MatchupExists = bracketMatchups.roundOf16?.[i];
                  return (
                    <div
                      key={`owner1-r2-${i}`}
                      style={{ height: `${2 * SLOT_HEIGHT}px` }}
                      className="flex items-center"
                    >
                      <div className="relative w-full">
                        {r16MatchupExists && activeMatchup ? (() => {
                          const r32Feeders = bracketMatchups.roundOf32 || [];
                          const leader1 = getFeederLeader(r32Feeders[i * 2],     nameMap, i * 2);
                          const leader2 = getFeederLeader(r32Feeders[i * 2 + 1], nameMap, i * 2 + 1);
                          const name1FWP = isGuest ? getFeederWrongPick(r32Feeders[i * 2],     leader1, voteMap, nameMap) : null;
                          const name2FWP = isGuest ? getFeederWrongPick(r32Feeders[i * 2 + 1], leader2, voteMap, nameMap) : null;
                          const name1Confirmed = !!leader1;
                          const name2Confirmed = !!leader2;
                          const resolvedMatchup = {
                            ...activeMatchup,
                            name1:   leader1 ? leader1.name   : 'TBD',
                            name1Id: leader1 ? leader1.nameId : activeMatchup.name1Id,
                            seed1:   leader1 ? leader1.seed   : activeMatchup.seed1,
                            name2:   leader2 ? leader2.name   : 'TBD',
                            name2Id: leader2 ? leader2.nameId : activeMatchup.name2Id,
                            seed2:   leader2 ? leader2.seed   : activeMatchup.seed2,
                          };
                          return (
                          <MatchupCard
                            matchup={resolvedMatchup}
                            status={status}
                            index={i}
                            side="left"
                            slotHeight={2 * SLOT_HEIGHT}
                            voterId={voterId}
                            voteMap={voteMap}
                            viewerRole={viewerRole}
                            ownerPicks={ownerPicks}
                            isLockedIn={isR16Locked}
                            isRoundPublished={isR16Published}
                            onVoteSuccess={onVoteSuccess}
                            name1Confirmed={name1Confirmed}
                            name2Confirmed={name2Confirmed}
                            name1FeederWrongPick={name1FWP}
                            name2FeederWrongPick={name2FWP}
                          />
                          );
                        })() : (
                          (() => {
                            const r32 = bracketMatchups.roundOf32 || [];
                            const vl1 = getFeederLeader(r32[i * 2],     nameMap, i * 2);
                            const vl2 = getFeederLeader(r32[i * 2 + 1], nameMap, i * 2 + 1);
                            const basePred = guestPredictions?.roundOf16?.[i] || {};
                            const syntheticPred = (vl1 || vl2) ? {
                              ...basePred,
                              guestName1Id: vl1?.nameId || null,
                              guestName2Id: vl2?.nameId || null,
                            } : null;
                            return (
                              <PlaceholderMatchup
                                round={2}
                                matchup1={matchup1}
                                matchup2={matchup2}
                                prediction={syntheticPred}
                                nameMap={nameMap}
                                isOwner={isOwner}
                                status={status}
                                side="left"
                                pmIndex={i}
                                slotHeight={2 * SLOT_HEIGHT}
                                onClick={() => scrollToRound(owner1R2Ref)}
                              />
                            );
                          })()
                        )}
                      </div>
                    </div>
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
              <div className="flex flex-col" style={{ height: `${TOTAL_HEIGHT}px` }}>
                {[...Array(2)].map((_, i) => {
                  const matchup1Index = i * 4;
                  const matchup2Index = i * 4 + 2;
                  // When elite8 round is active, Div1 live matchups sit at indices 0–1 in matchupGrid
                  const activeMatchup = matchups[i];
                  const e8MatchupExists = bracketMatchups.elite8?.[i];
                  return (
                    <div
                      key={`owner1-r3-${i}`}
                      style={{ height: `${4 * SLOT_HEIGHT}px` }}
                      className="flex items-center"
                    >
                      <div className="relative w-full">
                        {e8MatchupExists && activeMatchup ? (() => {
                          const r16Feeders = bracketMatchups.roundOf16 || [];
                          const leader1 = getFeederLeader(r16Feeders[i * 2],     nameMap, i * 2);
                          const leader2 = getFeederLeader(r16Feeders[i * 2 + 1], nameMap, i * 2 + 1);
                          const name1FWP = isGuest ? getFeederWrongPick(r16Feeders[i * 2],     leader1, voteMap, nameMap) : null;
                          const name2FWP = isGuest ? getFeederWrongPick(r16Feeders[i * 2 + 1], leader2, voteMap, nameMap) : null;
                          const name1Confirmed = !!leader1;
                          const name2Confirmed = !!leader2;
                          const resolvedMatchup = {
                            ...activeMatchup,
                            name1:   leader1 ? leader1.name   : 'TBD',
                            name1Id: leader1 ? leader1.nameId : activeMatchup.name1Id,
                            seed1:   leader1 ? leader1.seed   : activeMatchup.seed1,
                            name2:   leader2 ? leader2.name   : 'TBD',
                            name2Id: leader2 ? leader2.nameId : activeMatchup.name2Id,
                            seed2:   leader2 ? leader2.seed   : activeMatchup.seed2,
                          };
                          return (
                          <MatchupCard
                            matchup={resolvedMatchup}
                            status={status}
                            index={i}
                            side="left"
                            round={3}
                            slotHeight={4 * SLOT_HEIGHT}
                            voterId={voterId}
                            voteMap={voteMap}
                            viewerRole={viewerRole}
                            ownerPicks={ownerPicks}
                            isLockedIn={isE8Locked}
                            isRoundPublished={isE8Published}
                            onVoteSuccess={onVoteSuccess}
                            name1Confirmed={name1Confirmed}
                            name2Confirmed={name2Confirmed}
                            name1FeederWrongPick={name1FWP}
                            name2FeederWrongPick={name2FWP}
                          />
                          );
                        })() : (
                          <PlaceholderMatchup
                            round={3}
                            matchup1={owner1Matchups[matchup1Index]}
                            matchup2={owner1Matchups[matchup1Index + 1]}
                            matchup3={owner1Matchups[matchup2Index]}
                            matchup4={owner1Matchups[matchup2Index + 1]}
                            prediction={guestPredictions?.elite8?.[i] || null}
                            nameMap={nameMap}
                            isOwner={isOwner}
                            status={status}
                            side="left"
                            pmIndex={i}
                            slotHeight={4 * SLOT_HEIGHT}
                            onClick={() => scrollToRound(owner1R3Ref)}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Final 4 + Championship — single center column */}
            <div
              className="flex-shrink-0 w-[280px] relative"
              ref={championshipRef}
              style={{ height: `${TOTAL_HEIGHT + 28}px` }}
            >
              {/* Column header */}
              <h3
                className="text-sm font-bold text-indigo-600 mb-4 text-center cursor-pointer hover:text-indigo-700 transition-colors"
                onClick={() => scrollToRound(championshipRef)}
              >
                FINAL 4 / CHAMPIONSHIP
              </h3>

              {/* Inner region positioned relative to this spacer div below the header */}
              <div className="relative" style={{ height: `${TOTAL_HEIGHT}px` }}>

                {/* F4 Div1 card — top aligned with top Elite 8 card center (2*SLOT_HEIGHT = 260px) */}
                <div
                  className="absolute w-full"
                  style={{ top: `${F4_DIV1_TOP}px` }}
                >
                  <div className="text-xs font-semibold text-gray-600 mb-1 text-center">Division 1</div>
                  <PlaceholderMatchup
                    round={4}
                    matchup1={owner1Matchups[0]}
                    matchup2={owner1Matchups[1]}
                    matchup3={owner1Matchups[2]}
                    matchup4={owner1Matchups[3]}
                    prediction={guestPredictions?.final4?.[0] || null}
                    nameMap={nameMap}
                    isOwner={isOwner}
                    status={status}
                    side="center"
                    onClick={() => scrollToRound(championshipRef)}
                    isFinal4={true}
                    label=""
                  />
                </div>

                {/* Vertical connector: F4 Div1 bottom → Championship top */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 w-0.5 bg-gray-300 hidden xl:block"
                  style={{
                    top:    `${F4_DIV1_TOP + F4_LABEL_HEIGHT + F4_CARD_HEIGHT}px`,
                    height: `${TOTAL_HEIGHT / 2 - SLOT_HEIGHT / 2 - (F4_DIV1_TOP + F4_LABEL_HEIGHT + F4_CARD_HEIGHT)}px`,
                  }}
                />

                {/* Championship card */}
                <div
                  className="absolute w-full"
                  style={{ top: `${TOTAL_HEIGHT / 2 - SLOT_HEIGHT / 2}px` }}
                >
                  <div className="text-xs font-semibold text-yellow-600 mb-1 text-center">CHAMPIONSHIP</div>
                  <PlaceholderMatchup
                    round={5}
                    prediction={guestPredictions?.championship?.[0] || null}
                    nameMap={nameMap}
                    isOwner={isOwner}
                    status={status}
                    side="center"
                    onClick={() => scrollToRound(championshipRef)}
                    isChampionship={true}
                  />
                </div>

                {/* Lock-in block — positioned to the right of the Championship card so the
                    Championship → Division 2 connector stays clean. Vertically aligned with the
                    top of the Championship card body. */}
                {status === 'active' && viewerRole === 'guest' && (
                  <div
                    className="absolute text-center"
                    style={{
                      top:  `${TOTAL_HEIGHT / 2 - SLOT_HEIGHT / 2 + F4_LABEL_HEIGHT + CHAMP_SUBTITLE_HEIGHT}px`,
                      left: 'calc(100% + 8px)',
                      width: '160px',
                    }}
                  >
                    {!isLockedIn && (
                      <>
                        <p className="text-xs text-gray-500 mb-2">
                          {allVoted
                            ? 'All picks made! Lock in to see how others voted.'
                            : `${votedCount} / ${votableMatchups.length} matchups picked`}
                        </p>
                        <button
                          onClick={onGuestLockIn}
                          disabled={!allVoted}
                          className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-lg shadow hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                        >
                          Lock In My Picks
                        </button>
                      </>
                    )}
                    {isLockedIn && (
                      <div className="pt-4">
                        <span className="px-4 py-2 text-sm font-semibold text-green-700 bg-green-100 rounded-lg border border-green-300">
                          Picks Locked In
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Vertical connector: Championship bottom → F4 Div2 top */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 w-0.5 bg-gray-300 hidden xl:block"
                  style={{
                    top:    `${CHAMP_BODY_BOTTOM}px`,
                    height: `${F4_DIV2_TOP - CHAMP_BODY_BOTTOM}px`,
                  }}
                />

                {/* F4 Div2 card — top aligned with bottom Elite 8 card center (6*SLOT_HEIGHT = 780px) */}
                <div
                  className="absolute w-full"
                  style={{ top: `${F4_DIV2_TOP}px` }}
                >
                  <div className="text-xs font-semibold text-gray-600 mb-1 text-center">Division 2</div>
                  <PlaceholderMatchup
                    round={4}
                    matchup1={owner2Matchups[0]}
                    matchup2={owner2Matchups[1]}
                    matchup3={owner2Matchups[2]}
                    matchup4={owner2Matchups[3]}
                    prediction={guestPredictions?.final4?.[1] || null}
                    nameMap={nameMap}
                    isOwner={isOwner}
                    status={status}
                    side="center"
                    onClick={() => scrollToRound(championshipRef)}
                    isFinal4={true}
                    label=""
                  />
                </div>

              </div>{/* end inner relative region */}
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
              <div className="flex flex-col" style={{ height: `${TOTAL_HEIGHT}px` }}>
                {[...Array(2)].map((_, i) => {
                  const matchup1Index = i * 4;
                  const matchup2Index = i * 4 + 2;
                  // When elite8 round is active, live matchups sit at indices 2+i in matchupGrid
                  const activeMatchup = matchups[2 + i];
                  const e8MatchupExists = bracketMatchups.elite8?.[2 + i];
                  return (
                    <div
                      key={`owner2-r3-${i}`}
                      style={{ height: `${4 * SLOT_HEIGHT}px` }}
                      className="flex items-center"
                    >
                      <div className="relative w-full">
                        {e8MatchupExists && activeMatchup ? (() => {
                          const r16Feeders = bracketMatchups.roundOf16 || [];
                          const globalR16Base = 4 + i * 2;
                          const leader1 = getFeederLeader(r16Feeders[globalR16Base],     nameMap, globalR16Base);
                          const leader2 = getFeederLeader(r16Feeders[globalR16Base + 1], nameMap, globalR16Base + 1);
                          const name1FWP = isGuest ? getFeederWrongPick(r16Feeders[globalR16Base],     leader1, voteMap, nameMap) : null;
                          const name2FWP = isGuest ? getFeederWrongPick(r16Feeders[globalR16Base + 1], leader2, voteMap, nameMap) : null;
                          const name1Confirmed = !!leader1;
                          const name2Confirmed = !!leader2;
                          const resolvedMatchup = {
                            ...activeMatchup,
                            name1:   leader1 ? leader1.name   : 'TBD',
                            name1Id: leader1 ? leader1.nameId : activeMatchup.name1Id,
                            seed1:   leader1 ? leader1.seed   : activeMatchup.seed1,
                            name2:   leader2 ? leader2.name   : 'TBD',
                            name2Id: leader2 ? leader2.nameId : activeMatchup.name2Id,
                            seed2:   leader2 ? leader2.seed   : activeMatchup.seed2,
                          };
                          return (
                          <MatchupCard
                            matchup={resolvedMatchup}
                            status={status}
                            index={2 + i}
                            side="right"
                            round={3}
                            slotHeight={4 * SLOT_HEIGHT}
                            voterId={voterId}
                            voteMap={voteMap}
                            viewerRole={viewerRole}
                            ownerPicks={ownerPicks}
                            isLockedIn={isE8Locked}
                            isRoundPublished={isE8Published}
                            onVoteSuccess={onVoteSuccess}
                            name1Confirmed={name1Confirmed}
                            name2Confirmed={name2Confirmed}
                            name1FeederWrongPick={name1FWP}
                            name2FeederWrongPick={name2FWP}
                          />
                          );
                        })() : (
                          <PlaceholderMatchup
                            round={3}
                            matchup1={owner2Matchups[matchup1Index]}
                            matchup2={owner2Matchups[matchup1Index + 1]}
                            matchup3={owner2Matchups[matchup2Index]}
                            matchup4={owner2Matchups[matchup2Index + 1]}
                            prediction={guestPredictions?.elite8?.[2 + i] || null}
                            nameMap={nameMap}
                            isOwner={isOwner}
                            status={status}
                            side="right"
                            pmIndex={i}
                            slotHeight={4 * SLOT_HEIGHT}
                            onClick={() => scrollToRound(owner2R3Ref)}
                          />
                        )}
                      </div>
                    </div>
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
              <div className="flex flex-col" style={{ height: `${TOTAL_HEIGHT}px` }}>
                {[...Array(4)].map((_, i) => {
                  // In R32 mode: PlaceholderMatchup shows who might face each other here
                  const matchup1 = owner2Matchups[i * 2];
                  const matchup2 = owner2Matchups[i * 2 + 1];
                  // In R16 mode: Div2 R16 matchups live at indices 4–7.
                  // Show a live MatchupCard as soon as R16 matchup data exists.
                  const activeMatchup = matchups[4 + i];
                  const r16MatchupExists = bracketMatchups.roundOf16?.[4 + i];
                  return (
                    <div
                      key={`owner2-r2-${i}`}
                      style={{ height: `${2 * SLOT_HEIGHT}px` }}
                      className="flex items-center"
                    >
                      <div className="relative w-full">
                        {r16MatchupExists && activeMatchup ? (() => {
                          const r32Feeders = bracketMatchups.roundOf32 || [];
                          const globalIdx = 4 + i;
                          const leader1 = getFeederLeader(r32Feeders[globalIdx * 2],     nameMap, globalIdx * 2);
                          const leader2 = getFeederLeader(r32Feeders[globalIdx * 2 + 1], nameMap, globalIdx * 2 + 1);
                          const name1FWP = isGuest ? getFeederWrongPick(r32Feeders[globalIdx * 2],     leader1, voteMap, nameMap) : null;
                          const name2FWP = isGuest ? getFeederWrongPick(r32Feeders[globalIdx * 2 + 1], leader2, voteMap, nameMap) : null;
                          const name1Confirmed = !!leader1;
                          const name2Confirmed = !!leader2;
                          const resolvedMatchup = {
                            ...activeMatchup,
                            name1:   leader1 ? leader1.name   : 'TBD',
                            name1Id: leader1 ? leader1.nameId : activeMatchup.name1Id,
                            seed1:   leader1 ? leader1.seed   : activeMatchup.seed1,
                            name2:   leader2 ? leader2.name   : 'TBD',
                            name2Id: leader2 ? leader2.nameId : activeMatchup.name2Id,
                            seed2:   leader2 ? leader2.seed   : activeMatchup.seed2,
                          };
                          return (
                          <MatchupCard
                            matchup={resolvedMatchup}
                            status={status}
                            index={4 + i}
                            side="right"
                            slotHeight={2 * SLOT_HEIGHT}
                            voterId={voterId}
                            voteMap={voteMap}
                            viewerRole={viewerRole}
                            ownerPicks={ownerPicks}
                            isLockedIn={isR16Locked}
                            isRoundPublished={isR16Published}
                            onVoteSuccess={onVoteSuccess}
                            name1Confirmed={name1Confirmed}
                            name2Confirmed={name2Confirmed}
                            name1FeederWrongPick={name1FWP}
                            name2FeederWrongPick={name2FWP}
                          />
                          );
                        })() : (
                          (() => {
                            const r32 = bracketMatchups.roundOf32 || [];
                            const vl1 = getFeederLeader(r32[(4 + i) * 2],     nameMap, (4 + i) * 2);
                            const vl2 = getFeederLeader(r32[(4 + i) * 2 + 1], nameMap, (4 + i) * 2 + 1);
                            const basePred = guestPredictions?.roundOf16?.[4 + i] || {};
                            const syntheticPred = (vl1 || vl2) ? {
                              ...basePred,
                              guestName1Id: vl1?.nameId || null,
                              guestName2Id: vl2?.nameId || null,
                            } : null;
                            return (
                              <PlaceholderMatchup
                                round={2}
                                matchup1={matchup1}
                                matchup2={matchup2}
                                prediction={syntheticPred}
                                nameMap={nameMap}
                                isOwner={isOwner}
                                status={status}
                                side="right"
                                pmIndex={i}
                                slotHeight={2 * SLOT_HEIGHT}
                                onClick={() => scrollToRound(owner2R2Ref)}
                              />
                            );
                          })()
                        )}
                      </div>
                    </div>
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
              <div className="flex flex-col" style={{ height: `${TOTAL_HEIGHT}px` }}>
                {(completedR32 ? completedR32.slice(8, 16) : owner2Matchups).map((matchup, index) => (
                  <div
                    key={matchup._id || `owner2-${index}`}
                    style={{ height: `${SLOT_HEIGHT}px` }}
                    className="flex items-center"
                  >
                    <div className="relative w-full">
                      <MatchupCard
                        matchup={matchup}
                        status={status}
                        index={index + 8}
                        side="right"
                        slotHeight={SLOT_HEIGHT}
                        voterId={voterId}
                        voteMap={voteMap}
                        viewerRole={viewerRole}
                        ownerPicks={ownerPicks}
                        isLockedIn={isLockedIn}
                        isRoundPublished={completedR32 ? true : isRoundPublished}
                        onVoteSuccess={onVoteSuccess}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function TBDCard({
  side,
  onClick,
  isFinal4 = false,
  isChampionship = false,
  label = '',
  round = 0,
  pmIndex = 0,
  slotHeight = 120,
  connectorSide = null,
}) {
  // connectorSide overrides side for connector direction only
  const effectiveConnectorSide = connectorSide ?? side;
  const isLeftSide = effectiveConnectorSide === 'left';
  const connectorPos    = isLeftSide ? 'left-full' : 'right-full';
  const connectorBorder = isLeftSide ? 'border-r-2' : 'border-l-2';

  const cardClasses = isFinal4
    ? 'bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 rounded-lg border-2 border-indigo-300 dark:border-indigo-700 overflow-hidden opacity-90 hover:opacity-100 hover:shadow-lg transition-all cursor-pointer'
    : isChampionship
      ? 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/40 dark:to-amber-950/40 rounded-lg border-2 border-yellow-400 dark:border-yellow-700 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer'
      : 'bg-white dark:bg-gray-900 rounded border border-dashed border-gray-300 dark:border-gray-700 overflow-hidden opacity-60 hover:opacity-80 transition-opacity cursor-pointer';

  return (
    <div className="relative">
      {/* Connector lines toward the next round — only for non-terminal cards */}
      {round < 4 && !isFinal4 && !isChampionship && (
        <>
          {/*
            Horizontal stub pointing to the next round.
            - round 1 (R32→S16): only a stub, no L-shape — render always.
            - round 2 (S16→E8): the L-shape below has border-t-2/border-b-2 that already
              draws the horizontal segment, so we suppress the stub here to avoid doubling.
            - round 3 (E8→F4): straight stub only (no L-shape) — render always.
          */}
          {round !== 2 && (
            <div className={`absolute ${connectorPos} top-1/2 w-8 h-0.5 bg-gray-300 hidden xl:block`} />
          )}

          {/*
            Vertical L-shape connectors: only for Sweet 16 → Elite 8 (round 2).
            Elite 8 → Final 4 (round 3) uses a straight stub because each Elite 8 card
            feeds a different Final 4 cell — they are not bracket-paired with each other.
          */}
          {round === 2 && pmIndex % 2 === 0 && (
            <div className={`absolute ${connectorPos} top-1/2 hidden xl:block`}>
              <div
                className={`w-8 ${connectorBorder} border-t-2 border-gray-300`}
                style={{ height: `${slotHeight / 2}px` }}
              />
            </div>
          )}
          {round === 2 && pmIndex % 2 === 1 && (
            <div className={`absolute ${connectorPos} bottom-1/2 hidden xl:block`}>
              <div
                className={`w-8 ${connectorBorder} border-b-2 border-gray-300`}
                style={{ height: `${slotHeight / 2}px` }}
              />
            </div>
          )}
        </>
      )}
      {isFinal4 && label && (
        <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 text-center">{label}</div>
      )}
      {isChampionship && (
        <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 text-center">Division 1 vs Division 2</div>
      )}
      <div className={cardClasses} onClick={onClick}>
        {[1, 2].map(n => (
          <div
            key={n}
            className={`flex items-center justify-between px-3 py-2 ${n === 1 ? 'border-b border-gray-200' : ''} ${isFinal4 ? (n === 1 ? 'bg-white/50 dark:bg-white/5' : 'bg-white/30 dark:bg-white/5') : ''}`}
          >
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className={`${isFinal4 || isChampionship ? 'text-xs' : 'text-[10px]'} font-bold text-gray-400 w-5 text-center`}>-</span>
              <span className={`${isFinal4 || isChampionship ? 'text-sm' : 'text-xs'} text-gray-400 italic truncate`}>
                {isChampionship ? `Finalist ${n}` : 'TBD'}
              </span>
            </div>
            <span className={`${isFinal4 || isChampionship ? 'text-xs' : 'text-[10px]'} text-gray-400`}>-</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlaceholderMatchup({
  round, matchup1, matchup2, matchup3, matchup4,
  status, side = 'left', connectorSide, onClick,
  isFinal4 = false, isChampionship = false, label = '',
  prediction = null, nameMap = {}, isOwner = false,
  pmIndex = 0, slotHeight = 120,
}) {
  // connectorSide overrides side for connector direction only — lets the right-side
  // Elite 8 column route connectors leftward toward the Final 4 column.
  const effectiveConnectorSide = connectorSide ?? side;
  const isLeftSide = effectiveConnectorSide === 'left';
  const connectorPos = isLeftSide ? 'left-full' : 'right-full';
  const connectorBorder = isLeftSide ? 'border-r-2' : 'border-l-2';

  const guestName1 = prediction?.guestName1Id ? nameMap[prediction.guestName1Id]?.value : null;
  const guestName2 = prediction?.guestName2Id ? nameMap[prediction.guestName2Id]?.value : null;

  // If no guest predictions yet, render the TBD fallback — pass connector props through
  // so TBDCard can draw the same L-shape bracket connectors as the prediction path.
  if (!guestName1 && !guestName2) {
    return (
      <TBDCard
        side={effectiveConnectorSide}
        onClick={onClick}
        isFinal4={isFinal4}
        isChampionship={isChampionship}
        label={label}
        round={round}
        pmIndex={pmIndex}
        slotHeight={slotHeight}
        connectorSide={connectorSide}
      />
    );
  }

  // Correctness state
  const name1Correct = prediction?.name1Correct; // true | false | null
  const name2Correct = prediction?.name2Correct;
  const name1Wrong   = name1Correct === false;
  const name2Wrong   = name2Correct === false;

  const officialName1 = prediction?.officialName1Id ? nameMap[prediction.officialName1Id]?.value : null;
  const officialName2 = prediction?.officialName2Id ? nameMap[prediction.officialName2Id]?.value : null;

  return (
    <div className="relative">
      {round < 4 && !isFinal4 && !isChampionship && (
        <>
          {/*
            Horizontal stub pointing to the next round.
            - round 1 (R32→S16): only a stub, no L-shape — render always.
            - round 2 (S16→E8): suppressed here because the L-shape below already draws
              the horizontal segment via border-t-2/border-b-2, preventing double-bold lines.
            - round 3 (E8→F4): rendered as a straight horizontal stub; no L-shape for this round
              because each Elite 8 card feeds a different Final 4 cell independently.
          */}
          {round !== 2 && (
            <div className={`absolute ${connectorPos} top-1/2 w-8 h-0.5 bg-gray-300 hidden xl:block`} />
          )}

          {/*
            L-shape bracket connectors: Sweet 16 → Elite 8 only (round 2).
            Elite 8 → Final 4 (round 3) does NOT use L-shapes because each Elite 8 card
            feeds a different Final 4 cell — they are not bracket-paired with each other.
          */}
          {round === 2 && pmIndex % 2 === 0 && (
            <div className={`absolute ${connectorPos} top-1/2 hidden xl:block`}>
              <div
                className={`w-8 ${connectorBorder} border-t-2 border-gray-300`}
                style={{ height: `${slotHeight / 2}px` }}
              />
            </div>
          )}
          {round === 2 && pmIndex % 2 === 1 && (
            <div className={`absolute ${connectorPos} bottom-1/2 hidden xl:block`}>
              <div
                className={`w-8 ${connectorBorder} border-b-2 border-gray-300`}
                style={{ height: `${slotHeight / 2}px` }}
              />
            </div>
          )}
        </>
      )}
      {isFinal4 && label && (
        <div className="text-xs font-semibold text-gray-600 mb-2 text-center">{label}</div>
      )}
      <div
        className={`bg-white dark:bg-gray-900 rounded-lg border shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${
          (name1Wrong || name2Wrong)
            ? 'border-red-300 dark:border-red-600'
            : isFinal4 ? 'border-2 border-indigo-300'
            : isChampionship ? 'border-2 border-yellow-400'
            : 'border-gray-200 dark:border-gray-700'
        }`}
        onClick={onClick}
      >
        {/* Name 1 prediction row */}
        {name1Wrong && officialName1 && (
          <div className="text-[9px] text-green-600 font-semibold px-2.5 pt-1">
            Actual: {officialName1}
          </div>
        )}
        <div className={`flex items-center px-2.5 py-2 border-b border-gray-200 dark:border-gray-700 ${
          name1Correct === true ? 'bg-green-500/15' : ''
        }`}>
          {name1Correct === true && <span className="text-xs mr-1 text-green-600">✓</span>}
          <span className={`text-sm font-medium truncate ${
            name1Wrong       ? 'line-through text-red-400 dark:text-red-500'
            : name1Correct === true ? 'text-green-700 dark:text-green-400 font-bold'
            : 'text-gray-600 dark:text-gray-300 italic'
          }`}>
            {guestName1 || 'TBD'}
          </span>
        </div>

        {/* Name 2 prediction row */}
        {name2Wrong && officialName2 && (
          <div className="text-[9px] text-green-600 font-semibold px-2.5 pt-1">
            Actual: {officialName2}
          </div>
        )}
        <div className={`flex items-center px-2.5 py-2 ${
          name2Correct === true ? 'bg-green-500/15' : ''
        }`}>
          {name2Correct === true && <span className="text-xs mr-1 text-green-600">✓</span>}
          <span className={`text-sm font-medium truncate ${
            name2Wrong       ? 'line-through text-red-400 dark:text-red-500'
            : name2Correct === true ? 'text-green-700 dark:text-green-400 font-bold'
            : 'text-gray-600 dark:text-gray-300 italic'
          }`}>
            {guestName2 || 'TBD'}
          </span>
        </div>
      </div>
    </div>
  );
}

