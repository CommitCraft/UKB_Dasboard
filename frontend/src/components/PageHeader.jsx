import React from 'react';

/**
 * Reusable PageHeader component used across all management pages.
 *
 * Props:
 *  - icon       : React element (Lucide icon) to show in the colored badge
 *  - title      : Page title string
 *  - subtitle   : Subtitle/description string (optional)
 *  - actions    : React node(s) rendered on the right side (buttons, etc.) - optional
 */
const PageHeader = ({ icon, title, subtitle, actions }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-gray-800 px-5 py-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/60">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-[#00629F] to-[#004774] text-white shadow-md shadow-[#00629F]/20">
            {icon}
          </div>
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-3 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
