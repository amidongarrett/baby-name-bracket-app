"use client";

import ListMatchupCard from './ListMatchupCard';

// Maps API round keys → human-readable labels
const ROUND_DISPLAY = {
  roundOf32:    'Round of 32',
  roundOf16:    'Sweet 16',
  elite8:       'Elite 8',
  final4:       'Final 4',
  championship: 'Championship',
};

export default function BracketListView({
  matchups = [],
  status,
  voterId,
  voteMap = {},
  viewerRole = 'guest',
  ownerPicks = {},
  lockedRounds = [],
  publishedRounds = [],
  activeRoundKey = 'roundOf32',
  bracketMatchups = {},
  nameMap = {},
  onVoteSuccess,
  onGuestLockIn,
}) {
  const isLockedIn      = lockedRounds.includes(activeRoundKey);
  const isRoundPublished = publishedRounds.includes(activeRoundKey);

  // Count how many current-round matchups the viewer has voted on
  const votableMatchups = matchups.filter(m => m.name1Id && m.name2Id);
  const votedCount = votableMatchups.filter(m => voteMap[m._id || m.id]).length;
  const allVoted = votableMatchups.length > 0 && votedCount === votableMatchups.length;

  // Derive champion from bracketMatchups if available
  const championNameId = bracketMatchups.championNameId || null;
  const isTournamentComplete = status === 'completed' || !!championNameId;

  const roundLabel = ROUND_DISPLAY[activeRoundKey] || activeRoundKey;

  return (
    <div className="space-y-3 px-4 pb-8">
      {/* Round label */}
      <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 pt-4">
        {roundLabel}
      </h3>

      {isTournamentComplete ? (
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 rounded-2xl border-2 border-yellow-400 dark:border-yellow-700 p-6 text-center">
          <p className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">Tournament Complete</p>
          {championNameId && nameMap[championNameId] && (
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Champion: <span className="font-semibold text-yellow-700 dark:text-yellow-400">{nameMap[championNameId].value}</span>
            </p>
          )}
        </div>
      ) : (
        <>
          {matchups.map((matchup, index) => (
            <ListMatchupCard
              key={matchup._id || matchup.id || `list-${index}`}
              matchup={matchup}
              status={status}
              index={index}
              voterId={voterId}
              voteMap={voteMap}
              viewerRole={viewerRole}
              ownerPicks={ownerPicks}
              isLockedIn={isLockedIn}
              isRoundPublished={isRoundPublished}
              onVoteSuccess={onVoteSuccess}
            />
          ))}

          {/* Guest lock-in CTA */}
          {status === 'active' && viewerRole === 'guest' && (
            <div className="mt-4 text-center">
              {!isLockedIn && (
                <>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    {allVoted
                      ? 'All picks made! Lock in to see how others voted.'
                      : `${votedCount} / ${votableMatchups.length} matchups picked`}
                  </p>
                  <button
                    onClick={onGuestLockIn}
                    disabled={!allVoted}
                    className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-lg shadow hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                  >
                    Lock In My Picks
                  </button>
                </>
              )}
              {isLockedIn && (
                <span className="px-4 py-2 text-sm font-semibold text-green-700 bg-green-100 dark:bg-green-900/40 dark:text-green-400 rounded-lg border border-green-300 dark:border-green-700">
                  Picks Locked In
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
