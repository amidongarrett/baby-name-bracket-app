# Last Status Update

## 2026-05-22 — remove-tiebreaker-ui

SHIPPED. Removed the championship vote-percentage tiebreaker input from the bracket visualization canvas so the lock-in flow is no longer blocked by it. After making all 31 picks (including championship), the "Lock In My Bracket" button now appears immediately with no percentage input or amber hint message visible. The `tiebreakerPrediction` state, `handleTiebreakerChange` handler, and tiebreaker-init `useEffect` were removed from the page layer; the `tiebreakerSet` guard was removed from `allPicksFilled` in the canvas component. The backend tiebreaker endpoint and model field remain in place but are unused by the UI. Pure frontend, two files changed.

Archived at: `plans/completed/remove-tiebreaker-ui.md`

---

## 2026-05-21 — lock-gates-and-realtime-sync

SHIPPED. Disabled the "Lock In My Names" buttons until each owner has exactly 16 active names (tooltip counts remaining names needed), disabled both "Lock In My Bracket" buttons (canvas and list view) until every matchup in the current round has a pick, and added background polling on the names page (5-second interval, draft status only) and the bracket view page (9-second interval, active status only). All polling respects the Page Visibility API: paused when the tab is hidden, resumed with an immediate fetch on focus return. No loading spinner on background polls (`silent` parameter added to `fetchBracket`). Pure frontend, no backend changes.

Archived at: `plans/completed/lock-gates-and-realtime-sync.md`

---

## 2026-05-21 — bracket-score-display

SHIPPED. Added a read-only score panel to the bracket visualization canvas, positioned to the left of the Championship matchup card. The panel shows the authenticated guest user's earned points and maximum points still available, fetched from the existing `GET /api/bracket/:id/scores` endpoint and re-fetched whenever `userBracket?.lockedAt` changes. The panel is hidden for owner and owner2 viewer roles. Pure frontend, no backend changes.

Archived at: `plans/completed/bracket-score-display.md`

---

## 2026-05-21 — bracket-scoring

SHIPPED. Added full bracket scoring, tiebreaker prediction, and lobby score display. Points scale by round (1/2/4/8/16) and are fan-out on round advancement. A new Championship tiebreaker input captures each participant's predicted vote-split percentage (0–100), required before "Lock In My Bracket" is enabled. A `GET /api/bracket/:id/scores` endpoint returns participants sorted by score then tiebreaker delta. The all-brackets lobby enriches each card with `myScore` and `myMaxPossible`.

Archived at: `plans/completed/bracket-scoring.md`

---

## 2026-05-21 — bracket-bug-fixes-batch2

SHIPPED. Fixed four persistent root-cause bugs: (1) Final Four vote buttons now respect bracket lock for all roles — `MatchupCard.jsx` simplified `canVote` to `!isLocked`. (2) Pick a Winner now correctly shows each owner's independent picks and allows saves after personal lock — new `GET /api/bracket/:id/owner-brackets` endpoint; `submitPick` bypasses `lockedAt` for owners; `BracketPickWinner.jsx` updated to use the new endpoint. (3) Vote-percentage bars now appear on all future rounds before advancement — `aggregateVoteTallies` rewritten to cover all rounds by size rather than skipping rounds with no stubs, and includes `name1Id`/`name2Id` in the tally payload. (4) Mobile drag in Pick a Name reliably reorders on first touch — `DraggableNameList.jsx` applies `dragHandleProps` and `touchAction: 'none'` unconditionally.

Archived at: `plans/completed/bracket-bug-fixes-batch2.md`

---

## 2026-05-21 — bracket-bug-fixes-batch1

SHIPPED. Fixed four independent frontend bugs: (1) Division 1 Final Four vote buttons no longer appear after a guest locks their bracket — `BracketView.jsx` now treats F4/Championship cards as published when the active round has not yet reached them. (2) Pick a Winner now lets owners change their pre-populated picks — `isOwner` guard and `handlePick` wiring corrected in `BracketPickWinner.jsx`. (3) Vote-percentage bars now appear on Sweet 16, Elite 8, Final Four, and Championship matchup cards — `voteTallies` data is threaded from the page-level `BracketView.jsx` down into the bracket visualization and list view components and merged into completed-round resolved matchups. (4) Mobile drag in Pick a Name now reliably reorders instead of scrolling — `DraggableNameList.jsx` spreads `dragHandleProps` onto the full tile div and adds `touchAction: 'none'`. No backend changes.

