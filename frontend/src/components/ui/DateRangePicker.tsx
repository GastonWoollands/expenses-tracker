/**
 * DateRangePicker: Component for selecting date ranges with presets
 */

import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { getDateRangePresets, type DateRangePreset } from '../../utils/analytics';

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const presets = getDateRangePresets();

  const handlePresetSelect = (preset: DateRangePreset) => {
    onChange({
      startDate: preset.startDate,
      endDate: preset.endDate
    });
    setIsOpen(false);
    setShowCustom(false);
  };

  const handleCustomDateChange = (type: 'start' | 'end', dateString: string) => {
    const date = dateString ? new Date(dateString) : null;
    onChange({
      ...value,
      [type === 'start' ? 'startDate' : 'endDate']: date
    });
  };

  const formatDateRange = () => {
    if (!value.startDate || !value.endDate) {
      return 'Select date range';
    }
    return `${format(value.startDate, 'MMM d, yyyy')} - ${format(value.endDate, 'MMM d, yyyy')}`;
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-0 py-2.5 text-sm border-0 border-b border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 hover:border-slate-400 dark:hover:border-slate-500 focus:outline-none transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          <span className="text-slate-700 dark:text-slate-300 font-normal">{formatDateRange()}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded shadow-sm">
            <div className="p-4">
              <div className="flex gap-0.5 mb-4 border-b border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCustom(false)}
                  className={`flex-1 px-4 py-2 text-xs font-normal transition-colors border-b-2 ${
                    !showCustom
                      ? 'border-slate-900 dark:border-slate-100 text-slate-900 dark:text-slate-100'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  Presets
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustom(true)}
                  className={`flex-1 px-4 py-2 text-xs font-normal transition-colors border-b-2 ${
                    showCustom
                      ? 'border-slate-900 dark:border-slate-100 text-slate-900 dark:text-slate-100'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  Custom
                </button>
              </div>

              {!showCustom ? (
                <div className="space-y-0.5">
                  {presets.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handlePresetSelect(preset)}
                      className="w-full text-left px-0 py-2.5 text-sm font-normal text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-normal text-slate-500 dark:text-slate-400 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={value.startDate ? format(value.startDate, 'yyyy-MM-dd') : ''}
                      onChange={(e) => handleCustomDateChange('start', e.target.value)}
                      className="w-full px-0 py-2 text-sm border-0 border-b border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-normal text-slate-500 dark:text-slate-400 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={value.endDate ? format(value.endDate, 'yyyy-MM-dd') : ''}
                      onChange={(e) => handleCustomDateChange('end', e.target.value)}
                      min={value.startDate ? format(value.startDate, 'yyyy-MM-dd') : undefined}
                      className="w-full px-0 py-2 text-sm border-0 border-b border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-colors"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="w-full px-0 py-2 text-sm font-normal text-slate-900 dark:text-slate-100 hover:text-slate-600 dark:hover:text-slate-300 transition-colors border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DateRangePicker;

