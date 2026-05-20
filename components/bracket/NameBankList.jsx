'use client';

import { useState } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';

/**
 * NameBankList
 *
 * Props:
 *   bankNames    — array of bank name objects { id, name }
 *   droppableId  — string ('owner1-bank' | 'owner2-bank')
 *   isOwner      — boolean
 *   isLocked     — boolean
 *   onRemove(id) — callback
 */
export default function NameBankList({
  bankNames,
  droppableId,
  isOwner,
  isLocked,
  onRemove,
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="mt-4 border border-dashed border-amber-300 dark:border-amber-700 rounded-lg overflow-hidden">
      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setIsExpanded(prev => !prev)}
        className="w-full flex items-center justify-between px-3 py-2 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
      >
        <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
          Name Bank ({bankNames.length})
        </span>
        <svg
          className={`w-4 h-4 text-amber-600 dark:text-amber-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <Droppable droppableId={droppableId} isDropDisabled={isLocked || !isOwner}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`p-2 space-y-2 min-h-[3rem] transition-colors ${
                snapshot.isDraggingOver ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-white dark:bg-gray-900'
              }`}
            >
              {bankNames.length === 0 ? (
                <p className="text-xs text-center text-gray-400 dark:text-gray-600 italic py-3">
                  {isOwner ? 'Drag names here or add more than 16 to fill the bank.' : 'Bank is empty.'}
                </p>
              ) : (
                bankNames.map((item, index) => (
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
                        className={`flex items-center justify-between px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 select-none ${
                          dragSnapshot.isDragging ? 'shadow-lg ring-2 ring-amber-400' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isOwner && !isLocked && (
                            <span
                              {...dragProvided.dragHandleProps}
                              className="text-amber-400 dark:text-amber-500 cursor-grab active:cursor-grabbing flex-shrink-0"
                              title="Drag to active list"
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
                          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded flex-shrink-0">
                            BANK
                          </span>
                          <span className="text-foreground truncate">{item.name}</span>
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
                ))
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      )}
    </div>
  );
}