Archived at: `plans/completed/bracket-bug-fixes-batch1.md`

---

## 2026-05-20 — name-seeding-and-bank

SHIPPED. Full drag-and-drop name seeding and a personal Name Bank for the baby name bracket app. Each parent can now reorder their active names (up to 16) via drag-and-drop on the name listing page, with seed numbers updating immediately. A collapsible Name Bank section beneath each owner's list holds unlimited overflow names. Names can be dragged freely between the active list and the bank; adding a 17th+ name via the input form routes it to the bank automatically instead of returning an error. All ordering and bank state persists across sessions via a new `PATCH /api/brackets/:id/names/reorder` endpoint. The `@hello-pangea/dnd` library (React 19 / touch compatible) powers the frontend drag interactions.

Archived at: `plans/completed/name-seeding-and-bank.md`

---

## 2026-05-20 — hamburger-settings-cog-redesign

SHIPPED. Hamburger menu identity row now shows the user's display name and a settings cog icon inline on the same row; tapping the cog opens the settings sub-panel. The settings sub-panel was reordered to lead with Profile (icon picker + Update Information), followed by existing content (Invite People, Bracket Health, Danger Zone), then a visually separated bottom section with "All Brackets" and "Sign Out". The standalone Profile, Settings, and Sign Out rows were removed from the main panel. The "All Brackets" text label was removed from the navbar brand area (home icon only remains). Non-owners see no cog. Pure frontend, single-file change to `Navbar.jsx`.

Archived at: `plans/completed/hamburger-settings-cog-redesign.md`

---

## 2026-05-20 — hamburger-active-route-hide

SHIPPED. Navigation options in the hamburger menu are now hidden when the user is already on the page that option navigates to. Added `isBracketViewPage` boolean in `Navbar.jsx`; "View Bracket" link gated on `showViewBracket && !isBracketViewPage`; `ownerLinks.map` replaced with `ownerLinks.filter(link => pathname !== link.href).map`; "View Bracket Dashboard" profile sub-panel button wrapped in `!isBracketViewPage` guard. Pure frontend, single-file change.

Archived at: `plans/completed/hamburger-active-route-hide.md`

---

## 2026-05-20 — remove-anonymous-voter-id

SHIPPED. Eliminated the legacy anonymous-voter `voterId` mechanism so all bracket interactions require an authenticated user. Backend: all four `my-bracket` routes switched from `optionalAuth` to `requireAuth`; `userId` fallback patterns (`req.userId || req.query/body.userId`) simplified to `req.userId`; 400 guards updated to 401 with `'Authentication required'`. Frontend: `generateVoterId` function, `voterId` state, and `localStorage('voterId')` seed `useEffect` removed from `BracketView.jsx`; all `user?.id ?? voterId` expressions replaced with `user?.id`; `fetchUserBracket` returns early when no token is present. Unauthenticated visitors see the bracket but cannot vote, pick, lock, or reset.

Archived at: `plans/completed/remove-anonymous-voter-id.md`

---

## 2026-05-20 — authenticated-guest-bracket-identity

SHIPPED. Authenticated users who join a bracket as a guest now get their own independent bracket state instead of sharing the browser's persistent `voterId`. The identity-resolution logic in `BracketView.jsx` was updated to use a three-tier model: owners send a Bearer token; authenticated guests (non-owners with `user?.id`) send `userId = user.id` as a query/body param; unauthenticated guests continue using the localStorage `voterId` unchanged. All call sites in `BracketView.jsx` that previously used bare `voterId` as the voter identity now use `user?.id ?? voterId`.

Archived at: `plans/completed/authenticated-guest-bracket-identity.md`

---

## 2026-05-20 — test-user-free-join

SHIPPED. Test users (`test+*@amidonlabs.com`) can now join any active bracket from the lobby without entering an invite code. Backend: `joinBracket` in `lobbyController.js` relaxes the `inviteCode`-required guard for test callers presenting a `bracketId`, looks up the bracket by `_id`, validates `status === 'active'`, and applies the existing duplicate-owner/already-joined checks. New error codes: `400 bracketId is required for test user join`, `403 Test user bypass only available for active brackets`. Frontend: `LobbyPage` in `Lobby.jsx` derives `isTestUser` from `user.email`, reads `allActive` from the `getMyBrackets` response, and passes both into a refactored `JoinModal` that renders a selectable active-bracket list instead of the invite-code text input for test users. New `joinBracketById(bracketId, token)` function added to `lib/lobbyApi.js`.

