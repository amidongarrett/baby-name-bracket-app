/**
 * NameCard Component
 * Purely presentational — renders a single contestant row within a matchup card.
 * No useState, no fetch. All values are pre-computed by MatchupCard and passed as props.
 */

export default function NameCard({
  name,
  nameId,
  seed,
  isPlaceholder,
  status,
  isOwner,
  canVote,
  isVoting,
  votedForThis,
  votedForOther,
  ownerHasVoted,
  effectiveWinnerId,
  isWinner,
  otherIsWinner,
  isLeading,
  hasConflict,
  dadVotedThis,
  momVotedThis,
  guestWrong,
  otherName,
  feederWrongPick = null,
  guestCorrect = false,
  votes,
  percentage,
  showVoteBars,
  rowColor,
  onVote,
  rowBg,
}) {
  const nameText = otherIsWinner
    ? 'text-gray-400 dark:text-gray-500'
    : isWinner
      ? 'text-green-800 dark:text-green-300 font-bold'
      : isPlaceholder
        ? 'text-gray-400 italic'
        : 'text-gray-900 dark:text-gray-100 font-bold';

  const voteButtonClass = rowColor === 'blue'
    ? 'ml-2 px-2 py-0.5 text-[10px] font-semibold bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
    : 'ml-2 px-2 py-0.5 text-[10px] font-semibold bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  const isBottomRow = rowColor === 'purple';
  const borderClass = isBottomRow ? '' : 'border-b border-gray-200 dark:border-gray-700';

  const voteTextClass = isLeading
    ? 'text-[9px] text-green-600 dark:text-green-400 font-medium w-14 text-right tabular-nums'
    : 'text-[9px] text-gray-400 dark:text-gray-500 font-medium w-14 text-right tabular-nums';

  return (
    <>
      {feederWrongPick && (
        <div className="text-[9px] px-2.5 pt-1 text-gray-500">
          You picked: <span className="line-through text-red-400">{feederWrongPick.guestName}</span>
          {' → '}
          <span className="text-green-600 font-semibold">{feederWrongPick.actualName}</span>
        </div>
      )}
      {guestWrong && (
        <div className="text-[9px] text-green-600 font-semibold px-2.5 pt-1">
          ✓ Actual: {otherName}
        </div>
      )}
      <div className={`flex items-center justify-between px-2.5 py-2 ${borderClass} transition-colors ${rowBg} ${guestCorrect ? 'border-l-4 border-green-500' : ''}`}>
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className={`text-xs font-bold w-5 text-center shrink-0 ${otherIsWinner ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
            {isPlaceholder ? '-' : seed}
          </span>
          {isWinner && <span className="text-xs shrink-0">🏆</span>}
          <span className={`text-sm truncate ${guestWrong ? 'line-through text-red-400 dark:text-red-500' : nameText}`}>
            {name}
          </span>
          {hasConflict && dadVotedThis && <span className="text-xs shrink-0 ml-1">👨</span>}
          {hasConflict && momVotedThis && <span className="text-xs shrink-0 ml-1">👩</span>}
        </div>
        {status === 'active' && !isPlaceholder && !effectiveWinnerId && (
          ownerHasVoted
            ? <span className="ml-2 px-2 py-0.5 text-[10px] font-semibold text-amber-700 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-400 rounded whitespace-nowrap">
                Matchup in progress
              </span>
            : votedForThis
              ? <span className="ml-2 px-2 py-0.5 text-[10px] font-semibold text-green-700 bg-green-100 dark:bg-green-900/40 dark:text-green-400 rounded">✓ Picked</span>
              : votedForOther && canVote
                ? <button
                    onClick={(e) => { e.stopPropagation(); onVote(nameId); }}
                    disabled={isVoting}
                    className="ml-2 px-2 py-0.5 text-[10px] font-semibold bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Change
                  </button>
                : canVote && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onVote(nameId); }}
                      disabled={isVoting}
                      className={voteButtonClass}
                    >
                      Vote
                    </button>
                  )
        )}
        {status === 'draft' && <span className="text-[10px] text-gray-400 ml-2">-</span>}
      </div>

      {status === 'active' && !isPlaceholder && showVoteBars && (
        <div className={`px-2.5 pb-1.5 ${otherIsWinner ? 'opacity-40' : ''}`}>
          <div className="flex items-center gap-1">
            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${rowColor === 'blue' ? 'bg-blue-500' : 'bg-purple-500'} transition-all duration-300`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className={voteTextClass}>
              {`${votes} (${percentage}%)`}
            </span>
          </div>
        </div>
      )}
    </>
  );
}
