'use client';

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';
import { useTheme } from '@/contexts/ThemeContext';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsUserMenuOpen(false);
    router.push('/');
    router.refresh();
  };

  const isSignedIn = !!user;

  return (
    <header className="fixed top-0 left-0 right-0 z-[10000] pt-4 px-4 lg:px-8 transition-all duration-300">
      <div className="bg-white/25 dark:bg-black/25 border-[1.5px] border-static-gray-50/70 dark:border-static-gray-100/90 rounded-xl max-w-7xl mx-auto shadow-2xl" style={{ backdropFilter: 'blur(2.5px)', WebkitBackdropFilter: 'blur(2.5px)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1)' }}>
        <div className="flex justify-between items-center h-14 px-6 lg:px-8">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/">
              <Image
                src="/VoyanaLogo.svg"
                alt="Voyana Logo"
                width={140}
                height={36}
                priority
                className="h-9 w-auto cursor-pointer"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-10">
            <Link 
              href="/flights" 
              className="text-static-text-900 dark:text-static-text-100 hover:text-accent-600 transition-colors duration-200 font-medium text-sm"
            >
              Flights
            </Link>
            {isSignedIn && (
              <Link 
                href="/itinerary" 
                className="text-static-text-900 dark:text-static-text-100 hover:text-accent-600 transition-colors duration-200 font-medium text-sm"
              >
                My Trips
              </Link>
            )}
            <Link 
              href="/remember" 
              className="text-static-text-900 dark:text-static-text-100 hover:text-accent-600 transition-colors duration-200 font-medium text-sm"
            >
              Remember
            </Link>
          </nav>

          {/* Authentication Section */}
          <div className="hidden lg:flex items-center space-x-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors duration-200"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <svg className="w-5 h-5 text-static-text-900 dark:text-static-text-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-static-text-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>
            
            {isSignedIn ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-static-text-900 dark:text-static-text-100 hover:text-accent-600 transition-colors duration-200 p-1"
                >
                  <div className="w-9 h-9 rounded-full bg-accent-600 flex items-center justify-center text-white font-semibold text-sm">
                    {user?.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-3 w-52 bg-white/90 dark:bg-black/90 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 dark:border-white/10 py-2 z-50">
                    <div className="px-4 py-3 border-b border-white/20 dark:border-white/10">
                      <p className="text-xs font-medium text-static-text-900 dark:text-static-text-100 truncate">{user?.email}</p>
                    </div>
                    <Link
                      href="/user-profile"
                      className="block px-4 py-2.5 text-sm text-static-text-900 dark:text-static-text-100 hover:bg-black/5 dark:hover:bg-white/10"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-black/5 dark:hover:bg-white/10"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/sign-in">
                  <button className="text-static-text-900 dark:text-static-text-100 hover:text-accent-600 font-medium text-sm transition-colors duration-200 px-5 py-2">
                    Sign In
                  </button>
                </Link>
                <Link href="/sign-up">
                  <button className="bg-accent-600 hover:bg-accent-700 text-white px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-200 shadow-sm">
                    Sign Up
                  </button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-static-text-900 dark:text-static-text-100 hover:text-accent-600 focus:outline-none transition-colors duration-200 p-2"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden py-6 border-t border-white/20 dark:border-white/10">
            <div className="flex flex-col space-y-2">
              <Link 
                href="/flights" 
                className="text-static-text-900 dark:text-static-text-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors duration-200 font-medium text-sm px-4 py-3 rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                Flights
              </Link>
              {isSignedIn && (
                <Link 
                  href="/itinerary" 
                  className="text-static-text-900 dark:text-static-text-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors duration-200 font-medium text-sm px-4 py-3 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Trips
                </Link>
              )}
              <Link 
                href="/remember" 
                className="text-static-text-900 dark:text-static-text-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors duration-200 font-medium text-sm px-4 py-3 rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                Remember
              </Link>
              
              <div className="pt-6 mt-4 border-t border-white/20 dark:border-white/10">
                {/* Theme Toggle - Mobile */}
                <button
                  onClick={toggleTheme}
                  className="flex items-center space-x-3 w-full text-left text-static-text-900 dark:text-static-text-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors duration-200 font-medium text-sm px-4 py-3 mb-2 rounded-lg"
                >
                  {theme === 'light' ? (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                      <span>Dark Mode</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span>Light Mode</span>
                    </>
                  )}
                </button>
                
                {isSignedIn ? (
                  <div className="flex flex-col space-y-2">
                    <Link
                      href="/user-profile"
                      className="text-static-text-900 dark:text-static-text-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors duration-200 font-medium text-sm px-4 py-3 rounded-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setIsMenuOpen(false);
                      }}
                      className="text-left text-red-600 hover:bg-black/5 dark:hover:bg-white/10 transition-colors duration-200 font-medium text-sm px-4 py-3 rounded-lg"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-3">
                    <Link href="/sign-in">
                      <button 
                        className="w-full text-center text-static-text-900 dark:text-static-text-100 hover:bg-black/5 dark:hover:bg-white/10 font-medium text-sm py-3 rounded-lg transition-colors duration-200"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Sign In
                      </button>
                    </Link>
                    <Link href="/sign-up">
                      <button 
                        className="w-full bg-accent-600 hover:bg-accent-700 text-white px-6 py-3 rounded-full font-medium text-sm transition-all duration-200 shadow-sm"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Sign Up
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}