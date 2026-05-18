/**
 * Lock the tournament bracket to prevent further modifications
 * @returns {Promise<Object>} The parsed JSON response from the API
 * @throws {Error} If the request fails or returns a non-ok status
 */
export async function lockTournamentBracket() {
  try {
    const response = await fetch('http://localhost:3001/api/bracket/lock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to lock tournament bracket: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // Re-throw with additional context if it's a network error
    if (error instanceof TypeError) {
      throw new Error(`Network error while locking tournament bracket: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Advance the tournament bracket to the next round
 * @param {string} round - The target round to advance to
 * @param {string} bracketId - The bracket ID to advance
 * @returns {Promise<Object>} The parsed JSON response from the API
 * @throws {Error} If the request fails or returns a non-ok status
 */
export async function advanceTournamentRound(round, bracketId) {
  try {
    const response = await fetch('http://localhost:3001/api/bracket/advance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ round, bracketId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to advance tournament round: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // Re-throw with additional context if it's a network error
    if (error instanceof TypeError) {
      throw new Error(`Network error while advancing tournament round: ${error.message}`);
    }
    throw error;
  }
}
