/**
 * Compute what a guest predicted would appear in each future round slot,
 * and whether those predictions match the official results.
 *
 * @param {Object} bracketMatchups - bracket.matchups (all rounds from API)
 * @param {Object} voteMap         - { [matchupId]: selectedNameId }
 * @param {string[]} publishedRounds - rounds admin has published
 * @returns {Object} { roundOf16, elite8, final4, championship } arrays of prediction objects
 *
 * Each prediction object:
 * {
 *   slotIndex: number,
 *   guestName1Id: string|null,   // UUID guest predicted for name1 slot
 *   guestName2Id: string|null,   // UUID guest predicted for name2 slot
 *   officialName1Id: string|null, // official name1 from bracketMatchups (if round advanced)
 *   officialName2Id: string|null, // official name2 from bracketMatchups (if round advanced)
 *   name1Correct: boolean|null,  // null = not yet determinable
 *   name2Correct: boolean|null,
 *   officialMatchupId: string|null, // for voting in future rounds once active
 * }
 */
export function computeGuestPredictions(bracketMatchups, voteMap, publishedRounds) {
  const r32 = bracketMatchups?.roundOf32 || [];
  const r16Official = bracketMatchups?.roundOf16 || [];
  const elite8Official = bracketMatchups?.elite8 || [];
  const final4Official = bracketMatchups?.final4 || [];
  const champOfficial = bracketMatchups?.championship || [];

  const r16Published = publishedRounds.includes('roundOf32');
  const e8Published  = publishedRounds.includes('roundOf16');
  const f4Published  = publishedRounds.includes('elite8');
  const cPublished   = publishedRounds.includes('final4');

  // Helper: get guest's pick from a matchup
  const guestPick = (matchup) => {
    if (!matchup) return null;
    return voteMap[matchup.id || matchup._id] || null;
  };

  // Helper: build prediction for a slot
  const buildPrediction = (slotIndex, srcM1, srcM2, officialMatchup, isPublished) => {
    const g1 = guestPick(srcM1);
    const g2 = guestPick(srcM2);
    const o1 = officialMatchup?.name1Id || null;
    const o2 = officialMatchup?.name2Id || null;
    return {
      slotIndex,
      guestName1Id: g1,
      guestName2Id: g2,
      officialName1Id: o1,
      officialName2Id: o2,
      // Only flag correct/wrong once the source round is published
      name1Correct: (isPublished && g1 && o1) ? g1 === o1 : null,
      name2Correct: (isPublished && g2 && o2) ? g2 === o2 : null,
      officialMatchupId: officialMatchup?.id || null,
    };
  };

  // Round 16 (8 slots): pairs of Round 32 matchups
  const roundOf16 = [];
  for (let i = 0; i < r32.length; i += 2) {
    roundOf16.push(buildPrediction(
      i / 2, r32[i], r32[i + 1],
      r16Official[i / 2] || null, r16Published
    ));
  }

  // Elite 8 (4 slots): pairs of Round 16 matchups
  const elite8 = [];
  for (let i = 0; i < Math.max(r16Official.length, 8); i += 2) {
    // Source matchups are the Round 16 official matchups (once they exist)
    // Before Round 16 is played, we can't predict Elite 8
    const srcM1 = r16Official[i] || null;
    const srcM2 = r16Official[i + 1] || null;
    elite8.push(buildPrediction(
      i / 2, srcM1, srcM2,
      elite8Official[i / 2] || null, e8Published
    ));
  }

  // Final 4 (2 slots): pairs of Elite 8 matchups
  const final4 = [];
  for (let i = 0; i < Math.max(elite8Official.length, 4); i += 2) {
    const srcM1 = elite8Official[i] || null;
    const srcM2 = elite8Official[i + 1] || null;
    final4.push(buildPrediction(
      i / 2, srcM1, srcM2,
      final4Official[i / 2] || null, f4Published
    ));
  }

  // Championship (1 slot)
  const championship = final4Official.length >= 2
    ? [buildPrediction(0, final4Official[0], final4Official[1], champOfficial[0] || null, cPublished)]
    : [];

  return { roundOf16, elite8, final4, championship };
}
