'use client';

import { useState } from 'react';
import { Destination, formatCurrency, formatDate, calculateNights } from '@/types/itinerary';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface DestinationsTabProps {
  destinations: Destination[];
  onUpdateDestinations: (destinations: Destination[]) => void;
  onAddDestination: () => void;
}

export default function DestinationsTab({
  destinations,
  onUpdateDestinations,
  onAddDestination
}: DestinationsTabProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);

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

    onUpdateDestinations(updatedDestinations);
  };

  const updateDestination = (id: string, field: string, value: string | number) => {
    const updatedDestinations = destinations.map(dest => {
      if (dest.id === id) {
        const updated = { ...dest, [field]: value };
        
        // Recalculate nights when dates change
        if (field === 'startDate' || field === 'endDate') {
          updated.nights = calculateNights(updated.startDate, updated.endDate);
        }
        
        return updated;
      }
      return dest;
    });

    onUpdateDestinations(updatedDestinations);
    setEditingId(null);
    setEditingField(null);
  };

  const deleteDestination = (id: string) => {
    const updatedDestinations = destinations
      .filter(dest => dest.id !== id)
      .map((dest, index) => ({ ...dest, order: index }));
    
    onUpdateDestinations(updatedDestinations);
  };

  const calculateDistance = (dest: Destination): string => {
    if (dest.distanceFromPrevious) {
      return `${dest.distanceFromPrevious}km from previous`;
    }
    return '';
  };

  const getTotalActivities = (dest: Destination): number => {
    // This would be calculated from the days/activities data
    // For now, return a placeholder
    return Math.floor(Math.random() * 10) + 1;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Destinations</h2>
          <p className="text-gray-600 mt-1">Plan your route and accommodations</p>
        </div>
        <button
          onClick={onAddDestination}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Destination
        </button>
      </div>

      {/* Destinations List */}
      {destinations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-200">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No destinations yet</h3>
          <p className="text-gray-600 mb-4">Add your first destination to start planning your route</p>
          <button
            onClick={onAddDestination}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Add Destination
          </button>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="destinations">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                {destinations
                  .sort((a, b) => a.order - b.order)
                  .map((destination, index) => (
                    <Draggable key={destination.id} draggableId={destination.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`bg-white rounded-xl p-6 shadow-sm border transition-all duration-200 ${
                            snapshot.isDragging ? 'shadow-lg rotate-1' : 'hover:shadow-md'
                          }`}
                        >
                          {/* Drag handle and route indicator */}
                          <div className="flex items-start gap-4">
                            {/* Route number and drag handle */}
                            <div className="flex flex-col items-center">
                              <div
                                {...provided.dragHandleProps}
                                className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm cursor-grab hover:bg-blue-200 transition-colors"
                              >
                                {index + 1}
                              </div>
                              {index < destinations.length - 1 && (
                                <div className="w-0.5 bg-gray-200 h-8 mt-2"></div>
                              )}
                            </div>

                            {/* Destination content */}
                            <div className="flex-1">
                              <div className="grid lg:grid-cols-3 gap-6">
                                {/* Main info */}
                                <div className="lg:col-span-2">
                                  <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                      {/* Destination name */}
                                      {editingId === destination.id && editingField === 'name' ? (
                                        <input
                                          type="text"
                                          defaultValue={destination.name}
                                          className="text-xl font-bold text-gray-900 bg-transparent border-b-2 border-blue-500 outline-none"
                                          autoFocus
                                          onBlur={(e) => updateDestination(destination.id, 'name', e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              updateDestination(destination.id, 'name', e.currentTarget.value);
                                            }
                                          }}
                                        />
                                      ) : (
                                        <h3
                                          className="text-xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                                          onClick={() => {
                                            setEditingId(destination.id);
                                            setEditingField('name');
                                          }}
                                        >
                                          {destination.name}
                                        </h3>
                                      )}

                                      {/* Date range */}
                                      <div className="flex items-center gap-4 mt-2 text-gray-600">
                                        <div className="flex items-center gap-2">
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                          </svg>
                                          <span className="text-sm">
                                            {formatDate(destination.startDate)} - {formatDate(destination.endDate)}
                                          </span>
                                        </div>
                                        <span className="text-sm bg-gray-100 px-2 py-1 rounded-lg">
                                          {destination.nights} {destination.nights === 1 ? 'night' : 'nights'}
                                        </span>
                                      </div>

                                      {/* Distance */}
                                      {index > 0 && (
                                        <p className="text-sm text-gray-500 mt-1">
                                          {calculateDistance(destination) || 'Distance not calculated'}
                                        </p>
                                      )}
                                    </div>

                                    {/* Actions */}
                                    <button
                                      onClick={() => deleteDestination(destination.id)}
                                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>

                                  {/* Lodging */}
                                  <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      🛏️ Lodging
                                    </label>
                                    {editingId === destination.id && editingField === 'lodging' ? (
                                      <input
                                        type="text"
                                        defaultValue={destination.lodging}
                                        className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500"
                                        autoFocus
                                        placeholder="Where are you staying?"
                                        onBlur={(e) => updateDestination(destination.id, 'lodging', e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            updateDestination(destination.id, 'lodging', e.currentTarget.value);
                                          }
                                        }}
                                      />
                                    ) : (
                                      <p
                                        className="text-gray-700 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                                        onClick={() => {
                                          setEditingId(destination.id);
                                          setEditingField('lodging');
                                        }}
                                      >
                                        {destination.lodging || 'Click to add lodging details'}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Stats sidebar */}
                                <div className="space-y-4">
                                  <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-900 mb-3">Quick Stats</h4>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Activities</span>
                                        <span className="font-medium">{getTotalActivities(destination)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Estimated Cost</span>
                                        <span className="font-medium text-green-600">
                                          {formatCurrency(destination.estimatedCost)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Route Summary */}
      {destinations.length > 1 && (
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">Route Summary</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Total Destinations:</span>
              <span className="font-medium ml-2">{destinations.length}</span>
            </div>
            <div>
              <span className="text-blue-700">Total Nights:</span>
              <span className="font-medium ml-2">
                {destinations.reduce((sum, dest) => sum + dest.nights, 0)}
              </span>
            </div>
            <div>
              <span className="text-blue-700">Estimated Budget:</span>
              <span className="font-medium ml-2 text-green-700">
                {formatCurrency(destinations.reduce((sum, dest) => sum + dest.estimatedCost, 0))}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}