'use client';

import { useState, useCallback, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Destination, Trip, calculateNights, Lodging } from '@/types/itinerary';
import { getDestinationColors, PREMIUM_COLOR_PALETTE } from '@/utils/colors';
import ColorPicker from './ColorPicker';
import InlineDestinationSearch from './InlineDestinationSearch';
import AddLodgingModal from './AddLodgingModal';

interface TabbedDestinationRailProps {
  destinations: Destination[];
  expandedDestinationIds: Set<string>;
  onDestinationSelect: (id: string) => void;
  onDestinationsReorder: (destinations: Destination[]) => void;
  onUpdateDestination: (destination: Destination) => void;
  onAddDestination: (destination: Omit<Destination, 'id' | 'order'>) => void;
  onRemoveDestination?: (destinationId: string) => void;
  trip: Trip;
}

export default function TabbedDestinationRail({
  destinations,
  expandedDestinationIds,
  onDestinationSelect,
  onDestinationsReorder,
  onUpdateDestination,
  onAddDestination,
  onRemoveDestination,
  trip
}: TabbedDestinationRailProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<string | null>(null);
  const [addLodgingModalOpen, setAddLodgingModalOpen] = useState<string | null>(null);
  
  // Auto-fill nights if only one destination
  useEffect(() => {
    if (destinations.length === 1 && trip.startDate && trip.endDate) {
      const maxNights = calculateNights(trip.startDate, trip.endDate);
      const destination = destinations[0];
      
      // Only update if nights don't match the full trip
      if (destination.nights !== maxNights) {
        const updatedDestination = {
          ...destination,
          nights: maxNights,
          startDate: trip.startDate,
          endDate: trip.endDate
        };
        onUpdateDestination(updatedDestination);
      }
    }
  }, [destinations.length, trip.startDate, trip.endDate, destinations, onUpdateDestination]);
  
  // Handle drag end for destination reordering
  const handleDragEnd = useCallback((result: DropResult) => {
    // Early returns for invalid drag operations
    if (!result.destination) return;
    if (result.destination.droppableId !== result.source.droppableId) return;
    if (result.destination.index === result.source.index) return;

    // Prevent updates during other operations
    if (isUpdating) return;
    setIsUpdating(true);

    try {
      const items = Array.from(destinations);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);

      // Update order property
      const reorderedDestinations = items.map((item, index) => ({
        ...item,
        order: index
      }));

      onDestinationsReorder(reorderedDestinations);
    } catch (error) {
      console.error('Error reordering destinations:', error);
    } finally {
      // Reset updating state after a delay to prevent rapid operations
      setTimeout(() => setIsUpdating(false), 200);
    }
  }, [destinations, isUpdating, onDestinationsReorder]);

  // Calculate available nights for validation
  const getTotalNightsAllocated = () => {
    return destinations.reduce((total, dest) => total + dest.nights, 0);
  };

  const getMaxNightsForTrip = () => {
    if (!trip.startDate || !trip.endDate) return 0;
    return calculateNights(trip.startDate, trip.endDate);
  };

  const getRemainingNights = () => {
    return getMaxNightsForTrip() - getTotalNightsAllocated();
  };

  // Calculate dynamic date range for a destination based on allocated nights
  const getDestinationDateRange = (destination: Destination): string => {
    if (!trip.startDate || destination.nights === 0) {
      return "No dates assigned";
    }

    // Find the starting day for this destination by counting nights before it
    const sortedDestinations = [...destinations].sort((a, b) => a.order - b.order);
    let dayOffset = 0;
    
    for (const dest of sortedDestinations) {
      if (dest.id === destination.id) break;
      dayOffset += dest.nights;
    }

    const startDate = new Date(trip.startDate);
    startDate.setDate(startDate.getDate() + dayOffset);
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + destination.nights);

    const formatDateShort = (date: Date): string => {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
    };

    return `${formatDateShort(startDate)} - ${formatDateShort(endDate)}`;
  };

  // Handle night count changes with validation
  const updateNights = useCallback((destination: Destination, change: number) => {
    if (isUpdating) return; // Prevent rapid clicking
    
    // Disable night changes when there's only one destination
    if (destinations.length === 1) return;
    
    const newNights = Math.max(0, destination.nights + change);
    if (newNights === destination.nights) return; // No change needed
    
    // Validate against trip limits
    if (change > 0) {
      const remainingNights = getRemainingNights();
      if (remainingNights <= 0) return; // No more nights available
    }
    
    setIsUpdating(true);
    
    // Calculate new start and end dates based on night allocation
    const sortedDestinations = [...destinations].sort((a, b) => a.order - b.order);
    let dayOffset = 0;
    
    for (const dest of sortedDestinations) {
      if (dest.id === destination.id) break;
      dayOffset += dest.nights;
    }
    
    const startDate = new Date(trip.startDate);
    startDate.setDate(startDate.getDate() + dayOffset);
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + newNights);
    
    const updatedDestination = { 
      ...destination, 
      nights: newNights,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
    
    // Use requestAnimationFrame for smoother updates
    requestAnimationFrame(() => {
      onUpdateDestination(updatedDestination);
      // Reset after a short delay
      setTimeout(() => setIsUpdating(false), 100);
    });
  }, [isUpdating, trip.startDate, trip.endDate, destinations, onUpdateDestination]);

  // Handle color selection
  const handleColorSelect = useCallback((destinationId: string, colorId: string) => {
    const destination = destinations.find(d => d.id === destinationId);
    if (!destination) return;

    const updatedDestination = { ...destination, customColor: colorId };
    onUpdateDestination(updatedDestination);
    setColorPickerOpen(null);
  }, [destinations, onUpdateDestination]);

  // Get current color for display
  const getCurrentColor = (destination: Destination) => {
    if (destination.customColor) {
      const colorData = PREMIUM_COLOR_PALETTE.find(c => c.id === destination.customColor);
      return colorData?.hex;
    }
    // For default colors, we need to get the hex value from our palette
    const colors = getDestinationColors(destination.id, destinations);
    const defaultColorIndex = destinations.findIndex(d => d.id === destination.id) % PREMIUM_COLOR_PALETTE.length;
    return PREMIUM_COLOR_PALETTE[defaultColorIndex]?.hex || '#6366f1';
  };

  // Handle adding lodging
  const handleAddLodging = useCallback((destinationId: string, lodging: Omit<Lodging, 'id'>) => {
    const destination = destinations.find(d => d.id === destinationId);
    if (!destination) return;

    const newLodging: Lodging = {
      ...lodging,
      id: `lodging-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    const updatedDestination = {
      ...destination,
      lodgings: [...(destination.lodgings || []), newLodging],
    };

    onUpdateDestination(updatedDestination);
  }, [destinations, onUpdateDestination]);

  // Handle removing lodging
  const handleRemoveLodging = useCallback((destinationId: string, lodgingId: string) => {
    const destination = destinations.find(d => d.id === destinationId);
    if (!destination) return;

    const updatedDestination = {
      ...destination,
      lodgings: (destination.lodgings || []).filter(l => l.id !== lodgingId),
    };

    onUpdateDestination(updatedDestination);
  }, [destinations, onUpdateDestination]);



  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Night allocation status */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Nights allocated:</span>
          <span className={`font-medium ${getRemainingNights() === 0 ? 'text-green-600' : getRemainingNights() < 0 ? 'text-red-600' : 'text-gray-900'}`}>
            {getTotalNightsAllocated()} / {getMaxNightsForTrip()}
          </span>
        </div>
        {getRemainingNights() > 0 && (
          <div className="text-xs text-blue-600 mt-1">
            {getRemainingNights()} nights remaining
          </div>
        )}
        {getRemainingNights() < 0 && (
          <div className="text-xs text-red-600 mt-1">
            Over-allocated by {Math.abs(getRemainingNights())} nights
          </div>
        )}
      </div>

      {/* Inline Search Bar */}
      <InlineDestinationSearch
        onAddDestination={onAddDestination}
        existingDestinations={destinations}
      />

      {/* Destination Rows */}
      <div className="flex-1 overflow-y-auto pb-64">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="destination-list" direction="vertical">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`transition-colors duration-200 ${
                  snapshot.isDraggingOver ? 'bg-blue-50 border-l-2 border-blue-300' : ''
                }`}
              >
                {destinations.map((destination, index) => {
                  const colors = getDestinationColors(destination.id, trip.destinations);
                  const isActive = expandedDestinationIds.has(destination.id);

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
                          className={`w-full transition-all duration-200 ${
                            snapshot.isDragging ? 'z-50 rotate-2 scale-105 shadow-lg' : ''
                          }`}
                        >
                          {/* Card Container */}
                          <div
                            className={`w-full border-b border-gray-100 transition-all duration-200 ${
                              snapshot.isDragging 
                                ? 'bg-white shadow-xl rounded-lg border border-gray-300'
                                : ''
                            }`}
                          >
                            {/* Card Header */}
                            <div
                              className={`p-4 transition-all duration-200 flex items-center gap-3 ${
                                snapshot.isDragging 
                                  ? `${colors.light} border-l-4 ${colors.border} ${colors.text}`
                                  : isActive
                                  ? `${colors.light} border-l-4 ${colors.border} ${colors.text}`
                                  : 'hover:bg-gray-50 border-l-4 border-transparent'
                              }`}
                            >
                              {/* Dedicated drag handle */}
                              <div 
                                {...provided.dragHandleProps} 
                                className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing transition-colors duration-200"
                                title="Drag to reorder destinations"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                </svg>
                              </div>
                              
                              {/* Color chip (clickable) */}
                              <div className="relative flex-shrink-0">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setColorPickerOpen(colorPickerOpen === destination.id ? null : destination.id);
                                  }}
                                  className="w-6 h-6 rounded-full border-2 border-white shadow-sm hover:scale-110 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                  style={{ backgroundColor: getCurrentColor(destination) }}
                                  title="Change destination color"
                                  aria-label={`Change color for ${destination.name}`}
                                />
                                
                                {/* Color Picker */}
                                <ColorPicker
                                  currentColor={destination.customColor}
                                  onColorSelect={(colorId) => handleColorSelect(destination.id, colorId)}
                                  onClose={() => setColorPickerOpen(null)}
                                  isOpen={colorPickerOpen === destination.id}
                                />
                              </div>

                              {/* Clickable content area */}
                              <div 
                                className="flex items-center gap-3 flex-1 cursor-pointer" 
                                onClick={() => onDestinationSelect(destination.id)}
                              >
                                {/* Destination info */}
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 truncate">{destination.name}</div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {getDestinationDateRange(destination)}
                                  </div>
                                </div>
                              </div>

                              {/* Night counter */}
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                  </svg>
                                  NIGHTS
                                </div>
                                {destinations.length > 1 ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateNights(destination, -1);
                                      }}
                                      className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all duration-200"
                                      disabled={destination.nights <= 0 || isUpdating}
                                    >
                                      −
                                    </button>
                                    <span className="min-w-[24px] text-center font-medium text-gray-900">
                                      {destination.nights}
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateNights(destination, 1);
                                      }}
                                      className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-50 hover:border-green-300 hover:text-green-600 transition-all duration-200"
                                      disabled={isUpdating || getRemainingNights() <= 0}
                                      title={getRemainingNights() <= 0 ? 'No more nights available for this trip' : 'Add one night'}
                                    >
                                      +
                                    </button>
                                  </div>
                                ) : (
                                  <span className="min-w-[24px] text-center font-medium text-gray-900">
                                    {destination.nights}
                                  </span>
                                )}
                              </div>

                              {/* Expand/Collapse button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDestinationSelect(destination.id);
                                }}
                                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                                title={isActive ? 'Collapse' : 'Expand'}
                              >
                                <svg 
                                  className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'rotate-180' : ''}`} 
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>

                              {/* Delete button */}
                              {onRemoveDestination && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirmOpen(destination.id);
                                  }}
                                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group"
                                  title={`Remove ${destination.name}`}
                                  aria-label={`Remove ${destination.name}`}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                            </div>

                            {/* Expandable Content */}
                            <div 
                              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                isActive ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                              }`}
                            >
                              <div className="px-4 pb-4 pt-2 space-y-3 bg-gray-50/50">
                                {/* Lodging Section */}
                                <div className="bg-white rounded-lg p-3 border border-gray-200">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                      </svg>
                                      Lodging
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setAddLodgingModalOpen(destination.id);
                                      }}
                                      className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors duration-200"
                                    >
                                      + Add
                                    </button>
                                  </div>
                                  
                                  {/* List of lodging entries */}
                                  {destination.lodgings && destination.lodgings.length > 0 ? (
                                    <div className="space-y-2">
                                      {destination.lodgings.map((lodging) => (
                                        <div
                                          key={lodging.id}
                                          className="flex items-center justify-between p-2 bg-gray-50 rounded-md border border-gray-200"
                                        >
                                          <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">{lodging.name}</p>
                                            <p className="text-xs text-gray-500">
                                              {lodging.nights} {lodging.nights === 1 ? 'night' : 'nights'}
                                            </p>
                                          </div>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleRemoveLodging(destination.id, lodging.id);
                                            }}
                                            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                            title="Remove lodging"
                                          >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-gray-400 italic">No lodging added yet</p>
                                  )}
                                </div>

                                {/* Notes Section (if exists) */}
                                {destination.notes && (
                                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      Notes
                                    </div>
                                    <p className="text-sm text-gray-600">{destination.notes}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" onClick={() => setDeleteConfirmOpen(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete {destinations.find(d => d.id === deleteConfirmOpen)?.name}
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              Are you sure you want to delete {destinations.find(d => d.id === deleteConfirmOpen)?.name}?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  onRemoveDestination?.(deleteConfirmOpen);
                  setDeleteConfirmOpen(null);
                }}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
              >
                Yes
              </button>
              <button
                onClick={() => setDeleteConfirmOpen(null)}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Lodging Modal */}
      {addLodgingModalOpen && (() => {
        const destination = destinations.find(d => d.id === addLodgingModalOpen);
        return destination ? (
          <AddLodgingModal
            destination={destination}
            onClose={() => setAddLodgingModalOpen(null)}
            onSave={(lodging) => handleAddLodging(addLodgingModalOpen, lodging)}
          />
        ) : null;
      })()}
    </div>
  );
}