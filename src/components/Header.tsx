'use client';

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
    <header className="fixed top-0 left-0 right-0 z-[10000] bg-white/95 backdrop-blur-md border-b border-gray-200/50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/">
              <Image
                src="/VoyanaLogo.svg"
                alt="Voyana Logo"
                width={160}
                height={40}
                priority
                className="h-10 w-auto cursor-pointer"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            <Link 
              href="/" 
              className="text-gray-700 hover:text-blue-600 transition-colors duration-300 font-medium tracking-wide"
            >
              Home
            </Link>
            {isSignedIn && (
              <Link 
                href="/itinerary" 
                className="text-gray-700 hover:text-blue-600 transition-colors duration-300 font-medium tracking-wide"
              >
                My Trips
              </Link>
            )}
            <a 
              href="#services" 
              className="text-gray-700 hover:text-blue-600 transition-colors duration-300 font-medium tracking-wide"
            >
              Services
            </a>
            <a 
              href="#about" 
              className="text-gray-700 hover:text-blue-600 transition-colors duration-300 font-medium tracking-wide"
            >
              About
            </a>
            <a 
              href="#contact" 
              className="text-gray-700 hover:text-blue-600 transition-colors duration-300 font-medium tracking-wide"
            >
              Contact
            </a>
          </nav>

          {/* Authentication Section */}
          <div className="hidden lg:flex items-center space-x-4">
            {isSignedIn ? (
              <div className="flex items-center space-x-4">
                <Link 
                  href="/dashboard"
                  className="text-gray-700 hover:text-blue-600 transition-colors duration-300 font-medium"
                >
                  Dashboard
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors duration-300"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                      {user?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                  </button>
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
                      </div>
                      <Link
                        href="/user-profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Profile Settings
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/sign-in">
                  <button className="text-gray-700 hover:text-blue-600 font-medium tracking-wide transition-colors duration-300">
                    Sign In
                  </button>
                </Link>
                <Link href="/sign-up">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full font-semibold tracking-wide transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                    Get Started
                  </button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-blue-600 focus:outline-none focus:text-blue-600 transition-colors duration-300"
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
          <div className="lg:hidden py-4 border-t border-gray-200/50">
            <div className="flex flex-col space-y-4">
              <Link 
                href="/" 
                className="text-gray-700 hover:text-blue-600 transition-colors duration-300 font-medium tracking-wide px-4 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              {isSignedIn && (
                <Link 
                  href="/itinerary" 
                  className="text-gray-700 hover:text-blue-600 transition-colors duration-300 font-medium tracking-wide px-4 py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Trips
                </Link>
              )}
              <a 
                href="#services" 
                className="text-gray-700 hover:text-blue-600 transition-colors duration-300 font-medium tracking-wide px-4 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Services
              </a>
              <a 
                href="#about" 
                className="text-gray-700 hover:text-blue-600 transition-colors duration-300 font-medium tracking-wide px-4 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </a>
              <a 
                href="#contact" 
                className="text-gray-700 hover:text-blue-600 transition-colors duration-300 font-medium tracking-wide px-4 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </a>
              <div className="px-4 pt-4 border-t border-gray-200">
                {isSignedIn ? (
                  <div className="flex flex-col space-y-3">
                    <Link 
                      href="/dashboard"
                      className="text-gray-700 hover:text-blue-600 transition-colors duration-300 font-medium tracking-wide px-4 py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/user-profile"
                      className="text-gray-700 hover:text-blue-600 transition-colors duration-300 font-medium tracking-wide px-4 py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Profile Settings
                    </Link>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setIsMenuOpen(false);
                      }}
                      className="text-left text-red-600 hover:text-red-700 transition-colors duration-300 font-medium tracking-wide px-4 py-2"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-3">
                    <Link href="/sign-in">
                      <button 
                        className="w-full text-center text-gray-700 hover:text-blue-600 font-medium tracking-wide py-2 transition-colors duration-300"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Sign In
                      </button>
                    </Link>
                    <Link href="/sign-up">
                      <button 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-semibold tracking-wide transition-all duration-300 shadow-lg"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Get Started
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