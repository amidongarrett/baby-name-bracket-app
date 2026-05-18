"use client";

import { useState } from 'react';

export default function AdminPanel({
  bracket,
  matchupGrid,
  nameMap,
  publishedRounds,
  activeRoundKey,
  ownerPicks = {},
  onWinnerSet,
  onPublishRound,
  onUnlockNames,
  isOpen: isOpenProp,
  onToggle,
}) {
  const [localOpen, setLocalOpen] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  const open = isOpenProp !== undefined ? isOpenProp : localOpen;
  const toggle = onToggle ?? (() => setLocalOpen(p => !p));

  const isRoundPublished = publishedRounds.includes(activeRoundKey);

  // Only show matchups for the current active round that have both names
  const votableMatchups = matchupGrid.filter(m => m.name1Id && m.name2Id);

  // All matchups must have a winnerId before publish is allowed
  const allWinnersSet = votableMatchups.length > 0 &&
    votableMatchups.every(m => m.winnerId);

  return (
    <div className="max-w-7xl mx-auto px-4 mb-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-yellow-300 dark:border-yellow-700 shadow-sm overflow-hidden">
        {/* Panel Header / Toggle */}
        <button
          onClick={toggle}
          className="w-full flex items-center justify-between px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-yellow-800 dark:text-yellow-300">
              🏆 Admin: Pick Round Winners
            </span>
            {isRoundPublished && (
              <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 rounded border border-green-300 dark:border-green-700">
                ✅ Round Published
              </span>
            )}
          </div>
          <svg
            className={`w-5 h-5 text-yellow-700 dark:text-yellow-400 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Collapsible Body */}
        {open && (
          <div className="p-4">
            {votableMatchups.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No active matchups for this round yet.
              </p>
            ) : (
              <div className="space-y-3">
                {votableMatchups.map((matchup) => {
                  const matchupId = matchup._id || matchup.id;
                  const name1 = matchup.name1 || nameMap[matchup.name1Id]?.value || 'TBD';
                  const name2 = matchup.name2 || nameMap[matchup.name2Id]?.value || 'TBD';
                  const currentWinner = matchup.winnerId;

                  // Owner pick indicators
                  const picks = ownerPicks[matchupId] || {};
                  const owner1NameId = picks.owner1NameId || null;
                  const owner2NameId = picks.owner2NameId || null;
                  const owner1VotedName1 = owner1NameId === matchup.name1Id;
                  const owner1VotedName2 = owner1NameId === matchup.name2Id;
                  const owner2VotedName1 = owner2NameId === matchup.name1Id;
                  const owner2VotedName2 = owner2NameId === matchup.name2Id;

                  // Agreement status
                  let agreementStatus = null;
                  if (owner1NameId && owner2NameId) {
                    agreementStatus = owner1NameId === owner2NameId
                      ? { text: '✅ Agreed — winner auto-set', cls: 'text-green-600 dark:text-green-400' }
                      : { text: '⚠️ Conflict — owners disagree', cls: 'text-amber-600 dark:text-amber-400' };
                  } else if (owner1NameId || owner2NameId) {
                    agreementStatus = { text: '⏳ Waiting for other owner', cls: 'text-gray-500 dark:text-gray-400' };
                  }

                  return (
                    <div
                      key={matchupId}
                      className="flex flex-col gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      {/* Owner pick status */}
                      {agreementStatus && (
                        <p className={`text-xs font-semibold ${agreementStatus.cls}`}>
                          {agreementStatus.text}
                        </p>
                      )}

                      {/* Owner pick badges row */}
                      {(owner1NameId || owner2NameId) && (
                        <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                          {owner1NameId && (
                            <span>
                              👨 <span className="font-semibold">{owner1VotedName1 ? name1 : name2}</span>
                            </span>
                          )}
                          {owner2NameId && (
                            <span>
                              👩 <span className="font-semibold">{owner2VotedName1 ? name1 : name2}</span>
                            </span>
                          )}
                        </div>
                      )}

                      {/* Manual Override label */}
                      <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                        Manual Override (if needed)
                      </p>

                      {/* Name pick buttons */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => onWinnerSet(matchupId, matchup.name1Id)}
                          className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg border-2 transition-all ${
                            currentWinner === matchup.name1Id
                              ? 'bg-green-100 dark:bg-green-900/40 border-green-500 text-green-800 dark:text-green-300 shadow-sm'
                              : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20'
                          }`}
                        >
                          {currentWinner === matchup.name1Id && <span className="mr-1">🏆</span>}
                          {owner1VotedName1 && <span className="mr-0.5">👨</span>}
                          {owner2VotedName1 && <span className="mr-0.5">👩</span>}
                          {name1}
                        </button>

                        <span className="text-xs font-bold text-gray-400 dark:text-gray-500 shrink-0">
                          vs
                        </span>

                        <button
                          onClick={() => onWinnerSet(matchupId, matchup.name2Id)}
                          className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg border-2 transition-all ${
                            currentWinner === matchup.name2Id
                              ? 'bg-green-100 dark:bg-green-900/40 border-green-500 text-green-800 dark:text-green-300 shadow-sm'
                              : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/20'
                          }`}
                        >
                          {currentWinner === matchup.name2Id && <span className="mr-1">🏆</span>}
                          {owner1VotedName2 && <span className="mr-0.5">👨</span>}
                          {owner2VotedName2 && <span className="mr-0.5">👩</span>}
                          {name2}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Publish Round button */}
            <div className="mt-5 flex flex-col items-center gap-2">
              {isRoundPublished ? (
                <span className="px-6 py-2.5 text-sm font-semibold text-green-700 bg-green-100 rounded-lg border border-green-300 dark:bg-green-900/40 dark:text-green-400 dark:border-green-700">
                  ✅ Round Published — Guests can see results
                </span>
              ) : (
                <>
                  {!allWinnersSet && votableMatchups.length > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Set a winner for all {votableMatchups.length} matchups to enable publishing.
                    </p>
                  )}
                  <button
                    onClick={() => onPublishRound(activeRoundKey)}
                    disabled={!allWinnersSet}
                    className="px-6 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-bold rounded-lg shadow hover:from-yellow-600 hover:to-amber-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                  >
                    📢 Publish Round Results
                  </button>
                </>
              )}
            </div>

            {/* Danger Zone — Reset & Regenerate */}
            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="text-xs text-red-500 mb-2">
                ⚠️ Danger Zone — clears all votes and regenerates bracket with current seeding algorithm
              </p>
              <button
                onClick={async () => {
                  if (!window.confirm('Reset and regenerate the bracket? This will delete all votes.')) return;
                  await fetch('http://localhost:3001/api/admin/reset-and-regenerate', { method: 'POST' });
                  window.location.reload();
                }}
                className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 transition-colors"
              >
                🔄 Reset & Regenerate Bracket
              </button>

              {bracket.status !== 'draft' && (
                <>
                  <button
                    onClick={() => setShowUnlockModal(true)}
                    className="mt-2 px-4 py-2 bg-orange-600 text-white text-xs font-bold rounded hover:bg-orange-700 transition-colors"
                  >
                    🔓 Unlock Names
                  </button>

                  {showUnlockModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
                        <h2 className="text-lg font-bold text-red-600 mb-2">Unlock Names?</h2>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                          This will permanently erase <strong>all votes</strong> and <strong>all matchups</strong>.
                          The bracket will return to draft mode so names can be edited again.
                          This cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-end">
                          <button
                            onClick={() => setShowUnlockModal(false)}
                            className="px-4 py-2 text-sm rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={async () => {
                              setShowUnlockModal(false);
                              await fetch('http://localhost:3001/api/admin/unlock-names', { method: 'POST' });
                              onUnlockNames();
                            }}
                            className="px-4 py-2 text-sm font-bold rounded bg-red-600 text-white hover:bg-red-700"
                          >
                            Yes, Unlock
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
