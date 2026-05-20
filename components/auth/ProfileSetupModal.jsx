'use client';

import { useState } from 'react';
import { setName } from '@/lib/authApi';
import { useUser } from '@/contexts/UserContext';
import { ICON_OPTIONS } from '@/lib/constants';

/**
 * ProfileSetupModal — blocks app access for authenticated users whose profile
 * is missing a display name or icon. Non-dismissible: has no close button and
 * cannot be bypassed. Once submitted, updateUser() flips isProfileComplete in
 * context and AuthGate automatically renders children.
 */
export default function ProfileSetupModal() {
  const { user, token, updateUser } = useUser();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [icon, setIcon]               = useState(user?.icon || '👤');
  const [error, setError]             = useState('');
  const [submitting, setSubmitting]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!displayName.trim()) {
      setError('Display name is required.');
      return;
    }
    if (!ICON_OPTIONS.includes(icon)) {
      setError('Please select a valid icon.');
      return;
    }

    setSubmitting(true);
    try {
      const { user: updatedUser } = await setName(displayName.trim(), token, icon);
      updateUser(updatedUser);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';
  const buttonClass =
    'w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 to-gray-900 px-4">
      <div className="mx-auto w-full max-w-sm rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <span className="text-4xl">🏆</span>
          <h1 className="mt-2 text-xl font-bold text-white">Complete Your Profile</h1>
          <p className="mt-1 text-sm text-gray-400">
            Choose a display name and icon before continuing.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Display name
            </label>
            <input
              type="text"
              required
              autoFocus
              maxLength={50}
              placeholder="e.g. Grandma Sue"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Choose your icon
            </label>
            <div className="flex flex-wrap gap-2 mt-1">
              {ICON_OPTIONS.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setIcon(opt)}
                  className={`text-2xl rounded-lg p-1.5 border-2 transition-colors ${
                    icon === opt
                      ? 'border-indigo-500 bg-indigo-900/40'
                      : 'border-gray-700 bg-gray-800 hover:border-gray-500'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button type="submit" disabled={submitting} className={buttonClass}>
            {submitting ? 'Saving…' : 'Save and continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
