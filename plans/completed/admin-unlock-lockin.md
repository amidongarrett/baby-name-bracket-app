# Admin: Unlock Lock-In

## Feature goal
Give the admin (Owner 1) a way to reset both parents' lock-in state so names can be adjusted and re-submitted without wiping votes or nuking the whole bracket.

## Scope
- A new "Unlock Lock-In" button appears in the admin Danger Zone whenever at least one owner is locked in
- Clicking it resets both lock-in flags to false and returns the bracket to draft status
- Any pre-generated matchup stubs are cleared (they will be re-generated when both parents re-lock)
- All names (owner1Names, owner2Names, bank, pending) are left completely untouched
- Neither parent's votes on a UserBracket are affected (this only resets the name-submission lock, not voting)
- After unlocking, both parents see the "Lock In My Names" button again and the names page is fully editable

## Affected surfaces
- Frontend: the admin settings panel in the Navbar gains a new "Unlock Lock-In" button in the Danger Zone section
- Backend: a new admin endpoint resets the two lock-in flags and clears matchup stubs without touching names

## Data & contracts

**New endpoint:** `POST /api/admin/unlock-lockin`
```json
Request:  { "bracketId": "<id>" }
Response: { "success": true, "owner1LockedIn": false, "owner2LockedIn": false, "status": "draft" }
```

Side effects on the bracket document:
- `owner1LockedIn` → `false`
- `owner2LockedIn` → `false`
- `status` → `'draft'` (if it was `'active'`)
- `matchups.roundOf32/16/elite8/final4/championship` → cleared to `[]`
- `previewMatchups` → cleared to `[]`
- `currentRound` → reset to `'Round of 32'`
- All name arrays, votes, publishedRounds → untouched

## Dependencies & ordering
No ordering constraints — single endpoint + single UI button.

## Acceptance criteria
- The "Unlock Lock-In" button appears in the admin panel when either owner is locked in
- After clicking and confirming, both parents see the "Lock In My Names" button again
- Names are unchanged after unlocking
- The bracket status returns to draft
- Both parents can re-lock in independently; the bracket re-activates normally once both do
- The button is not visible when neither owner is locked in (nothing to unlock)

## Implementation Plan

### Backend

**File: `/Users/garrettamidon/workspace/ai-workshop/baby-name-bracket-api/controllers/bracketController.js`**

- Add a new exported function `unlockLockin` after the existing `unlockNames` function (around line 1803).
- The function follows the identical shape of `unlockNames` but with two key differences:
  1. It does NOT guard against `status === 'draft'` — the button must also work when only one owner has locked in (status may still be `'draft'` at that point).
  2. It clears `previewMatchups` in addition to the five `matchups.*` sub-arrays, per the plan spec.
- Logic:
  ```js
  const unlockLockin = async (req, res) => {
    try {
      const bracketId = req.query.bracketId || req.body.bracketId;
      const bracket = await findBracket(bracketId);

      // Guard: nothing to unlock if neither owner is locked in
      if (!bracket.owner1LockedIn && !bracket.owner2LockedIn) {
        return res.status(400).json({ error: 'Neither owner is locked in. Nothing to unlock.' });
      }

      bracket.owner1LockedIn = false;
      bracket.owner2LockedIn = false;
      bracket.matchups.roundOf32    = [];
      bracket.matchups.roundOf16    = [];
      bracket.matchups.elite8       = [];
      bracket.matchups.final4       = [];
      bracket.matchups.championship = [];
      bracket.previewMatchups = [];
      bracket.status       = 'draft';
      bracket.currentRound = 'Round of 32';

      await bracket.save();

      return res.status(200).json({
        success: true,
        owner1LockedIn: false,
        owner2LockedIn: false,
        status: 'draft',
      });
    } catch (err) {
      console.error('Error in unlockLockin controller:', err);
      return res.status(500).json({ error: 'Failed to unlock lock-in' });
    }
  };
  ```
- Add `unlockLockin` to the `module.exports` object at the bottom of the file (around line 2182, beside `unlockNames`).

**File: `/Users/garrettamidon/workspace/ai-workshop/baby-name-bracket-api/routes/bracketRoutes.js`**

- Import `unlockLockin` in the destructured require from `../controllers/bracketController` (alongside `unlockNames` on line 27).
- Register the route after the existing `unlock-names` route (line 218):
  ```js
  router.post('/admin/unlock-lockin', unlockLockin);
  ```
- No auth middleware change needed — the admin routes in this file are unguarded at the router level (matching the pattern of `/admin/unlock-names`, `/admin/reset-and-regenerate`).

---

### Frontend

**File: `/Users/garrettamidon/workspace/ai-workshop/baby-name-bracket-app/components/layout/Navbar.jsx`**

**1. New state variable** — add alongside existing modal-state declarations (around line 23):
```js
const [showUnlockLockinModal, setShowUnlockLockinModal] = useState(false);
```

**2. New handler function** — add after `handleUnlockNames` (around line 119):
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

**3. New button in the Danger Zone** — insert after the existing "Unlock Names" button block and before the "Remove Owner 2" button (around line 382). Visibility condition: `currentBracket?.owner1LockedIn || currentBracket?.owner2LockedIn`.
```jsx
{(currentBracket?.owner1LockedIn || currentBracket?.owner2LockedIn) && (
  <button
    onClick={() => setShowUnlockLockinModal(true)}
    className="w-full px-3 py-2 bg-yellow-600 text-white text-xs font-bold rounded hover:bg-yellow-700 transition-colors text-left"
  >
    Unlock Lock-In
  </button>
)}
```

**4. New ConfirmModal** — add after the existing `{showUnlockModal && ...}` block (around line 469), before the closing `</nav>`:
```jsx
{showUnlockLockinModal && (
  <ConfirmModal
    title="Unlock Lock-In?"
    message="This resets both owners' lock-in state so names can be edited and re-submitted. Existing matchup stubs are cleared; all names and votes are left untouched. This cannot be undone."
    confirmLabel="Yes, Unlock"
    onConfirm={async () => { await handleUnlockLockin(); setShowUnlockLockinModal(false); }}
    onCancel={() => setShowUnlockLockinModal(false)}
    loading={dangerLoading}
  />
)}
```

---

### Verification steps

1. **Backend unit check** — POST to `http://localhost:3001/api/admin/unlock-lockin` with `{ "bracketId": "<id>" }` when one or both owners are locked in. Confirm response is `{ "success": true, "owner1LockedIn": false, "owner2LockedIn": false, "status": "draft" }`. Verify the bracket document in MongoDB has both flags false, matchups cleared, status draft.
2. **Guard check** — POST the same endpoint when neither owner is locked in; confirm 400 response with the error message.
3. **Frontend button visibility** — Log in as owner1, navigate to a bracket where at least one owner is locked in. Open the Navbar admin panel and confirm the "Unlock Lock-In" button appears in the Danger Zone. Confirm it is absent when neither owner is locked in.
4. **End-to-end flow** — Click "Unlock Lock-In", confirm the modal appears, confirm, and verify the page reloads with both owners seeing the "Lock In My Names" button and the names page fully editable. Confirm names are unchanged.
5. **Re-lock flow** — Both parents re-lock in; confirm the bracket re-activates (status becomes active, matchups regenerate) normally.

**Decomposition recommendation:** CROSS_CUTTING

---

Completed: 2026-05-20. Archived in plans/status-archive.md.
