'use client';

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Destination, Trip, formatDate, calculateNights, formatCurrency } from '@/types/itinerary';

interface DestinationRailProps {
  destinations: Destination[];
  activeDestinationId: string;
  onDestinationSelect: (id: string) => void;
  onDestinationsReorder: (destinations: Destination[]) => void;
  trip: Trip;
}

export default function DestinationRail({
  destinations,
  activeDestinationId,
  onDestinationSelect,
  onDestinationsReorder,
  trip
}: DestinationRailProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'lodging' | 'notes' | null>(null);
  const [editValue, setEditValue] = useState('');

  // Handle drag end for destination reordering
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(destinations);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order property
    const updatedDestinations = items.map((dest, index) => ({
      ...dest,
      order: index
    }));

    onDestinationsReorder(updatedDestinations);
  };

  // Start inline editing
  const startEdit = (id: string, field: 'lodging' | 'notes', currentValue: string) => {
    setEditingId(id);
    setEditingField(field);
    setEditValue(currentValue || '');
  };

  // Save edit
  const saveEdit = () => {
    if (!editingId || !editingField) return;

    const updatedDestinations = destinations.map(dest =>
      dest.id === editingId
        ? { ...dest, [editingField]: editValue }
        : dest
    );

    onDestinationsReorder(updatedDestinations);
    setEditingId(null);
    setEditingField(null);
    setEditValue('');
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingId(null);
    setEditingField(null);
    setEditValue('');
  };

  // Handle keyboard events for inline editing
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  // Get destination color based on order
  const getDestinationColor = (index: number) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-red-500',
      'bg-teal-500'
    ];
    return colors[index % colors.length];
  };

  // Calculate destination stats
  const getDestinationStats = (destination: Destination) => {
    const destDays = trip.days.filter(day => day.destinationId === destination.id);
    const totalActivities = destDays.reduce((sum, day) => sum + day.activities.length, 0);
    const totalCost = destDays.reduce((sum, day) => sum + day.totalCost, 0);
    
    return {
      days: destDays.length,
      activities: totalActivities,
      cost: totalCost
    };
  };

  // Check for conflicts (overlapping dates, missing lodging, etc.)
  const getDestinationConflicts = (destination: Destination) => {
    const conflicts: string[] = [];
    
    if (!destination.lodging?.trim()) {
      conflicts.push('No lodging specified');
    }
    
    if (destination.estimatedCost === 0) {
      conflicts.push('No budget set');
    }

    return conflicts;
  };

  return (
    <div className="flex-1 overflow-auto">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="destinations">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`p-4 space-y-3 ${
                snapshot.isDraggingOver ? 'bg-blue-50' : ''
              } transition-colors duration-200`}
            >
              {destinations.map((destination, index) => {
                const stats = getDestinationStats(destination);
                const conflicts = getDestinationConflicts(destination);
                const isActive = destination.id === activeDestinationId;
                const colorClass = getDestinationColor(index);

                return (
                  <Draggable
                    key={destination.id}
                    draggableId={destination.id}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`bg-white rounded-xl border-2 transition-all duration-200 ${
                          isActive 
                            ? 'border-blue-500 shadow-lg ring-2 ring-blue-100' 
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                        } ${
                          snapshot.isDragging ? 'rotate-2 scale-105 shadow-xl' : ''
                        }`}
                        onClick={() => onDestinationSelect(destination.id)}
                        role="button"
                        tabIndex={0}
                        aria-pressed={isActive}
                        aria-label={`Select ${destination.name}, ${calculateNights(destination.startDate, destination.endDate)} nights, ${stats.activities} activities, ${formatCurrency(stats.cost)}`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onDestinationSelect(destination.id);
                          }
                        }}
                      >
                        {/* Drag Handle */}
                        <div
                          {...provided.dragHandleProps}
                          className="flex items-center justify-between p-4 cursor-grab active:cursor-grabbing"
                        >
                          <div className="flex items-center gap-3">
                            {/* Color indicator */}
                            <div className={`w-3 h-3 rounded-full ${colorClass}`} />
                            
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {destination.name}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {formatDate(destination.startDate)} - {formatDate(destination.endDate)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Conflict badge */}
                            {conflicts.length > 0 && (
                              <div 
                                className="w-2 h-2 bg-red-500 rounded-full"
                                title={conflicts.join(', ')}
                              />
                            )}
                            
                            {/* Drag icon */}
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                            </svg>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="px-4 pb-2">
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{calculateNights(destination.startDate, destination.endDate)} nights</span>
                            <span>{stats.activities} activities</span>
                            <span>{formatCurrency(stats.cost)}</span>
                          </div>
                        </div>

                        {/* Lodging */}
                        <div className="px-4 pb-2">
                          {editingId === destination.id && editingField === 'lodging' ? (
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={saveEdit}
                              onKeyDown={handleKeyDown}
                              placeholder="Where are you staying?"
                              className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                              autoFocus
                            />
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startEdit(destination.id, 'lodging', destination.lodging || '');
                              }}
                              className="w-full text-left text-sm text-gray-600 hover:text-blue-600 py-1 transition-colors duration-200"
                            >
                              🏨 {destination.lodging || 'Add lodging...'}
                            </button>
                          )}
                        </div>

                        {/* Notes */}
                        {destination.notes && (
                          <div className="px-4 pb-3">
                            {editingId === destination.id && editingField === 'notes' ? (
                              <textarea
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={saveEdit}
                                onKeyDown={handleKeyDown}
                                placeholder="Notes about this destination..."
                                className="w-full px-2 py-1 text-sm border border-blue-500 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-200"
                                rows={2}
                                autoFocus
                              />
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEdit(destination.id, 'notes', destination.notes || '');
                                }}
                                className="w-full text-left text-sm text-gray-500 hover:text-blue-600 py-1 transition-colors duration-200"
                              >
                                📝 {destination.notes}
                              </button>
                            )}
                          </div>
                        )}

                        {/* Conflicts indicator */}
                        {conflicts.length > 0 && isActive && (
                          <div className="px-4 pb-3">
                            <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                              <p className="text-xs font-medium text-red-800">Issues:</p>
                              <ul className="text-xs text-red-700 mt-1 space-y-1">
                                {conflicts.map((conflict, i) => (
                                  <li key={i}>• {conflict}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}