'use client';

import Image from "next/image";
import Link from "next/link";
import { useUser, SignUpButton } from "@clerk/nextjs";

export default function HeroSection() {
  const { isSignedIn } = useUser();
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full blur-xl animate-float opacity-30"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-blue-300 rounded-full blur-xl animate-float-delayed opacity-20"></div>
      <div className="absolute top-1/3 right-20 w-16 h-16 bg-gray-200 rounded-full blur-xl animate-float-slow opacity-40"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-700 font-medium text-sm tracking-wide mb-8">
              <span className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse"></span>
              Premium Experience Awaits
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Elevate Your
              <span className="block text-blue-600 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Digital Presence
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl lg:text-2xl text-gray-700 mb-8 leading-relaxed max-w-2xl">
              Experience luxury in every pixel. We craft extraordinary digital experiences 
              that captivate, inspire, and deliver exceptional results for discerning clients.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              {isSignedIn ? (
                <Link 
                  href="/dashboard"
                  className="group bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-semibold text-lg tracking-wide transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-blue-500/25 text-center"
                >
                  <span className="flex items-center justify-center">
                    Go to Dashboard
                    <svg 
                      className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </Link>
              ) : (
                <SignUpButton mode="modal">
                  <button className="group bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-semibold text-lg tracking-wide transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-blue-500/25">
                    <span className="flex items-center">
                      Start Your Journey
                      <svg 
                        className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </span>
                  </button>
                </SignUpButton>
              )}
              
              <button className="group bg-transparent border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-8 py-4 rounded-full font-semibold text-lg tracking-wide transition-all duration-300 transform hover:scale-105">
                <span className="flex items-center">
                  <svg 
                    className="mr-2 w-5 h-5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-7 4h12l-2 5H9l-2-5z" />
                  </svg>
                  View Portfolio
                </span>
              </button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-8 mt-12 pt-8 border-t border-gray-300">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">500+</div>
                <div className="text-gray-600 text-sm tracking-wide">Premium Projects</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">98%</div>
                <div className="text-gray-600 text-sm tracking-wide">Client Satisfaction</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">5★</div>
                <div className="text-gray-600 text-sm tracking-wide">Average Rating</div>
              </div>
            </div>
          </div>

          {/* Visual Element */}
          <div className="relative">
            {/* Main Visual Container */}
            <div className="relative bg-gradient-to-br from-blue-50/80 to-gray-50/80 rounded-3xl p-8 backdrop-blur-sm border border-blue-200/50">
              {/* Decorative Elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-200 rounded-full opacity-30 blur-lg"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-blue-300 rounded-full opacity-20 blur-xl"></div>
              
              {/* Logo Showcase */}
              <div className="relative z-10 text-center">
                <div className="mb-8">
                  <Image
                    src="/VoyanaLogo.svg"
                    alt="Voyana - Premium Digital Experience"
                    width={300}
                    height={75}
                    className="mx-auto filter drop-shadow-2xl"
                    priority
                  />
                </div>
                
                {/* Feature Cards */}
                <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-200 hover:shadow-xl transition-all duration-300">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Lightning Fast</h3>
                    <p className="text-gray-600 text-sm">Optimized performance</p>
                  </div>
                  
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-200 hover:shadow-xl transition-all duration-300">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                      <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Secure</h3>
                    <p className="text-gray-600 text-sm">Enterprise-grade security</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-blue-400 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-blue-600 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
}