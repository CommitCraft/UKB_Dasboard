import React from 'react';
import { X, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const SidebarHeader = ({
  onClose,
  logoSrc = "https://cdn.enfsolar.com/ID/logo/60779d90f067a.jpg?v=1",
  logoAlt = "Logo"
}) => {
  const { user } = useAuth();
  const currentDate = new Date();

  const formattedDate = currentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="flex flex-col p-4 border-b border-gray-200 dark:border-gray-700 relative">
      <div className="flex flex-col items-center w-full text-center">
        {/* Full width logo container */}
        <div className="w-full flex items-center justify-center px-1">
          <img
            src={logoSrc}
            alt={logoAlt}
            className="w-full h-auto max-h-16 object-contain"
          />
        </div>

        {/* Welcome greeting & date */}
        <div className="mt-3 flex flex-col items-center w-full">
          <span className="text-sm font-extrabold text-gray-900 dark:text-white">
            Welcome back, <span className="text-[#00629F] dark:text-sky-400">{user?.username || 'superadmin'}!</span>
          </span>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-1">
            <Calendar className="h-3.5 w-3.5 text-[#00629F]" />
            {formattedDate}
          </span>
        </div>
      </div>

      {/* Mobile close button */}
      <button
        onClick={onClose}
        className="lg:hidden absolute top-3 right-3 p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:text-gray-800 dark:bg-gray-700 dark:text-gray-300 dark:hover:text-white"
        aria-label="Close sidebar"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
};

export default SidebarHeader;
