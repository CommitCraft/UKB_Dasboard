import React from 'react';
import { X } from 'lucide-react';

const SidebarHeader = ({
  onClose,
  title = "UKB Dashboard",
  logoSrc = "https://cdn.enfsolar.com/ID/logo/60779d90f067a.jpg?v=1",
  logoAlt = "UKB Logo"
}) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex flex-col items-center">
        <div className="flex items-center justify-center">
          <img
            src={logoSrc}
            alt={logoAlt}
            className="object-contain"
          />
        </div>
        <span className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
          {title}
        </span>
      </div>
      <button
        onClick={onClose}
        className="lg:hidden p-1 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        aria-label="Close sidebar"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
};

export default SidebarHeader;
