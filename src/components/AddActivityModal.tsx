'use client';

import { useState } from 'react';

interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddActivity: (activity: {
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
  }) => void;
  selectedDate: string;
}

export default function AddActivityModal({ isOpen, onClose, onAddActivity, selectedDate }: AddActivityModalProps) {
  const [formData, setFormData] = useState<{
    type: 'flight' | 'hotel' | 'activity' | 'meeting' | 'other';
    title: string;
    time: string;
    location: string;
    description: string;
    confirmation: string;
    terminal: string;
    gate: string;
    flightNumber: string;
    arrivalTime: string;
  }>({
    type: 'activity',
    title: '',
    time: '',
    location: '',
    description: '',
    confirmation: '',
    terminal: '',
    gate: '',
    flightNumber: '',
    arrivalTime: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.time) {
      alert('Please fill in the required fields');
      return;
    }

    const activityData = {
      type: formData.type,
      title: formData.title,
      time: formData.time,
      ...(formData.location && { location: formData.location }),
      ...(formData.description && { description: formData.description }),
      ...(formData.confirmation && { confirmation: formData.confirmation }),
      ...(formData.terminal && { terminal: formData.terminal }),
      ...(formData.gate && { gate: formData.gate }),
      ...(formData.flightNumber && { flightNumber: formData.flightNumber }),
      ...(formData.arrivalTime && { arrivalTime: formData.arrivalTime })
    };

    onAddActivity(activityData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      type: 'activity',
      title: '',
      time: '',
      location: '',
      description: '',
      confirmation: '',
      terminal: '',
      gate: '',
      flightNumber: '',
      arrivalTime: ''
    });
    onClose();
  };

  const formatSelectedDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'flight':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        );
      case 'hotel':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2z" />
          </svg>
        );
      case 'meeting':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'activity':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Add Activity</h2>
            <p className="text-gray-600 text-sm mt-1">{formatSelectedDate(selectedDate)}</p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors duration-200"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Activity Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Activity Type</label>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                { value: 'flight', label: 'Flight', color: 'blue' },
                { value: 'hotel', label: 'Hotel', color: 'green' },
                { value: 'activity', label: 'Activity', color: 'yellow' },
                { value: 'meeting', label: 'Meeting', color: 'purple' },
                { value: 'other', label: 'Other', color: 'gray' }
              ].map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: type.value as any }))}
                  className={`p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                    formData.type === type.value
                      ? `border-${type.color}-500 bg-${type.color}-50 text-${type.color}-700`
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  {getTypeIcon(type.value)}
                  <span className="text-xs font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder={
                  formData.type === 'flight' ? 'BOS - FRA' :
                  formData.type === 'hotel' ? 'Hotel Check-in' :
                  formData.type === 'meeting' ? 'Meet at work' :
                  'Activity name'
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                required
              />
            </div>

            <div>
              <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                id="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                required
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder={
                formData.type === 'flight' ? 'Terminal E, Gate E9' :
                formData.type === 'hotel' ? 'Hotel address' :
                'Location or address'
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
            />
          </div>

          {/* Flight-specific fields */}
          {formData.type === 'flight' && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Flight Details</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="flightNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Flight Number
                  </label>
                  <input
                    type="text"
                    id="flightNumber"
                    name="flightNumber"
                    value={formData.flightNumber}
                    onChange={handleInputChange}
                    placeholder="LH 423"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  />
                </div>

                <div>
                  <label htmlFor="confirmation" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmation
                  </label>
                  <input
                    type="text"
                    id="confirmation"
                    name="confirmation"
                    value={formData.confirmation}
                    onChange={handleInputChange}
                    placeholder="CHGSDY"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  />
                </div>

                <div>
                  <label htmlFor="terminal" className="block text-sm font-medium text-gray-700 mb-2">
                    Terminal
                  </label>
                  <input
                    type="text"
                    id="terminal"
                    name="terminal"
                    value={formData.terminal}
                    onChange={handleInputChange}
                    placeholder="Terminal E"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  />
                </div>

                <div>
                  <label htmlFor="gate" className="block text-sm font-medium text-gray-700 mb-2">
                    Gate
                  </label>
                  <input
                    type="text"
                    id="gate"
                    name="gate"
                    value={formData.gate}
                    onChange={handleInputChange}
                    placeholder="Gate E9"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="arrivalTime" className="block text-sm font-medium text-gray-700 mb-2">
                  Arrival Time
                </label>
                <input
                  type="time"
                  id="arrivalTime"
                  name="arrivalTime"
                  value={formData.arrivalTime}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                />
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Additional notes or details..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 resize-none"
            />
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
              Add Activity
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}