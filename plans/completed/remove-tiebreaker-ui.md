# Remove Tiebreaker UI

## Feature goal
Remove the championship vote-percentage tiebreaker input from the bracket visualization so the lock-in flow is no longer blocked by it.

## Scope
- Remove the percentage input that appears below the Championship card when a championship pick is made.
- Remove the amber "Enter your championship % prediction to lock in" hint message.
- Restore the lock-in button gating to depend only on all 31 picks being filled (no tiebreaker requirement).
- Remove the `tiebreakerPrediction` / `onTiebreakerChange` prop threading from the page layer down to the canvas component.
- Backend tiebreaker endpoint and model field are left in place (no backend changes needed).

## Affected surfaces
- Frontend only: `components/bracket/BracketView.jsx` (canvas) and `components/pages/BracketView.jsx` (page).

## Data & contracts
No contract changes. Backend `POST /api/bracket/:id/my-bracket/tiebreaker` and `UserBracket.tiebreakerPrediction` remain but are simply unused by the UI.

## Dependencies & ordering
No ordering constraints.

## Acceptance criteria
- After making all 31 picks (including championship), the "Lock In My Bracket" button appears immediately with no percentage input or hint message visible.
- The bracket canvas renders cleanly with no tiebreaker-related JSX.

## Implementation Plan

### FILE 1: `baby-name-bracket-app/components/bracket/BracketView.jsx`

1. Remove `tiebreakerPrediction = null` and `onTiebreakerChange = null` from the prop signature.
2. Remove the `tiebreakerSet` variable and revert `allPicksFilled` to its prior form — `const allPicksFilled = totalFilledPicks === TOTAL_PICKS_REQUIRED` (remove the `&& tiebreakerSet` clause).
3. Remove the tiebreaker `<input>` JSX block (the number input with label "Championship vote % for your pick").
4. Remove the amber hint `<p>` element ("Enter your championship % prediction above to lock in.").

### FILE 2: `baby-name-bracket-app/components/pages/BracketView.jsx`

1. Remove the `tiebreakerPrediction` state declaration.
2. Remove the `handleTiebreakerChange` async function.
3. Remove the `useEffect` that initializes `tiebreakerPrediction` from `userBracket.tiebreakerPrediction`.
4. Remove `tiebreakerPrediction={tiebreakerPrediction}` and `onTiebreakerChange={handleTiebreakerChange}` from the `<BracketView>` JSX.

**Decomposition recommendation:** PURE_FRONTEND

Completed: 2026-05-22. Archived in plans/status-archive.md.