Archived at: `plans/completed/test-user-free-join.md`

---

## 2026-05-20 — owner-bracket-persistence

SHIPPED. Owners' personal bracket picks now persist across sessions. Added `optionalAuth` middleware to `auth.js` and applied it to all four `my-bracket` routes so that a Bearer token (when present) populates `req.userId`; all four controllers now prefer `req.userId` over query/body param, leaving the guest `voterId` path unchanged. `BracketView.jsx` updated to send the Authorization header for authenticated owners, derive `effectiveUserId` from `user.id`, and extend fetch dependency arrays to include `user?.id` and `token`.

Archived at: `plans/completed/owner-bracket-persistence.md`

---

## 2026-05-19 — advance-round-auto-set-winners

SHIPPED. `POST /api/bracket/advance` no longer errors with "Matchup has no winner set" when both owners have agreed picks but `matchup.winnerId` was null. The `advanceRound` controller now resolves each missing `winnerId` from owner1's `UserBracket` picks before calling `advanceMatchupWinners`; falls back to `aggregateVoteTallies` for any position owner1 never picked; never overwrites already-set values; and calls `bracket.markModified('matchups')` after the resolution loop.

Archived at: `plans/completed/advance-round-auto-set-winners.md`

---

## 2026-05-19 — advance-round-500-fix

SHIPPED. Fixed the 500 error thrown by `POST /api/bracket/advance` when confirming "Advance to Next Round." Four defects resolved: `bracket.markModified('matchups')` added before `bracket.save()` so Mongoose persists the sub-array replacement; two inline `require('uuid').v4()` calls in `bracketProgression.js` replaced with the imported `uuidv4` alias; `fanOutScores` added after `bracket.save()` in `advanceRound` for score parity with `proceedToNextRound`; `const bracket` changed to `let bracket` in `proceedToNextRound` to fix a constant-reassignment crash.

Archived at: `plans/completed/advance-round-500-fix.md`

---

## 2026-05-19 — vote-tally-and-advance-round-fix

SHIPPED. Fixed two regressions from the UserBracket voting refactor: (1) `proceedToNextRound` now captures the return value of `advanceMatchupWinners()` so the bracket actually advances instead of returning a 500; (2) vote tallies are now aggregated from locked UserBracket documents via a new `GET /api/bracket/:id/vote-tallies` endpoint and surfaced on BracketPickWinner and BracketView instead of always showing 0/50-50.

Archived at: `plans/completed/vote-tally-and-advance-round-fix.md`

---

## 2026-05-19 — pick-winner-realtime-polling

SHIPPED. Added automatic 9-second polling to `BracketPickWinner.jsx` via a single additive `useEffect`. The effect calls `fetchVoteTallies()` and `fetchOwnerBrackets()` in parallel every 9 seconds, is guarded by `bracket?.status === 'active'` so it never runs in draft or completed state, and integrates the Page Visibility API to pause the interval while the tab is hidden and resume (with an immediate fetch) when the tab regains focus. Cleanup removes both the interval and the `visibilitychange` listener on unmount. Pure frontend, no backend or API changes.

Archived at: `plans/completed/pick-winner-realtime-polling.md`

---

## 2026-05-19 — list-view-lock-and-nav-improvements

SHIPPED. Gated the "Lock My Bracket" button in the list view behind `allPicksFilled` (hidden with helper text when picks are incomplete). Added a duplicate bottom round-navigation row in `BracketListView.jsx` so users can change rounds without scrolling to the top. Added a mobile-only sticky bottom nav bar in `BracketView.jsx` (`flex md:hidden`) that scrolls the bracket canvas to the selected round via `scrollToRound`. Pure frontend, no backend changes.

Archived at: `plans/completed/list-view-lock-and-nav-improvements.md`

---

## 2026-05-19 — suppress-body-hydration-warning

SHIPPED. Added `suppressHydrationWarning` to the `<body>` element in `baby-name-bracket-app/app/layout.js` to eliminate the React hydration mismatch warning caused by browser extensions (e.g., `cz-shortcut-listen`) injecting attributes after SSR. Single-attribute addition, no logic or behavioral changes.

Archived at: `plans/completed/suppress-body-hydration-warning.md`

---

## 2026-05-19 — hamburger-menu-user-name-top-row

