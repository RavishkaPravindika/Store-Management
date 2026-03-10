import React, { forwardRef } from 'react';
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: {
    value: string;
    label: string;
  }[];
}
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', id, ...props }, ref) => {
    const selectId = id || Math.random().toString(36).substring(7);
    return (
      <div className="w-full">
        {label &&
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-gray-700 mb-1">

            {label}
          </label>
        }
        <select
          id={selectId}
          ref={ref}
          className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`}
          {...props}>

          <option value="" disabled>
            Select an option
          </option>
          {options.map((option) =>
          <option key={option.value} value={option.value}>
              {option.label}
            </option>
          )}
        </select>
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>);

  }
);
Select.displayName = 'Select';