'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import AddActivityModal from '@/components/AddActivityModal';
import Link from 'next/link';

interface Activity {
  id: string;
  type: 'flight' | 'hotel' | 'activity' | 'meeting' | 'other';
  title: string;
  time: string;
  location?: string;
  description?: string;
  confirmation?: string;
  terminal?: string;
  gate?: string;
  flightNumber?: string;
  arrivalTime?: string;
}

interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  description: string;
  photo: string;
  activities: { [date: string]: Activity[] };
}

export default function TripDetailPage() {
  const { user } = useUser();
  const params = useParams();
  const tripId = params.id as string;
  
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isAddActivityOpen, setIsAddActivityOpen] = useState(false);

  // Generate array of dates for the trip
  const generateDates = (startDate: string, endDate: string) => {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d).toISOString().split('T')[0]);
    }
    return dates;
  };

  // Load trip data
  useEffect(() => {
    if (user && tripId) {
      const savedTrips = localStorage.getItem(`voyana_trips_${user.id}`);
      if (savedTrips) {
        const trips: Trip[] = JSON.parse(savedTrips);
        const foundTrip = trips.find(t => t.id === tripId);
        if (foundTrip) {
          setTrip(foundTrip);
          if (!selectedDate) {
            setSelectedDate(foundTrip.startDate);
          }
        }
      }
      setLoading(false);
    }
  }, [user, tripId, selectedDate]);

  // Save trip data
  const saveTrip = (updatedTrip: Trip) => {
    if (user) {
      const savedTrips = localStorage.getItem(`voyana_trips_${user.id}`);
      if (savedTrips) {
        const trips: Trip[] = JSON.parse(savedTrips);
        const updatedTrips = trips.map(t => t.id === tripId ? updatedTrip : t);
        localStorage.setItem(`voyana_trips_${user.id}`, JSON.stringify(updatedTrips));
        setTrip(updatedTrip);
      }
    }
  };

  const addActivity = (activity: Omit<Activity, 'id'>) => {
    if (!trip || !selectedDate) return;

    const newActivity: Activity = {
      ...activity,
      id: Date.now().toString()
    };

    const updatedTrip = {
      ...trip,
      activities: {
        ...trip.activities,
        [selectedDate]: [...(trip.activities[selectedDate] || []), newActivity]
      }
    };

    saveTrip(updatedTrip);
    setIsAddActivityOpen(false);
  };

  const deleteActivity = (date: string, activityId: string) => {
    if (!trip) return;

    const updatedTrip = {
      ...trip,
      activities: {
        ...trip.activities,
        [date]: (trip.activities[date] || []).filter(a => a.id !== activityId)
      }
    };

    saveTrip(updatedTrip);
  };

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'flight':
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
        );
      case 'hotel':
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
          </div>
        );
      case 'meeting':
        return (
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        );
      case 'activity':
        return (
          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (dateStr === today.toISOString().split('T')[0]) {
      return `Today, ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } else if (dateStr === tomorrow.toISOString().split('T')[0]) {
      return `Tomorrow, ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="pt-20 flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading trip details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="pt-20 flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Trip not found</h1>
            <Link 
              href="/itinerary"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Trips
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const tripDates = generateDates(trip.startDate, trip.endDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <Header />
      
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link 
              href="/itinerary"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium mb-4 transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Trips
            </Link>
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{trip.name}</h1>
                <div className="flex items-center gap-4 text-gray-600">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {trip.destination}
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setIsAddActivityOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Activity
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Date Selector Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 sticky top-24">
                <h3 className="font-semibold text-gray-900 mb-4">Trip Days</h3>
                <div className="space-y-2">
                  {tripDates.map((date, index) => (
                    <button
                      key={date}
                      onClick={() => setSelectedDate(date)}
                      className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${
                        selectedDate === date
                          ? 'bg-blue-100 text-blue-700 border-2 border-blue-200'
                          : 'hover:bg-gray-50 border-2 border-transparent'
                      }`}
                    >
                      <div className="font-medium">Day {index + 1}</div>
                      <div className="text-sm opacity-75">{formatDate(date)}</div>
                      {trip.activities[date] && trip.activities[date].length > 0 && (
                        <div className="text-xs mt-1 opacity-60">
                          {trip.activities[date].length} activity(ies)
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {formatDate(selectedDate)}
                  </h3>
                  <button
                    onClick={() => setIsAddActivityOpen(true)}
                    className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Activity
                  </button>
                </div>

                {/* Activities Timeline */}
                <div className="space-y-4">
                  {trip.activities[selectedDate] && trip.activities[selectedDate].length > 0 ? (
                    trip.activities[selectedDate]
                      .sort((a, b) => a.time.localeCompare(b.time))
                      .map((activity, index) => (
                        <div key={activity.id} className="flex gap-4">
                          {/* Timeline */}
                          <div className="flex flex-col items-center">
                            {getActivityIcon(activity.type)}
                            {index < trip.activities[selectedDate].length - 1 && (
                              <div className="w-0.5 bg-gray-200 h-16 mt-2"></div>
                            )}
                          </div>

                          {/* Activity Card */}
                          <div className="flex-1 bg-gray-50 rounded-xl p-4 hover:shadow-md transition-shadow duration-200">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="text-lg font-semibold text-gray-900">
                                    {activity.time}
                                  </span>
                                  <span className="text-sm text-gray-500 uppercase tracking-wide">
                                    GMT{activity.time.includes('GMT') ? '' : '+1'}
                                  </span>
                                </div>
                                
                                <h4 className="text-lg font-medium text-gray-900 mb-1">
                                  {activity.title}
                                </h4>
                                
                                {activity.location && (
                                  <p className="text-gray-600 text-sm mb-2 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    </svg>
                                    {activity.location}
                                  </p>
                                )}

                                {activity.flightNumber && (
                                  <div className="text-sm text-gray-600 space-y-1">
                                    <p>Flight Number: {activity.flightNumber}</p>
                                    {activity.confirmation && <p>Confirmation: {activity.confirmation}</p>}
                                    {activity.terminal && <p>Terminal: {activity.terminal}</p>}
                                    {activity.gate && <p>Gate: {activity.gate}</p>}
                                    {activity.arrivalTime && <p>Arrive: {activity.arrivalTime}</p>}
                                  </div>
                                )}

                                {activity.description && (
                                  <p className="text-gray-600 text-sm mt-2">{activity.description}</p>
                                )}
                              </div>

                              <button
                                onClick={() => deleteActivity(selectedDate, activity.id)}
                                className="text-gray-400 hover:text-red-500 ml-4 transition-colors duration-200"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <p className="text-gray-500 mb-4">No activities planned for this day</p>
                      <button
                        onClick={() => setIsAddActivityOpen(true)}
                        className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                      >
                        Add your first activity
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add Activity Modal */}
      <AddActivityModal
        isOpen={isAddActivityOpen}
        onClose={() => setIsAddActivityOpen(false)}
        onAddActivity={addActivity}
        selectedDate={selectedDate}
      />
    </div>
  );
}