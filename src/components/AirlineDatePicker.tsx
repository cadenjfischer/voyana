'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface AirlineDatePickerProps {
  startDate?: string;
  endDate?: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  className?: string;
}

export default function AirlineDatePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  className = ''
}: AirlineDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingStart, setSelectingStart] = useState(true);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const selectedStartDate = startDate ? new Date(startDate) : null;
  const selectedEndDate = endDate ? new Date(endDate) : null;

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const isDateInRange = (date: Date) => {
    if (!selectedStartDate || !selectedEndDate) return false;
    return date >= selectedStartDate && date <= selectedEndDate;
  };

  const isDateInHoverRange = (date: Date) => {
    if (!hoveredDate || !selectedStartDate || selectedEndDate) return false;
    const start = selectedStartDate;
    const end = hoveredDate;
    const minTime = Math.min(start.getTime(), end.getTime());
    const maxTime = Math.max(start.getTime(), end.getTime());
    return date.getTime() >= minTime && date.getTime() <= maxTime;
  };

  const handleDateClick = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    
    if (selectingStart || !selectedStartDate) {
      onStartDateChange(dateStr);
      onEndDateChange('');
      setSelectingStart(false);
    } else {
      if (date < selectedStartDate) {
        onStartDateChange(dateStr);
        onEndDateChange(selectedStartDate.toISOString().split('T')[0]);
      } else {
        onEndDateChange(dateStr);
      }
      setSelectingStart(true);
      setIsOpen(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const renderMonth = (monthOffset: number) => {
    const monthDate = new Date(currentMonth);
    monthDate.setMonth(currentMonth.getMonth() + monthOffset);
    
    const daysInMonth = getDaysInMonth(monthDate);
    const firstDay = getFirstDayOfMonth(monthDate);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="w-6 h-6"></div>
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
      const isToday = isSameDay(date, today);
      const isStartDate = selectedStartDate && isSameDay(date, selectedStartDate);
      const isEndDate = selectedEndDate && isSameDay(date, selectedEndDate);
      const isInRange = isDateInRange(date);
      const isInHoverRange = isDateInHoverRange(date);
      const isPastDate = date < today;

      let dayClasses = 'w-6 h-6 flex items-center justify-center text-xs font-bold cursor-pointer transition-all duration-200 rounded-full relative';

      if (isPastDate) {
        dayClasses += ' text-gray-300 cursor-not-allowed';
      } else if (isStartDate || isEndDate) {
        dayClasses += ' bg-blue-600 text-white';
      } else if (isInRange || isInHoverRange) {
        dayClasses += ' bg-blue-100 text-blue-700';
      } else if (isToday) {
        dayClasses += ' border-2 border-blue-600 text-blue-600';
      } else {
        dayClasses += ' text-gray-800 hover:bg-blue-50 hover:text-blue-600';
      }

      days.push(
        <div
          key={day}
          className={dayClasses}
          onClick={() => !isPastDate && handleDateClick(date)}
          onMouseEnter={() => !isPastDate && setHoveredDate(date)}
          onMouseLeave={() => setHoveredDate(null)}
        >
          {day}
        </div>
      );
    }

    return (
      <div className="flex-1 p-3">
        <div className="text-center mb-2">
          <h3 className="text-sm font-bold text-gray-900 tracking-tight">
            {monthNames[monthDate.getMonth()]} {monthDate.getFullYear()}
          </h3>
        </div>
        
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {weekDays.map(day => (
            <div key={day} className="w-6 h-5 flex items-center justify-center text-xs font-bold text-gray-500 uppercase">
              {day}
            </div>
          ))}
        </div>
        
        {/* Days grid - Equal spacing horizontally and vertically */}
        <div className="grid grid-cols-7 gap-0.5">
          {days}
        </div>
      </div>
    );
  };

  const formatDateRange = () => {
    if (!selectedStartDate && !selectedEndDate) {
      return 'Select dates';
    }
    
    if (selectedStartDate && !selectedEndDate) {
      return selectedStartDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
    
    if (selectedStartDate && selectedEndDate) {
      const start = selectedStartDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      const end = selectedEndDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      return `${start} - ${end}`;
    }
    
    return 'Select dates';
  };

  return (
    <div className={`relative ${className}`} ref={pickerRef}>
      {/* Date Input Display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 text-left bg-white hover:bg-gray-50"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              <div className="text-gray-900 font-medium">
                {formatDateRange()}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {selectingStart ? 'Select departure date' : 'Select return date'}
              </div>
            </div>
          </div>
          <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
        </div>
      </button>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden" style={{width: '500px'}}>
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-1 border-b border-gray-100 bg-gray-50">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-1 rounded hover:bg-white transition-colors duration-200"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            
            <div className="text-center">
              <div className="text-sm text-gray-600">
                {selectingStart ? 'Select departure date' : 'Select return date'}
              </div>
            </div>
            
            <button
              onClick={() => navigateMonth('next')}
              className="p-1 rounded hover:bg-white transition-colors duration-200"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Side-by-side months */}
          <div className="flex divide-x divide-gray-100">
            {renderMonth(0)}
            {renderMonth(1)}
          </div>

          {/* Footer */}
          <div className="px-3 py-1 border-t border-gray-100 bg-gray-50">
            <div className="text-xs text-gray-500 text-center">
              {selectedStartDate && !selectedEndDate ? (
                <span className="font-medium text-blue-600">Now select your return date</span>
              ) : (
                `Click to select ${selectingStart ? 'departure' : 'return'} date`
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}