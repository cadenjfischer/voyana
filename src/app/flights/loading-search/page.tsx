'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plane } from 'lucide-react';

export default function LoadingSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Fetch flight results in the background
    const fetchFlights = async () => {
      try {
        const response = await fetch(`/api/flights/search?${searchParams.toString()}`);
        const data = await response.json();

        // After 2 seconds minimum (for nice UX), navigate to results
        setTimeout(() => {
          router.push(`/flights?${searchParams.toString()}`);
        }, 2000);
      } catch (error) {
        console.error('Search error:', error);
        // Still navigate to flights page even on error
        setTimeout(() => {
          router.push(`/flights?${searchParams.toString()}`);
        }, 2000);
      }
    };

    fetchFlights();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
      <div className="text-center max-w-2xl px-4">
        {/* Animated Logo/Icon */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-blue-100 rounded-full animate-ping opacity-20"></div>
          </div>
          <div className="relative">
            <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-2xl">
              <Plane className="w-16 h-16 text-white animate-bounce" />
            </div>
          </div>
        </div>

        {/* Loading Text */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Finding the best flights for you
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Searching hundreds of airlines to compare prices and options...
        </p>

        {/* Loading Steps */}
        <div className="space-y-4 text-left max-w-md mx-auto">
          <LoadingStep 
            text="Searching Duffel Airlines" 
            delay={0}
          />
          <LoadingStep 
            text="Searching Amadeus database" 
            delay={600}
          />
          <LoadingStep 
            text="Comparing prices and options" 
            delay={1200}
          />
          <LoadingStep 
            text="Preparing your results" 
            delay={1800}
          />
        </div>

        {/* Progress Bar */}
        <div className="mt-12">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-progress"></div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }
        .animate-progress {
          animation: progress 2s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
}

function LoadingStep({ text, delay }: { text: string; delay: number }) {
  return (
    <div 
      className="flex items-center gap-3 opacity-0 animate-fade-in"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <div className="flex-shrink-0">
        <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
      <span className="text-gray-700 font-medium">{text}</span>
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
