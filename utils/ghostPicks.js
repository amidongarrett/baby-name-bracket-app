/**
 * computeGhostPicks
 *
 * For a locked-in bracket, derives which future matchup slots should display
 * a "ghost pick" — the eliminated name a user predicted to appear there.
 *
 * @param {object} bracketMatchups - raw API matchups: { roundOf32, roundOf16, elite8, final4, championship }
 * @param {object} userPicks       - user's picks map: { roundOf32: [], roundOf16: [], elite8: [], final4: [], championship: [] }
 * @param {object} nameMap         - nameId → { value } display map
 *
 * @returns {object} ghostsByMatchup — { [roundKey]: { [matchupIndex]: { name1Ghost?: string, name2Ghost?: string } } }
 */
export function computeGhostPicks(bracketMatchups, userPicks, nameMap) {
  const ghostsByMatchup = {};

  const ROUND_SEQUENCE = ['roundOf32', 'roundOf16', 'elite8', 'final4'];
  const NEXT_ROUND = {
    roundOf32:  'roundOf16',
    roundOf16:  'elite8',
    elite8:     'final4',
    final4:     'championship',
  };

  for (const roundKey of ROUND_SEQUENCE) {
    const rawMatchups = bracketMatchups[roundKey];
    if (!rawMatchups || rawMatchups.length === 0) continue;

    const nextRoundKey = NEXT_ROUND[roundKey];
    if (!nextRoundKey) continue;

    for (let i = 0; i < rawMatchups.length; i++) {
      const m = rawMatchups[i];
      if (!m || !m.winnerId) continue; // round not decided yet — skip

      const pickedNameId = userPicks[roundKey]?.[i];
      if (!pickedNameId) continue; // user made no pick here

      if (pickedNameId === m.winnerId) continue; // pick was correct — no ghost

      // Pick was eliminated — inject ghost into the next round
      let nextMatchupIndex;
      let nextSlot;

      if (roundKey === 'elite8') {
        // E8[0] → F4[0].name1,  E8[1] → F4[1].name1
        // E8[2] → F4[0].name2,  E8[3] → F4[1].name2
        nextMatchupIndex = i % 2;
        nextSlot = i < 2 ? 'name1Ghost' : 'name2Ghost';
      } else if (roundKey === 'final4') {
        // F4[0] → Champ[0].name1,  F4[1] → Champ[0].name2
        nextMatchupIndex = 0;
        nextSlot = i === 0 ? 'name1Ghost' : 'name2Ghost';
      } else {
        // roundOf32 → roundOf16, and roundOf16 → elite8: standard halving
        nextMatchupIndex = Math.floor(i / 2);
        nextSlot = i % 2 === 0 ? 'name1Ghost' : 'name2Ghost';
      }

      const ghostValue = nameMap[pickedNameId]?.value;
      if (!ghostValue) continue;

      if (!ghostsByMatchup[nextRoundKey]) ghostsByMatchup[nextRoundKey] = {};
      if (!ghostsByMatchup[nextRoundKey][nextMatchupIndex]) ghostsByMatchup[nextRoundKey][nextMatchupIndex] = {};
      ghostsByMatchup[nextRoundKey][nextMatchupIndex][nextSlot] = ghostValue;
    }
  }

  return ghostsByMatchup;
}