SHIPPED. User display name is now always the first row in the hamburger menu, regardless of other items (e.g., "View Bracket"). Moved the user-identity `<div>` to the top of the `activePanel === 'main'` fragment in `Navbar.jsx`, upgraded the name text to `text-base font-bold`, and added a `|| 'Guest'` fallback guard. Pure frontend, single-file change.

Archived at: `plans/completed/hamburger-menu-user-name-top-row.md`

---

## 2026-05-19 — hamburger-menu-view-bracket

SHIPPED. Added "View Bracket" as the first item in the hamburger menu on all bracket-scoped pages. A `showViewBracket` boolean (`!!currentBracketId && pathname !== '/'`) gates a new `<Link>` JSX block inserted before the user identity header in the `activePanel === 'main'` branch of `Navbar.jsx`. The item shows an active indigo dot when the user is already on the bracket view page, and is absent entirely on the lobby (`/`) page. No new props, state, or API calls were introduced.

Archived at: `plans/completed/hamburger-menu-view-bracket.md`

---

## 2026-05-19 — owner2-invite-from-names

SHIPPED. Added an "Invite a Partner" card to the Owner 2 column on the names page, shown only to Owner 1 when no Owner 2 has joined yet. A new `POST /api/brackets/:id/invite-owner2` endpoint in `lobbyController.js` validates Owner 1 auth (403) and already-joined guard (409), sets `owner2Email`, generates `inviteCode` if missing, and calls `sendInviteEmail`. `lobbyRoutes.js` registers the route with `requireAuth`. `BracketNames.jsx` gains `owner2UserId` state populated from `fetchBracketData`, three invite-card state variables, a `handleInviteOwner2` handler, and a conditional render that swaps in the invite card when `isOwner1 && !owner2UserId`.

Archived at: `plans/completed/owner2-invite-from-names.md`

---

## 2026-05-19 — test-user-seeding-and-qa-agent

SHIPPED. Introduced a reserved test-email convention (`/^test\+.+@amidonlabs\.com$/i`) that bypasses OTP in both `requestCode` and `verifyCode` in `authController.js`. A shared `utils/testEmail.js` utility exports the regex. `lobbyController.js` adds an `allActive` key to the lobby response for test-email users. `AuthFlow.jsx` detects the pattern on submit and calls `verifyCode` directly, skipping the OTP step. Four agent files were created or updated: `quality-assurance.md` (new agent), `orchestrator.md` (Phase 6 QA spawn), `setup.md` (testing-preference Q&A + Step 3a), and `systems-scribe.md` (mandatory "Testing with guest accounts" section).

Archived at: `plans/completed/test-user-seeding-and-qa-agent.md`

---

## 2026-05-19 — bracket-owner-icon-live-sync

SHIPPED. Updated `GET /api/bracket/:sessionId` to return each owner's live emoji icon from their current User document instead of the stale denormalized snapshot. Added a `resolveOwnerIcons(bracket)` async helper to `bracketController.js` that performs a single lean `User.find` batching both owner IDs, with graceful fallback to the bracket's stored icon then `'👤'`. The `getBracket` handler now calls the helper and overwrites `owner1Icon`/`owner2Icon` on the response object before returning. All write-endpoint call sites for `buildCurrentBracketResponse` are unchanged. Pure backend, single-file change.

Archived at: `plans/completed/bracket-owner-icon-live-sync.md`

---

## 2026-05-19 — user-icon-surface-integration

SHIPPED. Replaced crown and generic placeholder icons with each user's personally selected emoji icon across the navbar identity display and the BracketPickWinner identity chip/subtitle. `Navbar.jsx` had both the menu-button trigger and the dropdown header updated to always render `user?.icon || '😊'` instead of conditionally showing `👑` for owners. `BracketPickWinner.jsx` replaced the hardcoded `isOwner ? '👑' : '👤'` derivation with `user?.icon || '😊'`. `BracketNames.jsx` was already correct and required no changes. Pure frontend, no backend changes.

Archived at: `plans/completed/user-icon-surface-integration.md`

---

## 2026-05-19 — owner-display-names-and-icon

