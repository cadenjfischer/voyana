'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import CustomAutocomplete from './CustomAutocomplete';
import { fetchDestinationPhoto } from '../utils/unsplash';

const AirlineDatePicker = dynamic(() => import('./AirlineDatePicker'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 h-12 rounded-xl"></div>
});

interface AddTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTrip: (trip: {
    title: string;
    destination: string;
    startDate: string;
    endDate: string;
    description: string;
    photo: string;
  }) => void;
}

export default function AddTripModal({ isOpen, onClose, onAddTrip }: AddTripModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    destination: '',
    startDate: '',
    endDate: '',
    description: '',
    photo: ''
  });

  const [photoPreview, setPhotoPreview] = useState<string>('/default-trip-image.svg');
  const [isLoadingPhoto, setIsLoadingPhoto] = useState(false);
  const [multipleCities, setMultipleCities] = useState(false);
  const [destinations, setDestinations] = useState<string[]>([]);
  const [currentDestination, setCurrentDestination] = useState('');
  const [regenerateCount, setRegenerateCount] = useState(0);
  const maxRegenerations = 3;

  // Fetch photo when user selects a destination (only if both dates are available)
  const fetchPhotoForDestination = async (destination: string, isRegenerate = false) => {
    if (destination && destination.length > 2 && formData.startDate && formData.endDate) {
      setIsLoadingPhoto(true);
      try {
        // Pass the trip dates and random seed for regeneration to get seasonally appropriate photos
        const randomSeed = isRegenerate ? Date.now() + regenerateCount : undefined;
        const photoUrl = await fetchDestinationPhoto(
          destination, 
          formData.startDate, 
          formData.endDate,
          randomSeed
        );
        if (photoUrl) {
          setPhotoPreview(photoUrl);
          setFormData(prev => ({ ...prev, photo: photoUrl }));
          
          // Increment regenerate count if this is a manual regeneration
          if (isRegenerate) {
            setRegenerateCount(prev => prev + 1);
          }
        } else {
          // Fallback to default image if no photo found
          setPhotoPreview('/default-trip-image.svg');
        }
      } catch (error) {
        console.error('Error fetching destination photo:', error);
        // Fallback to default image on error
        setPhotoPreview('/default-trip-image.svg');
      } finally {
        setIsLoadingPhoto(false);
      }
    }
  };

  // Regenerate photo function with limit
  const handleRegeneratePhoto = () => {
    const currentDestination = multipleCities 
      ? destinations[0] 
      : formData.destination;
      
    if (regenerateCount < maxRegenerations && currentDestination) {
      fetchPhotoForDestination(currentDestination, true);
    }
  };

  // Fetch photo when dates change (only if we have both dates)
  useEffect(() => {
    const currentDestination = multipleCities 
      ? destinations[0] // Use first destination for photo
      : formData.destination;
      
    if (currentDestination && 
        currentDestination.length > 2 && 
        formData.startDate && 
        formData.endDate) {
      // Fetch photo when we have destination AND both dates
      fetchPhotoForDestination(currentDestination);
    }
  }, [formData.startDate, formData.endDate, destinations]); // Only react to date changes and destinations array changes

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setPhotoPreview(result);
        setFormData(prev => ({
          ...prev,
          photo: result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddDestination = (destination: string) => {
    if (multipleCities) {
      // Add to destinations array if not already present
      if (!destinations.includes(destination)) {
        const newDestinations = [...destinations, destination];
        setDestinations(newDestinations);
        
        // If this is the first destination, fetch photo for it
        if (newDestinations.length === 1) {
          fetchPhotoForDestination(destination);
          setFormData(prev => ({ ...prev, destination: destination }));
        }
        
        // Clear the current input
        setCurrentDestination('');
      }
    } else {
      // Single city mode - set as main destination
      setFormData(prev => ({ ...prev, destination: destination }));
      setCurrentDestination(destination);
      fetchPhotoForDestination(destination);
    }
  };

  const handleRemoveDestination = (indexToRemove: number) => {
    const newDestinations = destinations.filter((_, index) => index !== indexToRemove);
    setDestinations(newDestinations);
    
    // If we removed the first destination, update the main destination and photo
    if (indexToRemove === 0) {
      const newMainDestination = newDestinations[0] || '';
      setFormData(prev => ({ ...prev, destination: newMainDestination }));
      if (newMainDestination) {
        fetchPhotoForDestination(newMainDestination);
      } else {
        setPhotoPreview('/default-trip-image.svg');
        setFormData(prev => ({ ...prev, photo: '' }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation for destinations
    const hasDestination = multipleCities 
      ? destinations.length > 0 
      : !!formData.destination && formData.destination.trim().length > 0;
    
    if (!formData.title || !hasDestination || !formData.startDate || !formData.endDate) {
      const missingFields = [];
      if (!formData.title) missingFields.push('Trip Name');
      if (!hasDestination) missingFields.push(multipleCities ? 'At least one destination' : 'Destination');
      if (!formData.startDate) missingFields.push('Start Date');
      if (!formData.endDate) missingFields.push('End Date');
      
      alert(`Please fill in the following required fields: ${missingFields.join(', ')}`);
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      alert('End date must be after start date');
      return;
    }

    // Prepare the trip data with proper destination handling
    const tripData = {
      ...formData,
      destination: multipleCities && destinations.length > 0 
        ? destinations.join(', ') // Join multiple cities with comma separation
        : formData.destination
    };
    
    onAddTrip(tripData);
    setFormData({
      title: '',
      destination: '',
      startDate: '',
      endDate: '',
      description: '',
      photo: ''
    });
    setPhotoPreview('/default-trip-image.jpg');
    setMultipleCities(false);
    setDestinations([]);
    setCurrentDestination('');
    setRegenerateCount(0); // Reset regenerate count
  };

  const handleClose = () => {
    setFormData({
      title: '',
      destination: '',
      startDate: '',
      endDate: '',
      description: '',
      photo: ''
    });
    setPhotoPreview('/default-trip-image.jpg');
    setRegenerateCount(0); // Reset regenerate count
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Add Trip</h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors duration-200"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Form Section */}
            <div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Trip Details</h3>
                  
                  {/* Trip Name */}
                  <div className="mb-3">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-1">
                      Trip Name
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Enter trip name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 text-gray-900 placeholder-gray-500"
                      required
                    />
                  </div>

                  {/* Destination */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="destination" className="block text-sm font-medium text-gray-900">
                        Destination City <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600">Multiple Cities</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newMultipleCities = !multipleCities;
                            setMultipleCities(newMultipleCities);
                            
                            // If turning ON multiple cities and there's a current destination, add it to the list
                            if (newMultipleCities && formData.destination && formData.destination.trim()) {
                              setDestinations([formData.destination]);
                              setCurrentDestination('');
                            }
                            // If turning OFF multiple cities, clear the destinations array and set the first one as main
                            else if (!newMultipleCities && destinations.length > 0) {
                              setFormData(prev => ({ ...prev, destination: destinations[0] }));
                              setDestinations([]);
                              setCurrentDestination('');
                            }
                          }}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
                            multipleCities ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ${
                              multipleCities ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                    <CustomAutocomplete
                      value={multipleCities ? currentDestination : formData.destination}
                      onChange={(value) => {
                        if (multipleCities) {
                          setCurrentDestination(value);
                        } else {
                          setFormData(prev => ({ ...prev, destination: value }));
                        }
                      }}
                      onSelect={(value) => {
                        handleAddDestination(value);
                      }}
                      placeholder={multipleCities ? "Add another city..." : "Search for a city or ski resort..."}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 text-gray-900 placeholder-gray-500"
                      required={!multipleCities}
                    />
                    
                    {/* Multiple Cities List */}
                    {multipleCities && destinations.length > 0 && (
                      <div className="mt-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Destinations</h4>
                        <div className="flex flex-wrap gap-2">
                          {destinations.map((dest, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm border border-blue-200"
                            >
                              <span className="text-sm font-medium">{dest}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveDestination(index)}
                                className="ml-1 text-blue-500 hover:text-red-600 transition-colors duration-150"
                                title="Remove destination"
                              >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Travel Dates <span className="text-red-500">*</span>
                    </label>
                    <AirlineDatePicker
                      startDate={formData.startDate}
                      endDate={formData.endDate}
                      onStartDateChange={(date: string) => setFormData(prev => ({ ...prev, startDate: date }))}
                      onEndDateChange={(date: string) => setFormData(prev => ({ ...prev, endDate: date }))}
                    />
                  </div>

                  {/* Description */}
                  <div className="mb-4">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-900 mb-1">
                      Trip Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Enter Trip Description"
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 resize-none text-gray-900 placeholder-gray-500"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors duration-200"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>

            {/* Photo Section - Moved up */}
            <div className="flex flex-col h-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Trip Photo</h3>
              
              {/* Helper text */}
              <p className="text-sm text-gray-500 mb-1">
                Photo will appear once destination and dates are selected
              </p>
              <p className="text-xs text-gray-400 mb-3">
                Images may show regional views for some destinations
              </p>
              
              <div className="relative flex-1">
                <div className="aspect-[4/3] bg-gray-50 rounded-2xl overflow-hidden border-2 border-dashed border-gray-400 hover:border-blue-500 transition-colors duration-200">
                  {isLoadingPhoto ? (
                    <div className="flex flex-col items-center justify-center h-full text-blue-600">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                      <p className="text-sm font-medium">Finding perfect photo for {formData.destination}...</p>
                    </div>
                  ) : photoPreview ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={photoPreview}
                        alt={`Trip preview for ${formData.destination}`}
                        fill
                        className="object-cover"
                      />
                      {formData.destination && (
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          {formData.destination}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-600">
                      <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm font-medium">
                        {formData.destination ? 'Auto-loading destination photo...' : 'Enter destination to see photo'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  {/* Regenerate Photo Button - only show if photo exists and regenerations available */}
                  {photoPreview !== '/default-trip-image.svg' && regenerateCount < maxRegenerations && (
                    <button
                      onClick={handleRegeneratePhoto}
                      disabled={isLoadingPhoto}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Generate New Photo ({maxRegenerations - regenerateCount} left)
                    </button>
                  )}
                  
                  {/* Show limit reached message */}
                  {regenerateCount >= maxRegenerations && photoPreview !== '/default-trip-image.svg' && (
                    <p className="text-xs text-gray-500 text-center">
                      Regeneration limit reached ({maxRegenerations}/{maxRegenerations} used)
                    </p>
                  )}

                  {/* Change Photo Button */}
                  <label className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl cursor-pointer hover:bg-blue-100 transition-colors duration-200">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Upload Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}