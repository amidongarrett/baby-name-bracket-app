'use client';

import { Droppable, Draggable } from '@hello-pangea/dnd';

function getEffectiveRank(item, sharedNames) {
  if (item.isShared) {
    const shared = sharedNames.find(s => s.name === item.name);
    return shared ? shared.rank : item.rank;
  }
  return item.rank;
}

/**
 * DraggableNameList
 *
 * Props:
 *   names        — array of active name objects { id, name, rank, isShared }
 *   droppableId  — string ('owner1-active' | 'owner2-active')
 *   isOwner      — boolean; controls drag handles and remove buttons
 *   isLocked     — boolean; disables drag when true
 *   onRemove(id) — callback
 *   sharedNames  — passed through for getEffectiveRank
 */
export default function DraggableNameList({
  names,
  droppableId,
  isOwner,
  isLocked,
  onRemove,
  sharedNames = [],
}) {
  return (
    <Droppable droppableId={droppableId} isDropDisabled={isLocked || !isOwner}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`space-y-2 min-h-[2rem] rounded-lg transition-colors ${
            snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''
          }`}
        >
          {names.map((item, index) => (
            <Draggable
              key={item.id}
              draggableId={item.id}
              index={index}
              isDragDisabled={isLocked || !isOwner}
            >
              {(dragProvided, dragSnapshot) => (
                <div
                  ref={dragProvided.innerRef}
                  {...dragProvided.draggableProps}
                  {...(isOwner && !isLocked ? dragProvided.dragHandleProps : {})}
                  style={{
                    ...(dragProvided.draggableProps.style || {}),
                    ...(isOwner && !isLocked ? { touchAction: 'none' } : {}),
                  }}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg select-none ${
                    item.isShared
                      ? 'bg-purple-50 dark:bg-purple-900/30 border-2 border-purple-300 dark:border-purple-700'
                      : 'bg-gray-50 dark:bg-gray-800'
                  } ${dragSnapshot.isDragging ? 'shadow-lg ring-2 ring-blue-400' : ''} ${isOwner && !isLocked ? 'cursor-grab active:cursor-grabbing' : ''}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Drag handle icon — visual indicator only; drag events handled by outer div */}
                    {isOwner && !isLocked && (
                      <span
                        className="text-gray-400 dark:text-gray-500 flex-shrink-0"
                        title="Drag to reorder"
                        aria-hidden="true"
                      >
                        <svg width="12" height="20" viewBox="0 0 12 20" fill="currentColor">
                          <circle cx="4" cy="4" r="1.5" />
                          <circle cx="8" cy="4" r="1.5" />
                          <circle cx="4" cy="10" r="1.5" />
                          <circle cx="8" cy="10" r="1.5" />
                          <circle cx="4" cy="16" r="1.5" />
                          <circle cx="8" cy="16" r="1.5" />
                        </svg>
                      </span>
                    )}
                    {/* Rank badge */}
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded flex-shrink-0 ${
                        item.isShared
                          ? 'text-purple-600 dark:text-purple-400 bg-purple-200 dark:bg-purple-900/60'
                          : 'text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700'
                      }`}
                    >
                      #{getEffectiveRank(item, sharedNames)}
                    </span>
                    <div className="flex items-center gap-1 min-w-0">
                      {item.isShared && (
                        <span className="text-purple-500 flex-shrink-0" title="Shared Favorite">
                          💜
                        </span>
                      )}
                      <span className="text-foreground truncate">{item.name}</span>
                    </div>
                  </div>
                  {isOwner && !isLocked && (
                    <button
                      onClick={() => onRemove(item.id)}
                      className="text-red-500 hover:text-red-700 font-medium text-sm flex-shrink-0 ml-2"
                    >
                      Remove
                    </button>
                  )}
                </div>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}
