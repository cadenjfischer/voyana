'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { NormalizedFlight } from '@/lib/api/duffelClient';

export interface PassengerInfo {
  title: 'mr' | 'ms' | 'mrs' | 'miss' | 'dr';
  givenName: string;
  familyName: string;
  dateOfBirth: string;
  gender: 'm' | 'f';
  email: string;
  phoneNumber: string;
}

interface PassengerInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  flight: NormalizedFlight;
  passengerCount: number;
  onConfirm: (passengers: PassengerInfo[]) => void;
}

export default function PassengerInfoModal({
  isOpen,
  onClose,
  flight,
  passengerCount,
  onConfirm,
}: PassengerInfoModalProps) {
  const [passengers, setPassengers] = useState<PassengerInfo[]>(
    Array(passengerCount).fill(null).map(() => ({
      title: 'mr' as const,
      givenName: '',
      familyName: '',
      dateOfBirth: '',
      gender: 'm' as const,
      email: '',
      phoneNumber: '',
    }))
  );

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  if (!isOpen) return null;

  const handlePassengerChange = (
    index: number,
    field: keyof PassengerInfo,
    value: string
  ) => {
    const newPassengers = [...passengers];
    newPassengers[index] = {
      ...newPassengers[index],
      [field]: value,
    };
    setPassengers(newPassengers);
    
    // Clear error for this field
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`${index}-${field}`];
      return newErrors;
    });
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    passengers.forEach((passenger, index) => {
      if (!passenger.givenName.trim()) {
        newErrors[`${index}-givenName`] = 'First name is required';
      }
      if (!passenger.familyName.trim()) {
        newErrors[`${index}-familyName`] = 'Last name is required';
      }
      if (!passenger.dateOfBirth) {
        newErrors[`${index}-dateOfBirth`] = 'Date of birth is required';
      }
      if (!passenger.email.trim() || !passenger.email.includes('@')) {
        newErrors[`${index}-email`] = 'Valid email is required';
      }
      if (!passenger.phoneNumber.trim()) {
        newErrors[`${index}-phoneNumber`] = 'Phone number is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onConfirm(passengers);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">Passenger Information</h2>
            <p className="text-blue-100 text-sm">
              {flight.origin} → {flight.destination} • {flight.carrier} {flight.flightNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {passengers.map((passenger, index) => (
            <div key={index} className="mb-8 pb-8 border-b last:border-b-0">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">
                Passenger {index + 1}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <select
                    value={passenger.title}
                    onChange={(e) => handlePassengerChange(index, 'title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
                  >
                    <option value="mr">Mr.</option>
                    <option value="ms">Ms.</option>
                    <option value="mrs">Mrs.</option>
                    <option value="miss">Miss</option>
                    <option value="dr">Dr.</option>
                  </select>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={passenger.gender}
                    onChange={(e) => handlePassengerChange(index, 'gender', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
                  >
                    <option value="m">Male</option>
                    <option value="f">Female</option>
                  </select>
                </div>

                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={passenger.givenName}
                    onChange={(e) => handlePassengerChange(index, 'givenName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium placeholder:text-gray-400 placeholder:font-normal ${
                      errors[`${index}-givenName`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="John"
                  />
                  {errors[`${index}-givenName`] && (
                    <p className="text-red-500 text-xs mt-1">{errors[`${index}-givenName`]}</p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={passenger.familyName}
                    onChange={(e) => handlePassengerChange(index, 'familyName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium placeholder:text-gray-400 placeholder:font-normal ${
                      errors[`${index}-familyName`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Smith"
                  />
                  {errors[`${index}-familyName`] && (
                    <p className="text-red-500 text-xs mt-1">{errors[`${index}-familyName`]}</p>
                  )}
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    value={passenger.dateOfBirth}
                    onChange={(e) => handlePassengerChange(index, 'dateOfBirth', e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium ${
                      errors[`${index}-dateOfBirth`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors[`${index}-dateOfBirth`] && (
                    <p className="text-red-500 text-xs mt-1">{errors[`${index}-dateOfBirth`]}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={passenger.email}
                    onChange={(e) => handlePassengerChange(index, 'email', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium placeholder:text-gray-400 placeholder:font-normal ${
                      errors[`${index}-email`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="john.smith@example.com"
                  />
                  {errors[`${index}-email`] && (
                    <p className="text-red-500 text-xs mt-1">{errors[`${index}-email`]}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={passenger.phoneNumber}
                    onChange={(e) => handlePassengerChange(index, 'phoneNumber', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium placeholder:text-gray-400 placeholder:font-normal ${
                      errors[`${index}-phoneNumber`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="+1 234 567 8900"
                  />
                  {errors[`${index}-phoneNumber`] && (
                    <p className="text-red-500 text-xs mt-1">{errors[`${index}-phoneNumber`]}</p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Price Summary */}
          <div className="bg-blue-50 rounded-xl p-4 mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700">Base Fare ({passengerCount} passenger{passengerCount > 1 ? 's' : ''})</span>
              <span className="font-semibold">
                {flight.currency} {(flight.price * passengerCount).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-blue-200">
              <span className="text-lg font-bold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-blue-600">
                {flight.currency} {(flight.price * passengerCount).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 p-6 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            Complete Booking
          </button>
        </div>
      </div>
    </div>
  );
}