SHIPPED. Replaced all hardcoded "Husband" / "Wife" / "Owner 1" / "Owner 2" labels with real owner display names and emoji icons throughout the app. Added `icon` field to User model, `owner1Icon`/`owner2Icon` to Bracket model, icon validation in auth endpoints, and icon propagation through bracket create/accept flows. Fixed `removeOwner2` to clear all shared names (not just Owner 2's). Frontend added icon picker grids in AuthFlow sign-up and profile edit, and updated BracketNames and BracketPickWinner to use dynamic display names and icons.

Archived at: `plans/completed/owner-display-names-and-icon.md`

---

## 2026-05-19 — profile-icon-picker-reorder

SHIPPED. Moved the "Choose your icon" emoji picker to the bottom of the Profile sub-panel, after the Back, View Bracket Dashboard, and Update Information buttons. Changed the picker wrapper's `border-b` to `border-t`. Pure frontend, single-file JSX block reorder in `Navbar.jsx`.

Archived at: `plans/completed/profile-icon-picker-reorder.md`

---

## 2026-05-19 — navbar-restructure

SHIPPED. Replaced the "Baby Name Bracket" brand link in the navbar top-left with an "All Brackets" link navigating to `/`. Removed the redundant "All Brackets" row from the hamburger main panel. Promoted Names and Pick Round Winners as top-level owner-only rows in the main panel (between Profile and Settings). Slimmed the Settings sub-panel to Invite People, Bracket Health, and Danger Zone only. Pure frontend single-file change to `Navbar.jsx`.

Archived at: `plans/completed/navbar-restructure.md`

---

## 2026-05-19 — navbar-danger-zone-auth-fix

SHIPPED. Fixed all four Owner 1 danger-zone actions (Remove Owner 2, Delete Bracket, Reset & Regenerate, Unlock Names) silently failing with 401 errors by destructuring `token` from `useUser()` in `Navbar.jsx` and adding `Authorization: Bearer ${token}` headers to each of the four fetch calls. No backend changes were required. Pure frontend single-file fix.

Archived at: `plans/completed/navbar-danger-zone-auth-fix.md`

---

## 2026-05-19 — remove-owner2-full-bracket-reset

SHIPPED. Expanded the Remove Owner 2 action into a complete official bracket reset: added `UserBracket.deleteMany({ bracketId })` to delete all prediction documents (Owner 1, Owner 2, all guests), cleared `guestUserIds`, and reset all Owner 2 identity fields (`owner2UserId`, `owner2Name`, `owner2Email`, `inviteCode`). Updated the confirmation modal copy in `Navbar.jsx` to accurately describe the full data-loss scope. Backend only required the `removeOwner2` controller body expansion; no route or response shape changes.

Archived at: `plans/completed/remove-owner2-full-bracket-reset.md`

---

## 2026-05-19 — bracket-button-right-vcenter

SHIPPED. Repositioned the "Lock In My Bracket", "Reset Picks", and "Bracket Locked In" block to sit to the right of the Championship card and vertically centered with it. Changed `left` from `'0'` to `'calc(100% + 8px)'`, `width` from `'100%'` to `'160px'`, `top` from `${CHAMP_BODY_BOTTOM + 12}px` to `${TOTAL_HEIGHT / 2}px`, added `transform: 'translateY(-50%)'`, and removed `pt-4` from the locked-in badge wrapper. Pure frontend, single file change.

Archived at: `plans/completed/bracket-button-right-vcenter.md`

---

## 2026-05-19 — bracket-button-centering

SHIPPED. Repositioned the "Lock In My Bracket", "Reset Picks", and "Bracket Locked In" elements in the bracket visualization canvas so they appear horizontally centered directly below the Championship card instead of floating outside the right edge of the center column. Changed `left: 'calc(100% + 8px)'` to `'0'`, `width: '160px'` to `'100%'`, and `top` from the Championship card-body top to `${CHAMP_BODY_BOTTOM + 12}px`. Pure frontend, single file change.

Archived at: `plans/completed/bracket-button-centering.md`

---

## 2026-05-19 — bracket-lockin-championship-fixes

SHIPPED. Fixed three related bugs in the bracket views: (1) the "Lock In My Bracket" button in the bracket visualization now requires all 31 picks before appearing (replaced `roundsToCheck`-based `allPicksFilled` with a hard 31-pick count); (2) the championship placeholder card now shows both finalists' names and seeds once Final 4 picks are made (derives prediction from `picks.final4` + `nameSeedMap`, mirroring the F4 placeholder pattern); (3) the list view lock-in button now appears during an active tournament (flipped `isTournamentComplete` to `!isTournamentComplete` on line 231 of `BracketListView.jsx`).

Archived at: `plans/completed/bracket-lockin-championship-fixes.md`

---

## 2026-05-19 — e8-div2-r16-index-fix

SHIPPED. Fixed an operator-precedence bug (`(4 + i) * 2` → `4 + i * 2`) in the E8 Div2 `PlaceholderMatchup` else-branch of `BracketView.jsx` so R16 Division 2 pick indices resolve correctly (4 and 6 instead of the out-of-bounds 8 and 10). Replaced the stale `getPickedSeed(r16Feeders[...], nameId)` calls with `nameSeedMap` lookups, matching every other placeholder site. Removed now-unused `r16Feeders` and `globalR16Base` local variables.

Archived at: `plans/completed/e8-div2-r16-index-fix.md`

---

## 2026-05-19 — seed-persistence-and-reset-picks

SHIPPED. Fixed seed numbers disappearing on Elite 8, Final 4, and Championship placeholder matchup cards by building a `nameSeedMap` from `bracketMatchups.roundOf32` in the bracket visualization component and replacing five `getPickedSeed(feeder, nameId)` call sites with direct map lookups. Added a `POST /api/bracket/:id/my-bracket/reset` endpoint that clears all picks arrays and `lockedAt` (returning 403 if already locked). Frontend added `handleResetPicks` handler in the page-level `BracketView`, passed as `onResetPicks` to both the visualization and list view components; both render an inline confirm/cancel "Reset Picks" button visible only when `totalPickCount > 0 && !isLocked`.

Archived at: `plans/completed/seed-persistence-and-reset-picks.md`

---

## 2026-05-19 — owner-bracket-pick-winners

SHIPPED. Replaced the localStorage-only `parentPicks` state on the Pick Winners page with server-persisted per-owner bracket predictions. Both owners' `UserBracket` documents are now fetched in parallel via the existing `GET /api/bracket/:id/my-bracket?userId=<id>` endpoint using `bracket.owner1UserId` / `bracket.owner2UserId`. Per-matchup conflict status (`agreed` / `disagreed` / `partial` / `unpicked`) is derived from the two fetched pick maps. Cards show green badges on agreement and red "O1"/"O2" badges on disagreement. Each owner's picks are written via `POST /api/bracket/:id/my-bracket/pick`. No backend changes were required.

Archived at: `plans/completed/owner-bracket-pick-winners.md`

---

## 2026-05-19 — user-bracket-voting-refactor

SHIPPED. Replaced the embedded per-matchup vote-counter approach with a per-user `UserBracket` document that stores each guest's complete 31-slot bracket prediction. Removed `VoteSchema`, `votes[]`, `guestLockIns[]`, and `name1Votes`/`name2Votes` from `Bracket.js`. Added new `UserBracket` Mongoose model (bracketId+userId compound unique index). Rewrote `generateAllRoundStubs` to emit R32 only; future rounds are now created on-the-fly by `advanceMatchupWinners` with real winner IDs. Added three new backend endpoints (`GET/POST /api/bracket/:id/my-bracket`, `POST /api/bracket/:id/my-bracket/pick`, `POST /api/bracket/:id/my-bracket/lock`); removed `castVote`, `getUserVotes`, `guestLockIn` controllers and routes. Added `fanOutScores` helper to `proceedToNextRound` for per-pick score tracking. Frontend removed `voteMap`/`fetchVotedMatchups`/`computeGuestPredictions`/`guestBracket.js`; added `userBracket` state and picks-based display derivation throughout `BracketListView`, `ListMatchupCard`, and `BracketView`.

Archived at: `plans/completed/user-bracket-voting-refactor.md`

---

## 2026-05-18 — proceed-to-next-round

SHIPPED. Added a "Proceed to [Next Round Name]" button at the bottom of the List view, visible only to Owner 1 when all current-round matchups have at least one vote. A new `POST /api/bracket/:id/proceed-to-next-round` endpoint auto-sets each matchup's `winnerId` to the vote-leader (deterministic tie-break to name1), calls `advanceMatchupWinners` to populate next-round name IDs, and advances `bracket.currentRound`. Guests who have locked in all picks see a "Waiting for next round…" message. Fixes the root cause of the Sweet 16 voting bug where R16 matchup name IDs were never populated.

Archived at: `plans/completed/proceed-to-next-round.md`

---

## 2026-05-18 — mobile-bracket-view-fix

SHIPPED. Removed the broken partial mobile layout from `BracketView.jsx` (the `md:hidden` block and the dead `MobileMatchupCard` function) and removed the `hidden md:block` wrapper from the full bracket canvas so it is visible on all screen sizes with horizontal scrolling. Updated the `viewMode` initializer in `components/pages/BracketView.jsx` to default to `'list'` on first visit for screens narrower than 768px.

Archived at: `plans/completed/mobile-bracket-view-fix.md`

---

## 2026-05-18 — vote-change-r16-tbd-fix

SHIPPED. Fixed the Round of 16 placeholder slot showing TBD after a guest changed their Round of 32 vote. Two bugs were resolved: `getFeederLeader()` now falls back to `name1` on a tied/zero-vote state instead of returning `null`, and both R16 `PlaceholderMatchup` render sites now derive displayed names from server vote counts (via a synthetic prediction object built from `getFeederLeader()`) rather than from the guest's own individual picks.

Archived at: `plans/completed/vote-change-r16-tbd-fix.md`

---

## 2026-05-18 — admin-tools-into-settings-panel

SHIPPED. Merged the Owner 1 sub-panel back into the single Settings panel so the hamburger menu has only one settings destination. The "Owner 1" row was removed from the main panel. The Settings sub-panel now contains nav links, the Invite People button, and — gated on `ownerRole === 'owner1'` — a red Danger Zone section with all four destructive action buttons. The `owner1` panel state and its JSX block were deleted from `Navbar.jsx`. Owner 2 sees Settings without the Danger Zone.

Archived at: `plans/completed/admin-tools-into-settings-panel.md`

---

## 2026-05-18 — admin-tools-to-hamburger-menu

SHIPPED. Moved all bracket admin controls from the inline `AdminPanel.jsx` component into a new "Owner 1" sub-panel inside the hamburger menu drawer (`Navbar.jsx`). The sub-panel (visible only to `isOwnerOfCurrentBracket && ownerRole === 'owner1'`) contains navigation links (Names, Pick Winner of Round) and a Danger Zone with four action buttons (Reset & Regenerate, Unlock Names, Remove Owner 2, Delete Bracket), each backed by a `ConfirmModal`. Handler functions were implemented directly in `Navbar.jsx` via `useBracket()`. `AdminPanel.jsx` was deleted, its render was removed from `BracketView.jsx`, and `adminPanelOpen`/`setAdminPanelOpen` were removed from `BracketContext.js`.

Archived at: `plans/completed/admin-tools-to-hamburger-menu.md`

---

## 2026-05-18 — expand-name-seed-database

SHIPPED. Expanded the name seed database with historical baby names across six eras (2021–2025, 2010–2015, 2000–2005, 1990–1995, 1980–1985, 1970–1975). The `GIRL_NAMES`, `BOY_NAMES`, and `NEUTRAL_NAMES` arrays in `seedBabyNames.js` were extended in place with deduplicated, Title-cased entries; the total-count comment was updated. No API, model, or structural changes required.

Archived at: `plans/completed/expand-name-seed-database.md`

---

## 2026-05-18 — bracket-lockin-connector-fix

SHIPPED. Fixed three visual defects in `BracketView.jsx` that only appeared after a guest locked in their predictions (the prediction-card rendering path inside `PlaceholderMatchup`):

1. **Right-side E8→F4 connectors** were pointing rightward (away from center) — fixed by adding `connectorSide="left"` to both `PlaceholderMatchup` call sites in the Div2 Elite 8 column loop, making both the TBDCard and prediction-card paths use the correct leftward direction.

2. **Prediction-card connector block missing guards** — added `!isFinal4 && !isChampionship` to the `round < 4` outer guard in the prediction-card path, matching `TBDCard`'s existing guard.

3. **"Lock In My Picks" button off-center** — changed from `position: absolute; left: calc(100% + 8px); width: 160px` (outside the column) to `left: 0; right: 0; text-center` (inside the column, below the Championship card), using the same arithmetic as the card position constants.

Archived at: `plans/completed/bracket-lockin-connector-fix.md`

---

## 2026-05-18 — hamburger-menu-redesign

SHIPPED. Replaced the Navbar dropdown with a fixed full-height slide-in drawer. Adds backdrop overlay, Escape-key close, body-scroll lock, and full accessibility support (`role="dialog"`, `aria-modal`, focus trap, focus-return). Pure frontend change — one file modified: `baby-name-bracket-app/components/layout/Navbar.jsx`.

Archived at: `plans/completed/hamburger-menu-redesign.md`

---

## 2026-05-18 — fix-generate-round-of-32-undefined

SHIPPED. Fixed a server-side 500 error thrown when owner2 added their 16th name (completing the 32-name roster). Root cause: `bracketController.js` called `generateRoundOf32Matchups(allNames)` — a function that does not exist anywhere in the codebase. Replaced with the already-imported `generateDivisionMatchups(bracket.owner1Names, bracket.owner2Names)` and removed the now-dead `const allNames = bracket.getAllNames()` assignment.

Archived at: `plans/completed/fix-generate-round-of-32-undefined.md`

---

## 2026-05-18 — profile-update

SHIPPED. Users can now view and edit their display name and email from `/profile/edit`. Backend added `PUT /api/auth/profile` (display-name save; email change triggers OTP re-verification) and `POST /api/auth/verify-email-change`. `User.displayName` is now required in the Mongoose schema. Frontend added `updateProfile`/`verifyEmailChange` fetch wrappers in `authApi.js`, an `updateUser` helper in `UserContext`, a full two-step form at `/profile/edit`, and an empty-name client-side guard in `AuthFlow.jsx`.

Archived at: `plans/completed/profile-update.md`

---

## 2026-05-18 — bracket-invite

SHIPPED. Added an admin-only "Invite People" entry to the hamburger menu's Settings sub-panel. Clicking it opens an invite modal with a pill-based email input (Space/Enter locks each address into a removable green pill), a "Send Invites" button disabled until at least one pill is present, and a copyable shared bracket link. On submit, invitation emails are dispatched to all listed addresses and the modal shows a "Invites sent!" confirmation before auto-closing. Backend adds `shareToken` to the Bracket model, a `sendBracketInviteEmail` utility, and two new authenticated endpoints (`GET /api/bracket/:id/invite-link`, `POST /api/bracket/:id/invite`) registered above the catch-all route. Frontend adds `EmailPillInput.jsx`, `InviteModal.jsx`, and the Invite People button with `showInviteModal` state in `Navbar.jsx`.

Archived at: `plans/completed/bracket-invite.md`

---

## 2026-05-18 — production-deployment

SHIPPED. Deployed the Next.js frontend to Vercel at `babybracket.amidonlabs.com` and the Express API to Render at `babybracket-api.amidonlabs.com`. CORS config in `server.js` replaced with comma-separated `ALLOWED_ORIGINS` env var (localhost origins injected only in non-production). Two hardcoded `http://localhost:3001` fetch calls in `utils/api.js` fixed to use `NEXT_PUBLIC_API_URL`. `.env.example` scrubbed of plaintext credentials and updated to document `ALLOWED_ORIGINS` and `APP_URL`. DNS CNAMEs configured at registrar. End-to-end: health check, CORS headers, invite email share links, and full OTP auth flow all verified in production.

Archived at: `plans/completed/production-deployment.md`

---

## 2026-05-18 — bracket-deletion-and-owner-reset

SHIPPED. Admin can permanently delete the entire bracket, guests can remove their own voting participation, and the admin can remove Owner 2 (clears all Owner 2 names, resets shared-name flags, and reverts the bracket to draft state with no matchups). All three destructive actions require an explicit confirmation step via a new reusable `ConfirmModal` component. Backend adds `deleteBracket`, `deleteGuestSession`, and `removeOwner2` controller functions with three new DELETE routes; frontend adds a "Danger Zone" section in `AdminPanel.jsx`, a guest "Delete my participation" link in `BracketView.jsx`, and the new `ConfirmModal.jsx` UI component.

Archived at: `plans/completed/bracket-deletion-and-owner-reset.md`

---

## 2026-05-18 — mobile-friendly-bracket-list-view

SHIPPED. Added a "Bracket | List" toggle to the bracket page header (hidden in draft status). List view renders current-round matchups as vertically stacked cards with no horizontal scroll on mobile. Votes use the same endpoint and `onVoteSuccess` callback as Bracket view; both views stay in sync via shared `voteMap`. Guest lock-in CTA is preserved in List view. Selected view mode persists in `localStorage`.

Archived at: `plans/completed/mobile-friendly-bracket-list-view.md`

---

## 2026-05-18 — vote-scroll-position-fix

SHIPPED. Prevented page-scroll-to-top after casting a vote. Captures `window.scrollY` before the re-fetch calls and restores it via a double `requestAnimationFrame` after `Promise.all` resolves. Applied to both `onVoteSuccess` callbacks in `BracketView.jsx` (one passed to `<BracketListView>`, one to `<BracketView>`). No vote logic or API changes.

Archived at: `plans/completed/vote-scroll-position-fix.md`

---

**Archive Note:** All completed features have been promoted to [`status-archive.md`](status-archive.md)
