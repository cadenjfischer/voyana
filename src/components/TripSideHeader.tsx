'use client';

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  Settings, 
  Share2, 
  Calendar, 
  MapPin, 
  DollarSign,
  User,
  Moon,
  Sun,
  Users,
  Plane,
  Hotel,
  Compass,
  Wallet
} from 'lucide-react';
import { Trip } from '@/types/itinerary';
import { useTheme } from '@/contexts/ThemeContext';
import { format } from 'date-fns';

interface TripSideHeaderProps {
  trip: Trip;
  user?: {
    email?: string | null;
  } | null;
  onEditTrip?: () => void;
  onSignOut?: () => void;
}

type TabType = 'plan' | 'discover' | 'budget' | 'flights' | 'hotels';

export default function TripSideHeader({ trip, user, onEditTrip, onSignOut }: TripSideHeaderProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('plan');

  const totalNights = trip.destinations.reduce((sum, dest) => sum + (dest.nights || 0), 0);
  const startDate = new Date(trip.startDate);
  const endDate = new Date(trip.endDate);

  const tabs = [
    { id: 'plan' as TabType, icon: MapPin, label: 'Plan' },
    { id: 'discover' as TabType, icon: Compass, label: 'Discover' },
    { id: 'budget' as TabType, icon: Wallet, label: 'Budget' },
    { id: 'flights' as TabType, icon: Plane, label: 'Flights' },
    { id: 'hotels' as TabType, icon: Hotel, label: 'Hotels' },
  ];

  return (
    <aside 
      className="fixed left-0 top-0 bottom-0 w-28 bg-white dark:bg-gray-800 flex flex-col items-center z-[9999] border-r border-gray-200 dark:border-gray-700 shadow-sm"
    >
      {/* Logo/Back Button */}
      <Link 
        href="/itinerary" 
        className="w-12 h-12 mt-6 mb-8 flex items-center justify-center rounded-lg bg-accent-600 hover:bg-accent-700 transition-colors group shadow-sm"
        title="Back to trips"
      >
        <ChevronLeft className="w-5 h-5 text-white" />
      </Link>

      {/* Navigation Tabs with Labels */}
      <nav className="flex-1 flex flex-col gap-1 w-full px-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex flex-col items-center justify-center gap-1 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-static-accent-600'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-static-text-900 dark:text-static-text-50' : 'text-static-text-900 dark:text-static-text-50'}`} />
              <span className={`text-xs font-medium ${isActive ? 'text-static-text-900 dark:text-static-text-50' : 'text-static-text-900 dark:text-static-text-50'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="flex flex-col gap-2 mb-4 w-full px-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex flex-col items-center justify-center gap-1 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5 text-static-text-900 dark:text-static-text-50" />
          ) : (
            <Sun className="w-5 h-5 text-static-text-900 dark:text-static-text-50" />
          )}
        </button>

        {/* User Menu */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="w-full flex flex-col items-center justify-center gap-1 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-accent-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                {user.email?.[0]?.toUpperCase() || 'U'}
              </div>
            </button>

            {isUserMenuOpen && (
              <div className="absolute bottom-full left-full ml-2 mb-2 w-52 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-medium text-static-text-900 dark:text-static-text-50 truncate">
                    {user.email}
                  </p>
                </div>
                <Link
                  href="/user-profile"
                  className="block px-4 py-2.5 text-sm text-static-text-700 dark:text-static-text-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    onSignOut?.();
                    setIsUserMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
