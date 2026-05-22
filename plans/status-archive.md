## 📊 Baby Name Bracket Championship - Completed Features Archive

---

## 2026-05-22 — remove-tiebreaker-ui

SHIPPED. Removed the championship vote-percentage tiebreaker input from the bracket visualization canvas so the lock-in flow is no longer blocked by it. The percentage input below the Championship card, the amber "Enter your championship % prediction to lock in" hint message, and the `tiebreakerSet` guard on `allPicksFilled` were all deleted from `BracketView.jsx`. The lock-in button now gates solely on all 31 picks being filled. The `tiebreakerPrediction` state, `handleTiebreakerChange` async function, and the `useEffect` that initialized tiebreaker state from `userBracket.tiebreakerPrediction` were removed from the page-level `BracketView.jsx`, along with the two props that threaded those values down to the canvas component. The backend tiebreaker endpoint and `UserBracket.tiebreakerPrediction` field remain in place but are no longer used by the UI.

Files changed:
- `baby-name-bracket-app/components/bracket/BracketView.jsx` — removed `tiebreakerPrediction`/`onTiebreakerChange` from prop signature; removed `tiebreakerSet` variable; reverted `allPicksFilled` to `totalFilledPicks === TOTAL_PICKS_REQUIRED`; removed tiebreaker `<input>` JSX block and amber hint `<p>` element
- `baby-name-bracket-app/components/pages/BracketView.jsx` — removed `tiebreakerPrediction` state; removed `handleTiebreakerChange` function; removed tiebreaker-init `useEffect`; removed `tiebreakerPrediction` and `onTiebreakerChange` props from `<BracketView>` JSX

Archived at: `plans/completed/remove-tiebreaker-ui.md`

---

## 2026-05-21 — lock-gates-and-realtime-sync

SHIPPED. Added lock-gate guards to the "Lock In My Names" and "Lock In My Bracket" buttons, and added background polling on all bracket pages so connected clients stay in sync without manual refreshes. The "Lock In My Names" button for each owner is now disabled (with a tooltip counting remaining names) until exactly 16 active names are present, changing the condition from `length === 0` to `length < MAX_NAMES`. The "Lock In My Bracket" button in both the bracket canvas (`BracketView.jsx`) and the list view (`BracketListView.jsx`) is now rendered as a visually disabled button with helper text when the user has not completed all picks in the current round, replacing the previous behavior of hiding the button entirely. The names page gains a 5-second polling `useEffect` (active only in draft status) that re-fetches bracket state so each owner sees the other's additions within ~5 seconds. The bracket view page gains a 9-second polling `useEffect` (active only in active status) that re-fetches bracket, vote tallies, and owner picks in parallel, with a `silent` parameter added to `fetchBracket` to suppress the loading spinner on background polls. All polling integrates the Page Visibility API to pause when the tab is hidden and resume with an immediate fetch when focus returns.

Files changed:
- `components/pages/BracketNames.jsx` — `disabled` condition on both Lock In buttons changed to `length < MAX_NAMES`; `title` tooltip added; 5-second polling `useEffect` added
- `components/bracket/BracketView.jsx` — lock-in button block replaced with disabled-state button showing per-round pick progress; `currentRoundComplete` derived value added
- `components/bracket/BracketListView.jsx` — text-only hint in the not-all-voted branch replaced with a visually disabled "Lock My Bracket" button and pick-count caption
- `components/pages/BracketView.jsx` — `silent` parameter added to `fetchBracket`; 9-second polling `useEffect` added mirroring `BracketPickWinner.jsx`

Archived at: `plans/completed/lock-gates-and-realtime-sync.md`

---

### ✅ **IMPLEMENTED - Backend API**

**Complete Features:**
- [`Bracket.js`](baby-name-bracket-api/models/Bracket.js:1) MongoDB schema with owner1Names, owner2Names, sharedNames arrays
- [`POST /api/names`](baby-name-bracket-api/controllers/bracketController.js:49) - Add name with duplicate detection + **auto-recalculate matchups in draft mode**
- [`GET /api/bracket/current`](baby-name-bracket-api/controllers/bracketController.js:360) - Fetch current bracket (no sessionId required)
- [`GET /api/bracket/preview`](baby-name-bracket-api/controllers/bracketController.js:475) - Generate server-side preview matchups (read-only) + **handles < 32 names with placeholders**
- [`GET /api/bracket/:sessionId`](baby-name-bracket-api/controllers/bracketController.js:220) - Fetch specific bracket by ID
- [`DELETE /api/names/:nameId`](baby-name-bracket-api/controllers/bracketController.js:485) - Remove name with rank recalculation + **auto-recalculate matchups in draft mode** + **handles <32 names with null IDs (schema fixed)** + **database reset script available**
- [`POST /api/bracket/generate`](baby-name-bracket-api/controllers/bracketController.js:563) - Generate Round of 32 matchups + **no longer returns 400 for incomplete brackets, uses placeholders**
- [`POST /api/votes/:matchupId`](baby-name-bracket-api/controllers/bracketController.js:643) - Cast vote with duplicate prevention
- [`seedingAlgorithm.js`](baby-name-bracket-api/utils/seedingAlgorithm.js:1) - March Madness seeding (1v32, 2v31, etc.) + **handles < 32 names with null IDs**
- **Duplicate Rule**: Shared names stored in both owner lists (marked `isShared:true`) + sharedNames array
- **Vote Tracking**: Guest voters tracked by localStorage voterId, duplicate votes blocked per matchup
- **Auto-Recalculation**: Matchups automatically recalculate when names are added/removed in draft mode
- **Placeholder Support**: Empty slots show "TBD - Waiting for name submission" until all 32 names are added

### ✅ **IMPLEMENTED - Frontend**

**Name Submission Dashboard** ([`/bracket`](baby-name-bracket-app/app/bracket/page.js:1)):
- Three-column layout (Owner 1, Shared Favorites, Owner 2)
- Real-time duplicate validation
- API connection status indicator
- 16-name limit enforcement
- Remove button with auto-recalculation
- **Data fetching from `/api/bracket/current`** - Fixed: Changed from `data.names.owner1` to `data.owner1Names` to match API response structure
- **Lock-in functionality** - Each owner can independently lock their name submissions
  - "Lock In My Names" button for each owner (disabled when no names added)
  - Input forms disabled after owner locks in
  - Remove buttons hidden after owner locks in
  - Visual confirmation with checkmark and status message
  - Waiting indicator shows which owner still needs to lock in
  - Celebration banner appears when both owners lock in
  - Bracket status changes from 'draft' to 'active' when both lock in
  - Calls `POST /api/bracket/lock-in` endpoint (backend implementation needed)

**Tournament Bracket** ([`/tournament`](baby-name-bracket-app/app/tournament/page.js:1)):
- **Server-side preview matchups** - Fetches preview from `GET /api/bracket/preview` endpoint
- **Client-side fallback preview** - Generates March Madness seeded matchups (1v32, 2v31, etc.) from submitted names when backend preview unavailable
- Generate Bracket button (enabled at 32 names)
- Status badges (Draft/Active)
- **Guest voter ID generation** - Auto-generates unique voterId and stores in localStorage
- **Live vote tracking** - Real-time vote count updates after each vote
- **Shows actual submitted names** - Displays real names in preview matchups, not TBD placeholders

**Bracket Visualization** ([`BracketView.jsx`](baby-name-bracket-app/components/bracket/BracketView.jsx:1)):
- Traditional March Madness horizontal layout
- **Click-and-hold drag-to-scroll**
- Quick navigation buttons
- Desktop + mobile responsive views
- Connecting lines between rounds
- **Interactive voting buttons** - Vote buttons for each name in active matchups
- **Live progress bars** - Animated vote percentage visualization
- **Vote submission** - POST requests to `/api/votes/:matchupId` endpoint

---

### ✅ **IMPLEMENTED - Per-Owner Lock-In** *(2026-05-16, commit `14d2a7d`)*

**POST /api/bracket/lock-in** — Fixed 404; frontend `app/bracket/page.js` calls this with `{ owner: "Owner 1" | "Owner 2" }`.

- [`Bracket.js`](baby-name-bracket-api/models/Bracket.js) — Added `owner1LockedIn: Boolean (default: false)` and `owner2LockedIn: Boolean (default: false)` after the `status` field
- [`lockInOwner()`](baby-name-bracket-api/controllers/bracketController.js) — New controller function:
  - Validates owner is `"Owner 1"` or `"Owner 2"`
  - Sets the corresponding lock-in flag on the draft bracket
  - If both flags are `true` AND `totalNames === 32`: generates `previewMatchups` if absent, copies them to `matchups.roundOf32`, sets `status → 'active'`, `currentRound → 'Round of 32'`
  - Returns `{ owner1LockedIn, owner2LockedIn, status }`
- [`getCurrentBracket()`](baby-name-bracket-api/controllers/bracketController.js) — Updated response to include `owner1LockedIn` and `owner2LockedIn`
- [`bracketRoutes.js`](baby-name-bracket-api/routes/bracketRoutes.js) — Registered `router.post('/bracket/lock-in', lockInOwner)`

---

### ✅ **IMPLEMENTED - Auto-Preview Architecture** *(2026-05-16)*

Replaced client-side matchup generation with server-side preview; bracket activation via lock flow.

**Backend Changes:**
1. Added `previewMatchups` field to [`Bracket.js`](baby-name-bracket-api/models/Bracket.js:157) schema (MatchupSchema array)
2. Modified [`addName()`](baby-name-bracket-api/controllers/bracketController.js:148): auto-generates `previewMatchups` when total = 32; clears when < 32
3. Modified [`deleteName()`](baby-name-bracket-api/controllers/bracketController.js:541): same auto-recalculate logic on deletion
4. Created [`lockBracket()`](baby-name-bracket-api/controllers/bracketController.js:644): copies `previewMatchups → matchups.roundOf32`, sets `status → 'active'`
5. Added `POST /api/bracket/lock` route in [`bracketRoutes.js`](baby-name-bracket-api/routes/bracketRoutes.js:133)
6. Kept `POST /api/bracket/generate` for backward compatibility

**Frontend Changes:** *(commit `2ae8514`)*
1. Removed client-side `generateDraftMatchupGrid()` function
2. Added `fetchPreviewMatchups()` calling `GET /api/bracket/preview`
3. Added `useEffect` to fetch preview when status = 'draft'
4. Updated matchupGrid to use `previewMatchups` state
5. Updated UI messaging to indicate "Server-Side Preview"
6. Added graceful fallback when preview endpoint unavailable
7. Migrated `app/bracket/page.js` to full API-driven add/delete/lock-in flows
8. Created `app/tournament/page.js` — tournament view with draft preview & voting controls
9. Created `components/bracket/BracketView.jsx` — full March Madness bracket component
10. Created `utils/api.js` — `lockTournamentBracket()` + `advanceTournamentRound()` utilities
11. Replaced `next.config.ts` with `next.config.mjs` (ESM + Turbopack root config)
12. Added `jsconfig.json` with `@/*` path alias

---

### ✅ **IMPLEMENTED - Layout, Navigation & Pick Winner Flow** *(2026-05-16, commit `6c733b0`)*

- Home page (`/`) is now the full tournament bracket view (previously a landing page)
- `app/tournament/page.js` → server-side redirect to `/` for backward compatibility
- **Navbar rewritten** (`components/layout/Navbar.jsx`):
  - Left: 🏆 "Baby Name Bracket" brand link
  - Right: "Admin" hamburger button → dropdown "Parent Controls" panel
    - 📝 **Names** → `/bracket`
    - 🏅 **Pick Winner of Round** → `/pick-winner`
  - Active-route dot indicator; click-outside closes dropdown
- **New page: `/pick-winner`** (`app/pick-winner/page.js`):
  - Owner selector (👨 Husband / 👩 Wife) — must select role before picks register
  - Each of 16 matchups shows name options with live vote counts + percentage bars
  - Clicking an option records that owner's pick; badges show which parent picked which name
  - Card border: 🟢 green = agreed, 🟠 orange = disagreed, ⬜ gray = unpicked/partial
  - "Confirm & Advance" CTA enabled only when all 16 matchups have consensus
  - Calls `POST /api/bracket/advance`, clears `localStorage` picks, refreshes bracket
  - Picks persisted in `localStorage` ('parentPicks') across page refreshes
- "Go to Tournament Bracket" link in `/bracket` updated from `/tournament` → `/`
- `app/layout.js` metadata updated to "Baby Name Bracket Championship"

---

### ✅ **IMPLEMENTED - Tournament Progression (Backend + Frontend hookup)** *(2026-05-16)*

- [`bracketProgression.js`](baby-name-bracket-api/utils/bracketProgression.js) — winner determination logic
- [`POST /api/bracket/advance`](baby-name-bracket-api/routes/bracketRoutes.js:164) — round advancement endpoint
- [`advanceRound()`](baby-name-bracket-api/controllers/bracketController.js:948) — backend controller
- [`advanceTournamentRound()`](baby-name-bracket-app/utils/api.js:37) — frontend API utility
- Frontend UI wired via Pick Winner page (see above); "Advance to Next Round" button also present on home bracket view for active brackets

---

### ✅ **IMPLEMENTED - Rank display fix + Winner/Loser highlighting** *(2026-05-16, commit `920b877`)*

**Rank bug fixed**: `normalizeMatchup()` in `app/page.js` converts every matchup format (client-preview objects, server-preview MatchupSchema, active MatchupSchema, placeholders) to a consistent flat shape before `BracketView`. Seed resolution tries: stored `seed1`, nested `name1.seed`, `SEED_PAIRS[i]` (hardcoded March Madness bracket order), then index fallback. `MatchupCard` and `MobileMatchupCard` simplified to read flat fields — no more status-branching. `PlaceholderMatchup.getName` simplified.

**Winner/loser highlighting added**:
- When `matchup.winnerId` is set (after round advances): winner row = 🏆 + green bg + bold green text; loser row = grey bg + dimmed text + vote bars faded to 40%; vote buttons hidden
- When no `winnerId` but votes differ: leading name gets subtle green tint
- Applied in both desktop `MatchupCard` and mobile `MobileMatchupCard`

---

### ✅ **IMPLEMENTED - Vote Button State (already-voted detection)** *(2026-05-16, commit `badba6d`)*

