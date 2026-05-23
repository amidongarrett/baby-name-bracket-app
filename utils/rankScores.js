/**
 * rankEntries — pure function that sorts and assigns rank labels to score entries.
 *
 * Input: raw array from GET /api/bracket/:id/scores
 *   [{ userId, displayName, icon, score, maxPossible }]
 *
 * Output: same entries augmented with:
 *   rank      {number}  1-based ordinal position
 *   rankLabel {string}  "T1" for tied entries, "3" for a plain rank
 *
 * Tie rules:
 *   - Primary sort:   score descending
 *   - Secondary sort: maxPossible descending (within a tie)
 *   - Entries sharing the same score get the same ordinal and a "T" prefix
 *   - The entry after a tied group gets the correct sequential rank
 *     (e.g., two T1s → next is 3)
 */
export function rankEntries(entries) {
  if (!entries || entries.length === 0) return [];

  // Sort: score desc, then maxPossible desc as tiebreaker
  const sorted = [...entries].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.maxPossible - a.maxPossible;
  });

  // Assign rank labels in a single pass
  const result = [];
  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    // The true ordinal is 1-based index
    const ordinal = i + 1;

    // Look ahead/behind to determine if this entry is part of a tie group
    const prevSameScore = i > 0 && sorted[i - 1].score === entry.score;
    const nextSameScore = i < sorted.length - 1 && sorted[i + 1].score === entry.score;
    const isTied = prevSameScore || nextSameScore;

    // Rank ordinal for tied entries is the position of the first in the group
    let rank = ordinal;
    if (prevSameScore) {
      // Backtrack to find the first member of this tie group
      let groupStart = i - 1;
      while (groupStart > 0 && sorted[groupStart - 1].score === entry.score) {
        groupStart--;
      }
      rank = groupStart + 1; // 1-based
    }

    result.push({
      ...entry,
      rank,
      rankLabel: isTied ? `T${rank}` : String(ordinal),
    });
  }

  return result;
}
