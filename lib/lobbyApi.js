const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Create a new bracket.
 * @param {{ owner1Name: string, owner2Name: string, owner2Email: string }} body
 * @param {string} token
 * @returns {Promise<{ bracket: { id, inviteCode, owner1Name, owner2Name, status } }>}
 */
export async function createBracket({ owner1Name, owner2Name, owner2Email }, token) {
  const res = await fetch(`${BASE_URL}/api/brackets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ owner1Name, owner2Name, owner2Email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create bracket');
  return data;
}

/**
 * Fetch brackets the authenticated user owns or guests on.
 * @param {string} token
 * @returns {Promise<{ owned: Bracket[], guest: Bracket[] }>}
 */
export async function getMyBrackets(token) {
  const res = await fetch(`${BASE_URL}/api/brackets/mine`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch brackets');
  return data;
}

/**
 * Join a bracket as a guest using its invite code.
 * @param {string} inviteCode
 * @param {string} token
 * @returns {Promise<{ bracket: { id, inviteCode, owner1Name, owner2Name, status } }>}
 */
export async function joinBracket(inviteCode, token) {
  const res = await fetch(`${BASE_URL}/api/brackets/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ inviteCode }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to join bracket');
  return data;
}

/**
 * Join an active bracket by its ID (test-user bypass — no invite code needed).
 * @param {string} bracketId
 * @param {string} token
 * @returns {Promise<{ bracket: { id, inviteCode, owner1Name, owner2Name, status } }>}
 */
export async function joinBracketById(bracketId, token) {
  const res = await fetch(`${BASE_URL}/api/brackets/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ bracketId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to join bracket');
  return data;
}

/**
 * Accept the Owner 2 seat on a bracket (called from the invite link).
 * @param {string} inviteCode
 * @param {string} token
 * @returns {Promise<{ bracket: { id, inviteCode, owner1Name, owner2Name, status } }>}
 */
export async function acceptOwner2(inviteCode, token) {
  const res = await fetch(`${BASE_URL}/api/brackets/${inviteCode}/accept-owner`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to accept invite');
  return data;
}
