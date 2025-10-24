'use client';

import { useState, useEffect } from 'react';
import { Activity } from '@/types/itinerary';

interface ActivityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (activity: Partial<Activity>) => void;
  activityType: Activity['type'];
  dayId: string;
}

export default function ActivityFormModal({
  isOpen,
  onClose,
  onSave,
  activityType,
  dayId
}: ActivityFormModalProps) {
  const [formData, setFormData] = useState<any>({});
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData({});
      setExpandedSections(new Set());
    }
  }, [isOpen, activityType]);

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const renderActivityForm = () => {
    switch (activityType) {
      case 'activity':
        return renderActivityForm_Activity();
      case 'rail':
        return renderActivityForm_Rail();
      case 'car-rental':
        return renderActivityForm_CarRental();
      case 'restaurant':
        return renderActivityForm_Restaurant();
      case 'concert':
        return renderActivityForm_Concert();
      case 'note':
        return renderActivityForm_Note();
      default:
        return renderActivityForm_Generic();
    }
  };

  const renderActivityForm_Activity = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
        <input
          type="text"
          placeholder="Enter Event Name"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.title || ''}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.startDate || ''}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
          <input
            type="time"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.startTime || ''}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.timezone || 'Automatic Timezone'}
            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
          >
            <option>Automatic Timezone</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.endDate || ''}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
          <input
            type="time"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.endTime || ''}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
        <input
          type="text"
          placeholder="Enter Venue"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.venue || ''}
          onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <input
          type="text"
          placeholder="Enter Address"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.address || ''}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
        <input
          type="tel"
          placeholder="Enter Phone"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.phone || ''}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
        <input
          type="url"
          placeholder="Enter Website"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.website || ''}
          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          placeholder="Enter Email"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.email || ''}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 items-start">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="booked"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            checked={formData.booked || false}
            onChange={(e) => setFormData({ ...formData, booked: e.target.checked })}
          />
          <label htmlFor="booked" className="ml-2 text-sm text-gray-700">
            Has this plan been booked?
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirmation</label>
          <input
            type="text"
            placeholder="Enter Confirmation"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.confirmation || ''}
            onChange={(e) => setFormData({ ...formData, confirmation: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          placeholder="Enter Note e.g. Don't forget your charger!"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      {/* Expandable sections */}
      <div className="border-t pt-4">
        <button
          onClick={() => toggleSection('attendees')}
          className="flex items-center justify-between w-full text-left font-medium text-gray-700 hover:text-gray-900"
        >
          <span>Attendees</span>
          <span className="text-blue-600 text-sm">+ Show more</span>
        </button>
      </div>

      <div className="border-t pt-4">
        <button
          onClick={() => toggleSection('booking')}
          className="flex items-center justify-between w-full text-left font-medium text-gray-700 hover:text-gray-900"
        >
          <span>Booking Info</span>
          <span className="text-blue-600 text-sm">+ Show more</span>
        </button>
      </div>
    </div>
  );

  const renderActivityForm_Rail = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirmation</label>
          <input
            type="text"
            placeholder="Enter Confirmation"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.confirmation || ''}
            onChange={(e) => setFormData({ ...formData, confirmation: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Total Cost</label>
          <input
            type="text"
            placeholder="Enter Total Cost"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.totalCost || ''}
            onChange={(e) => setFormData({ ...formData, totalCost: e.target.value })}
          />
        </div>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="booked-rail"
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          checked={formData.booked || false}
          onChange={(e) => setFormData({ ...formData, booked: e.target.checked })}
        />
        <label htmlFor="booked-rail" className="ml-2 text-sm text-gray-700">
          Has this plan been booked?
        </label>
      </div>

      <div className="border-t pt-4">
        <h3 className="font-semibold text-gray-900 mb-4">Train Ride 1</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Carrier Name *</label>
            <input
              type="text"
              placeholder="Enter Carrier Name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.carrierName || ''}
              onChange={(e) => setFormData({ ...formData, carrierName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Train Number</label>
            <input
              type="text"
              placeholder="Enter Train Number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.trainNumber || ''}
              onChange={(e) => setFormData({ ...formData, trainNumber: e.target.value })}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Departure Station</label>
          <input
            type="text"
            placeholder="Enter Departure Station"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.departureStation || ''}
            onChange={(e) => setFormData({ ...formData, departureStation: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Departure Date</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.departureDate || ''}
              onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Departure Time</label>
            <input
              type="time"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.departureTime || ''}
              onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.timezone || 'Automatic Timezone'}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
            >
              <option>Automatic Timezone</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input
            type="text"
            placeholder="Enter Address"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.departureAddress || ''}
            onChange={(e) => setFormData({ ...formData, departureAddress: e.target.value })}
          />
        </div>

        <div className="mt-6 pt-6 border-t">
          <h4 className="font-medium text-gray-900 mb-4">Arrival</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Station</label>
            <input
              type="text"
              placeholder="Enter Arrival Station"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.arrivalStation || ''}
              onChange={(e) => setFormData({ ...formData, arrivalStation: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.arrivalDate || ''}
                onChange={(e) => setFormData({ ...formData, arrivalDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Time</label>
              <input
                type="time"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.arrivalTime || ''}
                onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.arrivalTimezone || 'Automatic Timezone'}
                onChange={(e) => setFormData({ ...formData, arrivalTimezone: e.target.value })}
              >
                <option>Automatic Timezone</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              placeholder="Enter Address"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.arrivalAddress || ''}
              onChange={(e) => setFormData({ ...formData, arrivalAddress: e.target.value })}
            />
          </div>
        </div>

        <div className="mt-6 pt-6 border-t">
          <h4 className="font-medium text-gray-900 mb-4">Train and Service Info</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Train Type</label>
            <input
              type="text"
              placeholder="Enter Train Type"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.trainType || ''}
              onChange={(e) => setFormData({ ...formData, trainType: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Coach Number(s)</label>
              <input
                type="text"
                placeholder="Enter Coach Number(s)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.coachNumber || ''}
                onChange={(e) => setFormData({ ...formData, coachNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <input
                type="text"
                placeholder="Enter Class"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.class || ''}
                onChange={(e) => setFormData({ ...formData, class: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seat(s)</label>
              <input
                type="text"
                placeholder="Enter Seat(s)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.seats || ''}
                onChange={(e) => setFormData({ ...formData, seats: e.target.value })}
              />
            </div>
          </div>

          <button className="mt-4 text-blue-600 hover:text-blue-700 flex items-center gap-2 text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add a Train Ride
          </button>
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          placeholder="Enter Note e.g. Don't forget your charger!"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      {/* Expandable sections */}
      <div className="border-t pt-4">
        <button
          onClick={() => toggleSection('passengers')}
          className="flex items-center justify-between w-full text-left font-medium text-gray-700 hover:text-gray-900"
        >
          <span>Passengers</span>
          <span className="text-blue-600 text-sm">+ Show more</span>
        </button>
      </div>

      <div className="border-t pt-4">
        <button
          onClick={() => toggleSection('supplier')}
          className="flex items-center justify-between w-full text-left font-medium text-gray-700 hover:text-gray-900"
        >
          <span>Supplier Info</span>
          <span className="text-blue-600 text-sm">+ Show more</span>
        </button>
      </div>

      <div className="border-t pt-4">
        <button
          onClick={() => toggleSection('booking')}
          className="flex items-center justify-between w-full text-left font-medium text-gray-700 hover:text-gray-900"
        >
          <span>Booking Info</span>
          <span className="text-blue-600 text-sm">+ Show more</span>
        </button>
      </div>
    </div>
  );

  const renderActivityForm_CarRental = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
        <input
          type="text"
          placeholder="Enter Company Name"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.companyName || ''}
          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirmation</label>
          <input
            type="text"
            placeholder="Enter Confirmation"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.confirmation || ''}
            onChange={(e) => setFormData({ ...formData, confirmation: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Total Cost</label>
          <input
            type="text"
            placeholder="Enter Total Cost"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.totalCost || ''}
            onChange={(e) => setFormData({ ...formData, totalCost: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
        <input
          type="text"
          placeholder="Enter Vehicle Type"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.vehicleType || ''}
          onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
        />
      </div>

      <div className="border-t pt-4">
        <h3 className="font-semibold text-gray-900 mb-4">Pick-up</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            type="text"
            placeholder="Enter Pick-up Location"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.pickupLocation || ''}
            onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.pickupDate || ''}
              onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
            <input
              type="time"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.pickupTime || ''}
              onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="font-semibold text-gray-900 mb-4">Drop-off</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            type="text"
            placeholder="Enter Drop-off Location"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.dropoffLocation || ''}
            onChange={(e) => setFormData({ ...formData, dropoffLocation: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.dropoffDate || ''}
              onChange={(e) => setFormData({ ...formData, dropoffDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
            <input
              type="time"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.dropoffTime || ''}
              onChange={(e) => setFormData({ ...formData, dropoffTime: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          placeholder="Enter Note e.g. Don't forget your driver's license!"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>
    </div>
  );

  const renderActivityForm_Restaurant = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
        <input
          type="text"
          placeholder="Enter Restaurant Name"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.title || ''}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.date || ''}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
          <input
            type="time"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.time || ''}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <input
          type="text"
          placeholder="Enter Address"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.address || ''}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
        <input
          type="tel"
          placeholder="Enter Phone"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.phone || ''}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Party Size</label>
        <input
          type="number"
          placeholder="Enter Party Size"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.partySize || ''}
          onChange={(e) => setFormData({ ...formData, partySize: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Confirmation</label>
        <input
          type="text"
          placeholder="Enter Confirmation Number"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.confirmation || ''}
          onChange={(e) => setFormData({ ...formData, confirmation: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          placeholder="Enter dietary restrictions or preferences"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>
    </div>
  );

  const renderActivityForm_Concert = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
        <input
          type="text"
          placeholder="Enter Event Name"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.title || ''}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Artist/Performer</label>
        <input
          type="text"
          placeholder="Enter Artist Name"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.artist || ''}
          onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
        <input
          type="text"
          placeholder="Enter Venue"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.venue || ''}
          onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.date || ''}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
          <input
            type="time"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.time || ''}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <input
          type="text"
          placeholder="Enter Address"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.address || ''}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Type/Section</label>
        <input
          type="text"
          placeholder="Enter Ticket Type"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.ticketType || ''}
          onChange={(e) => setFormData({ ...formData, ticketType: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Seat Number(s)</label>
          <input
            type="text"
            placeholder="Enter Seat Numbers"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.seatNumbers || ''}
            onChange={(e) => setFormData({ ...formData, seatNumbers: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirmation</label>
          <input
            type="text"
            placeholder="Enter Confirmation"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.confirmation || ''}
            onChange={(e) => setFormData({ ...formData, confirmation: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          placeholder="Enter any special notes"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>
    </div>
  );

  const renderActivityForm_Note = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          placeholder="Enter Note Title"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.title || ''}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
        <textarea
          placeholder="Enter your note here..."
          rows={8}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>
    </div>
  );

  const renderActivityForm_Generic = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          placeholder="Enter Title"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.title || ''}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.date || ''}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
          <input
            type="time"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.time || ''}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
        <input
          type="text"
          placeholder="Enter Location"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.location || ''}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          placeholder="Enter any notes"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>
    </div>
  );

  const getActivityTitle = () => {
    const titles: Record<Activity['type'], string> = {
      activity: 'Add Activity',
      rail: 'Add Rail',
      'car-rental': 'Add Car Rental',
      restaurant: 'Add Restaurant',
      concert: 'Add Concert',
      note: 'Add Note',
      parking: 'Add Parking',
      cruise: 'Add Cruise',
      directions: 'Add Directions',
      ferry: 'Add Ferry',
      theater: 'Add Theater',
      tour: 'Add Tour',
      meeting: 'Add Meeting',
      transportation: 'Add Transportation',
      flight: 'Add Flight',
      lodging: 'Add Lodging',
      map: 'Add Map'
    };
    return titles[activityType] || 'Add Activity';
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-[9998] transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide-up panel */}
      <div 
        className={`fixed left-0 bottom-0 bg-white shadow-2xl z-[9999] transition-transform duration-300 ease-out scrollbar-hide ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ 
          top: '80px',
          width: '50vw',
          maxWidth: '700px',
          minWidth: '500px',
          maxHeight: 'calc(100vh - 80px)',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-center z-10">
          <button
            onClick={onClose}
            className="absolute left-6 text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h2 className="text-xl font-semibold text-gray-900">{getActivityTitle()}</h2>
          <button
            onClick={handleSave}
            className="absolute right-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Save
          </button>
        </div>

        {/* Form content */}
        <div className="px-6 py-6">
          {renderActivityForm()}
        </div>

        {/* Footer buttons */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Save
          </button>
        </div>
      </div>
    </>
  );
}
