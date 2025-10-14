'use client';

import { useState } from 'react';
import { Trip } from '@/types/itinerary';

interface FloatingAddButtonProps {
  trip: Trip;
  activeDestinationId: string;
  activeDay: string;
  onUpdateTrip: (trip: Trip) => void;
}

export default function FloatingAddButton({
  trip,
  activeDestinationId,
  activeDay,
  onUpdateTrip
}: FloatingAddButtonProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Quick add options based on context
  const getContextualOptions = () => {
    const activeDestination = trip.destinations.find(d => d.id === activeDestinationId);
    const activeDayData = trip.days.find(d => d.id === activeDay);
    
    const options = [];
    
    // Always available
    options.push({
      id: 'destination',
      icon: '📍',
      label: 'Destination',
      description: 'Add a new place to visit'
    });
    
    if (activeDayData) {
      options.push({
        id: 'activity',
        icon: '🎯',
        label: 'Activity',
        description: `Add to ${new Date(activeDayData.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      });
      
      // Context-specific quick adds
      if (activeDayData.activities.length === 0) {
        options.push({
          id: 'sleep',
          icon: '🏨',
          label: 'Lodging',
          description: 'Where you\'ll stay tonight'
        });
      }
      
      // Check if breakfast/lunch/dinner exist
      const meals = activeDayData.activities.filter(a => a.type === 'eat');
      if (meals.length < 3) {
        const mealTimes = ['breakfast', 'lunch', 'dinner'];
        const existingMeals = meals.map(m => m.title.toLowerCase());
        const nextMeal = mealTimes.find(meal => !existingMeals.some(existing => existing.includes(meal)));
        
        if (nextMeal) {
          options.push({
            id: 'meal',
            icon: '🍽️',
            label: nextMeal.charAt(0).toUpperCase() + nextMeal.slice(1),
            description: `Quick add ${nextMeal}`
          });
        }
      }
    }
    
    return options;
  };

  // Handle quick actions
  const handleQuickAction = (actionId: string) => {
    setIsMenuOpen(false);
    
    switch (actionId) {
      case 'destination':
        // Trigger destination modal
        console.log('Add destination');
        break;
        
      case 'activity':
        // Trigger activity modal
        console.log('Add activity');
        break;
        
      case 'sleep':
        // Quick add sleep/lodging
        addQuickActivity('sleep', 'Check-in', 'Hotel accommodation');
        break;
        
      case 'meal':
        // Quick add meal
        const meals = ['breakfast', 'lunch', 'dinner'];
        const activeDayData = trip.days.find(d => d.id === activeDay);
        if (activeDayData) {
          const existingMeals = activeDayData.activities.filter(a => a.type === 'eat');
          const nextMealIndex = existingMeals.length;
          if (nextMealIndex < 3) {
            const mealName = meals[nextMealIndex];
            addQuickActivity('eat', mealName.charAt(0).toUpperCase() + mealName.slice(1), `${mealName.charAt(0).toUpperCase() + mealName.slice(1)} time`);
          }
        }
        break;
    }
  };

  // Quick add activity helper
  const addQuickActivity = (type: 'sleep' | 'eat' | 'do' | 'transport' | 'notes', title: string, description: string) => {
    const activeDayData = trip.days.find(d => d.id === activeDay);
    if (!activeDayData) return;

    const newActivity = {
      id: Date.now().toString(),
      type,
      title,
      description,
      time: '',
      cost: 0,
      location: '',
      order: activeDayData.activities.length,
      dayId: activeDay,
      icon: type === 'sleep' ? '🏨' : type === 'eat' ? '🍽️' : '🎯'
    };

    const updatedDays = trip.days.map(day => {
      if (day.id === activeDay) {
        const updatedActivities = [...day.activities, newActivity];
        return {
          ...day,
          activities: updatedActivities,
          totalCost: updatedActivities.reduce((sum, act) => sum + act.cost, 0)
        };
      }
      return day;
    });

    const updatedTrip = {
      ...trip,
      days: updatedDays,
      totalCost: updatedDays.reduce((sum, day) => sum + day.totalCost, 0),
      updatedAt: new Date().toISOString()
    };

    onUpdateTrip(updatedTrip);
  };

  const options = getContextualOptions();

  return (
    <div className="fixed bottom-6 right-6 z-30">
      {/* Menu */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Options menu */}
          <div className="absolute bottom-16 right-0 bg-white rounded-2xl shadow-2xl border border-gray-200 py-2 min-w-[240px] transform transition-all duration-200 origin-bottom-right">
            {options.map((option, index) => (
              <button
                key={option.id}
                onClick={() => handleQuickAction(option.id)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 flex items-center gap-3"
                style={{ 
                  animationDelay: `${index * 50}ms`,
                  animation: 'slideInUp 200ms ease-out forwards'
                }}
              >
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-lg">
                  {option.icon}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 text-sm">
                    {option.label}
                  </div>
                  <div className="text-xs text-gray-500">
                    {option.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Main FAB */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={`w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transform transition-all duration-200 flex items-center justify-center ${
          isMenuOpen ? 'rotate-45 scale-110' : 'hover:scale-105'
        }`}
        aria-label="Add new item"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>

      {/* Keyboard shortcut hint */}
      <div className="absolute -top-10 right-0 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
        Press &apos;A&apos; to add quickly
      </div>

      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}