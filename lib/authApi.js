const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Request a 6-digit OTP be sent to the given email.
 * @param {string} email
 * @returns {Promise<{ message: string }>}
 */
export async function requestCode(email) {
  const res = await fetch(`${BASE_URL}/api/auth/request-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to send code');
  return data;
}

/**
 * Verify an OTP and receive a JWT on success.
 * @param {string} email
 * @param {string} code
 * @returns {Promise<{ token: string, isNewUser: boolean, user: { id, email, displayName } }>}
 */
export async function verifyCode(email, code) {
  const res = await fetch(`${BASE_URL}/api/auth/verify-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Invalid or expired code');
  return data;
}

/**
 * Set the authenticated user's display name.
 * @param {string} displayName
 * @param {string} token
 * @returns {Promise<{ user: { id, email, displayName } }>}
 */
export async function setName(displayName, token) {
  const res = await fetch(`${BASE_URL}/api/auth/set-name`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ displayName }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to set display name');
  return data;
}

/**
 * Fetch the current authenticated user.
 * @param {string} token
 * @returns {Promise<{ user: { id, email, displayName } }>}
 */
export async function getMe(token) {
  const res = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Not authenticated');
  return data;
}
