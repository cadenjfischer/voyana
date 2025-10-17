'use client';

import { useState } from 'react';
import { Day, ACTIVITY_TYPES, formatCurrency, formatDate } from '@/types/itinerary';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface SingleDayViewProps {
  day: Day;
  dayNumber: number;
  onUpdateDay: (day: Day) => void;
  onAddActivity: () => void;
  onDeleteActivity: (activityId: string) => void;
}

export default function SingleDayView({
  day,
  dayNumber,
  onUpdateDay,
  onAddActivity,
  onDeleteActivity
}: SingleDayViewProps) {
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);

  const handleActivityDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(day.activities);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order property
    const updatedActivities = items.map((activity, index) => ({
      ...activity,
      order: index
    }));

    onUpdateDay({
      ...day,
      activities: updatedActivities,
      totalCost: updatedActivities.reduce((sum, activity) => sum + activity.cost, 0)
    });
  };

  const updateActivity = (activityId: string, field: string, value: string | number) => {
    const updatedActivities = day.activities.map(activity => {
      if (activity.id === activityId) {
        return { ...activity, [field]: value };
      }
      return activity;
    });

    onUpdateDay({
      ...day,
      activities: updatedActivities,
      totalCost: updatedActivities.reduce((sum, activity) => sum + activity.cost, 0)
    });
    setEditingActivityId(null);
    setEditingField(null);
  };

  const updateDayNotes = (notes: string) => {
    onUpdateDay({ ...day, notes });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500 font-medium mb-1">Day {dayNumber}</div>
          <h3 className="text-2xl font-bold text-gray-900">{formatDate(day.date)}</h3>
        </div>
        <button
          onClick={onAddActivity}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Activity
        </button>
      </div>

      {/* Day Summary */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Activities</p>
            <p className="text-xl font-bold text-gray-900">{day.activities.length}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Daily Cost</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(day.totalCost)}</p>
          </div>
        </div>
      </div>

      {/* Activities List */}
      {day.activities.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium mb-2">No activities planned for this day</p>
          <button
            onClick={onAddActivity}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            Add your first activity
          </button>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleActivityDragEnd}>
          <Droppable droppableId="activities">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-3"
              >
                {day.activities.map((activity, index) => {
                  const activityTypeKey = activity.type as keyof typeof ACTIVITY_TYPES;
                  const activityType = ACTIVITY_TYPES[activityTypeKey];
                  
                  return (
                    <Draggable key={activity.id} draggableId={activity.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`bg-white border rounded-lg p-4 transition-shadow ${
                            snapshot.isDragging ? 'shadow-lg' : 'shadow-sm'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Drag Handle */}
                            <div
                              {...provided.dragHandleProps}
                              className="mt-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                              </svg>
                            </div>

                            {/* Activity Icon */}
                            <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${activityType?.color || 'bg-gray-100'}`}>
                              <span className="text-lg">{activityType?.icon || '📍'}</span>
                            </div>

                            {/* Activity Details */}
                            <div className="flex-1 min-w-0">
                              {editingActivityId === activity.id && editingField === 'title' ? (
                                <input
                                  type="text"
                                  defaultValue={activity.title}
                                  onBlur={(e) => updateActivity(activity.id, 'title', e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') updateActivity(activity.id, 'title', e.currentTarget.value);
                                    if (e.key === 'Escape') { setEditingActivityId(null); setEditingField(null); }
                                  }}
                                  autoFocus
                                  className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              ) : (
                                <h4
                                  onClick={() => { setEditingActivityId(activity.id); setEditingField('title'); }}
                                  className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600"
                                >
                                  {activity.title}
                                </h4>
                              )}

                              <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                {activity.time && (
                                  <span className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {activity.time}
                                  </span>
                                )}
                                {activity.location && (
                                  <span className="flex items-center gap-1 truncate">
                                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    {activity.location}
                                  </span>
                                )}
                              </div>

                            </div>

                            {/* Cost and Actions */}
                            <div className="flex items-start gap-2">
                              <div className="text-right">
                                {editingActivityId === activity.id && editingField === 'cost' ? (
                                  <input
                                    type="number"
                                    defaultValue={activity.cost}
                                    onBlur={(e) => updateActivity(activity.id, 'cost', parseFloat(e.target.value) || 0)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') updateActivity(activity.id, 'cost', parseFloat(e.currentTarget.value) || 0);
                                      if (e.key === 'Escape') { setEditingActivityId(null); setEditingField(null); }
                                    }}
                                    autoFocus
                                    className="w-20 px-2 py-1 border border-blue-500 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                ) : (
                                  <span
                                    onClick={() => { setEditingActivityId(activity.id); setEditingField('cost'); }}
                                    className="font-semibold text-green-600 cursor-pointer hover:text-green-700"
                                  >
                                    {formatCurrency(activity.cost)}
                                  </span>
                                )}
                              </div>

                              <button
                                onClick={() => onDeleteActivity(activity.id)}
                                className="text-gray-400 hover:text-red-600 transition-colors"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
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
      )}

      {/* Day Notes */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">📝</span>
          <h4 className="font-semibold text-gray-900">Day Notes</h4>
        </div>
        <textarea
          value={day.notes || ''}
          onChange={(e) => updateDayNotes(e.target.value)}
          placeholder="Add any notes or reminders for this day..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
          rows={3}
        />
      </div>
    </div>
  );
}
