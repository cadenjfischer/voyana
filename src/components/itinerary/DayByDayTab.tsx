'use client';

import { useState, useRef, useEffect } from 'react';
import { Day, ACTIVITY_TYPES, formatCurrency, formatDate } from '@/types/itinerary';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface DayByDayTabProps {
  days: Day[];
  onUpdateDays: (days: Day[]) => void;
  onAddActivity: (dayId: string) => void;
}

export default function DayByDayTab({ days, onUpdateDays, onAddActivity }: DayByDayTabProps) {
  const [selectedDayId, setSelectedDayId] = useState<string>(days[0]?.id || '');
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'day' | 'timeline'>('day');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Load view mode from localStorage on mount
  useEffect(() => {
    const savedViewMode = localStorage.getItem('dayByDayViewMode');
    if (savedViewMode === 'day' || savedViewMode === 'timeline') {
      setViewMode(savedViewMode);
    }
  }, []);

  // Save view mode to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('dayByDayViewMode', viewMode);
  }, [viewMode]);

  // Auto-select first day when days change
  useEffect(() => {
    if (days.length > 0 && !selectedDayId) {
      setSelectedDayId(days[0].id);
    }
  }, [days, selectedDayId]);

  const selectedDay = days.find(day => day.id === selectedDayId);

  const handleActivityDragEnd = (result: DropResult) => {
    if (!result.destination || !selectedDay) return;

    const items = Array.from(selectedDay.activities);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order property
    const updatedActivities = items.map((activity, index) => ({
      ...activity,
      order: index
    }));

    const updatedDay = {
      ...selectedDay,
      activities: updatedActivities,
      totalCost: updatedActivities.reduce((sum, activity) => sum + activity.cost, 0)
    };

    const updatedDays = days.map(day => 
      day.id === selectedDay.id ? updatedDay : day
    );

    onUpdateDays(updatedDays);
  };

  const updateActivity = (activityId: string, field: string, value: string | number) => {
    if (!selectedDay) return;

    const updatedActivities = selectedDay.activities.map(activity => {
      if (activity.id === activityId) {
        return { ...activity, [field]: value };
      }
      return activity;
    });

    const updatedDay = {
      ...selectedDay,
      activities: updatedActivities,
      totalCost: updatedActivities.reduce((sum, activity) => sum + activity.cost, 0)
    };

    const updatedDays = days.map(day => 
      day.id === selectedDay.id ? updatedDay : day
    );

    onUpdateDays(updatedDays);
    setEditingActivityId(null);
    setEditingField(null);
  };

  const deleteActivity = (activityId: string) => {
    if (!selectedDay) return;

    const updatedActivities = selectedDay.activities.filter(activity => activity.id !== activityId);
    const updatedDay = {
      ...selectedDay,
      activities: updatedActivities.map((activity, index) => ({ ...activity, order: index })),
      totalCost: updatedActivities.reduce((sum, activity) => sum + activity.cost, 0)
    };

    const updatedDays = days.map(day => 
      day.id === selectedDay.id ? updatedDay : day
    );

    onUpdateDays(updatedDays);
  };

  const updateDayNotes = (notes: string) => {
    if (!selectedDay) return;

    const updatedDay = { ...selectedDay, notes };
    const updatedDays = days.map(day => 
      day.id === selectedDay.id ? updatedDay : day
    );

    onUpdateDays(updatedDays);
  };

  const scrollToDay = (index: number) => {
    if (scrollContainerRef.current) {
      const dayWidth = 120; // Approximate width of day button
      scrollContainerRef.current.scrollTo({
        left: index * dayWidth,
        behavior: 'smooth'
      });
    }
  };

  const getTotalTripCost = () => {
    return days.reduce((sum, day) => sum + day.totalCost, 0);
  };

  // Filter days with activities for Timeline view
  const daysWithActivities = days.filter(day => day.activities.length > 0);

  return (
    <div className="space-y-6">
      {/* Header with day navigation */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Day by Day</h2>
            <p className="text-gray-600 mt-1">Plan your daily activities and track expenses</p>
          </div>
          <div className="flex items-center gap-6">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('day')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                  viewMode === 'day'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>🗓️</span>
                Day View
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                  viewMode === 'timeline'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>📜</span>
                Timeline
              </button>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Trip Cost</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(getTotalTripCost())}</p>
            </div>
          </div>
        </div>

        {/* Day Navigation Scroll Bar */}
        <div className="relative">
          <div
            ref={scrollContainerRef}
            className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
          >
            {days.map((day, index) => {
              const isSelected = day.id === selectedDayId;
              return (
                <button
                  key={day.id}
                  onClick={() => {
                    setSelectedDayId(day.id);
                    scrollToDay(index);
                  }}
                  className={`flex-shrink-0 p-3 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-xs font-medium opacity-75">Day {index + 1}</div>
                  <div className="text-sm font-semibold">{formatDate(day.date)}</div>
                  <div className="text-xs opacity-75 mt-1">
                    {day.activities.length} {day.activities.length === 1 ? 'activity' : 'activities'}
                  </div>
                  {day.totalCost > 0 && (
                    <div className="text-xs font-medium text-green-600 mt-1">
                      {formatCurrency(day.totalCost)}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Day View (Planning Mode) */}
      {viewMode === 'day' && selectedDay && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Activities Column */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {formatDate(selectedDay.date)}
                </h3>
                <button
                  onClick={() => onAddActivity(selectedDay.id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Activity
                </button>
              </div>

              {/* Activities List */}
              {selectedDay.activities.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <p className="text-gray-500 mb-4">No activities planned for this day</p>
                  <button
                    onClick={() => onAddActivity(selectedDay.id)}
                    className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    Add your first activity
                  </button>
                </div>
              ) : (
                <DragDropContext onDragEnd={handleActivityDragEnd}>
                  <Droppable droppableId="activities">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                        {selectedDay.activities
                          .sort((a, b) => a.order - b.order)
                          .map((activity, index) => (
                            <Draggable key={activity.id} draggableId={activity.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`flex gap-4 p-4 bg-gray-50 rounded-lg transition-all ${
                                    snapshot.isDragging ? 'shadow-lg' : 'hover:bg-gray-100'
                                  }`}
                                >
                                  {/* Activity Icon */}
                                  <div className="flex-shrink-0">
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-lg shadow-sm">
                                      {ACTIVITY_TYPES[activity.type].icon}
                                    </div>
                                  </div>

                                  {/* Activity Content */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex-1">
                                        {/* Title */}
                                        {editingActivityId === activity.id && editingField === 'title' ? (
                                          <input
                                            type="text"
                                            defaultValue={activity.title}
                                            className="font-medium text-gray-900 bg-white border border-gray-300 rounded px-2 py-1 text-sm w-full"
                                            autoFocus
                                            onBlur={(e) => updateActivity(activity.id, 'title', e.target.value)}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                updateActivity(activity.id, 'title', e.currentTarget.value);
                                              }
                                            }}
                                          />
                                        ) : (
                                          <h4
                                            className="font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                                            onClick={() => {
                                              setEditingActivityId(activity.id);
                                              setEditingField('title');
                                            }}
                                          >
                                            {activity.title}
                                          </h4>
                                        )}

                                        {/* Time and Location */}
                                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                          {activity.time && (
                                            <span className="flex items-center gap-1">
                                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                              </svg>
                                              {activity.time}
                                            </span>
                                          )}
                                          {activity.location && (
                                            <span className="flex items-center gap-1">
                                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                              </svg>
                                              {activity.location}
                                            </span>
                                          )}
                                        </div>

                                        {/* Description */}
                                        {activity.description && (
                                          <p className="text-sm text-gray-600 mt-2">{activity.description}</p>
                                        )}
                                      </div>

                                      {/* Cost and Actions */}
                                      <div className="flex items-center gap-2 ml-4">
                                        {activity.cost > 0 && (
                                          <span className="text-sm font-medium text-green-600">
                                            {formatCurrency(activity.cost)}
                                          </span>
                                        )}
                                        <div
                                          {...provided.dragHandleProps}
                                          className="cursor-grab text-gray-400 hover:text-gray-600"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                          </svg>
                                        </div>
                                        <button
                                          onClick={() => deleteActivity(activity.id)}
                                          className="text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                          </svg>
                                        </button>
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

              {/* Day Notes */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📝 Day Notes
                </label>
                <textarea
                  value={selectedDay.notes}
                  onChange={(e) => updateDayNotes(e.target.value)}
                  placeholder="Add notes about this day..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:border-blue-500 transition-colors"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Day Summary Sidebar */}
          <div className="space-y-6">
            {/* Day Stats */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h4 className="font-semibold text-gray-900 mb-4">Day Summary</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Activities</span>
                  <span className="font-medium">{selectedDay.activities.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Daily Cost</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(selectedDay.totalCost)}
                  </span>
                </div>
              </div>
            </div>

            {/* Activity Type Breakdown */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h4 className="font-semibold text-gray-900 mb-4">Activity Types</h4>
              <div className="space-y-2">
                {Object.entries(ACTIVITY_TYPES).map(([type, config]) => {
                  const count = selectedDay.activities.filter(a => a.type === type).length;
                  const cost = selectedDay.activities
                    .filter(a => a.type === type)
                    .reduce((sum, a) => sum + a.cost, 0);
                  
                  if (count === 0) return null;
                  
                  return (
                    <div key={type} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span>{config.icon}</span>
                        <span className="text-gray-700">{config.label}</span>
                        <span className="text-gray-500">({count})</span>
                      </div>
                      {cost > 0 && (
                        <span className="text-green-600 font-medium">
                          {formatCurrency(cost)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Add Activities */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h4 className="font-semibold text-gray-900 mb-4">Quick Add</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(ACTIVITY_TYPES).map(([type, config]) => (
                  <button
                    key={type}
                    onClick={() => onAddActivity(selectedDay.id)}
                    className="flex items-center gap-2 p-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <span>{config.icon}</span>
                    <span>{config.label}</span>
                  </button>
                ))}
              </div>
            </div>
                    </div>
        </div>
      )}

      {/* Timeline View (Read-Only Summary) */}
      {viewMode === 'timeline' && (
        <div className="bg-white rounded-xl p-8 shadow-sm border">
          {daysWithActivities.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📜</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Activities Yet</h3>
              <p className="text-gray-600 mb-6">Switch to Day View to start planning your trip</p>
              <button
                onClick={() => setViewMode('day')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Go to Day View
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {daysWithActivities.map((day, dayIndex) => (
                <div key={day.id} className="relative">
                  {/* Timeline Connector */}
                  {dayIndex < daysWithActivities.length - 1 && (
                    <div className="absolute left-[19px] top-12 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 to-transparent" />
                  )}
                  
                  {/* Day Header */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold shadow-md">
                      {days.findIndex(d => d.id === day.id) + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900">{formatDate(day.date)}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <span>{day.activities.length} {day.activities.length === 1 ? 'activity' : 'activities'}</span>
                        {day.totalCost > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-green-600 font-medium">{formatCurrency(day.totalCost)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Activities */}
                  <div className="ml-14 space-y-3">
                    {day.activities
                      .sort((a, b) => a.order - b.order)
                      .map((activity) => (
                        <div
                          key={activity.id}
                          className="flex gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100"
                        >
                          {/* Activity Icon */}
                          <div className="flex-shrink-0">
                            <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-base shadow-sm border border-gray-200">
                              {ACTIVITY_TYPES[activity.type].icon}
                            </div>
                          </div>

                          {/* Activity Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{activity.title}</h4>
                                
                                {/* Time and Location */}
                                <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                                  {activity.time && (
                                    <span className="flex items-center gap-1">
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      {activity.time}
                                    </span>
                                  )}
                                  {activity.location && (
                                    <span className="flex items-center gap-1">
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                      </svg>
                                      {activity.location}
                                    </span>
                                  )}
                                  <span className="text-gray-400">•</span>
                                  <span className="text-gray-500">{ACTIVITY_TYPES[activity.type].label}</span>
                                </div>

                                {/* Description */}
                                {activity.description && (
                                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{activity.description}</p>
                                )}
                              </div>

                              {/* Cost */}
                              {activity.cost > 0 && (
                                <span className="text-sm font-medium text-green-600 ml-4">
                                  {formatCurrency(activity.cost)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Day Notes */}
                  {day.notes && (
                    <div className="ml-14 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <span className="text-sm">📝</span>
                        <p className="text-sm text-gray-700 flex-1">{day.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
