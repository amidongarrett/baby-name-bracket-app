'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';
import { createBracket, getMyBrackets, joinBracket } from '@/lib/lobbyApi';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function StatusBadge({ status }) {
  const styles = {
    draft:     'bg-yellow-100 text-yellow-800 border border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700',
    active:    'bg-green-100 text-green-800 border border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700',
    completed: 'bg-gray-100 text-gray-700 border border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
  };
  const labels = { draft: 'Draft', active: 'Active', completed: 'Completed' };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${styles[status] || styles.draft}`}>
      {labels[status] || status}
    </span>
  );
}

function BracketCard({ bracket }) {
  const name = bracket.name || `${bracket.owner1Name} & ${bracket.owner2Name}`;
  return (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors">
      <div className="flex flex-col gap-1 min-w-0">
        <span className="font-semibold text-gray-900 dark:text-white truncate">{name}</span>
        <div className="flex items-center gap-2">
          <StatusBadge status={bracket.status} />
          {bracket.currentRound && (
            <span className="text-xs text-gray-500 dark:text-gray-400">{bracket.currentRound}</span>
          )}
        </div>
      </div>
      <Link
        href={`/bracket/${bracket._id || bracket.id}`}
        className="ml-4 shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Open
      </Link>
    </div>
  );
}

function CreateModal({ user, token, onClose, onCreated }) {
  const [owner1Name, setOwner1Name] = useState(user?.displayName || '');
  const [owner2Name, setOwner2Name] = useState('');
  const [owner2Email, setOwner2Email] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const validate = () => {
    if (!owner1Name.trim()) return 'Your name is required.';
    if (!owner2Name.trim()) return "Partner's name is required.";
    if (!owner2Email.trim()) return "Partner's email is required.";
    if (!EMAIL_REGEX.test(owner2Email.trim())) return 'Enter a valid email address.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setError(null);
    setSubmitting(true);
    try {
      const result = await createBracket(
        { owner1Name: owner1Name.trim(), owner2Name: owner2Name.trim(), owner2Email: owner2Email.trim() },
        token
      );
      onCreated(result.bracket);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create a Bracket</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Your Name
            </label>
            <input
              type="text"
              value={owner1Name}
              onChange={(e) => setOwner1Name(e.target.value)}
              placeholder="e.g. Garrett"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Partner's Name
            </label>
            <input
              type="text"
              value={owner2Name}
              onChange={(e) => setOwner2Name(e.target.value)}
              placeholder="e.g. Ashley"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Partner's Email
            </label>
            <input
              type="email"
              value={owner2Email}
              onChange={(e) => setOwner2Email(e.target.value)}
              placeholder="partner@example.com"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">An invite link will be emailed to them.</p>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating…' : 'Create Bracket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function JoinModal({ token, onClose, onJoined }) {
  const [inviteCode, setInviteCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) { setError('Enter an invite code.'); return; }
    setError(null);
    setSubmitting(true);
    try {
      const result = await joinBracket(inviteCode.trim().toUpperCase(), token);
      onJoined(result.bracket);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Join a Bracket</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Invite Code
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="e.g. AB12CD34"
              maxLength={8}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Joining…' : 'Join'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LobbyPage() {
  const { token, user } = useUser();
  const [owned, setOwned] = useState([]);
  const [guest, setGuest] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    getMyBrackets(token)
      .then(({ owned: o, guest: g }) => {
        setOwned(o || []);
        setGuest(g || []);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleCreated = (bracket) => {
    setOwned((prev) => [bracket, ...prev]);
    setShowCreate(false);
  };

  const handleJoined = (bracket) => {
    setGuest((prev) => [bracket, ...prev]);
    setShowJoin(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Baby Name Bracket</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your tournament brackets</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowJoin(true)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
            >
              Join
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors text-sm"
            >
              + Create
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-10">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-gray-500 text-sm">Loading brackets…</p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Your Brackets */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Brackets</h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">{owned.length} bracket{owned.length !== 1 ? 's' : ''}</span>
              </div>

              {owned.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                  <p className="text-gray-500 dark:text-gray-400 text-center">
                    You haven't created any brackets yet.
                  </p>
                  <button
                    onClick={() => setShowCreate(true)}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors text-sm"
                  >
                    Create your first bracket
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {owned.map((b) => <BracketCard key={b._id || b.id} bracket={b} />)}
                </div>
              )}
            </section>

            {/* Brackets You've Joined */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Brackets You've Joined</h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">{guest.length} bracket{guest.length !== 1 ? 's' : ''}</span>
              </div>

              {guest.length === 0 ? (
                <div className="py-10 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                  <p className="text-center text-gray-400 dark:text-gray-600 text-sm">
                    You haven't joined any brackets as a guest. Use the Join button and enter an invite code.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {guest.map((b) => <BracketCard key={b._id || b.id} bracket={b} />)}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {showCreate && (
        <CreateModal
          user={user}
          token={token}
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}

      {showJoin && (
        <JoinModal
          token={token}
          onClose={() => setShowJoin(false)}
          onJoined={handleJoined}
        />
      )}
    </div>
  );
}
