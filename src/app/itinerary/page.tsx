'use client';

interface Activity {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
}

interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  description: string;
  photo: string;
  activities: Activity[];
}

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Header from '@/components/Header';
import AddTripModal from '@/components/AddTripModal';
import Link from 'next/link';
import Image from 'next/image';

interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  description: string;
  photo: string;
  activities: Activity[];
}

export default function ItineraryPage() {
  const { user } = useUser();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isAddTripOpen, setIsAddTripOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load trips from localStorage on component mount
  useEffect(() => {
    if (user) {
      const savedTrips = localStorage.getItem(`voyana_trips_${user.id}`);
      if (savedTrips) {
        setTrips(JSON.parse(savedTrips));
      }
      setLoading(false);
    }
  }, [user]);

  // Save trips to localStorage whenever trips change
  useEffect(() => {
    if (user && trips.length > 0) {
      localStorage.setItem(`voyana_trips_${user.id}`, JSON.stringify(trips));
    }
  }, [trips, user]);

  const addTrip = (newTrip: Omit<Trip, 'id' | 'activities'>) => {
    const trip: Trip = {
      ...newTrip,
      id: Date.now().toString(),
      activities: []
    };
    setTrips(prev => [...prev, trip]);
    setIsAddTripOpen(false);
  };

  const deleteTrip = (tripId: string) => {
    setTrips(prev => prev.filter(trip => trip.id !== tripId));
    if (user) {
      const updatedTrips = trips.filter(trip => trip.id !== tripId);
      if (updatedTrips.length === 0) {
        localStorage.removeItem(`voyana_trips_${user.id}`);
      } else {
        localStorage.setItem(`voyana_trips_${user.id}`, JSON.stringify(updatedTrips));
      }
    }
  };

  const getDaysCount = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    };
    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="pt-20 flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your trips...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <Header />
      
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">My Trips</h1>
              <p className="text-gray-600">Plan and manage your travel itineraries</p>
            </div>
            <button
              onClick={() => setIsAddTripOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Trip
            </button>
          </div>

          {/* Trips Grid */}
          {trips.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No trips yet</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Start planning your next adventure! Create your first trip to organize your travel itinerary.
              </p>
              <button
                onClick={() => setIsAddTripOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Create Your First Trip
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.map((trip) => (
                <div key={trip.id} className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 flex flex-col h-full">
                  {/* Trip Image */}
                  <div className="relative h-48 bg-gradient-to-br from-blue-400 to-blue-600">
                    {trip.photo ? (
                      <Image
                        src={trip.photo}
                        alt={trip.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-16 h-16 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    )}
                    
                    {/* Delete Button */}
                    <button
                      onClick={() => deleteTrip(trip.id)}
                      className="absolute top-3 right-3 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors duration-200 opacity-75 hover:opacity-100"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Trip Info */}
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-bold text-gray-900 truncate">{trip.title}</h3>
                      <span className="text-sm text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-lg ml-2">
                        {getDaysCount(trip.startDate, trip.endDate)} days
                      </span>
                    </div>
                    
                    <div className="flex items-center text-gray-600 mb-3">
                      <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="truncate">{trip.destination}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-600 mb-4">
                      <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm">{formatDateRange(trip.startDate, trip.endDate)}</span>
                    </div>

                    {/* Description with fixed height to maintain consistency */}
                    <div className="flex-grow mb-4">
                      {trip.description ? (
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {trip.description}
                        </p>
                      ) : (
                        <div className="h-10"></div>
                      )}
                    </div>

                    {/* Button pushed to bottom */}
                    <Link
                      href={`/itinerary/${trip.id}`}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 mt-auto"
                    >
                      View Itinerary
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Trip Modal */}
      <AddTripModal
        isOpen={isAddTripOpen}
        onClose={() => setIsAddTripOpen(false)}
        onAddTrip={addTrip}
      />
    </div>
  );
}