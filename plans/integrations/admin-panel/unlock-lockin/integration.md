# Unlock Lock-In — Integration Reference

## API endpoint

**`POST /api/admin/unlock-lockin`**

No auth middleware at the router level (matches the pattern of all `/admin/*` routes in `bracketRoutes.js`).

### Request body
```json
{ "bracketId": "<bracket sessionId or _id>" }
```
`bracketId` is also accepted as a query parameter (`req.query.bracketId`).

### Success response — HTTP 200
```json
{
  "success": true,
  "owner1LockedIn": false,
  "owner2LockedIn": false,
  "status": "draft"
}
```

### Guard — HTTP 400
Returned when neither owner is locked in:
```json
{ "error": "Neither owner is locked in. Nothing to unlock." }
```

## Backend handler

**File:** `baby-name-bracket-api/controllers/bracketController.js`
**Function:** `unlockLockin` (exported, registered in `module.exports`)

### Fields mutated on the Bracket document

| Field | Before | After |
|-------|--------|-------|
| `owner1LockedIn` | `true` or `false` | `false` |
| `owner2LockedIn` | `true` or `false` | `false` |
| `matchups.roundOf32` | array | `[]` |
| `matchups.roundOf16` | array | `[]` |
| `matchups.elite8` | array | `[]` |
| `matchups.final4` | array | `[]` |
| `matchups.championship` | array | `[]` |
| `previewMatchups` | array | `[]` |
| `status` | `'active'` or `'draft'` | `'draft'` |
| `currentRound` | any | `'Round of 32'` |

**Not touched:** `owner1Names`, `owner2Names`, `bank`, `pending`, `publishedRounds`, all `UserBracket` vote data.

### Key design decision
Unlike `unlockNames` (which guards against `status === 'draft'`), `unlockLockin` intentionally has no status guard. This allows the admin to revert a single owner's partial lock-in before the bracket reaches `active`.

## Route registration

**File:** `baby-name-bracket-api/routes/bracketRoutes.js`
```js
router.post('/admin/unlock-lockin', unlockLockin);
```
Positioned after `router.post('/admin/unlock-names', unlockNames)` at line 220.

## Frontend — Navbar.jsx

**File:** `baby-name-bracket-app/components/layout/Navbar.jsx`

### State
```js
const [showUnlockLockinModal, setShowUnlockLockinModal] = useState(false);
```

### Handler
```js
async function handleUnlockLockin() {
  setDangerLoading(true);
  await fetch(`${BASE_URL}/api/admin/unlock-lockin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ bracketId: currentBracketId }),
  });
  setDangerLoading(false);
  window.location.reload();
}
```

### Button visibility condition
```jsx
{(currentBracket?.owner1LockedIn || currentBracket?.owner2LockedIn) && (
  <button onClick={() => setShowUnlockLockinModal(true)} ...>
    Unlock Lock-In
  </button>
)}
```
Button is yellow (`bg-yellow-600`). Positioned in the Danger Zone between "Unlock Names" and "Remove Owner 2".

### ConfirmModal
Uses the shared `ConfirmModal` component. The confirmation message explicitly states names and votes are untouched.

## Data model reference

**Model:** `baby-name-bracket-api/models/Bracket.js`

Relevant fields:
- `owner1LockedIn: { type: Boolean, default: false }`
- `owner2LockedIn: { type: Boolean, default: false }`
- `status`: enum `['draft', 'active', 'completed']`, default `'draft'`
- `currentRound`: enum of round names, default `'Round of 32'`
- `previewMatchups`: array (auto-calculated during draft, not permanently persisted between sessions)
- `matchups.roundOf32 / roundOf16 / elite8 / final4 / championship`: arrays of matchup objects

## Testing with guest accounts

Use the test email pattern `test+<alias>@amidonlabs.com` — no real OTP is required for these accounts.

### Steps to verify end-to-end

1. Sign in as Owner 1 using `test+admin@amidonlabs.com` (or any `test+` alias configured as the bracket owner).
2. Open the bracket and navigate to the names page. Confirm both owners have 16 names each and the bracket `status` is `'active'` (visible in the Navbar admin panel or the names page header).
3. Open the Navbar admin panel (click the user icon). In the Danger Zone, confirm the "Unlock Lock-In" button is visible (yellow).
4. Click "Unlock Lock-In". Confirm the `ConfirmModal` appears with the correct warning text.
5. Click "Yes, Unlock". Confirm the page reloads.
6. After reload, verify:
   - Both owners see the "Lock In My Names" button on the names page (lock-in state reset).
   - All names are unchanged (no names were deleted).
   - The bracket `status` is `'draft'` (visible in the admin panel or bracket header).
   - The "Unlock Lock-In" button is no longer visible in the Danger Zone (neither owner is locked in).
7. Confirm the guard: POST `http://localhost:3001/api/admin/unlock-lockin` with `{ "bracketId": "<id>" }` when neither owner is locked in. Expect HTTP 400 with `{ "error": "Neither owner is locked in. Nothing to unlock." }`.
8. Re-lock both owners in: have each owner click "Lock In My Names". Confirm the bracket returns to `status: 'active'` and matchups regenerate normally.