- `app/page.js`: on page load, calls `GET /api/votes/user/:voterId` after reading `voterId` from localStorage; stores `votedMatchupIds[]` in state
- After each successful vote, both `fetchBracket()` and `fetchVotedMatchups()` are called together so counts and button state stay in sync
- `BracketView` receives `votedMatchupIds` prop (default `[]`), threads it to every `MatchupCard` and `MobileMatchupCard`
- Each card computes `hasVoted = votedMatchupIds.includes(matchupId)`:
  - `true` → both name-row Vote buttons replaced with green "✓ Voted" chip (doesn't reveal which name was chosen)
  - `false` → Vote buttons behave as normal (blue/purple, disabled while submitting)
- Backend context: `GET /api/votes/user/:voterId` returns `{ votedMatchupIds: string[] }`; voting 404 fixed by matching `m.id || m._id.toString()`

---

### ✅ **IMPLEMENTED - Matchup Name Resolution Fix** *(2026-05-16, commit `1b201ec`)*

Backend `roundOf32` matchups store `name1Id`/`name2Id` UUIDs; `BracketView` expected plain strings. Fixed in `app/page.js` (and previously `app/tournament/page.js`): builds a `nameMap` from all owner/shared names, enriches each matchup with `name1`, `name2`, `name1Submitter`, `name2Submitter`, `seed1`, `seed2` before passing to `BracketView`.

---

### ✅ **IMPLEMENTED - Backend Repo Pushed to GitHub** *(2026-05-16, commit `14d2a7d`)*

- **URL**: https://github.com/amidongarrett/baby-name-bracket-api
- Full backend source committed for the first time: `server.js`, `config/database.js`, `models/Bracket.js`, `controllers/bracketController.js`, `routes/bracketRoutes.js`, `utils/seedingAlgorithm.js`, `utils/bracketProgression.js`, `scripts/resetDatabase.js`
- `package.json` updated with `start`/`dev` scripts and `uuid` dependency

---

### ✅ **IMPLEMENTED - Matchup Vote State UI** *(2026-05-17)*

Inline voted-state UI on matchup cards: chosen name shows "✓ Picked" badge, unchosen name shows gray "Change" button to switch vote. Implemented as a 3-way branch on each name row (`votedForName1` / `votedForName2` / neither), guarded by `canVote`. The null-safe guard (`name1Id != null`) prevents TBD slots from falsely matching. Applied identically in both `MatchupCard` (desktop) and `MobileMatchupCard` (mobile).

**File modified:**
- `baby-name-bracket-app/components/bracket/BracketView.jsx` (MatchupCard ~line 825, MobileMatchupCard ~line 1260)

**Data flow:** `voteMap` (`{ [matchupId]: selectedNameId }`) is fetched from `GET /api/votes/user/:voterId`, held in `page.js` state, and passed as a prop through `BracketView` to each card. No new API endpoints were added.

---

---

### ✅ **IMPLEMENTED - V2 Batch (2026-05-17)**

#### Bug Fix — Bracket UI (Final 4 alignment, Elite 8 voting, Change/Vote button correctness) — 2026-05-17

**File modified:**
- `baby-name-bracket-app/components/bracket/BracketView.jsx`

**Bug 1 — Right-side Final 4 connector alignment:**
- Added `connectorSide` prop to `PlaceholderMatchup` and `TBDCard`. When set, it overrides `side` for connector anchor direction only, leaving all other rendering unchanged.
- Right-side Elite 8 (Div2) `PlaceholderMatchup` calls now pass `connectorSide="left"` so horizontal and L-shape connectors emerge from the left edge of the card, pointing toward the Final 4 column.

**Bug 2 — Guests unable to vote in Elite 8:**
- Left E8 (Div1) and right E8 (Div2) columns now conditionally render a live `MatchupCard` (with `isLockedIn={isE8Locked}` and `isRoundPublished={isE8Published}`) when `bracketMatchups.elite8?.[i]` exists and the active matchup is defined, mirroring the Sweet 16 pattern.
- When elite8 is the active round, `matchupGrid` holds 4 entries: Div1 matchups at indices 0–1, Div2 at 2–3.

**Bug 3 — Change/Vote buttons on wrong rows:**
- `votedForName1` and `votedForName2` now include a non-null guard on the name ID: `name1Id != null && userVotedNameId === name1Id`. This prevents `null === null = true` when a matchup has unresolved name IDs, which caused both rows to show "Picked + Change" simultaneously.
- Fix applied in both `MatchupCard` and `MobileMatchupCard`.

---

#### Bug Fix — Guest change-vote affordance, Sweet 16 live voting, Elite 8 connector lines — 2026-05-17

**File modified:**
- `baby-name-bracket-app/components/bracket/BracketView.jsx`

**Bug 1 — Guest can change vote from Picked row (MatchupCard + MobileMatchupCard):**
- When `votedForName1 && canVote`, the "✓ Picked" badge on name 1's row is now accompanied by a gray "Change" button that calls `handleVote(name2Id)` (switching to the other name).
- Same pattern applied symmetrically for `votedForName2`: Change button calls `handleVote(name1Id)`.
- Mirrored identically in `MobileMatchupCard`.

**Bug 2 — Sweet 16 renders live MatchupCard when activeRoundKey === 'roundOf16':**
- Sweet 16 — Owner 1 column (Division 1): when `activeRoundKey === 'roundOf16'`, each slot now renders two stacked `MatchupCard` components (matchup1 + matchup2) with full props instead of a `PlaceholderMatchup`.
- Sweet 16 — Division 2 column: same conditional rendering applied with `side="right"`.

**Bug 3 — Elite 8 → Final 4 vertical L-shape connector lines:**
- Added `round === 3 && pmIndex % 2 === 0` top connector and `round === 3 && pmIndex % 2 === 1` bottom connector inside `PlaceholderMatchup`, mirroring the existing `round === 2` logic.

---

#### Bug Fix — Owner "Picked" bleed-through from guest votes + Owner conflict/agreement UI — 2026-05-17
- `BracketView.jsx` (MatchupCard + MobileMatchupCard): owners now source `userVotedNameId` from `ownerPicks` (role-keyed), not `voteMap`
- `canVote` updated: owners can always re-vote until winner is set (`isOwner ? true : !isLockedIn`)
- `guestWrongOnName1/2` guarded with `!isOwner` so owners never get wrong-pick styling
- `bracketController.js` (`castVote`): owner vote dedup changed to `role + matchup.id` (not `voterId + matchupId`) so both owners can vote independently on same device
- Auto-winner logic added in BOTH "update" and "new vote" branches: if both owners agree → `matchup.winnerId` set; if conflict → `null`
- `AdminPanel.jsx`: accepts `ownerPicks` prop; each matchup row shows owner badge indicators (👨/👩), agreement/conflict status text, and "Manual Override (if needed)" label above the name pick buttons

#### Bug Fix — Guest Re-Vote — 2026-05-17
- `castVote` backend: replaced 400 "Duplicate vote detected" block with update logic — decrements old tally (clamped to 0), updates `existingVote` record, increments new tally, returns 200
- `canVote` frontend: owners blocked after first vote; guests unblocked until lock-in (`isOwner ? !userVotedNameId : !isLockedIn`)
- Vote buttons show `Change` (not `Vote`) when guest has already voted in a matchup — applied in both `MatchupCard` and `MobileMatchupCard`

#### Bug Fix — Bracket Column Spacing — 2026-05-17
- Added `SLOT_HEIGHT = 130` and `TOTAL_HEIGHT = 1040` constants at top of `BracketView`
- All 6 round columns (R32 L/R, S16 L/R, E8 L/R) replaced `space-y-*`/`mt-*` approach with fixed-height flex slots
- F4 center column uses `marginTop = TOTAL_HEIGHT/2 - 96` to center around bracket midpoint
- `MatchupCard` and `PlaceholderMatchup` accept `slotHeight` prop; vertical connectors use `style={{ height: slotHeight/2 }}` instead of static `h-16`
- `PlaceholderMatchup` gains `pmIndex` prop; S16→E8 vertical L-shape connectors added (round === 2 only)

#### V2 Bug Fixes — Issue 2 & Issue 4B (castVote UUID + resetAndRegenerate endpoint) — 2026-05-17

**Files modified:**
- `baby-name-bracket-api/controllers/bracketController.js`
- `baby-name-bracket-api/routes/bracketRoutes.js`

**Fix 1 — Issue 2 (castVote UUID consistency):**
- In `castVote`, changed `voteRecord.matchupId` from the raw URL param value (`matchupId`) to `matchup.id` (the UUID on the located matchup object).

**Fix 2 — Issue 4B (resetAndRegenerate endpoint):**
- Added `resetAndRegenerate` async controller; clears matchups, votes, guestLockIns, publishedRounds, championNameId; resets status to 'draft', owner lock-in flags to false.
- Guards: if fewer than 32 names, saves draft state and returns 400.
- If 32 names: calls `generateDivisionMatchups(bracket.owner1Names, bracket.owner2Names)`, sets status to 'active', saves and returns success.
- Registered as `router.post('/admin/reset-and-regenerate', resetAndRegenerate)`.

#### Issue 3 Part A — `guestBracket.js` utility — 2026-05-17

**File created:**
- `baby-name-bracket-app/utils/guestBracket.js`

- Exports `computeGuestPredictions(bracketMatchups, voteMap, publishedRounds)`
- Derives guest prediction slots for `roundOf16`, `elite8`, `final4`, `championship` from the guest's `voteMap` and the bracket's official matchup data
- `name1Correct`/`name2Correct` are `null` until the source round is published; `true`/`false` once published

#### V2 Frontend Engineer Tasks (Guest Lock-In, Admin Panel, Wrong Pick Visualization) — 2026-05-17

**Files modified:**
- `baby-name-bracket-app/app/page.js`
- `baby-name-bracket-app/components/bracket/BracketView.jsx`

**File created:**
- `baby-name-bracket-app/components/bracket/AdminPanel.jsx`

**page.js changes:**
- Added `AdminPanel` import; added `lockedRounds` and `publishedRounds` state
- `fetchVotedMatchups` now reads `data.lockedRounds`; `fetchBracket` sets `publishedRounds`
- Added `handleGuestLockIn(round)`, `handleSetWinner(matchupId, winnerId)`, `handlePublishRound(round)` handlers
- Derived `activeRoundKey` from `ROUND_KEY_MAP[bracket?.currentRound]`
- `<AdminPanel>` rendered above `<BracketView>` for owner1/owner2 roles

**BracketView.jsx changes:**
- Updated signature to accept `lockedRounds`, `publishedRounds`, `activeRoundKey`, `onGuestLockIn`
- Derived `isLockedIn`, `isRoundPublished`, `votableMatchups`, `votedCount`, `allVoted`
- Added desktop and mobile Lock-In button below championship card
- Overhauled `MatchupCard` and `MobileMatchupCard`: `showVoteBars` gated by lock-in, `effectiveWinnerId` gated by publish, `guestWrongOnName1/2` with strikethrough + red border + "✓ Actual: [name]" label

**AdminPanel.jsx (new):**
- Collapsible panel (collapsed by default); renders one row per votable matchup with two name-pick buttons
- "Publish Round Results" button disabled until all matchups have `winnerId`; replaced with "✅ Round Published" badge after publish

#### V2 Backend Engineer Tasks (Phase 2 & 3 — Guest Lock-In, Admin Round Publisher) — 2026-05-17

**Files modified:**
- `baby-name-bracket-api/controllers/bracketController.js`
- `baby-name-bracket-api/routes/bracketRoutes.js`

- Updated `lockBracket` and `lockInOwner` to call `generateDivisionMatchups(bracket.owner1Names, bracket.owner2Names)` and write directly to `bracket.matchups.roundOf32`
- Updated `getUserVotes` to return `lockedRounds: string[]`
- Added `guestLockIn` controller (`POST /api/bracket/guest-lock-in`)
- Added `setMatchupWinner` controller (`POST /api/admin/set-winner`)
- Added `publishRound` controller (`POST /api/admin/publish-round`)
- Updated `getCurrentBracket` to include `publishedRounds` in response
- Registered all three new routes in `bracketRoutes.js`

#### V2 Lead Engineer Tasks (Seeding, Progression, Schema) — 2026-05-17

- `seedingAlgorithm.js`: Replaced `SEEDING_PAIRS` / `generateRoundOf32Matchups` / `validateBracketForSeeding` with `generateDivisionMatchups(owner1Names, owner2Names)` — 16 cross-pollinated matchups (Div1: H top-8 vs W bottom-8; Div2: W top-8 vs H bottom-8)
- `bracketProgression.js`: Replaced vote-tally winner logic with pre-set `matchup.winnerId` read; throws if any matchup has no `winnerId`
- `Bracket.js`: Added `guestLockIns` array and `publishedRounds: [String]` fields to `BracketSchema`

#### Voting Logic Overhaul (Role-Aware, Per-Name Voting) — 2026-05-17

**Backend:**
- Added `role` field (`'Owner 1' | 'Owner 2' | null`) to `VoteSchema` in `Bracket.js`
- Updated `castVote()` to extract and store `role` from request body
- Updated `getUserVotes()` to return `voteMap: { [matchupId]: selectedNameId }` alongside `votedMatchupIds`
- Added `getOwnerPicks()` controller returning `{ ownerPicks: { [matchupId]: { owner1NameId, owner2NameId } } }`
- Registered `GET /api/bracket/owner-picks`

**Frontend:**
- Replaced `votedMatchupIds` state with `voteMap: {}` in `app/page.js`
- Added `viewerRole` state with localStorage persistence and role selector UI
- Added `ownerPicks` state and `fetchOwnerPicks()` in `app/page.js`
- Overhauled `MatchupCard` and `MobileMatchupCard`: per-name voted badge, vote % gating, owner vs guest highlights, conflict detection (red border + 👨/👩 icons)

#### POST /api/bracket/reset-round — 2026-05-17
- Added `resetRound` async controller to `bracketController.js`
- Implements full rollback map: Round of 16 → Round of 32, Elite 8 → Round of 16, Final 4 → Elite 8, Championship → Final 4, Completed → Championship (also clears `championNameId`, resets `status = 'active'`)
- Edge case: if `currentRound` is "Round of 32", clears all `roundOf32` winnerId fields and returns
- Registered as `router.post('/bracket/reset-round', resetRound)`

---

### ✅ **IMPLEMENTED - Guest Lockout During Active Owner Vote** *(2026-05-17)*

When any owner has submitted a vote for a matchup, guest users now see a "Matchup in progress" badge in place of Vote/Change buttons for that matchup, while retaining full visibility into submitted vote results (percentage bars, names, picked highlights). Owner users are entirely unaffected. The fix was purely frontend: removing the owner-only guard on `fetchOwnerPicks()` so guests receive `ownerPicks` data, then adding an `ownerHasVoted` derived flag in both `MatchupCard` and `MobileMatchupCard` that conditionally suppresses vote controls and renders the amber badge when any owner pick is present for the matchup.

**Files modified:**
- `baby-name-bracket-app/app/page.js` — removed `viewerRole === 'owner1' || viewerRole === 'owner2'` guard from the `fetchOwnerPicks` useEffect so all roles (including guests) receive owner pick data
- `baby-name-bracket-app/components/bracket/BracketView.jsx` — added `ownerHasVoted` derivation after `isOwner` in both `MatchupCard` (~line 686) and `MobileMatchupCard` (~line 1141); replaced Vote/Change controls with an amber "Matchup in progress" badge for guests when `ownerHasVoted` is true

---

### ✅ **IMPLEMENTED - Bracket View Component Refactor** *(2026-05-17)*

Broke the monolithic `BracketView.jsx` matchup rendering into two standalone, importable components. `NameCard` is a purely presentational leaf component that renders one contestant row (rank, name, vote button, vote bar, winner/loser/conflict highlights). `MatchupCard` is a composed component that owns `isVoting` state and the `handleVote` async fetch, derives all computed booleans, and renders two `NameCard` instances. `BracketView.jsx` was slimmed to a thin orchestration layer by deleting the private `MatchupCard` function block and adding a single import. No visual or behavioral changes were made — all existing call sites, prop signatures, and network logic were preserved exactly.

**Files created:**
- `baby-name-bracket-app/components/bracket/NameCard.jsx`
- `baby-name-bracket-app/components/bracket/MatchupCard.jsx`

**Files modified:**
- `baby-name-bracket-app/components/bracket/BracketView.jsx` — removed private `MatchupCard` function (lines 659–946); added `import MatchupCard from './MatchupCard'`

---

### ✅ **IMPLEMENTED - Dynamic Round Progression + Champion Celebration** *(2026-05-16, commit `2bc766b`)*

**Dynamic round detection:**
- Added `ROUND_KEY_MAP` module-level constant in both `app/page.js` and `app/pick-winner/page.js` mapping display labels → API keys (`'Round of 32' → 'roundOf32'`, etc.)
- `handleAdvanceRound()` in `app/page.js`: reads `bracket.currentRound` to derive the correct round key; no longer hardcoded to `'roundOf32'`
- `handleAdvance()` in `app/pick-winner/page.js`: same dynamic key passed to `POST /api/bracket/advance`
- `rawMatchups` in `app/page.js`: reads from `bracket.matchups[currentRoundKey]` instead of always `roundOf32`; falls back to `'championship'` for completed brackets
- Matchup source in `app/pick-winner/page.js`: shows matchups from `bracket.matchups[currentRoundKey]`
- Pick-winner page header now shows `bracket.currentRound` dynamically
- Home page subtitle replaced hardcoded `'Round of 32'` with `bracket.currentRound`

**Champion celebration screen:**
- Home page (`app/page.js`): golden gradient banner with trophy emoji, large champion name, decorative emoji row — shown when `bracket.championNameId` is set
- Home page status badge: shows `'🏆 Champion Crowned!'` when champion exists
- Pick-winner page (`app/pick-winner/page.js`): full-page champion display with animated trophy, champion name, and "View Final Bracket" link — replaces the pick UI when tournament is complete

---

### IMPLEMENTED - Sweet 16 Guest Voting Fix *(2026-05-17)*

Guests can now see seed/rank numbers and cast votes on Sweet 16 matchups, matching the Round of 32 experience exactly.

Two root causes were diagnosed and fixed. Bug 1: `advanceMatchupWinners` in `bracketProgression.js` created next-round matchup objects with no `seed1`/`seed2` fields; `normalizeMatchup` in `page.js` fell through to positional `SEED_PAIRS` defaults — which are keyed to Round of 32 positions and produced wrong seed numbers for Sweet 16. The fix builds a `seedMap: { [nameId]: seed }` from the just-completed round's matchups before the pairing loop, then writes `seed1`/`seed2` from that map into each new advancement matchup, propagating seeds forward recursively through all subsequent rounds. Bug 2: `MatchupCard` computed `ownerHasVoted = !isOwner && (owner1Pick != null || owner2Pick != null)` across all rounds. In Sweet 16 and later, owner picks are bracket-advancement choices rather than in-round votes competing with guests; every Sweet 16 matchup was therefore flagged as "Matchup in progress", hiding the Vote button from all guests. The fix scopes the guard to `matchup.round === 'Round of 32'` only. To make `matchup.round` available on normalized matchups, `normalizeMatchup` in `page.js` was also updated to pass `round: m.round || null` through to the return object.

**Files changed:**
- `baby-name-bracket-api/utils/bracketProgression.js` — build `seedMap` from current-round matchups; write `seed1`/`seed2` into each new next-round matchup
- `baby-name-bracket-api/models/Bracket.js` — add `seed1: Number` and `seed2: Number` to the matchup sub-schema if absent
- `baby-name-bracket-app/app/page.js` — add `round: m.round || null` to the `normalizeMatchup` return object
- `baby-name-bracket-app/components/bracket/MatchupCard.jsx` — scope `ownerHasVoted` to `matchup.round === 'Round of 32'` only

---

### ✅ **IMPLEMENTED - Pre-Generate Future Round Matchup Stubs** *(2026-05-17)*

At bracket generation time, all five tournament rounds (Round of 32, Sweet 16, Elite 8, Final 4, Championship) are now created as pre-populated matchup stubs using seed-based expected advancement paths. Guests can immediately vote on Sweet 16, Elite 8, Final 4, and Championship matchups the moment the bracket goes live, before any earlier round finishes. When an admin advances a round, the pre-existing next-round stubs are updated in place (name IDs rewritten to reflect actual winners) rather than creating new records, so votes already cast on future-round stubs are preserved. Wrong picks — votes for a seeded name that did not actually advance — display with the same strike-through styling as Round of 32. Round rollback restores only the rolled-back round's stubs to their seeded state, leaving votes on further-future rounds intact. No frontend changes were required: BracketView already renders live MatchupCards whenever `bracketMatchups[roundKey][i]` is a truthy object; pre-populating all round arrays in the database satisfies that condition automatically.

**Files changed:**
- `baby-name-bracket-api/utils/seedingAlgorithm.js` — added `generateAllRoundStubs(owner1Names, owner2Names)` export; added `makeStubMatchup` and `projectNextRound` helpers; updated `makeMatchup` to store `seed1`/`seed2` on R32 matchups
- `baby-name-bracket-api/controllers/bracketController.js` — updated import to include `generateAllRoundStubs`; replaced single `roundOf32` assignment in `lockBracket`, `lockInOwner`, and `resetAndRegenerate` with five-round stub population; updated `resetRound` rollback to restore only the rolled-back round's stubs via `generateAllRoundStubs` rather than clearing to empty
- `baby-name-bracket-api/utils/bracketProgression.js` — `advanceMatchupWinners` now updates `name1Id`/`name2Id` on pre-existing next-round stubs in place instead of clearing and reinserting; falls back to inserting a new object if a stub is missing (guard against data inconsistency)

---

### ✅ **IMPLEMENTED - Unlock Names Admin Action** *(2026-05-17)*

Admins can unlock a bracket that has already been locked back to the name-submission (draft) phase from the admin panel. The feature includes a confirmation modal that warns the owner all collected votes will be permanently erased before proceeding. On confirmation, a new `POST /api/admin/unlock-names` backend endpoint clears all matchup arrays, votes, guest lock-ins, published rounds, and the champion name ID, resets `status` to `'draft'` and `currentRound` to `'Round of 32'`, and clears both owner lock-in flags — while leaving submitted names (owner1Names, owner2Names, sharedNames) untouched. The UI updates reactively via the existing `fetchBracket` flow without a page reload. The "Unlock Names" button is hidden when the bracket is already in draft status.

**Files changed:**
- `baby-name-bracket-api/controllers/bracketController.js` — added `unlockNames` async controller function (after `resetAndRegenerate`); added `unlockNames` to `module.exports`
- `baby-name-bracket-api/routes/bracketRoutes.js` — destructured `unlockNames` from controller import; registered `router.post('/admin/unlock-names', unlockNames)`
- `baby-name-bracket-app/components/bracket/AdminPanel.jsx` — added `showUnlockModal` useState; added "Unlock Names" button (visible when `bracket.status !== 'draft'`) and inline confirmation modal inside the Danger Zone div; added `onUnlockNames` to prop destructuring
- `baby-name-bracket-app/app/page.js` — added `handleUnlockNames` handler (calls `POST /api/admin/unlock-names` then `fetchBracket()`); passed `onUnlockNames={handleUnlockNames}` prop to `AdminPanel`

---

### ✅ **IMPLEMENTED - Future Matchup Placeholder Logic** *(2026-05-17)*

Future-round matchup cards (Sweet 16, Elite 8, etc.) now show "TBD" placeholder labels for any name slot whose feeding previous-round matchup has not yet resolved, and voting is locked until both name slots are confirmed winners. The feature is implemented entirely in the frontend: `BracketView.jsx` derives confirmation booleans by inspecting `winnerId` on the previous-round feeder matchups (R32→S16: feeders at indices `2i` and `2i+1`; R16→E8: same formula using Div-aware global indices) and passes `name1Confirmed`/`name2Confirmed` props to each live `MatchupCard`. `MatchupCard` defaults both props to `true` (preserving existing Round of 32 behavior when the props are absent), overrides the displayed name to `'TBD'` and sets `isPlaceholder` when a slot is unconfirmed, and extends the `canVote` guard to require both confirmations before either vote button activates. `NameCard` requires no changes — it already renders the name prop verbatim and applies `text-gray-400 italic` styling when `isPlaceholder` is true. No backend or API changes were needed; `winnerId` on each matchup is already the source of truth.

**Files changed:**
- `baby-name-bracket-app/components/bracket/BracketView.jsx` — added `name1Confirmed`/`name2Confirmed` derived consts and props at four call sites: Sweet 16 Div1 (~line 245), Sweet 16 Div2 (~line 528), Elite 8 Div1 (~line 304), Elite 8 Div2 (~line 464)
- `baby-name-bracket-app/components/bracket/MatchupCard.jsx` — added `name1Confirmed = true` and `name2Confirmed = true` to prop signature; added confirmation-aware name/placeholder derivation; extended `canVote` with `name1Confirmed && name2Confirmed` guard

---

### IMPLEMENTED - Bracket Layout Visual Fixes *(2026-05-17)*

Placeholder matchup cards now display "-" instead of a numeric seed in the rank column for any TBD/unconfirmed name slot. The Final 4 and Championship rounds were repositioned from a single merged center column into three separate columns (Left Final 4, Championship, Right Final 4), each fixed to `TOTAL_HEIGHT` so vertical centers align with the rest of the bracket. Connector lines (horizontal `w-8 h-0.5` stubs using `translateX(+/-100%)`) bridge the `gap-8` spacing between E8 and Final 4 columns, and between Final 4 and Championship columns on both sides. The Championship card now sits at the true horizontal and vertical center of the bracket, with the guest Lock-In UI preserved beneath it. The `championshipRef` was moved from the old merged column to the new Championship column so scroll-navigation targeting remains correct. All existing round columns (R32, S16, E8) are unaffected in position or appearance.

**Files changed:**
- `baby-name-bracket-app/components/bracket/NameCard.jsx` — seed `<span>` renders `'-'` when `isPlaceholder` is true, otherwise renders `{seed}`
- `baby-name-bracket-app/components/bracket/BracketView.jsx` — replaced single merged Final 4 + Championship column (lines 359-454) with three separate `flex-shrink-0 w-[280px]` columns: Left Final 4 (Div1 card centered in top half, empty bottom half, right-exiting connector stub), Championship (card vertically centered in full `TOTAL_HEIGHT`, left and right connector stubs, guest lock-in UI, `championshipRef`), Right Final 4 (empty top half, Div2 card centered in bottom half, left-entering connector stub)

---

### ✅ **IMPLEMENTED - Vote Leader Propagation and Center Column Layout** *(2026-05-17)*

Future-round matchup slots now dynamically show the current vote leader from the feeding matchup rather than a static seeded prediction. A new `getFeederLeader` helper is inserted into `BracketView.jsx` that inspects `votes.name1Votes`/`votes.name2Votes` (and `winnerId` when set) on each feeder matchup and returns the leading name's `{ nameId, name, seed }` or `null` when tied. At each of the four call sites — Sweet 16 Div1, Sweet 16 Div2, Elite 8 Div1, Elite 8 Div2 — a `resolvedMatchup` object is spread from `activeMatchup` and then overwritten with leader-derived `name1`, `name1Id`, `seed1`, `name2`, `name2Id`, `seed2` values; `name1Confirmed`/`name2Confirmed` are derived from whether each leader is non-null. This ensures that any voting advantage in a completed or live feeder matchup immediately propagates to the next-round slot, and that votes submitted on that slot record against the actual current leader's UUID rather than the original seeded prediction's UUID. Simultaneously, the three separate Final 4 / Championship center columns were collapsed into a single combined column: F4 Div1 card positioned at the vertical center of the top half (y≈195px), Championship at the absolute center (y≈455px), and F4 Div2 at the vertical center of the bottom half (y≈715px), joined by short vertical connector lines, with the guest Lock-In UI rendered immediately below the Championship card.

**Files changed:**
- `baby-name-bracket-app/components/bracket/BracketView.jsx` — added `getFeederLeader` helper function; replaced `name1Confirmed`/`name2Confirmed`-only derivation with full `resolvedMatchup` construction at S16 Div1 (~line 245), E8 Div1 (~line 312), E8 Div2 (~line 501), S16 Div2 (~line 574) call sites; replaced three separate Final 4 + Championship column blocks (lines 359–475) with a single center column using absolute positioning and vertical connector lines

---

### ✅ **IMPLEMENTED - Final 4 / Championship Connector and Position Fix** *(2026-05-17)*

The F4 cards were sitting slightly away from the Championship card, and the vertical connector lines between F4 and Championship spanned the full half-column height (390px), visually passing through the Championship and F4 cards rather than filling only the whitespace between adjacent card edges. This fix shifts F4 Div1 down by 65px (from `top: 195px` to `top: 260px`) and F4 Div2 up by 65px (from `top: 715px` to `top: 650px`), bringing both cards one half-slot-height closer to the Championship card. The two vertical connector lines are shortened from 390px to 65px (`SLOT_HEIGHT / 2`) so each bar fills only the gap between adjacent card edges and no longer overlaps any card. The E8 handoff stubs require no changes: the revised F4 card positions align geometrically with the existing E8 horizontal connector anchor points.

**Files changed:**
- `baby-name-bracket-app/components/bracket/BracketView.jsx` — updated F4 Div1 card `top` (Change 1), Connector 1 `height` (Change 2), Connector 2 `height` (Change 3), F4 Div2 card `top` (Change 4)

---

### ✅ **IMPLEMENTED - Final 4 Position and Lock-In Button Polish** *(2026-05-17)*

The F4 cards in the center column were misaligned with the Elite 8 connector stubs, and the vertical connector lines between F4 and Championship were the wrong height. This fix repositions F4 Div1 so its vertical center lands at exactly 260px (the E8 Div1 convergence point) by setting `top: TOTAL_HEIGHT/4 - SLOT_HEIGHT/2` (195px), and repositions F4 Div2 so its center lands at 780px by setting `top: 3*TOTAL_HEIGHT/4 - SLOT_HEIGHT/2` (715px). The two vertical connector lines are corrected to `height: SLOT_HEIGHT` (130px) each, exactly spanning the gap between adjacent card edges with no overlap. The "Lock In My Picks" / "Picks Locked In" block is extracted from inside the Championship card's absolute container and re-rendered as a sibling absolutely-positioned div using `left: calc(100% + 8px)` so it appears to the right of the Championship card without any connector line passing through it.

**Files changed:**
- `baby-name-bracket-app/components/bracket/BracketView.jsx` — F4 Div1 card `top` expression; Connector 1 `top` and `height`; Connector 2 `height`; F4 Div2 card `top` expression; extracted guest lock-in block from inside championship div into a new sibling absolutely-positioned div

---

### ✅ **IMPLEMENTED - OTP Login & First-Time Onboarding** *(2026-05-17)*

Users can now sign in via a one-time passcode sent to their email, and first-time visitors are prompted to set a display name before entering the app. The backend received a `User` model (UUID-keyed, unique email, nullable display name), an ephemeral `Otp` model with a TTL index, JWT signing/verification utilities, a Nodemailer email utility (stdout fallback in dev), `requireAuth` middleware, and a full `authController` covering `requestCode`, `verifyCode`, `setName`, and `getMe`. These are mounted at `POST/GET /api/auth/*` in `server.js`. The frontend gained a thin `authApi.js` fetch layer, an updated `UserContext.js` with real token-backed state and on-mount revalidation, a three-step `AuthFlow.jsx` component (email → code → optional name), and an `AuthGate.jsx` wrapper that gates all app content behind authentication. `app/layout.js` wraps the main content in `AuthGate`, and `Navbar.jsx` gained a Sign Out button and authenticated display name rendering.

**Files changed:**
- `baby-name-bracket-api/package.json` — added `jsonwebtoken`, `nodemailer` dependencies
- `baby-name-bracket-api/models/User.js` — new User Mongoose model
- `baby-name-bracket-api/models/Otp.js` — new ephemeral OTP Mongoose model with TTL index
- `baby-name-bracket-api/utils/jwt.js` — `signToken` / `verifyToken` utilities
- `baby-name-bracket-api/utils/email.js` — `sendOtpEmail` with Nodemailer / stdout fallback
- `baby-name-bracket-api/middleware/auth.js` — `requireAuth` JWT middleware
- `baby-name-bracket-api/controllers/authController.js` — `requestCode`, `verifyCode`, `setName`, `getMe`
- `baby-name-bracket-api/routes/authRoutes.js` — auth route registration
- `baby-name-bracket-api/server.js` — mounted `/api/auth` router
- `baby-name-bracket-api/.env.example` — documented `JWT_SECRET`, `SMTP_*`, `EMAIL_FROM` vars
- `baby-name-bracket-app/lib/authApi.js` — fetch wrappers for all four auth endpoints
- `baby-name-bracket-app/contexts/UserContext.js` — token-backed auth state with revalidation on mount
- `baby-name-bracket-app/components/auth/AuthFlow.jsx` — three-step auth component
- `baby-name-bracket-app/components/auth/AuthGate.jsx` — auth gate wrapper
- `baby-name-bracket-app/app/layout.js` — wrapped main content in `AuthGate`
- `baby-name-bracket-app/components/layout/Navbar.jsx` — Sign Out button, authenticated display name

---

### ✅ **IMPLEMENTED - Bracket Layout Fixes** *(2026-05-17)*

Three visual regressions on the bracket page were diagnosed and fixed. First, `TBDCard` in `BracketView.jsx` used hardcoded light-only Tailwind gradient and background classes with no `dark:` counterparts, causing Final 4 and Championship placeholder cards to appear in light mode while adjacent cards respected dark mode; the fix adds symmetric `dark:` variants to all affected class strings including row backgrounds and label text. Second, connector lines between Sweet 16 and Elite 8, and between Elite 8 and Final 4, were broken because live `MatchupCard` instances received a `slotHeight` equal to a single R32 slot (130 px) rather than the correct multiple (2× for S16, 4× for E8), causing the vertical L-shape leg to be too short, and because Div2 Elite 8 cards lacked the `connectorSide="left"` override that `PlaceholderMatchup` already had — the fix adds a `connectorSide` prop to `MatchupCard.jsx` and passes the correct `slotHeight` multiples and the `connectorSide` override at the four affected call sites in `BracketView.jsx`. Third, the Final 4 cards were positioned at the 25%/75% extremes of the bracket height, too far from the Championship card; the fix introduces `F4_CENTER_OFFSET` and `F4_CARD_HEIGHT` constants, updates both F4 `top` expressions to place each card's center at `TOTAL_HEIGHT/2 ± F4_CENTER_OFFSET`, and recomputes the two vertical connector `top` and `height` values to span only the whitespace between adjacent card edges.

**Files changed:**
- `baby-name-bracket-app/components/bracket/BracketView.jsx`
- `baby-name-bracket-app/components/bracket/MatchupCard.jsx`

---

### ✅ **IMPLEMENTED - Guest Bracket Scoring System** *(2026-05-17)*

Guests now receive real-time correct/wrong-pick feedback on their bracket selections as owners set official round winners. When an owner sets a winner, any guest who voted for the winning name sees a green left-border stripe on that name's card. A guest who voted for the losing name in a completed matchup continues to see the existing strikethrough-and-correction display on the same-round card (existing behavior, confirmed intact). Additionally, when a guest voted for the losing name in a feeder matchup (e.g. Round of 32), the next-round slot (Sweet 16 / Elite 8) now renders a small annotation above the slot row reading "You picked: [struck-through wrong name] → [actual advancing name]", implemented via a new `feederWrongPick` prop on `NameCard`. All wrong-pick and correct-pick rendering is guarded by `!isOwner` so owner users never see these annotations. A new `getFeederWrongPick` helper in `BracketView.jsx` computes the annotation data by comparing `voteMap[feederId]` against `feeder.winnerId` at each of the four live-matchup call sites (Sweet 16 Div1, Sweet 16 Div2, Elite 8 Div1, Elite 8 Div2). No backend changes, no new API fields, and no schema changes were required — the feature is derived entirely from the existing `voteMap` and `winnerId` values already returned by the API.

**Files changed:**
- `baby-name-bracket-app/components/bracket/NameCard.jsx` — added `guestCorrect` prop (green left-border on correct-pick row) and `feederWrongPick` prop (annotation above slot row for next-round wrong picks)
- `baby-name-bracket-app/components/bracket/MatchupCard.jsx` — added `name1FeederWrongPick` / `name2FeederWrongPick` props; computed `guestCorrectOnName1` / `guestCorrectOnName2` and passed them through to each `NameCard`
- `baby-name-bracket-app/components/bracket/BracketView.jsx` — added `getFeederWrongPick` helper; threaded `name1FeederWrongPick` / `name2FeederWrongPick` into all four live `resolvedMatchup` MatchupCard call sites (Sweet 16 Div1, Elite 8 Div1, Elite 8 Div2, Sweet 16 Div2); added `const isGuest = !isOwner` near top of component body

---

### ✅ **IMPLEMENTED - Multi-Bracket Lobby & Invite System** *(2026-05-17)*

After login, users land on a lobby home screen instead of directly inside a single hardcoded bracket. The lobby shows all brackets the user owns and all brackets they have joined as a guest, with Create and Join entry points. Creating a bracket generates a unique 8-character invite code, persists new multi-tenancy fields on the Bracket model, and fires an email to Owner 2's address containing a link to claim the owner seat. Owner 2 clicks the link, completes OTP login if not already authenticated, and lands inside the bracket with full owner permissions. Any authenticated user can join a bracket as a guest by entering the invite code. Each lobby card links to a per-bracket dynamic route (`/bracket/[id]`), which renders the existing bracket view (name submission, voting, tournament progression) unmodified. All existing single-bracket endpoints remain intact with no breaking changes.

**Files changed:**
- `baby-name-bracket-api/models/Bracket.js` — added `inviteCode`, `owner1UserId`, `owner1Name`, `owner2UserId`, `owner2Name`, `owner2Email`, `guestUserIds` fields and four new indexes
- `baby-name-bracket-api/utils/email.js` — added `sendInviteEmail(toEmail, inviteCode)` alongside `sendOtpEmail`
- `baby-name-bracket-api/controllers/lobbyController.js` — new file; `generateInviteCode`, `createBracket`, `listMyBrackets`, `joinBracket`, `acceptOwner2`
- `baby-name-bracket-api/routes/lobbyRoutes.js` — new file; mounts `POST /api/brackets`, `GET /api/brackets/mine`, `POST /api/brackets/join`, `GET /api/brackets/:inviteCode/accept-owner`
- `baby-name-bracket-api/server.js` — mounted `lobbyRoutes` under `/api`
- `baby-name-bracket-app/lib/lobbyApi.js` — new file; `createBracket`, `getMyBrackets`, `joinBracket`, `acceptOwner2` fetch wrappers
- `baby-name-bracket-app/app/page.js` — rewritten as lobby home; owned/guest bracket lists, Create modal, Join modal, bracket cards with per-bracket links
- `baby-name-bracket-app/app/bracket/[id]/page.js` — new dynamic route; full bracket view extracted from original `page.js`, threaded with `bracketId` from params
- `baby-name-bracket-app/app/invite/[inviteCode]/page.js` — new invite-acceptance page; calls `acceptOwner2` on mount (or after OTP login) and redirects into the bracket

---

### ✅ **IMPLEMENTED - Bracket Connector Lines Fix** *(2026-05-17)*

All bracket rounds now show the correct paired-bracket connector visual (two horizontal stubs + vertical join bar) when advancing from Sweet 16 → Elite 8 and Elite 8 → Final 4, matching the style already present for Round of 32 → Sweet 16.

**Root cause:** `TBDCard` (the fallback rendered by `PlaceholderMatchup` when no guest predictions exist) only drew a flat horizontal `w-8 h-0.5` stub — it lacked the vertical L-shape connectors. Since `PlaceholderMatchup` early-returns `TBDCard` before reaching the connector logic, S16 and E8 placeholder cards had no L-shapes. R32 → S16 appeared correct because R32 uses live `MatchupCard` components (not `PlaceholderMatchup`) which already had L-shapes.

**Fix:** `TBDCard` was updated to accept `round`, `pmIndex`, `slotHeight`, and `connectorSide` props and now renders the same full connector block (horizontal stub + L-shape pair for `round === 2` and `round === 3`) as the `PlaceholderMatchup` prediction-card path. `PlaceholderMatchup`'s early-return call to `TBDCard` now threads all four new props through.

**Files changed:**
- `baby-name-bracket-app/components/bracket/BracketView.jsx` — updated `TBDCard` signature and connector rendering; updated `PlaceholderMatchup` TBDCard call site to pass connector props

---

### ✅ **IMPLEMENTED - Final 4 Vertical Alignment Fix** *(2026-05-18)*

The Final 4 cells (Division 1 top, Division 2 bottom) were vertically misaligned with their corresponding Elite 8 cards, causing the straight horizontal connector lines between Elite 8 and Final 4 to appear bent. Division 1 F4 was 52px too low; Division 2 F4 was 94px too high.

**Root cause:** `F4_CENTER_OFFSET = Math.round(TOTAL_HEIGHT * 0.18) = 187px` placed F4 card body centers at 312px (Div1) and 686px (Div2). Elite 8 cards live inside `flex items-center` rows of 520px height, so their centers are at 260px (top) and 780px (bottom). The formula did not account for the F4 wrapper's label div (~20px) above the card body.

**Fix:** Replaced `F4_CENTER_OFFSET` with three derived constants:
- `F4_LABEL_HEIGHT = 20` (label div height)
- `F4_DIV1_TOP = 2 * SLOT_HEIGHT - F4_LABEL_HEIGHT - F4_CARD_HEIGHT / 2` → **196px** (was 268px)
- `F4_DIV2_TOP = 6 * SLOT_HEIGHT - F4_LABEL_HEIGHT - F4_CARD_HEIGHT / 2` → **716px** (was 642px)

Updated the two vertical connector `top`/`height` values between F4 and Championship to match the new card positions. Championship card position (455px) unchanged.

**Files changed:**
- `baby-name-bracket-app/components/bracket/BracketView.jsx` — replaced `F4_CENTER_OFFSET` constant with `F4_LABEL_HEIGHT`, `F4_DIV1_TOP`, `F4_DIV2_TOP`; updated F4 Div1 card `top`, F4 Div2 card `top`, and both vertical connector `top`/`height` expressions

---

## Name Generator Button

**Completed:** 2026-05-17

**Summary:** Added a name-generator UI to the baby-name bracket app's name-picking page. Parents can select a gender (Girl, Neutral, or Boy) via a color-coded toggle and click "Generate Name" to populate the name input with a random suggestion from a curated pool of ~150 names. Names cycle without repeats until the pool is exhausted, then reset. The feature spans a new Mongoose model and seed script on the backend, a new API endpoint (`GET /api/baby-names?gender=girl|boy|neutral`), and a new `NameGenerator` React component wired into both owner columns on the bracket page.

**Files changed:**
- `/Users/garrettamidon/workspace/ai-workshop/baby-name-bracket-api/models/BabyName.js` (created)
- `/Users/garrettamidon/workspace/ai-workshop/baby-name-bracket-api/scripts/seedBabyNames.js` (created)
- `/Users/garrettamidon/workspace/ai-workshop/baby-name-bracket-api/controllers/bracketController.js` (modified — added `getNamesByGender`, `BabyName` import)
- `/Users/garrettamidon/workspace/ai-workshop/baby-name-bracket-api/routes/bracketRoutes.js` (modified — registered `GET /api/baby-names`)
- `/Users/garrettamidon/workspace/ai-workshop/baby-name-bracket-app/components/bracket/NameGenerator.jsx` (created)
- `/Users/garrettamidon/workspace/ai-workshop/baby-name-bracket-app/app/bracket/page.js` (modified — imported and placed `NameGenerator` in both owner columns)

**Archived plan:** `plans/completed/name-generator-button.md`

---

## Name Generator Toggle Contrast Fix

**Completed:** 2026-05-17

**Summary:** Improved the readability of unselected gender toggle buttons in the `NameGenerator` component. The previous implementation applied `opacity-40` to the entire button element, washing out both the background and label text to the point of being difficult to read. The fix removes the blanket opacity and instead uses medium-tint Tailwind background classes (`bg-pink-200`, `bg-gray-200`, `bg-blue-200`) paired with legible text colors (`text-pink-600`, `text-gray-500`, `text-blue-600`). Unselected buttons now clearly show their pink, grey, or blue hue identity while remaining visually subordinate to the active selected button, whose appearance is unchanged.

**Files changed:**
- `/Users/garrettamidon/workspace/ai-workshop/baby-name-bracket-app/components/bracket/NameGenerator.jsx` (modified — updated unselected-state classes in `getToggleClass`)

**Archived plan:** `plans/completed/name-generator-toggle-contrast.md`

---

## Name Picker Ownership & Visibility Rules

**Completed:** 2026-05-17

**Summary:** Implemented per-parent identity, visibility, and remove-control rules for the baby-name bracket app. A "Who are you?" modal on first visit stores the parent's identity (Owner 1 / Owner 2) in localStorage. Each parent sees only their own list and the shared list until both lock in; the other owner's list shows a hidden placeholder. Removing a shared name routes through a new `DELETE /api/shared-names/:id` endpoint that checks who was the original adder: if the remover was the original adder, the name transfers to the other owner's active list or enters a pending queue (rendered in red with a tooltip) when that list is full at 16 names. Pending names are auto-promoted when the recipient drops below 16, and can be cancelled via `DELETE /api/pending-names/:id`. Remove buttons disappear from a parent's own list and the shared list once they lock in. Backend changes add `owner1PendingNames` and `owner2PendingNames` arrays to the Bracket model and two new controller functions; the existing `deleteName` controller was extended to trigger pending-name promotion.

**Files changed:**
- `/Users/garrettamidon/workspace/ai-workshop/baby-name-bracket-api/models/Bracket.js` (modified — added `owner1PendingNames` and `owner2PendingNames` sub-arrays and indexes)
- `/Users/garrettamidon/workspace/ai-workshop/baby-name-bracket-api/controllers/bracketController.js` (modified — added `removeSharedName`, `removePendingName`, `buildCurrentBracketResponse` helper; extended `deleteName` with pending-promotion logic)
- `/Users/garrettamidon/workspace/ai-workshop/baby-name-bracket-api/routes/bracketRoutes.js` (modified — registered `DELETE /api/shared-names/:id` and `DELETE /api/pending-names/:id`)
- `/Users/garrettamidon/workspace/ai-workshop/baby-name-bracket-app/app/bracket/page.js` (modified — added identity selector modal, `currentUser` state, pending-name state, `handleRemoveShared`, `handleRemovePending` handlers, column visibility guards, pending-name rendering, per-user remove-button conditions)

**Archived plan:** `plans/completed/name-picker-ownership-rules.md`

---

## Bracket Page — Drive Identity from UserContext

**Completed:** 2026-05-17

**Summary:** Removed the redundant "Who are you?" inline identity modal from the bracket page and replaced all local `currentUser` state with the app-wide `useUser()` hook sourced from `UserContext`. The localStorage read useEffect and `currentUser` useState declaration were deleted. Eight `currentUser` references across column visibility guards, pending-name renders, and remove-button conditions were replaced with the `isOwner1`, `isOwner2`, `isOwner`, and `role` values from `useUser()`. Guest users now automatically receive a fully read-only view (both columns visible, no remove buttons, no modal) without any additional logic, as the context values default correctly for guests.

**Files changed:**
- `/Users/garrettamidon/workspace/ai-workshop/baby-name-bracket-app/app/bracket/page.js` (modified — removed identity modal, `currentUser` state, localStorage useEffect; added `useUser()` hook import and destructure; replaced all `currentUser` references with `isOwner1`, `isOwner2`, `isOwner`, and `role`)

**Archived plan:** `plans/completed/bracket-page-user-context.md`

---

## Shared Name Rank Ordering in Owner Columns

**Completed:** 2026-05-17

**Summary:** Shared names displayed inside each owner's list now appear in the same order as they rank in the Shared Favorites column, giving both parents a consistent view of their mutual picks. A module-level pure helper `getEffectiveRank(item, sharedNames)` was added to `bracket/page.js`; it returns the shared-list rank for shared names and the personal rank for all others. The `.sort()` comparators for both `owner1Names` and `owner2Names` were updated to use this helper, and the rank badge expression in both owner columns was updated identically so the displayed badge number matches the sort order. Non-shared names are unaffected — `getEffectiveRank` falls through to `item.rank` for them.

**Files changed:**
- `/Users/garrettamidon/workspace/ai-workshop/baby-name-bracket-app/app/bracket/page.js` (modified — added `getEffectiveRank` helper; updated `.sort()` comparators and rank badge expressions for both owner columns)

**Archived plan:** `plans/completed/shared-name-rank-ordering.md`

---

## Bracket Connector Elite 8 / Bold Line Fix

**Completed:** 2026-05-17

**Summary:** Fixed two visual defects in the bracket connector lines in `BracketView.jsx`. First, extra-bold connector lines caused by double-rendered borders: for `round === 2` (Sweet 16 → Elite 8), a standalone horizontal stub div was being stacked on top of the L-shape's `border-t-2`/`border-b-2` edge, doubling the border thickness to ~4px. The fix suppresses the standalone stub when `round === 2` since the L-shape already covers that segment. Second, Elite 8 cards were incorrectly drawing L-shaped bracket-pair connectors (the condition was `round === 2 || round === 3`) instead of straight horizontal stubs to their respective Final 4 cells. The L-shape condition was narrowed to `round === 2` only, so Elite 8 cards now emit a clean straight stub pointing toward the correct Final 4 division cell. Both fixes were applied to both `TBDCard` and `PlaceholderMatchup`.

**Files changed:**
- `/Users/garrettamidon/workspace/ai-workshop/baby-name-bracket-app/components/bracket/BracketView.jsx` (modified — suppressed horizontal stub when `round === 2`; narrowed L-shape condition from `round === 2 || round === 3` to `round === 2` only; applied in both `TBDCard` and `PlaceholderMatchup`)

**Archived plan:** `plans/completed/bracket-connector-elite8-fix.md`

---

## Fix: generateRoundOf32Matchups Not Defined on 16th Name Add

**Completed:** 2026-05-18

**Summary:** Fixed a server-side 500 error that occurred when owner2 added their 16th name (completing the 32-name roster). The root cause was a call to `generateRoundOf32Matchups` on line 221 of `bracketController.js` — a function that was never defined, exported, or imported anywhere in the codebase. The correct function, `generateDivisionMatchups(owner1Names, owner2Names)`, was already imported at the top of the controller. The broken call was replaced with the correct call using the bracket's own owner arrays instead of the flat merged `allNames` local variable (which was also removed as dead code). No import changes were needed.

**Files changed:**
- `baby-name-bracket-api/controllers/bracketController.js` — replaced `generateRoundOf32Matchups(allNames)` with `generateDivisionMatchups(bracket.owner1Names, bracket.owner2Names)` on line 221; removed the now-unused `const allNames = bracket.getAllNames()` assignment

**Archived plan:** `plans/completed/fix-generate-round-of-32-undefined.md`

---

## Hamburger Menu Redesign

**Completed:** 2026-05-18

**Summary:** Replaced the existing absolute-positioned dropdown panel in `Navbar.jsx` with a fixed full-height slide-in drawer that animates from the right edge of the viewport. The redesign added a semi-transparent backdrop overlay (closes on click), Escape-key and outside-click close handlers, body-scroll locking while the drawer is open, and full accessibility support (`role="dialog"`, `aria-modal`, `aria-expanded`, `aria-controls`, focus trap, and focus-return to the toggle button on close). The drawer prominently displays the authenticated user's display name and role badge at the top, retains all existing navigation items (All Brackets, Parent Controls admin links, Sign Out) with their existing conditional visibility logic and routing, and adds a drawer-level close button. All transitions use CSS `transition-transform` (no new animation library dependency). This is a pure frontend UI enhancement — no backend, no context, no route changes.

**Files changed:**
- `baby-name-bracket-app/components/layout/Navbar.jsx` — full component rework replacing the dropdown `<div>` with a drawer panel

**Archived plan:** `plans/completed/hamburger-menu-redesign.md`

---

## Bracket Lock-In Connector and Button Fix

**Completed:** 2026-05-18

**Summary:** Fixed three visual defects in the bracket view that only manifested after a guest locked in their predictions (the prediction-card rendering path). (1) Right-side Elite 8 → Final 4 connectors were pointing rightward (away from center) instead of leftward toward the Final 4 column — fixed by adding `connectorSide="left"` to both `PlaceholderMatchup` call sites in the Div2 Elite 8 column loop. (2) The prediction-card connector block in `PlaceholderMatchup` lacked the `!isFinal4 && !isChampionship` guards that `TBDCard` already had — added to match. (3) The "Lock In My Picks" button was absolutely positioned outside the Championship column (`left: calc(100% + 8px)`), causing it to shift right; repositioned to render below the Championship card using `left: 0; right: 0` within the same column.

**Files changed:**
- `baby-name-bracket-app/components/bracket/BracketView.jsx` — added `connectorSide="left"` to Div2 E8 `PlaceholderMatchup` call sites; added `!isFinal4 && !isChampionship` guard to prediction-card connector block; changed lock-in button from out-of-column absolute to in-column centered absolute

**Archived plan:** `plans/completed/bracket-lockin-connector-fix.md`

---

## Profile Update

**Completed:** 2026-05-18

**Summary:** Enabled users to view and edit their display name and email address from a real `/profile/edit` form page, and made display name required during account creation. The backend received two new authenticated endpoints: `PUT /api/auth/profile` (handles display-name-only saves and triggers an OTP verification flow when the email address is changed) and `POST /api/auth/verify-email-change` (validates the OTP and commits the new email). The `User` model's `displayName` field was tightened from nullable to required at the database level. On the frontend, two new fetch wrappers were added to `authApi.js`, `UserContext` gained an `updateUser` helper to propagate identity changes app-wide without a page reload, the `/profile/edit` stub was replaced with a full two-step form (edit fields → optional OTP verification), and the sign-up `AuthFlow` name step received a client-side guard that rejects empty or whitespace-only display names before the API call.

**Files changed:**
- `baby-name-bracket-api/models/User.js`
- `baby-name-bracket-api/models/Otp.js` (no schema change — confirmed sufficient)
- `baby-name-bracket-api/controllers/authController.js`
- `baby-name-bracket-api/routes/authRoutes.js`
- `baby-name-bracket-app/lib/authApi.js`
- `baby-name-bracket-app/contexts/UserContext.js`
- `baby-name-bracket-app/app/profile/edit/page.jsx`
- `baby-name-bracket-app/components/auth/AuthFlow.jsx`

**Archived plan:** `plans/completed/profile-update.md`

---

## Bracket Invite — Email & Shared Link

**Completed:** 2026-05-18

**Summary:** Added an "Invite People" flow accessible from the hamburger menu's Settings sub-panel (admin-only). Clicking the option opens a modal with a pill-based email input (Space or Enter locks each address into a removable green pill), a "Send Invites" button that is disabled until at least one pill is present, and a copyable shared link for out-of-band sharing. On submission, all locked-in addresses receive a transactional invitation email and the modal shows a confirmation before auto-closing. The backend adds a stable `shareToken` UUID field to the Bracket model, a `sendBracketInviteEmail` helper in the email utility, and two new authenticated admin-only endpoints (`GET /api/bracket/:id/invite-link` to lazily generate and return the share link, and `POST /api/bracket/:id/invite` to dispatch emails); both routes are registered above the existing `/:sessionId` catch-all to prevent path shadowing. The frontend adds a reusable `EmailPillInput` component, an `InviteModal` component that fetches the share link on mount, and an "Invite People" button in the Navbar Settings sub-panel that opens the modal.

**Files changed:**
- `baby-name-bracket-api/models/Bracket.js` — added `shareToken` field and sparse index
- `baby-name-bracket-api/utils/email.js` — added `sendBracketInviteEmail(toEmail, shareLink, bracketName)`
- `baby-name-bracket-api/controllers/bracketController.js` — added `getInviteLink` and `sendInvites` controller functions
- `baby-name-bracket-api/routes/bracketRoutes.js` — registered `GET /api/bracket/:id/invite-link` and `POST /api/bracket/:id/invite` above the `/:sessionId` catch-all
- `baby-name-bracket-app/components/bracket/EmailPillInput.jsx` — new pill-based email input component
- `baby-name-bracket-app/components/bracket/InviteModal.jsx` — new invite modal component
- `baby-name-bracket-app/components/layout/Navbar.jsx` — added "Invite People" button and `showInviteModal` state

**Archived plan:** `plans/completed/bracket-invite.md`

---

## Production Deployment — Vercel + Render + Atlas

**Completed:** 2026-05-18

**Summary:** Deployed the Next.js frontend and Express API to production so the app is publicly reachable at amidonlabs.com. The backend CORS configuration was replaced with a comma-separated `ALLOWED_ORIGINS` env-var approach (eliminating hardcoded localhost origins in production and supporting both `babybracket.amidonlabs.com` and any future domain with a config-only change). Two hardcoded `http://localhost:3001` fetch calls in `baby-name-bracket-app/utils/api.js` (`lockTournamentBracket` and `advanceTournamentRound`) were fixed to read `process.env.NEXT_PUBLIC_API_URL`. The `.env.example` was scrubbed of plaintext credentials and updated to document the new `ALLOWED_ORIGINS` and `APP_URL` variables. The Render web service was created with all production environment variables set (MongoDB Atlas URI, JWT secret, APP_URL, ALLOWED_ORIGINS, SMTP credentials) and wired to `babybracket-api.amidonlabs.com`. The Vercel project was created with `NEXT_PUBLIC_API_URL` pointing at the API subdomain and wired to `babybracket.amidonlabs.com`. DNS CNAME records were configured at the registrar for both subdomains. End-to-end verification confirmed health check, CORS headers, no mixed-content errors, correct share-link domain in invite emails, and full auth/OTP flow in production.

**Files changed:**
- `baby-name-bracket-api/server.js` — replaced single-origin `FRONTEND_URL` CORS logic with `ALLOWED_ORIGINS` comma-separated env-var approach; removed hardcoded localhost origins from production builds
- `baby-name-bracket-app/utils/api.js` — added `BASE_URL` constant; replaced two hardcoded `http://localhost:3001` fetch calls with template-literal references to `BASE_URL`
- `baby-name-bracket-api/.env.example` — scrubbed plaintext Atlas URI and password comments; replaced `FRONTEND_URL` with `ALLOWED_ORIGINS`; added `APP_URL` documentation entry; removed unused `CORS_ORIGIN` line

**Archived plan:** `plans/completed/production-deployment.md`

---

## Expand Name Seed Database with Historical Baby Names

**Completed:** 2026-05-18

**Summary:** Populated the baby-name suggestion pool with top 50 boys, girls, and neutral names from six historical windows (2021–2025, 2010–2015, 2000–2005, 1990–1995, 1980–1985, 1970–1975), deduplicated across all eras and against the existing list (case-insensitive, per-gender-bucket). The three existing JavaScript arrays in the seed script (`GIRL_NAMES`, `BOY_NAMES`, `NEUTRAL_NAMES`) were extended in place using the same Title-cased string-literal style. Deduplication was applied at author time so the committed arrays contain no duplicates. The comment at the top of the file was updated to reflect the new total count. No structural changes to the seed script, Mongoose model, or any API contract were required — the `buildOps` helper, `bulkWrite` call, and connection/teardown logic are unchanged. The app loads without errors and surfaces a noticeably richer set of name suggestions.

**Files changed:**
- `baby-name-bracket-api/scripts/seedBabyNames.js` — extended `GIRL_NAMES`, `BOY_NAMES`, and `NEUTRAL_NAMES` arrays with deduplicated historical names; updated total-count comment

**Archived plan:** `plans/completed/expand-name-seed-database.md`

---

## Bracket Deletion and Owner Reset

**Completed:** 2026-05-18

**Summary:** Delivered three destructive-action endpoints with matching frontend controls: an admin can permanently delete the entire bracket document (all embedded names, matchups, and votes in a single `deleteOne` call); a guest can remove their own voting participation by pulling all their vote records from the bracket's `votes` array; and an admin can remove Owner 2 entirely, which clears `owner2Names` and `owner2PendingNames`, filters out all `sharedNames` contributed by Owner 2, clears `isShared` flags on all Owner 1 names, wipes every matchup round array along with votes and lock-in state, and resets the bracket to `draft` status. All three operations require an explicit confirmation step via a new reusable `ConfirmModal` component. The admin actions (`deleteBracket`, `removeOwner2`) are protected by the existing `requireAuth` middleware; the guest action (`deleteGuestSession`) is unauthenticated. The admin controls are surfaced in a new "Danger Zone" collapsible section at the bottom of `AdminPanel.jsx`, and the guest control is a small "Delete my participation" link visible only when `viewerRole === 'guest'` and a `voterId` is present in `BracketView.jsx`.

**Files changed:**
- `baby-name-bracket-api/controllers/bracketController.js` — added `deleteBracket`, `deleteGuestSession`, and `removeOwner2` controller functions; added all three to `module.exports`
- `baby-name-bracket-api/routes/bracketRoutes.js` — imported the three new controllers; registered `DELETE /api/bracket/:sessionId/guest`, `DELETE /api/bracket/:sessionId/owner2` (requireAuth), and `DELETE /api/bracket/:sessionId` (requireAuth) in specificity order
- `baby-name-bracket-app/components/bracket/AdminPanel.jsx` — added `showDeleteBracketModal`, `showRemoveOwner2Modal`, and `dangerLoading` state; added "Danger Zone" section with Delete Bracket and Remove Owner 2 buttons and their confirmation modals; added `onDeleteBracket` and `onRemoveOwner2` to prop signature
- `baby-name-bracket-app/components/ui/ConfirmModal.jsx` — new reusable confirmation overlay modal (title, message, confirmLabel, cancelLabel, onConfirm, onCancel, loading props)
- `baby-name-bracket-app/components/pages/BracketView.jsx` — added `handleDeleteBracket`, `handleRemoveOwner2`, `handleDeleteGuestSession` handlers; added `showDeleteGuestModal` state; passed new props to `AdminPanel`; added guest "Delete my participation" link with confirmation modal; imported `ConfirmModal`

**Archived plan:** `plans/completed/bracket-deletion-and-owner-reset.md`

---

## Admin Tools — Move to Hamburger Menu Owner 1 Panel

**Completed:** 2026-05-18

**Summary:** Consolidated all bracket admin controls from the inline `AdminPanel` component (rendered on the bracket page) into a dedicated "Owner 1" sub-panel inside the hamburger menu drawer in `Navbar.jsx`. Owner 1 opens the hamburger menu and finds a new "Owner 1" row (gated on `isOwnerOfCurrentBracket && ownerRole === 'owner1'`) that opens a sub-panel containing navigation links (Names, Pick Winner of Round) and a Danger Zone with four action buttons (Reset & Regenerate, Unlock Names, Remove Owner 2, Delete Bracket). Each destructive button opens the corresponding `ConfirmModal`. The handler functions (`handleDeleteBracket`, `handleRemoveOwner2`, `handleResetAndRegenerate`, `handleUnlockNames`) were implemented directly in `Navbar.jsx` using `useBracket()` for bracket ID and status. `AdminPanel.jsx` was deleted, its `<AdminPanel>` render was removed from `BracketView.jsx`, and the now-unused `adminPanelOpen`/`setAdminPanelOpen` state was removed from `BracketContext.js`. Guests and Owner 2 see no "Owner 1" entry in the menu.

**Files changed:**
- `baby-name-bracket-app/components/layout/Navbar.jsx` — added `owner1` panel state, four danger-zone modal states, `dangerLoading` boolean, four async handler functions, Owner 1 menu row, Owner 1 sub-panel JSX, and four `ConfirmModal` instances
- `baby-name-bracket-app/components/pages/BracketView.jsx` — removed `import AdminPanel` and the `{/* Admin Panel — owners only */}` render block; removed unused `handleDeleteBracket`, `handleRemoveOwner2`, and `adminPanelOpen` references
- `baby-name-bracket-app/components/bracket/AdminPanel.jsx` — deleted entirely
- `baby-name-bracket-app/contexts/BracketContext.js` — removed `adminPanelOpen` and `setAdminPanelOpen` state and context value entries

**Archived plan:** `plans/completed/admin-tools-to-hamburger-menu.md`

---

## Admin Tools — Consolidate into Settings Panel

**Completed:** 2026-05-18

**Summary:** Merged the Owner 1 sub-panel (added in the previous feature) back into the single Settings panel so the hamburger menu has only one settings destination. The "Owner 1" row was removed from the hamburger main panel. The Settings sub-panel was expanded to include navigation links (Names, Pick Winner of Round), the Invite People button, and — rendered exclusively for `ownerRole === 'owner1'` — a red "Danger Zone" section at the bottom containing the four destructive action buttons (Reset & Regenerate, Unlock Names, Remove Owner 2, Delete Bracket). The now-redundant `owner1` panel state value and its JSX block were deleted from Navbar. Owner 2 sees the Settings panel without the Danger Zone section.

**Files changed:**
- `baby-name-bracket-app/components/layout/Navbar.jsx` — removed the `owner1` panel state, its menu row, and its sub-panel JSX block; expanded the `settings` panel with nav-links, invite button, and an `ownerRole === 'owner1'`-gated Danger Zone section containing all four destructive action buttons and their `ConfirmModal` instances

---

## Mobile-Friendly Bracket List View

**Completed:** 2026-05-18

**Summary:** Added a mobile-first List view as an alternative to the full bracket canvas, making the app fully usable on small screens. A "Bracket | List" toggle appears in the bracket page header whenever the bracket status is not `draft`. In List view the current round's matchups render as vertically stacked cards with no horizontal scrolling required. Votes cast in List view use the identical API endpoint and callback as Bracket view — both views stay in sync via the shared `voteMap` and `onVoteSuccess` re-fetch. The guest lock-in CTA (progress counter and "Lock In My Picks" button) is preserved in List view. The selected view mode is persisted to `localStorage` under the key `bracketViewMode` so the choice survives page refreshes.

**Files changed:**
- `baby-name-bracket-app/components/bracket/ListMatchupCard.jsx` — new component; self-contained matchup card for list/mobile style, mirrors `MobileMatchupCard` logic, posts to `POST /api/votes/:matchupId`
- `baby-name-bracket-app/components/bracket/BracketListView.jsx` — new component; renders the full list-mode view for the current active round, derives `isLockedIn`, `isRoundPublished`, `votableMatchups`, `votedCount`, `allVoted` using the same expressions as `BracketView`
- `baby-name-bracket-app/app/bracket/[id]/page.js` — added `viewMode` state with `localStorage` lazy initializer and `handleViewModeChange` setter; added `BracketListView` import; added "Bracket | List" toggle control to the header (hidden in draft status); replaced single `<BracketView>` render with a `viewMode`-conditional that renders either `<BracketListView>` or `<BracketView>`

**Archived plan:** `plans/completed/mobile-friendly-bracket-list-view.md`

---

## Vote Scroll Position Fix

**Completed:** 2026-05-18

**Summary:** Prevented the page from jumping to the top after a user casts a vote. The root cause was that `onVoteSuccess` triggers a full `fetchBracket()` state replacement, which cascades into a large React re-render that causes the browser to reset scroll position. The fix captures `window.scrollY` immediately before the re-fetch calls and, after `Promise.all` resolves, restores the position via a double `requestAnimationFrame` — guaranteeing React has fully committed its render tree before the scroll instruction executes. The same `onVoteSuccess` closure is passed to both `<BracketView>` and `<BracketListView>`, so both views are fixed with a single change. No vote logic, API calls, or state shape were altered.

**Files changed:**
- `baby-name-bracket-app/components/pages/BracketView.jsx` — added `const savedScroll = window.scrollY` capture and double-RAF `window.scrollTo({ top: savedScroll, behavior: 'instant' })` restore to both `onVoteSuccess` callback instances (line 451–455 for `BracketListView` and line 472–476 for `BracketView`)

**Archived plan:** `plans/completed/vote-scroll-position-fix.md`

---

## Mobile Bracket View Fix

**Completed:** 2026-05-18

**Summary:** Made the Bracket view fully usable on mobile by replacing the broken partial mobile layout with a horizontally scrollable full bracket canvas and defaulting new mobile visitors to List view. The `md:hidden` mobile-only block (a hardcoded Round of 32 + Championship card that stopped being correct after any round advanced) was deleted along with the now-dead `MobileMatchupCard` function. The `hidden md:block` wrapper around the full bracket canvas was removed so the canvas is visible on all screen sizes (the existing `overflow-x-auto` container provides horizontal scrolling on mobile). The `viewMode` initializer in the page component was made screen-width-aware: first-time visitors on screens narrower than 768px default to List view; returning users who previously stored a preference have that preference honoured; desktop first-time visitors retain the existing bracket default. Desktop behavior is entirely unchanged.

**Files changed:**
- `baby-name-bracket-app/components/bracket/BracketView.jsx` — removed `hidden md:block` wrapper div (lines 237/803); removed `md:hidden` mobile block and `{/* Mobile View */}` comment (lines 805–856); deleted dead `MobileMatchupCard` function (lines 1087–1331)
- `baby-name-bracket-app/components/pages/BracketView.jsx` — replaced `viewMode` `useState` initializer with a screen-width-aware version that returns `'list'` when `window.innerWidth < 768` and no stored preference exists

**Archived plan:** `plans/completed/mobile-bracket-view-fix.md`

---

## Proceed to Next Round — List View Button + Auto-Winner Advance

**Completed:** 2026-05-18

**Summary:** Enabled Owner 1 to advance the bracket to the next round directly from the List view once all voting for the current round is complete. A new `POST /api/bracket/:id/proceed-to-next-round` backend endpoint atomically reads vote counts for every matchup in the current round, auto-sets each matchup's `winnerId` to the vote-leader (tie-breaking to `name1Id` deterministically), calls the existing `advanceMatchupWinners` utility to populate the next round's matchup name IDs, advances `bracket.currentRound`, and returns the updated bracket. On the frontend, `BracketListView.jsx` gained two new props (`bracketId`, `onProceedToNextRound`) and renders a "Proceed to [Next Round Name]" button at the bottom of the list (visible only to `ownerRole === 'owner1'` when all matchups have at least one vote); guests who have locked in all their picks see a "Waiting for next round…" message instead. This fixes the root cause of the Sweet 16 voting bug where R16 matchup name IDs were never populated because the advance was never triggered from the UI.

**Files changed:**
- `baby-name-bracket-api/controllers/bracketController.js` — added `proceedToNextRound` controller function; added to `module.exports`
- `baby-name-bracket-api/routes/bracketRoutes.js` — imported `proceedToNextRound`; registered `router.post('/bracket/:id/proceed-to-next-round', requireAuth, proceedToNextRound)` above the `/:sessionId` catch-all
- `baby-name-bracket-app/components/bracket/BracketListView.jsx` — added `bracketId` and `onProceedToNextRound` props; added `ROUND_ORDER`/`nextRoundLabel` derivation; added `allMatchupsHaveVotes` boolean; added `proceedLoading` state; added `handleProceedToNextRound` handler; added Owner 1 CTA block and guest waiting-state block

---

## UserBracket Voting Architecture Refactor

**Completed:** 2026-05-19

**Summary:** Replaced the embedded per-matchup vote-counter approach with a per-user `UserBracket` document that stores each guest's complete 31-slot bracket prediction, enables picks-based bracket projection, and tracks correct/wrong results as the admin advances official rounds. The `VoteSchema`, `votes` array, `guestLockIns` array, and `name1Votes`/`name2Votes` fields were removed from the `Bracket` model. A new `UserBracket` Mongoose model was added (bracketId+userId compound unique index, picks object with five round arrays, score, lockedAt). The `generateAllRoundStubs` utility was rewritten to produce only Round of 32 stubs; future-round matchups are now created on-the-fly by `advanceMatchupWinners` using real winner IDs. Three new backend endpoints were added (`GET /api/bracket/:id/my-bracket`, `POST /api/bracket/:id/my-bracket/pick`, `POST /api/bracket/:id/my-bracket/lock`) and the old `castVote`, `getUserVotes`, and `guestLockIn` controllers/routes were removed. The `proceedToNextRound` controller gained a `fanOutScores` helper that increments each locked UserBracket's score for every correct pick after a round advances. On the frontend, `voteMap`/`fetchVotedMatchups`/`computeGuestPredictions`/`guestBracket.js` were all removed; `userBracket` state and `fetchUserBracket` replace them. `BracketListView` and `ListMatchupCard` were updated to derive pick/lock state from `userBracket.picks` rather than `voteMap`, and future-round display is derived from picks arrays via a new `picksToPseudoMatchups` helper rather than from DB stubs.

**Files changed:**
- `baby-name-bracket-api/models/UserBracket.js` (created)
- `baby-name-bracket-api/models/Bracket.js` (modified — removed VoteSchema, votes array, guestLockIns array, name1Votes/name2Votes from MatchupSchema, stale votes.voterId index)
- `baby-name-bracket-api/utils/seedingAlgorithm.js` (modified — removed makeStubMatchup helper, removed projectNextRound function, rewrote generateAllRoundStubs to emit R32 only)
- `baby-name-bracket-api/utils/bracketProgression.js` (modified — replaced stub-update loop with matchup-creation loop for next-round matchups; kept synchronous)
- `baby-name-bracket-api/controllers/bracketController.js` (modified — added UserBracket require; removed castVote, getUserVotes, guestLockIn; updated proceedToNextRound with winners-set guard and fanOutScores call; added fanOutScores helper; added getMyBracket, submitPick, lockMyBracket controllers; updated buildCurrentBracketResponse to remove votes serialization)
- `baby-name-bracket-api/routes/bracketRoutes.js` (modified — removed castVote/getUserVotes/guestLockIn routes; added GET /api/bracket/:id/my-bracket, POST /api/bracket/:id/my-bracket/pick, POST /api/bracket/:id/my-bracket/lock)
- `baby-name-bracket-app/components/pages/BracketView.jsx` (modified — removed fetchVotedMatchups/voteMap/computeGuestPredictions; added userBracket state, fetchUserBracket, handleGuestLockIn rewrite, picksToPseudoMatchups helper; passes userBracket to BracketListView and BracketView)
- `baby-name-bracket-app/components/bracket/BracketListView.jsx` (modified — replaced voteMap/lockedRounds props with userBracket; derived pick/lock/allVoted from userBracket.picks; updated admin CTA guard to matchups.every(m => m.winnerId))
- `baby-name-bracket-app/components/bracket/ListMatchupCard.jsx` (modified — replaced handleVote/voteMap/isLockedIn with handlePick/userPickId/isLocked; updated userVotedNameId and canVote derivations; removed vote bars for guests)
- `baby-name-bracket-app/utils/guestBracket.js` (deleted)
- `baby-name-bracket-app/components/bracket/BracketView.jsx` (modified — removed syntheticPred IIFEs; replaced guestPredictions-based PlaceholderMatchup prediction with userBracket.picks-based derivation; removed getFeederLeader vote-count dependency for future-round names)

---

## Vote Change Round-of-16 TBD Fix

**Completed:** 2026-05-18

**Summary:** Fixed the Round of 16 placeholder slot showing TBD immediately after a guest changed their vote on a Round of 32 matchup. Two independent bugs combined to produce the symptom. Bug 1: `getFeederLeader()` returned `null` on any tied or 0-0 vote state, propagating TBD to the R16 slot; fixed by falling back to `name1` as a tie-break when the matchup has valid name slots (returning `null` only when no candidates exist at all). Bug 2: both R16 `PlaceholderMatchup` render sites (Div1 and Div2 Sweet 16 columns) derived their displayed names from `guestPredictions` (the guest's own individual picks) rather than from server vote counts in `bracketMatchups.roundOf32`; fixed by constructing a synthetic prediction object at each call site that replaces `guestName1Id`/`guestName2Id` with the vote-leader nameIds from `getFeederLeader()`, while still spreading in the existing `basePred` so correctness-scoring fields are preserved. After these two changes the R16 slot updates immediately whenever `bracketMatchups` re-renders following a `fetchBracket()` call, and never shows TBD due to a tied or zero-vote state.

**Files changed:**
- `baby-name-bracket-app/components/bracket/BracketView.jsx` — changed `getFeederLeader()` tie/zero-vote branch (line 38–39) from returning `null` to setting `leadSide = 'name1'` as fallback; replaced direct `<PlaceholderMatchup>` JSX at the Div1 R16 render site with an IIFE that computes `vl1`/`vl2` via `getFeederLeader()` and passes a `syntheticPred` object; applied the same IIFE pattern at the Div2 R16 render site using feeder indices `(4 + i) * 2` and `(4 + i) * 2 + 1`

**Archived plan:** `plans/completed/vote-change-r16-tbd-fix.md`

---

## Owner Bracket & Pick Winners Conflict View

**Completed:** 2026-05-19

**Summary:** Gave both owners independent, server-persisted bracket predictions on the Pick Winners page. Previously, the Pick Winners page stored all picks locally in `localStorage` under a shared `parentPicks` key, requiring both owners to use the same browser session. The feature replaces that localStorage-only approach by fetching each owner's `UserBracket` document via the existing `GET /api/bracket/:id/my-bracket?userId=<id>` endpoint (called twice in parallel — once per owner, using `bracket.owner1UserId` and `bracket.owner2UserId` already present in bracket state). Per-matchup conflict status (`agreed` / `disagreed` / `partial` / `unpicked`) is now derived from the two server-fetched pick maps rather than from local state. Matchup cards render green badges when both owners agree on a winner and red conflict highlights with "O1" / "O2" badges when they disagree. Each owner's picks are submitted via `POST /api/bracket/:id/my-bracket/pick` with their own userId, making predictions independent and persistent across browser sessions. The `allAgreed` guard on the "Advance Round" button correctly requires server-confirmed matching picks from both owners. No backend changes were required: `owner1UserId` / `owner2UserId` were already indexed on the Bracket schema and returned by the existing `GET /api/bracket/:id` response, and `requireAuth` on the my-bracket endpoints only requires a valid token rather than a matching subject claim.

**Files changed:**
- `baby-name-bracket-app/components/pages/BracketPickWinner.jsx` — added `owner1Bracket` / `owner2Bracket` state; added `fetchOwnerBrackets` parallel-fetch function called on bracket load and after each successful `handlePick`; replaced `getStatus(matchup)` localStorage derivation with server-pick-based conflict logic; updated `handlePick` to POST via API and re-fetch; updated `renderNameOption` badges to read from fetched UserBracket picks; removed localStorage `parentPicks` as authoritative source

**Archived plan:** `plans/completed/owner-bracket-pick-winners.md`

---

## Seed Persistence Fix and Reset Picks

**Completed:** 2026-05-19

**Summary:** Fixed seed numbers disappearing on future-round placeholder matchup cards (Elite 8, Final 4, Championship) in the bracket visualization, and introduced a "Reset Picks" button that lets guests clear all their predictions and start from a blank bracket as long as they have not yet locked in. The seed fix builds a `nameSeedMap` once from `bracketMatchups.roundOf32` (always fully populated once the bracket is active) near the top of the visualization component body, then replaces five `getPickedSeed(feeder, nameId)` call sites in placeholder blocks — which returned `null` whenever the intermediate feeder rounds had not yet been advanced — with direct `nameSeedMap[nameId] ?? null` lookups. The Reset Picks feature adds a new `POST /api/bracket/:bracketId/my-bracket/reset` backend endpoint that reads the `userId` from the request body, enforces a 403 if `lockedAt` is set, then sets all five picks arrays to empty and clears `lockedAt` before returning the updated `UserBracket` document. On the frontend, a `handleResetPicks` async handler was added to the page-level `BracketView` component and passed as `onResetPicks` to both the bracket visualization component and the list view. Both receive an inline confirm/cancel flow (rendered near the lock-in area) that is only visible when `totalPickCount > 0 && !isLocked`.

**Files changed:**
- `baby-name-bracket-api/controllers/bracketController.js` — added `resetMyBracket` controller function; added to `module.exports`
- `baby-name-bracket-api/routes/bracketRoutes.js` — imported `resetMyBracket`; registered `POST /bracket/:id/my-bracket/reset` grouped with the other `my-bracket` routes
- `baby-name-bracket-app/components/bracket/BracketView.jsx` (visualization) — added `nameSeedMap` from `roundOf32`; replaced `getPickedSeed` calls at 5 placeholder sites (Sweet 16 Div1, Elite 8 Div1, F4 Div1, F4 Div2, Sweet 16 Div2); added `onResetPicks` prop, `showResetConfirm` state, `canReset` derived boolean, and inline confirm/cancel Reset button block
- `baby-name-bracket-app/components/pages/BracketView.jsx` (page) — added `handleResetPicks` async handler; passed `onResetPicks={handleResetPicks}` to both `<BracketView>` and `<BracketListView>`
- `baby-name-bracket-app/components/bracket/BracketListView.jsx` — added `onResetPicks` prop, `showResetConfirm` state, `canReset` derived boolean, and inline confirm/cancel Reset button block

**Archived plan:** `plans/completed/seed-persistence-and-reset-picks.md`

---

## E8 Div2 R16 Index Fix

**Completed:** 2026-05-19

**Summary:** Fixed an operator-precedence bug in the Elite 8 Division 2 `PlaceholderMatchup` else-branch in `BracketView.jsx` where `(4 + i) * 2` evaluated to 8 (i=0) or 10 (i=1) — both out of bounds for the Round of 16 picks array (indices 0–7). The correct expression is `4 + i * 2`, yielding indices 4 and 6. Additionally, the same block still used the old `getPickedSeed(r16Feeders[...], nameId)` pattern rather than the `nameSeedMap` lookup already adopted by every other placeholder site; the two dead local variables `r16Feeders` and `globalR16Base` were also removed. After these changes, the E8 Div2 placeholder cards correctly show the predicted R16 winner names once R16 Division 2 picks have been made, and the F4 Div2 placeholder card updates reactively when the user picks from E8 Div2.

**Files changed:**
- `baby-name-bracket-app/components/bracket/BracketView.jsx` — fixed `(4 + i) * 2` → `4 + i * 2` for both `name1Id` and `name2Id` index expressions; replaced `getPickedSeed(r16Feeders[globalR16Base], name1Id)` / `getPickedSeed(r16Feeders[globalR16Base + 1], name2Id)` with `nameSeedMap[name1Id] ?? null` / `nameSeedMap[name2Id] ?? null`; removed now-unused `r16Feeders` and `globalR16Base` local variables

**Archived plan:** `plans/completed/e8-div2-r16-index-fix.md`

---

## Bracket Lock-In & Championship Display Fixes

**Completed:** 2026-05-19

**Summary:** Fixed three related bugs in the bracket views. First, the "Lock In My Bracket" button in the bracket view was appearing before all 31 picks were made because the `allPicksFilled` check only looked at rounds that had data rather than requiring all 31 slots; replaced with a hard count against the known total of 31 picks (16 + 8 + 4 + 2 + 1). Second, the championship card failed to display either finalist's name or seed even after both Final 4 picks were made; the fix derives the two finalists from `picks.final4[0]` and `picks.final4[1]` and their seeds from `nameSeedMap`, then passes them as a dynamic `prediction` object to `PlaceholderMatchup`, mirroring the pattern already used for the Final 4 placeholder cards. Third, the list view's "Lock In My Bracket" button was never shown during an active tournament because the condition was gated on `isTournamentComplete` (true only when the tournament is completed or a champion is set) rather than `!isTournamentComplete`; flipping the boolean aligns the lock-in button and the locked-state banner to the same active-tournament lifecycle phase.

**Files changed:**
- `baby-name-bracket-app/components/bracket/BracketView.jsx` — Fix 1: replaced `roundsToCheck`-based `allPicksFilled` derivation with a hard 31-pick count across all five round arrays. Fix 2: replaced static `<PlaceholderMatchup prediction={null}>` in the Championship else-branch with a dynamic prediction derived from `picks.final4` and `nameSeedMap`.
- `baby-name-bracket-app/components/bracket/BracketListView.jsx` — Fix 3: changed `isTournamentComplete` to `!isTournamentComplete` on the lock-in button condition (line 231).

**Archived plan:** `plans/completed/bracket-lockin-championship-fixes.md`

---

## Bracket View Button Centering

**Completed:** 2026-05-19

**Summary:** Repositioned the "Lock In My Bracket" / "Reset Picks" / "Bracket Locked In" block so it appears horizontally centered directly below the Championship card in the bracket visualization canvas, rather than floating 8px outside the right edge of the center column. The change replaced three inline style properties (`top`, `left`, `width`) on the absolute-positioned lock-in div: `left` moved from `calc(100% + 8px)` to `'0'`, `width` from `'160px'` to `'100%'` (spanning the full 280px center column), and `top` from the Championship card-body top to `${CHAMP_BODY_BOTTOM + 12}px` (12px of breathing room below the card bottom). The existing `text-center` class on the container naturally centers all child elements. No other properties, class names, inner JSX, event handlers, or views were changed.

**Files changed:**
- `baby-name-bracket-app/components/bracket/BracketView.jsx` — replaced `top`/`left`/`width` style properties on the absolute-positioned lock-in block

**Archived plan:** `plans/completed/bracket-button-centering.md`

---

## Bracket Button Right-Side Vertical Centering

**Completed:** 2026-05-19

**Summary:** Repositioned the "Lock In My Bracket", "Reset Picks", and "Bracket Locked In" block so it appears to the right of the Championship card and is vertically centered alongside it, rather than sitting below the card. The fix replaces three inline style properties on the absolute-positioned lock-in div: `top` changes from `${CHAMP_BODY_BOTTOM + 12}px` to `${TOTAL_HEIGHT / 2}px` (aligning the transform origin with the Championship card's vertical midpoint at 520px), `left` changes from `'0'` to `'calc(100% + 8px)'` (placing the block just outside the right edge of the 280px center column with an 8px gap), and `width` changes from `'100%'` to `'160px'` (constraining the block width for button text). A `transform: 'translateY(-50%)'` property is added to pull the block upward by half its own height, achieving true vertical centering without needing to know the button block's rendered height. The `pt-4` padding on the "Bracket Locked In" badge wrapper is removed (changed to a plain `<div>`) since that padding was compensating for the old below-card position and is no longer appropriate when the block is centered via transform. No other class names, event handlers, or views were changed.

**Files changed:**
- `baby-name-bracket-app/components/bracket/BracketView.jsx` — replaced `top`/`left`/`width` style properties on the absolute-positioned lock-in block; added `transform: 'translateY(-50%)'`; removed `pt-4` from the "Bracket Locked In" badge wrapper div

**Archived plan:** `plans/completed/bracket-button-right-vcenter.md`

---

## Remove Owner 2 — Full Bracket Reset

**Completed:** 2026-05-19

**Summary:** Expanded the Remove Owner 2 action into a complete official bracket reset. Previously the controller only cleared Owner 2's names and reverted matchup state; this feature extends it to also delete every UserBracket prediction document for the bracket (covering Owner 1, Owner 2, and all guests), clear the `guestUserIds` array so previously joined guests are fully removed, and clear all Owner 2 identity fields (`owner2UserId`, `owner2Name`, `owner2Email`, `inviteCode` set to null) so a fresh invite can be issued. The frontend confirmation modal copy was updated to accurately describe the full scope: all pick brackets, guest participants, and tournament progress are permanently erased; only Owner 1's submitted names are kept. No route or response shape changes were needed.

**Files changed:**
- `baby-name-bracket-api/controllers/bracketController.js` — added `UserBracket.deleteMany({ bracketId: bracket._id })` call, `bracket.guestUserIds = []` clear, and Owner 2 identity field resets (`owner2UserId`, `owner2Name`, `owner2Email`, `inviteCode`) inside the `removeOwner2` controller function after the `owner2LockedIn = false` line
- `baby-name-bracket-app/components/layout/Navbar.jsx` — updated the `showRemoveOwner2Modal` ConfirmModal `message` prop to describe the full data-loss scope including pick brackets, guest participants, and tournament progress

**Archived plan:** `plans/completed/remove-owner2-full-bracket-reset.md`

---

## Navbar Danger Zone — Auth Header Fix

**Completed:** 2026-05-19

**Summary:** Fixed all four Owner 1 danger-zone actions (Remove Owner 2, Delete Bracket, Reset & Regenerate, Unlock Names) silently failing with 401 errors. The root cause was that `token` was never destructured from `useUser()` in `Navbar.jsx`, so all four handler functions omitted the `Authorization: Bearer <token>` header required by the `requireAuth` middleware. The fix destructures `token` from `useUser()` and adds the `Authorization` header to each of the four fetch calls. No backend changes, no UI changes, and no contract changes were required — the endpoints already accepted the correct header format.

**Files changed:**
- `baby-name-bracket-app/components/layout/Navbar.jsx` — destructured `token` from `useUser()`; added `Authorization: Bearer ${token}` header to `handleDeleteBracket`, `handleRemoveOwner2`, `handleResetAndRegenerate`, and `handleUnlockNames` fetch calls

**Archived plan:** `plans/completed/navbar-danger-zone-auth-fix.md`

---

## Navbar Restructure — All Brackets Top Bar + Reordered Dropdown

**Completed:** 2026-05-19

**Summary:** Reorganized the hamburger menu navbar so that an "All Brackets" link (with a house emoji) replaces the "Baby Name Bracket" brand text in the top-left of the navbar and navigates to `/`. The redundant "All Brackets" row that was previously inside the main dropdown panel was removed. Inside the hamburger main panel, two owner-only items (Names and Pick Round Winners) were promoted from the Settings sub-panel to top-level rows between the Profile button and the Settings button, gated on `isOwnerOfCurrentBracket && ownerLinks.length > 0`. The Settings sub-panel was slimmed to contain only Invite People, Bracket Health, and Danger Zone — removing the Names and Pick Round Winners links from that panel. Non-owners are unaffected because all new rows are gated on the same `isOwnerOfCurrentBracket` guard already in use for the Settings button.

**Files changed:**
- `baby-name-bracket-app/components/layout/Navbar.jsx` — single file modified: replaced brand link emoji and label text; removed "All Brackets" dropdown row; added owner-only main-panel block for `ownerLinks`; replaced settings sub-panel `ownerLinks.map` + Invite People block with Invite People-only block

**Archived plan:** `plans/completed/navbar-restructure.md`

---

## Profile Icon Picker

**Completed:** 2026-05-19

**Summary:** Gave every authenticated user a personal emoji icon they can select from a grid in the Profile sub-panel of the hamburger menu navbar. The backend and API layer were already fully scaffolded: the `User` model carried an `icon` field (default `'👤'`), `authController.js` defined `VALID_ICONS` (13 options) and already read/wrote/returned `icon` in `updateProfile`, `setName`, `verifyCode`, and `getMe`, `authApi.js` already forwarded `icon` in `updateProfile`, and `UserContext` already surfaced `user.icon` to all consumers. The only change required was the frontend UI inside `Navbar.jsx`: a module-level `PICKER_ICONS` array (all 13 server-validated options) was added, an `iconSaving` boolean state and a `handleIconSelect` async handler were added to the component, and the Profile sub-panel body was expanded with a 5-column emoji grid in which the currently active icon is highlighted with an indigo ring. Tapping any icon calls `PUT /api/auth/profile` with the new value, receives the updated user object, and calls `updateUser()` to push it into `UserContext` — the navbar menu button re-renders immediately without a page reload. Non-owner users now display their chosen icon (falling back to `😊`) in the menu button where a crown previously appeared; owner users retain the `👑` crown as a role indicator.

**Files changed:**
- `baby-name-bracket-app/components/layout/Navbar.jsx` — added `updateProfile` import; destructured `updateUser` from `useUser()`; added `PICKER_ICONS` module-level constant; added `iconSaving` state and `handleIconSelect` handler; expanded Profile sub-panel body with icon-picker grid section; updated navbar menu button and main-panel identity header to show `user?.icon` for non-owners

**Archived plan:** `plans/completed/profile-icon-picker.md`

---

## Profile Icon Picker Reorder

**Completed:** 2026-05-19

**Summary:** Moved the "Choose your icon" emoji picker grid to the bottom of the Profile sub-panel, after the navigation buttons (Back, View Bracket Dashboard, Update Information). Previously the icon picker rendered between the Back button and the navigation buttons. The fix swaps the two JSX blocks so the rendering order is Back → navigation buttons → icon picker, and changes the icon picker wrapper's border class from `border-b` to `border-t` so the separator line visually sits above the picker (now at the bottom) rather than below it. This is a pure JSX block reorder within the Profile sub-panel branch of `Navbar.jsx` — no state, props, event handlers, or data flow were affected.

**Files changed:**
- `/Users/garrettamidon/workspace/ai-workshop/baby-name-bracket-app/components/layout/Navbar.jsx`

**Archived plan:** `plans/completed/profile-icon-picker-reorder.md`

---

## Owner Display Names, Icon Picker & Shared-Names Reset Fix

**Completed:** 2026-05-19

**Summary:** Replaced all hardcoded "Husband" / "Wife" / "Owner 1" / "Owner 2" UI labels throughout the app with each owner's real display name and personal emoji icon. A new `icon` field (default `'👤'`, validated against 13 allowed emoji) was added to the User model and surfaced through all auth endpoints (`setName`, `getMe`, `verifyCode`, `updateProfile`, `verifyEmailChange`). The Bracket model gained `owner1Icon` and `owner2Icon` fields populated when a bracket is created (`createBracket`) and when Owner 2 accepts the invite (`acceptOwner2`). The bracket response (`buildCurrentBracketResponse`) was extended to include both icon fields. The `removeOwner2` controller was fixed to clear the entire `sharedNames` array (previously only Owner 2's entries were filtered) and to reset `owner2Icon`. On the frontend, `BracketNames.jsx` gained four state variables for owner display names and icons, reads them from the API response, and uses them in all column headers, waiting-for-lock-in messages, and shared-name labels. `BracketPickWinner.jsx` similarly replaced all "Husband" / "Wife" role labels with dynamic owner display names. The sign-up name step in `AuthFlow.jsx` and the profile edit page (`/profile/edit`) both gained a visual emoji icon picker grid that stores the selection and passes it through to the API.

**Files changed:**
- `baby-name-bracket-api/models/User.js` — added `icon` field (String, default `'👤'`)
- `baby-name-bracket-api/models/Bracket.js` — added `owner1Icon` and `owner2Icon` String fields
- `baby-name-bracket-api/controllers/authController.js` — added `VALID_ICONS` validation; updated `setName`, `getMe`, `verifyCode`, `updateProfile`, `verifyEmailChange` to read/write/return `icon`
- `baby-name-bracket-api/controllers/lobbyController.js` — `createBracket` writes `owner1Icon` from user; `acceptOwner2` writes `owner2Icon` from user
- `baby-name-bracket-api/controllers/bracketController.js` — `buildCurrentBracketResponse` adds `owner1Icon`/`owner2Icon`; `removeOwner2` clears all `sharedNames` and resets `owner2Icon`
- `baby-name-bracket-app/lib/authApi.js` — `setName` and `updateProfile` accept and forward optional `icon` parameter
- `baby-name-bracket-app/components/auth/AuthFlow.jsx` — added `icon` state, `ICON_OPTIONS` constant, icon picker UI in the name step, passes `icon` to `setName`
- `baby-name-bracket-app/app/profile/edit/page.jsx` — added `icon` state, pre-filled from user context, icon picker grid in form, passes `icon` to `updateProfile`
- `baby-name-bracket-app/components/pages/BracketNames.jsx` — added `owner1Icon`, `owner2Icon`, `owner1DisplayName`, `owner2DisplayName` state; replaces all hardcoded role labels with dynamic names and icons in headers, waiting messages, and shared-name labels
- `baby-name-bracket-app/components/pages/BracketPickWinner.jsx` — replaced "Husband" / "Wife" role labels with `bracket?.owner1Name` / `bracket?.owner2Name` plus icon; added `owner1Icon`/`owner2Icon` from bracket state

**Archived plan:** `plans/completed/owner-display-names-and-icon.md`

---

## User Icon Surface Integration

**Completed:** 2026-05-19

**Summary:** Replaced generic placeholder icons (crowns and generic emoji) with each owner's personally selected emoji icon across three existing UX surfaces. In `Navbar.jsx`, both the menu-button trigger and the dropdown identity header were updated to always render the authenticated user's `user?.icon` (falling back to `'😊'`) instead of conditionally showing a `👑` crown for bracket owners — the crown was removed entirely as an identity signal. In `BracketPickWinner.jsx`, the hardcoded `const displayEmoji = isOwner ? '👑' : '👤'` derivation was replaced with `const displayEmoji = user?.icon || '😊'`, causing both the page subtitle ("Picking as ...") and the identity chip to show the user's real icon. `BracketNames.jsx` required no changes — it already correctly rendered `owner1Icon`/`owner2Icon` from the bracket API response. No backend or API contract changes were required; all icon data was already present from the prior `owner-display-names-and-icon` feature.

**Files changed:**
- `baby-name-bracket-app/components/layout/Navbar.jsx` — replaced both occurrences of `{isOwnerOfCurrentBracket ? '👑 ' : (user?.icon || '😊') + ' '}` with `{(user?.icon || '😊') + ' '}` (menu button trigger ~line 158 and dropdown identity header ~line 181)
- `baby-name-bracket-app/components/pages/BracketPickWinner.jsx` — replaced `const displayEmoji = isOwner ? '👑' : '👤'` with `const displayEmoji = user?.icon || '😊'` (~line 27)

**Archived plan:** `plans/completed/user-icon-surface-integration.md`

---

## Bracket Owner Icon Live Sync

**Completed:** 2026-05-19

**Summary:** Updated the `GET /api/bracket/:sessionId` endpoint to return each owner's current live emoji icon rather than the stale denormalized snapshot copied at bracket-creation or invite-accept time. A new `resolveOwnerIcons(bracket)` async helper was introduced in `bracketController.js` that fetches both owner `User` documents in a single `.lean()` query (projecting only `_id` and `icon`), then returns a two-field object with the live icon values, falling back to the bracket's stored icon and finally to the `'👤'` sentinel if a user record cannot be found. The `getBracket` handler was updated to call this helper after the existing synchronous `buildCurrentBracketResponse` call and override only the two icon fields before returning the response. All write-endpoint call sites for `buildCurrentBracketResponse` were intentionally left unchanged, as live icon resolution is only required on the read path. No schema changes, no frontend changes, and no API contract changes were needed — `owner1Icon` and `owner2Icon` were already present in the response shape.

**Files changed:**
- `baby-name-bracket-api/controllers/bracketController.js` — added `User` model import; added `resolveOwnerIcons` async helper; updated `getBracket` to call helper and override `owner1Icon`/`owner2Icon` on the response before returning

**Archived plan:** `plans/completed/bracket-owner-icon-live-sync.md`

---

## Test User Seeding, QA Agent, and Testing Plan Infrastructure

**Completed:** 2026-05-19

**Summary:** Introduced a reserved test-email convention (`/^test\+.+@amidonlabs\.com$/i`) that bypasses OTP so seeded accounts can instantly access the app, and wired a new `quality-assurance` agent into the orchestrator workflow so every future feature ships with a verifiable test path. On the backend, `authController.js` short-circuits both `requestCode` and `verifyCode` for matching emails (upserts the User record, skips OTP creation and email delivery, signs and returns a valid JWT). A shared `testEmail.js` utility exports the regex so the pattern is defined once. `lobbyController.js` was extended to include an `allActive` key in the `listMyBrackets` response when the authenticated user is a test-email address, returning every bracket whose `status === 'active'` without requiring an invite. On the frontend, `AuthFlow.jsx` detects the test-email pattern on submit and calls `verifyCode` directly with a dummy code, skipping the OTP step entirely. Four agent definition files were authored or updated: `quality-assurance.md` (new agent that reads `plans/testing-plan.md` and emits a verification checklist, or exits immediately when preference is `"none"`), `orchestrator.md` (new Phase 6 spawning the QA agent between systems-scribe and cleanup), `setup.md` (new testing-preference interview questions and `plans/testing-plan.md` generation in Step 3a), and `systems-scribe.md` (mandatory "Testing with guest accounts" section added to every `integration.md` it writes).

**Files changed:**
- `baby-name-bracket-api/utils/testEmail.js` (created — exports `TEST_EMAIL_RE`)
- `baby-name-bracket-api/controllers/authController.js` (modified — imports `TEST_EMAIL_RE` from utility; `requestCode` short-circuit for test emails; `verifyCode` short-circuit for test emails)
- `baby-name-bracket-api/controllers/lobbyController.js` (modified — `listMyBrackets` adds `allActive` parallel query for test-email users)
- `baby-name-bracket-app/components/auth/AuthFlow.jsx` (modified — detects test-email pattern on submit; calls `verifyCode` directly; skips OTP step)
- `ai-agents/.rulesync/subagents/quality-assurance.md` (created — canonical quality-assurance agent definition)
- `.claude/agents/quality-assurance.md` (created — deployed quality-assurance agent)
- `ai-agents/.rulesync/subagents/orchestrator.md` (modified — Phase 6 QA spawn inserted; phase table updated; anti-pattern entry added)
- `.claude/agents/orchestrator.md` (modified — same as canonical)
- `ai-agents/.rulesync/subagents/setup.md` (modified — testing-preference Q&A; Step 3a writes `plans/testing-plan.md` and updates `plans/project-config.json`)
- `.claude/agents/setup.md` (modified — same as canonical)
- `ai-agents/.rulesync/subagents/systems-scribe.md` (modified — mandatory "Testing with guest accounts" section added to every integration.md)
- `.claude/agents/systems-scribe.md` (modified — same as canonical)

**Archived plan:** `plans/completed/test-user-seeding-and-qa-agent.md`

---

## Owner 2 Invite Prompt in Names View

**Completed:** 2026-05-19

**Summary:** When a bracket has no Owner 2 yet, the Owner 2 column on the names page now shows an "Invite a Partner" card instead of an empty name-entry form. Owner 1 enters a partner email address, submits it, and sees an "Invite sent!" confirmation — all without leaving the names page. Guests and an already-joined Owner 2 never see the card. After Owner 2 accepts the invite and joins, the column reverts to the normal name-entry view. The backend adds a new `POST /api/brackets/:id/invite-owner2` endpoint (with Owner 1-only and already-joined guards) that reuses the existing `sendInviteEmail` utility and `inviteCode` / `owner2Email` fields on the Bracket model. The frontend adds `owner2UserId` state read from the existing `GET /api/bracket/:sessionId` response, three invite-card state variables (`inviteEmail`, `inviteStatus`, `inviteError`), a `handleInviteOwner2` form submit handler, and a conditional render in the Owner 2 column that swaps the invite card in whenever `isOwner1 && !owner2UserId`.

**Files changed:**
- `baby-name-bracket-api/controllers/lobbyController.js` — added `resendOwner2Invite` controller function; validates Owner 1 only (403), no existing Owner 2 (409), email format, generates `inviteCode` if missing, sets `owner2Email`, calls `sendInviteEmail`, returns `200 { sent: true, inviteCode }`; exported alongside existing functions
- `baby-name-bracket-api/routes/lobbyRoutes.js` — imported `resendOwner2Invite`; registered `router.post('/brackets/:id/invite-owner2', requireAuth, resendOwner2Invite)`
- `baby-name-bracket-app/components/pages/BracketNames.jsx` — added `owner2UserId` state populated from `fetchBracketData`; added `inviteEmail`, `inviteStatus`, `inviteError` state variables; added `handleInviteOwner2` async handler calling the new endpoint; replaced the Owner 2 column body with a conditional render (`isOwner1 && !owner2UserId` → invite card, otherwise existing form/lock/names content)

**Archived plan:** `plans/completed/owner2-invite-from-names.md`

---

## Hamburger Menu — "View Bracket" First Option

**Completed:** 2026-05-19

**Summary:** Added a "View Bracket" item as the very first entry in the hamburger menu for any bracket-scoped page. On pages associated with a specific bracket (bracket detail, name submission, voting views), a "View Bracket" link with a trophy emoji appears before all existing menu items and navigates to `/bracket/${currentBracketId}`. On the all-brackets listing page (`/`), the item is hidden entirely. The implementation derives a `showViewBracket` boolean (`!!currentBracketId && pathname !== '/'`) from existing context values — `currentBracketId` from `useBracket()` and `pathname` from `usePathname()` — requiring no new props, API calls, or state. An active-page indicator (indigo dot) appears when the user is already on the bracket view page. All previously existing menu items retain their relative order after "View Bracket".

**Files changed:**
- `baby-name-bracket-app/components/layout/Navbar.jsx` — added `showViewBracket` derived constant; inserted a new JSX block as the first item inside the `activePanel === 'main'` branch rendering a `<Link>` to `/bracket/${currentBracketId}` with active-route indigo dot indicator

---

## Suppress Body Hydration Warning

**Completed:** 2026-05-19

**Summary:** Eliminated the React hydration mismatch warning caused by browser extensions (e.g., ColorZilla, Grammarly, `cz-shortcut-listen`) injecting attributes into the `<body>` tag after server-side rendering. The fix adds the `suppressHydrationWarning` prop to the `<body>` element in the root layout, which tells React to skip attribute-level reconciliation checks on that element only. No child elements, rendering behavior, app UI, or visible behavior were changed. This is the idiomatic Next.js / React solution for browser-extension-caused body attribute mismatches.

**Files changed:**
- `baby-name-bracket-app/app/layout.js` — added `suppressHydrationWarning` prop to the `<body>` element

**Archived plan:** `plans/completed/suppress-body-hydration-warning.md`

---

## List View Lock-In Gate, Bottom Nav, and Bracket View Mobile Nav

**Completed:** 2026-05-19

**Summary:** Polished the bracket experience with three coordinated frontend improvements. First, the "Lock My Bracket" button in the list view is now gated: when not all picks are filled it is hidden entirely and replaced with a plain helper text message ("Complete all your picks to lock in."), preventing premature lock-in clicks. Second, a bottom round-navigation row (left/right arrow buttons + round label) is duplicated below the last matchup card in the list view, eliminating the need to scroll back to the top to change rounds. Third, on mobile viewports (below the `md` breakpoint), the bracket canvas view gains a sticky bottom navigation bar with the same left/right arrow + round-label controls, which scroll the canvas horizontally to the selected round's column via `scrollToRound`; this bar is hidden on desktop. All changes are purely frontend; no backend, API, or prop-signature changes were required.

**Files changed:**
- `baby-name-bracket-app/components/bracket/BracketListView.jsx` — gate "Lock My Bracket" button behind `allPicksFilled`; extract `RoundNavRow` inline component; render bottom `RoundNavRow` after the last matchup/action block
- `baby-name-bracket-app/components/bracket/BracketView.jsx` — add `displayRoundKey` state; add `ROUND_ORDER`, `ROUND_DISPLAY`, and `ROUND_REF_MAP` local constants; add `flex md:hidden` sticky bottom nav bar that calls `scrollToRound` on arrow press

**Archived plan:** `plans/completed/list-view-lock-and-nav-improvements.md`

---

## Pick a Winner — Real-Time Vote Updates via Polling

**Completed:** 2026-05-19

**Summary:** Added automatic polling to the Pick a Winner page so vote tallies and co-owner bracket picks refresh every 9 seconds without any user interaction. A single `useEffect` hook was added to `BracketPickWinner.jsx` that runs only when `bracket?.status === 'active'`, calls `fetchVoteTallies()` and `fetchOwnerBrackets()` in parallel via `Promise.all`, and restarts the interval whenever either owner's tab regains visibility using the Page Visibility API. The interval is cleared and the `visibilitychange` listener is removed in the cleanup function to prevent memory leaks on unmount or navigation. No backend changes, no new endpoints, no UI controls, and no new state variables were required — the feature is purely additive `useEffect` logic reusing existing fetch functions.

**Files changed:**
- `baby-name-bracket-app/components/pages/BracketPickWinner.jsx` — added polling `useEffect` with `setInterval(poll, 9000)`, `visibilitychange` handler that clears/restarts the interval on tab hide/show, and cleanup function that clears interval and removes listener on unmount; dependency array `[bracket?.status]`

**Archived plan:** `plans/completed/pick-winner-realtime-polling.md`

---

## Vote Tally Display and Advance Round Fix

**Completed:** 2026-05-19

**Summary:** Fixed two regressions introduced by the UserBracket voting refactor. Bug 1: the `proceedToNextRound` controller discarded the return value of `advanceMatchupWinners()`, so no changes were saved and the endpoint returned a 500 "Failed to advance round" error. Fixed by capturing the return value (`bracket = advanceMatchupWinners(bracket, currentRoundKey)`). Bug 2: the Pick a Winner page and the bracket view always showed 0 votes and a 50/50 split because `m.votes?.name1Votes` never resolved from MatchupSchema documents. Fixed by adding a backend `aggregateVoteTallies` helper that counts picks across all locked UserBracket documents and a new `GET /api/bracket/:id/vote-tallies` endpoint, then updating the frontend to fetch tallies independently and substitute them into the `votes1`/`votes2` derivation in both `BracketPickWinner.jsx` and `pages/BracketView.jsx`. The `components/bracket/BracketView.jsx` defensive read for `feeder.votes?.name1Votes` was also aligned to use the flat `votes1`/`votes2` fields.

**Files changed:**
- `baby-name-bracket-api/controllers/bracketController.js` — fixed `proceedToNextRound` return-value capture; added `aggregateVoteTallies` async helper; added `getVoteTallies` controller; added `getVoteTallies` to `module.exports`
- `baby-name-bracket-api/routes/bracketRoutes.js` — imported `getVoteTallies`; registered `router.get('/bracket/:id/vote-tallies', getVoteTallies)` above the `/:sessionId` catch-all
- `baby-name-bracket-app/components/pages/BracketPickWinner.jsx` — added `voteTallies` state; added `fetchVoteTallies` helper; added `useEffect` to load tallies on bracket load; replaced `m.votes?.name1Votes`/`m.votes?.name2Votes` derivation with tally lookup; added `index` parameter to matchup map callback; updated `fetchBracket` to also call `fetchVoteTallies`
- `baby-name-bracket-app/components/pages/BracketView.jsx` — added `voteTallies` state; added `fetchVoteTallies` helper; added `useEffect` to load tallies; updated `normalizeMatchup` `votes1`/`votes2` lines to prefer tally data; updated `handleAdvanceRound` to refresh tallies after round change
- `baby-name-bracket-app/components/bracket/BracketView.jsx` — updated `feeder.votes?.name1Votes` references at lines 24–25 to use `feeder.votes1 ?? feeder.votes?.name1Votes ?? 0` pattern

**Archived plan:** `plans/completed/vote-tally-and-advance-round-fix.md`

---

## Hamburger Menu — User Name Always on Top Row

**Completed:** 2026-05-19

**Summary:** Ensured the currently-logged-in user's display name is always the very first row inside the hamburger menu, regardless of what other items are present. The existing user-identity `<div>` block (which could previously appear below the conditional "View Bracket" link on bracket-scoped pages) was moved to be the first child rendered inside the `activePanel === 'main'` fragment. The name text was upgraded from `text-sm font-semibold` to `text-base font-bold` to meet the visual-distinction acceptance criterion. A final `|| 'Guest'` guard was added to the display-name expression so the row always shows something meaningful when both `user?.displayName` and the `displayName` context value are empty. No other logic, state, imports, or props were changed.

**Files changed:**
- `baby-name-bracket-app/components/layout/Navbar.jsx` — moved user-identity `<div>` to first child of `activePanel === 'main'` fragment; upgraded name text to `text-base font-bold`; added `|| 'Guest'` fallback guard

**Archived plan:** `plans/completed/hamburger-menu-user-name-top-row.md`

---

## POST /api/bracket/advance 500 Error Fix

**Completed:** 2026-05-19

**Summary:** Eliminated the 500 error thrown when the bracket owner confirms "Advance to Next Round" via `POST /api/bracket/advance`. Four root-cause defects were fixed: (1) `bracket.markModified('matchups')` was missing before `bracket.save()`, causing Mongoose to silently drop the sub-array replacement written by `advanceMatchupWinners`; (2) two inline `require('uuid').v4()` calls in `bracketProgression.js` were replaced with the already-imported `uuidv4` alias; (3) `fanOutScores` was not called after `bracket.save()` in `advanceRound`, so user bracket scores were never updated (parity with `proceedToNextRound` restored); (4) `proceedToNextRound` declared `bracket` with `const` and then reassigned it on a later line, causing a `TypeError: Assignment to constant variable` crash — changed to `let`. A `roundNormMap` was added inside `advanceRound` to normalize the incoming `round` body parameter to its camelCase key before passing it to `fanOutScores`.

**Files changed:**
- `baby-name-bracket-api/utils/bracketProgression.js` — replaced two inline `require('uuid').v4()` calls (lines 114 and 129) with `uuidv4` (the already-imported module-level alias)
- `baby-name-bracket-api/controllers/bracketController.js` — added `roundNormMap`/`normalizedRoundKey` in `advanceRound`; added `updatedBracket.markModified('matchups')` before `bracket.save()`; added `await fanOutScores(...)` after `bracket.save()`; changed `const bracket` to `let bracket` in `proceedToNextRound`

**Archived plan:** `plans/completed/advance-round-500-fix.md`

---

## Profile Setup Prompt on Login

**Completed:** 2026-05-19

**Summary:** Gated app access behind a mandatory profile-setup modal for any authenticated user whose profile is missing a display name or icon. Rather than adding new endpoints, the feature wires the existing backend infrastructure (already-complete `GET /api/auth/me` in `UserContext` and `POST /api/auth/set-name` in `lib/authApi.js`) into three coordinated frontend changes. A derived `isProfileComplete` boolean (`!!(user?.displayName && user?.icon)`) was added to `UserContext` so all consumers share a single canonical completeness definition. `AuthGate.jsx` gained a third gate state — authenticated but `!isProfileComplete` — which renders the new `ProfileSetupModal` instead of the app children, blocking navigation entirely. `ProfileSetupModal.jsx` is a non-dismissible full-viewport modal (no close button, no escape, no backdrop dismiss) that pre-populates `displayName` from the existing user record if already set, presents an emoji icon picker grid, and on submit calls `setName(displayName.trim(), token, icon)` then `updateUser(updatedUser)` to propagate the new values into context — causing `isProfileComplete` to become `true` and `AuthGate` to render the app automatically. A new shared `lib/constants.js` exports the `ICON_OPTIONS` array so both `ProfileSetupModal` and `AuthFlow` import from one place. No backend changes were required.

**Files changed:**
- `baby-name-bracket-app/contexts/UserContext.js` — added `isProfileComplete` derived boolean to context value
- `baby-name-bracket-app/components/auth/AuthGate.jsx` — added third gate branch: `!isProfileComplete` → render `ProfileSetupModal`
- `baby-name-bracket-app/components/auth/ProfileSetupModal.jsx` — new non-dismissible profile-setup modal component
- `baby-name-bracket-app/lib/constants.js` — new shared constants file exporting `ICON_OPTIONS`
- `baby-name-bracket-app/components/auth/AuthFlow.jsx` — updated to import `ICON_OPTIONS` from `lib/constants.js`

**Archived plan:** `plans/completed/profile-setup-prompt.md`

---

## advanceRound — Auto-Set Winners from Owner Picks

**Completed:** 2026-05-19

**Summary:** Fixed `POST /api/bracket/advance` returning "Matchup has no winner set" when both owners have agreed picks but `matchup.winnerId` was never explicitly written to the database. The `advanceRound` controller in `bracketController.js` now includes a winner-resolution step inserted immediately after `normalizedRoundKey` is derived: if any matchup in the current round lacks a `winnerId`, the controller fetches owner1's `UserBracket` (no `lockedAt` filter) and applies `picks[normalizedRoundKey][position]` as each matchup's `winnerId`. For any position where owner1 has no pick, it lazily calls the existing `aggregateVoteTallies` helper (single DB call, reused for all missing positions) and assigns the vote leader, using `name1Id` as a tiebreaker. Already-set `winnerId` values are never overwritten. `bracket.markModified('matchups')` is called after the loop to ensure Mongoose persists the in-place mutations before `advanceMatchupWinners` runs. If no owner pick and no locked votes exist for a position, `matchup.winnerId` remains `null` and `advanceMatchupWinners` throws its original defensive error — intentionally preserving that guard for truly unresolvable matchups.

**Files changed:**
- `baby-name-bracket-api/controllers/bracketController.js` — inserted winner-resolution block after `normalizedRoundKey` derivation in `advanceRound`; fetches owner1's `UserBracket`, iterates round matchups, applies owner1 pick or `aggregateVoteTallies` fallback, calls `bracket.markModified('matchups')`

**Archived plan:** `plans/completed/advance-round-auto-set-winners.md`

---

## Owner Bracket Persistence

**Completed:** 2026-05-20

**Summary:** Fixed owners' personal bracket picks failing to persist across sessions. The root cause was that the three `my-bracket` routes had no authentication middleware, so `req.userId` was never set for authenticated callers; all three controllers resolved the caller from `req.query.userId` or `req.body.userId`, and the frontend always sent the anonymous localStorage `voterId` string rather than the authenticated owner's identity. The fix is two-sided: on the backend, a new `optionalAuth` middleware was added to `baby-name-bracket-api/middleware/auth.js` that extracts the JWT and sets `req.userId` when a valid Bearer token is present but calls `next()` unconditionally, leaving the unauthenticated guest path intact; all four `my-bracket` routes (`GET my-bracket`, `POST my-bracket/pick`, `POST my-bracket/lock`, `POST my-bracket/reset`) were wrapped with `optionalAuth`; and all four controllers now resolve `userId` with `req.userId || req.query.userId` (or `req.body.userId`), preferring the token-derived identity. On the frontend, `BracketView.jsx` was updated to destructure `token`, `user`, and `isOwner` from `useUser()`, derive an `effectiveUserId` that prefers `user.id` for owners, add an `authHeaders()` helper that injects the `Authorization: Bearer <token>` header for owner requests, update `fetchUserBracket` to send the token via header and omit the `userId` query param for owners, extend the `useEffect` dependency array to include `user?.id` and `token`, and update `handlePick`, `handleGuestLockIn`, and `handleResetPicks` to send owner requests without a body `userId` field.

**Files changed:**
- `baby-name-bracket-api/middleware/auth.js` — added `optionalAuth` middleware export
- `baby-name-bracket-api/routes/bracketRoutes.js` — imported `optionalAuth`; applied it to all four `my-bracket` routes
- `baby-name-bracket-api/controllers/bracketController.js` — updated `getMyBracket`, `submitPick`, `lockMyBracket`, and `resetMyBracket` to prefer `req.userId` over query/body param
- `baby-name-bracket-app/components/pages/BracketView.jsx` — added `token`/`user`/`isOwner` from `useUser()`; added `effectiveUserId`, `authHeaders()`; updated `fetchUserBracket`, fetch `useEffect`, `handlePick`, `handleGuestLockIn`, `handleResetPicks`

**Archived plan:** `plans/completed/owner-bracket-persistence.md`

---

## Test User Free Join for Active Brackets

**Completed:** 2026-05-20

**Summary:** Test users (emails matching `/^test\+.+@amidonlabs\.com$/i`) can now join any active bracket directly without supplying an invite code. On the backend, the `joinBracket` controller in `lobbyController.js` was extended to detect test-email callers (reusing the existing `TEST_EMAIL_RE` pattern already imported for `listMyBrackets`), then accept a `bracketId` body field as an alternative to `inviteCode`: for test callers, the bracket is looked up by `_id` and validated to be `status === 'active'` before the existing duplicate-owner and already-joined guards run. The `inviteCode`-required guard at the function top was relaxed to fire only when the caller is not a test user presenting a `bracketId`. Three new error codes were added (`400 bracketId is required for test user join`, `403 Test user bypass only available for active brackets`, and the reused `404 Bracket not found`). On the frontend, `LobbyPage` in `Lobby.jsx` was extended to detect the test-user flag, load the `allActive` list already returned by `getMyBrackets`, and pass both values into `JoinModal`. `JoinModal` was refactored to accept `isTestUser` and `allActive` props: for test callers it renders a scrollable list of joinable active brackets (filtered to exclude already-owned or already-joined entries) with a per-row "Join" button; for regular callers it renders the existing invite-code text input unchanged. A new `joinBracketById` function was added to `lib/lobbyApi.js` to post `{ bracketId }` to `POST /api/brackets/join`.

**Files changed:**
- `baby-name-bracket-api/controllers/lobbyController.js` — relaxed `inviteCode`-required guard; added test-user detection via `TEST_EMAIL_RE`; added `bracketId` bypass path with active-status validation; added three new error responses
- `baby-name-bracket-app/components/pages/Lobby.jsx` — added `isTestUser` derived flag; added `allActive` state populated from `getMyBrackets` response; refactored `JoinModal` to accept and render active-bracket list for test users; added test-user conditional branch inside modal
- `baby-name-bracket-app/lib/lobbyApi.js` — added `joinBracketById(bracketId, token)` function posting `{ bracketId }` to `POST /api/brackets/join`

**Archived plan:** `plans/completed/test-user-free-join.md`

---

## Authenticated Guest Bracket Identity Fix

**Completed:** 2026-05-20

**Summary:** Fixed authenticated users who join a bracket as a guest (including test users) all sharing the same bracket state because the identity-resolution logic in `BracketView.jsx` gated on `isOwner` to decide between `user.id` and the persistent localStorage `voterId`. Since `isOwner` is only `true` when a user has explicitly adopted the owner role, any authenticated non-owner fell through to the shared `voterId` path — meaning different logged-in accounts on the same browser would see, modify, and overwrite each other's picks. The fix introduces a three-tier identity resolution: (1) owners (`isOwner === true`, token present) continue to send a Bearer token with no `userId` param; (2) authenticated guests (`user?.id` present, `isOwner === false`) now send `userId = user.id` as a query/body param without a Bearer token — the backend already preferred `req.userId` from JWT or falling through to the param; (3) unauthenticated guests continue using the localStorage `voterId` unchanged. Every site in `BracketView.jsx` that previously used bare `voterId` as a voter identity was updated to use `user?.id ?? voterId` instead: `resolvedId` in `fetchUserBracket`, the `useEffect` trigger guard, `handlePick`, `handleGuestLockIn`, `handleResetPicks`, `handleDeleteGuestSession`, the "Delete my participation" button guard, and the two `voterId` props passed to the bracket visualization and list view child components. No backend, data model, or API contract changes were required.

**Files changed:**
- `baby-name-bracket-app/components/pages/BracketView.jsx` — updated `resolvedId` derivation in `fetchUserBracket` from `(isOwner && user?.id) ? user.id : id` to `user?.id ?? id`; updated `useEffect` trigger guard from `isOwner && user?.id` to `user?.id`; updated `handlePick` body `userId` and post-pick `fetchUserBracket` call from bare `voterId` to `user?.id ?? voterId`; updated `handleGuestLockIn` body `userId` from `voterId` to `user?.id ?? voterId`; updated `handleResetPicks` body `userId` from `voterId` to `user?.id ?? voterId`; updated `handleDeleteGuestSession` body `guestId` from `voterId` to `user?.id ?? voterId`; updated "Delete my participation" button guard from `voterId &&` to `(user?.id ?? voterId) &&`; updated both `voterId={voterId}` child-component props to `voterId={user?.id ?? voterId}`

**Archived plan:** `plans/completed/authenticated-guest-bracket-identity.md`

---

## remove-anonymous-voter-id

**Completed:** 2026-05-20

**Summary:** Eliminated the legacy anonymous-voter `voterId` mechanism so that all bracket interactions are exclusively tied to a signed-in user's account ID. On the backend, all four `my-bracket` routes (`GET /api/bracket/:id/my-bracket`, `POST .../pick`, `POST .../lock`, `POST .../reset`) were switched from `optionalAuth` to `requireAuth` middleware, the `userId` fallback resolution patterns (`req.userId || req.query.userId` / `req.userId || req.body.userId`) in all four controller functions were simplified to `req.userId`, and 400-error guards were updated to return 401 with the message `'Authentication required'`. On the frontend, the `generateVoterId` function, `voterId` state, and the `localStorage('voterId')` seed `useEffect` were removed from `BracketView.jsx`; `authHeaders` was simplified to always send the Bearer token when present; `fetchUserBracket` now returns early when no token is available; the `useEffect` triggering the fetch no longer carries a `voterId` dependency; and all `user?.id ?? voterId` expressions across `handlePick`, `handleGuestLockIn`, `handleResetPicks`, `handleDeleteGuestSession`, and child-component `voterId` props were replaced with plain `user?.id`. Unauthenticated visitors can view a bracket but cannot vote, pick, lock, or reset.

**Files changed:**
- `baby-name-bracket-api/routes/bracketRoutes.js`
- `baby-name-bracket-api/controllers/bracketController.js`
- `baby-name-bracket-app/components/pages/BracketView.jsx`

**Archived plan:** `plans/completed/remove-anonymous-voter-id.md`

---

## Hamburger Menu Active-Route Hiding

**Completed:** 2026-05-20

**Summary:** Navigation options in the hamburger menu are now hidden when the user is already on the page that option navigates to. A derived `isBracketViewPage` boolean (`!!currentBracketId && pathname === /bracket/${currentBracketId}`) was added as the single source of truth for detecting the bracket view page. The "View Bracket" link in the main panel is hidden entirely when `isBracketViewPage` is true (removing its active-state dot logic as now-unnecessary). The `ownerLinks` map was replaced with a filtered map so each owner link — "Names" and "Pick Round Winners" — is suppressed when `pathname` matches that link's `href`, and the active-state dot inside the map body was removed as dead code. The "View Bracket Dashboard" button in the profile sub-panel is wrapped in a `!isBracketViewPage` guard so it disappears on the bracket view page. No new hooks, props, state, or API calls were introduced — `pathname` was already available via `usePathname()` and `currentBracketId` via `useBracket()`.

**Files changed:**
- `baby-name-bracket-app/components/layout/Navbar.jsx` — added `isBracketViewPage` derived constant; changed "View Bracket" render guard to `showViewBracket && !isBracketViewPage`; replaced `ownerLinks.map(...)` with `ownerLinks.filter(link => pathname !== link.href).map(...)`; wrapped "View Bracket Dashboard" button in `{!isBracketViewPage && (...)}` conditional

**Archived plan:** `plans/completed/hamburger-active-route-hide.md`

---

## Hamburger Menu Settings Cog Redesign

**Completed:** 2026-05-20

**Summary:** Redesigned the hamburger menu's identity row and settings panel so the user's display name and a settings cog icon appear inline on the same top row (cog gated on `isOwnerOfCurrentBracket`), with the cog opening the settings sub-panel directly. The settings sub-panel was reordered to lead with the Profile section (icon picker and Update Information button, previously a separate panel), followed by existing settings content (Invite People, Bracket Health, Danger Zone), and a new visually separated bottom section containing "All Brackets" and "Sign Out". The standalone Profile button, standalone Settings button, and standalone Sign Out button were all removed from the main panel. The "All Brackets" text span was removed from the navbar top-left brand area, leaving only the home icon. The separate `activePanel === 'profile'` panel block and its trigger were deleted since Profile is now always the first section inside settings. Non-owners see only the name in the identity row with no cog. Pure frontend change — only `Navbar.jsx` was modified.

**Files changed:**
- `baby-name-bracket-app/components/layout/Navbar.jsx` — removed "All Brackets" text span from navbar brand area; merged name row and cog into a single inline identity row; removed standalone Settings button block; removed standalone Profile button and Sign Out button from main panel; reordered settings sub-panel to lead with Profile section (icon picker + Update Information); added "All Brackets" and "Sign Out" as a visually separated bottom section inside settings sub-panel; deleted separate `activePanel === 'profile'` block and its trigger

**Archived plan:** `plans/completed/hamburger-settings-cog-redesign.md`

---

## [2026-05-20] Name Seeding Drag-and-Drop & Name Bank

**Summary:** Shipped full drag-and-drop name seeding and a personal Name Bank for the baby name bracket app. Each parent can now reorder their active names (up to 16) via drag-and-drop on the name listing page, with seed numbers updating immediately. A collapsible Name Bank section beneath each owner's list holds unlimited overflow names. Names can be dragged freely between the active list and the bank; adding a 17th+ name via the input form routes it to the bank automatically instead of returning an error. All ordering and bank state persists across sessions via a new `PATCH /api/brackets/:id/names/reorder` endpoint. The `@hello-pangea/dnd` library (React 19 / touch compatible) powers the frontend drag interactions.

**Files changed:**

Backend:
- `/Users/garrettamidon/workspace/ai-workshop/baby-name-bracket-api/models/Bracket.js` — added `status` field to `NameSchema`; added `owner1BankNames` / `owner2BankNames` arrays and their MongoDB indexes
- `/Users/garrettamidon/workspace/ai-workshop/baby-name-bracket-api/controllers/bracketController.js` — added `reorderNames` controller and `resolveOwnerFromIds` helper; modified `addName` to route overflow to bank; extended `buildCurrentBracketResponse` to include bank arrays
- `/Users/garrettamidon/workspace/ai-workshop/baby-name-bracket-api/routes/bracketRoutes.js` — registered `PATCH /brackets/:id/names/reorder` route with `requireAuth`

Frontend:
- `package.json` / `package-lock.json` — added `@hello-pangea/dnd` dependency
- `/Users/garrettamidon/workspace/ai-workshop/baby-name-bracket-app/components/bracket/DraggableNameList.jsx` — new component: sortable active-name list with drag handles and seed badges
- `/Users/garrettamidon/workspace/ai-workshop/baby-name-bracket-app/components/bracket/NameBankList.jsx` — new component: collapsible bank section with droppable zone
- `/Users/garrettamidon/workspace/ai-workshop/baby-name-bracket-app/components/pages/BracketNames.jsx` — added bank state, `handleReorder`, `onDragEnd` handlers, `DragDropContext` wrappers; removed 16-name cap error; added `status` coalesce in `fetchBracketData`

---

## bracket-bug-fixes-batch1 — 2026-05-21

**Summary:** Fixed four independent frontend bugs across the bracket visualization, pick-winner page, vote-result display, and mobile drag interaction. (1) Division 1 Final Four vote buttons were visible after a guest locked their bracket — fixed in `BracketView.jsx` by treating the Final Four and Championship cards as published when the active round has not yet reached them. (2) The Pick a Winner page did not let owners change their pre-populated picks — root cause traced to the `isOwner` guard and `handlePick` wiring in `BracketPickWinner.jsx`. (3) Vote-percentage bars were absent on Sweet 16, Elite 8, Final Four, and Championship matchup cards — fixed by threading the already-returned `voteTallies` data from the page-level `BracketView.jsx` down into `BracketView.jsx` (components) and `BracketListView.jsx`, where it is merged into the resolved matchup objects for completed-round cards. (4) On mobile, dragging a name tile in the Pick a Name list scrolled the page instead of reordering — fixed in `DraggableNameList.jsx` by moving `dragHandleProps` to the full tile `<div>` and adding `touchAction: 'none'` to prevent browser scroll interception. No backend changes were required.

**Files changed:**

- `baby-name-bracket-app/components/bracket/BracketView.jsx` — Bug 1: added `round={4}` prop and `isRoundPublished` override for F4 Div1/Div2 and Championship cards when not yet the active round; Bug 3: added `voteTallies` prop and merged tally data into completed-round resolved matchups for R16, E8, F4, and Championship cards
- `baby-name-bracket-app/components/pages/BracketView.jsx` — Bug 3: passed `voteTallies={voteTallies}` to both `<BracketView>` and `<BracketListView>`
- `baby-name-bracket-app/components/bracket/BracketListView.jsx` — Bug 3: added `voteTallies` prop and merged tally data into `displayMatchups` for past rounds
- `baby-name-bracket-app/components/pages/BracketPickWinner.jsx` — Bug 2: corrected `isOwner` guard derivation; cleaned up `handlePick` body param
- `baby-name-bracket-app/components/bracket/DraggableNameList.jsx` — Bug 4: spread `dragHandleProps` onto the full tile `<div>`; added `touchAction: 'none'` style

---

## bracket-bug-fixes-batch2 — 2026-05-21

**Summary:** Fixed four persistent root-cause bugs across the bracket visualization, Pick a Winner page, vote-bar display, and mobile drag interaction. (1) Final Four vote buttons now respect the bracket lock state for all roles — `MatchupCard.jsx` simplified `canVote` from `isOwner ? true : !isLocked` to plain `!isLocked` so owners are gated after both personal brackets lock. (2) Pick a Winner now correctly shows each owner's independent bracket picks and allows official-pick saves after personal lock — a new `GET /api/bracket/:id/owner-brackets` endpoint fetches both owners' UserBrackets server-side by owner ID; `submitPick` skips the `lockedAt` rejection when the authenticated user is a bracket owner; `BracketPickWinner.jsx` calls the new single endpoint instead of two duplicate calls. (3) Vote-percentage bars now appear on Sweet 16, Elite 8, Final Four, and Championship prediction cards even before round advancement — `aggregateVoteTallies` was rewritten to iterate all round positions by size rather than skipping rounds with empty matchup stubs, and includes `name1Id`/`name2Id` in the tally payload for future-round matching. (4) Mobile drag in Pick a Name now reliably reorders on first touch — `DraggableNameList.jsx` applies `dragHandleProps` and `touchAction: 'none'` unconditionally so the browser never claims the gesture as a scroll during the initial render window.

**Files changed:**

- `baby-name-bracket-api/controllers/bracketController.js` — added `AGG_ROUND_SIZES` constant; rewrote `aggregateVoteTallies` loop to cover all rounds regardless of stub presence and include `name1Id`/`name2Id` in tally entries; modified `submitPick` to bypass `lockedAt` rejection for bracket owners; added `getOwnerBrackets` controller function; added `getOwnerBrackets` to `module.exports`
- `baby-name-bracket-api/routes/bracketRoutes.js` — imported `getOwnerBrackets`; registered `GET /bracket/:id/owner-brackets` route with `requireAuth`
- `baby-name-bracket-app/components/bracket/MatchupCard.jsx` — simplified `canVote` to `!isLocked` for all roles
- `baby-name-bracket-app/components/pages/BracketPickWinner.jsx` — rewrote `fetchOwnerBrackets` to call new `owner-brackets` endpoint; updated its `useEffect` dependency to `[bracketId, token]`
- `baby-name-bracket-app/components/bracket/DraggableNameList.jsx` — applied `dragHandleProps` and `touchAction: 'none'` unconditionally on tile div

---

## Bracket Scoring — Points Per Round, Tiebreaker Prediction, Lobby Score Display

**Completed:** 2026-05-21

**Summary:** Participants now earn scaled points for each correct bracket prediction (Round of 32 = 1 pt, Sweet 16 = 2 pts, Elite 8 = 4 pts, Final Four = 8 pts, Championship = 16 pts), a tiebreaker resolves equal-score ties by comparing each participant's predicted championship vote-split percentage against the actual result, and each bracket card on the all-brackets lobby page shows the viewer's current score and maximum remaining points. The `UserBracket` model gained a `tiebreakerPrediction` field (Number, 0–100, nullable). The `fanOutScores` helper in `bracketController.js` was updated with a `ROUND_MULTIPLIERS` map so correct picks in later rounds earn proportionally more points. A new `getScores` controller function computes every locked UserBracket's `score`, `maxPossible` (alive-pick count × multiplier across unresolved rounds), and `tiebreakerDelta` (absolute difference between prediction and actual championship vote split), then returns the array sorted by score descending and tiebreaker delta ascending. A new `saveTiebreakerPrediction` controller handles `POST /api/bracket/:id/my-bracket/tiebreaker` and persists the participant's predicted championship vote-split percentage. The `listMyBrackets` lobby controller was enriched to include `myScore` and `myMaxPossible` on each bracket entry by querying UserBracket documents for the authenticated caller. Two new routes were registered: `GET /api/bracket/:id/scores` and `POST /api/bracket/:id/my-bracket/tiebreaker`. On the frontend, the Championship prediction card in the bracket visualization gained a percentage input (0–100) that appears once the participant has selected a champion; the input is required before the "Lock In My Bracket" button is enabled. The lobby `BracketCard` component was updated to render a score row (`N pts · M max`) below the status badge.

**Files changed:**
- `baby-name-bracket-api/models/UserBracket.js` — added `tiebreakerPrediction: { type: Number, default: null, min: 0, max: 100 }`
- `baby-name-bracket-api/controllers/bracketController.js` — added `ROUND_MULTIPLIERS` map; updated `fanOutScores` to apply per-round point multipliers; added `getScores` controller; added `saveTiebreakerPrediction` controller; enriched `listMyBrackets` lobby path with `myScore`/`myMaxPossible`
- `baby-name-bracket-api/routes/bracketRoutes.js` — registered `GET /bracket/:id/scores` and `POST /bracket/:id/my-bracket/tiebreaker`
- `baby-name-bracket-app/components/bracket/BracketView.jsx` — added `tiebreakerPrediction` and `onTiebreakerChange` props; added percentage input below Championship card; updated `allPicksFilled` gate to require tiebreaker; added prompt when picks are complete but tiebreaker is missing
- `baby-name-bracket-app/components/pages/BracketView.jsx` — added `tiebreakerPrediction` state; added `handleTiebreakerChange` handler that posts to `/api/bracket/:id/my-bracket/tiebreaker`; passes both down to the bracket visualization component
- `baby-name-bracket-app/components/pages/Lobby.jsx` — updated `BracketCard` to render score row using `bracket.myScore` and `bracket.myMaxPossible`

**Archived plan:** `plans/completed/bracket-scoring.md`

---

## Bracket Score Display — Championship Area

**Completed:** 2026-05-21

**Summary:** Added a read-only score panel to the bracket canvas positioned to the left of the Championship matchup card, showing the logged-in user's earned points and maximum points still available for the current bracket. The page-level `BracketView.jsx` gained a `myScore` state variable, a `fetchMyScore` async function that calls the existing `GET /api/bracket/:id/scores` endpoint and extracts the authenticated user's entry, and a `useEffect` that re-fetches whenever `user?.id` or `userBracket?.lockedAt` changes. The `myScore` object is passed as a new prop to the canvas-level `BracketView.jsx`, which renders an absolutely-positioned panel (`right: calc(100% + 8px)`, vertically centered with the Championship card via `translateY(-50%)`) only when `viewerRole === 'guest'`. The panel displays the user's earned score in large indigo text with a "pts earned" label and the maximum possible in smaller text with a "pts available" label, defaulting to `0` and `62` respectively when no score data is present. No backend changes were required — the `GET /api/bracket/:id/scores` endpoint already returns all the data needed.

**Files changed:**

- `baby-name-bracket-app/components/pages/BracketView.jsx` — added `myScore` state; added `fetchMyScore` function; added `useEffect` re-fetch on `user?.id` and `userBracket?.lockedAt`; passed `myScore` prop to canvas `BracketView`
- `baby-name-bracket-app/components/bracket/BracketView.jsx` — added `myScore = null` to prop signature; added absolutely-positioned score panel rendered when `viewerRole === 'guest'`

**Archived plan:** `plans/completed/bracket-score-display.md`
