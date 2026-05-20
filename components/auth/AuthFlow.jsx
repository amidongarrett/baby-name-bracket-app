'use client';

import { useState } from 'react';
import { requestCode, verifyCode, setName } from '@/lib/authApi';
import { useUser } from '@/contexts/UserContext';
import { ICON_OPTIONS } from '@/lib/constants';
const TEST_EMAIL_RE = /^test\+.+@amidonlabs\.com$/i;

/**
 * Multi-step OTP authentication flow.
 *
 * Steps:
 *   1. email  — collect email address and send OTP
 *   2. code   — collect 6-digit code and verify
 *   3. name   — (new users only) collect display name
 *
 * @param {{ onComplete: () => void }} props
 */
export default function AuthFlow({ onComplete }) {
  const { login, token } = useUser();

  const [step, setStep]         = useState('email');
  const [email, setEmail]       = useState('');
  const [code, setCode]         = useState('');
  const [displayName, setDisplayName] = useState('');
  const [icon, setIcon]         = useState('👤');
  const [error, setError]       = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Ephemeral token stored during the name-collection step
  const [pendingToken, setPendingToken] = useState(null);

  async function handleEmailSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const trimmedEmail = email.trim();
      if (TEST_EMAIL_RE.test(trimmedEmail)) {
        // Test-email: skip OTP entirely — backend accepts any code
        const { token: newToken, isNewUser, user } = await verifyCode(trimmedEmail, '000000');
        login(newToken, user);
        if (isNewUser) {
          setPendingToken(newToken);
          setStep('name');
        } else {
          onComplete();
        }
      } else {
        await requestCode(trimmedEmail);
        setStep('code');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCodeSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { token: newToken, isNewUser, user } = await verifyCode(email.trim(), code.trim());
      login(newToken, user);
      if (isNewUser) {
        setPendingToken(newToken);
        setStep('name');
      } else {
        onComplete();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleNameSubmit(e) {
    e.preventDefault();
    setError('');
    if (!displayName.trim()) {
      setError('Display name is required.');
      return;
    }
    setSubmitting(true);
    try {
      const { user: updatedUser } = await setName(displayName.trim(), pendingToken || token, icon);
      login(pendingToken || token, updatedUser);
      onComplete();
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
    <div className="mx-auto w-full max-w-sm rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-2xl">
      {/* Logo / title */}
      <div className="mb-6 text-center">
        <span className="text-4xl">🏆</span>
        <h1 className="mt-2 text-xl font-bold text-white">Baby Name Bracket</h1>
      </div>

      {step === 'email' && (
        <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Email address
            </label>
            <input
              type="email"
              required
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={submitting} className={buttonClass}>
            {submitting ? 'Sending…' : 'Send sign-in code'}
          </button>
        </form>
      )}

      {step === 'code' && (
        <form onSubmit={handleCodeSubmit} className="flex flex-col gap-4">
          <p className="text-sm text-gray-400">
            We sent a 6-digit code to <span className="font-medium text-gray-200">{email}</span>.
          </p>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Enter code
            </label>
            <input
              type="text"
              required
              autoFocus
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              className={`${inputClass} tracking-[0.4em] text-center text-lg`}
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={submitting} className={buttonClass}>
            {submitting ? 'Verifying…' : 'Verify code'}
          </button>
          <button
            type="button"
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            onClick={() => { setStep('email'); setError(''); setCode(''); }}
          >
            Use a different email
          </button>
        </form>
      )}

      {step === 'name' && (
        <form onSubmit={handleNameSubmit} className="flex flex-col gap-4">
          <p className="text-sm text-gray-400">
            Welcome! Choose a display name that others will see when you vote.
          </p>
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
            <label className="mb-1.5 block text-sm font-medium text-gray-300">Choose your icon</label>
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
            {submitting ? 'Saving…' : 'Set display name'}
          </button>
        </form>
      )}
    </div>
  );
}
