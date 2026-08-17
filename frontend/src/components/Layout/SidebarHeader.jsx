import React from 'react';
import { ChevronLeft, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const SidebarHeader = ({
  onClose,
  isOpen = false,
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

      {/* Centered collapse toggle button (rendered ONLY when mobile drawer is open/expanded) */}
      {isOpen && (
        <button
          onClick={onClose}
          className="lg:hidden absolute -right-3.5 top-1/2 -translate-y-1/2 z-50 flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-md transition-all hover:scale-110 hover:border-[#00629F] hover:text-[#00629F] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:text-white cursor-pointer"
          aria-label="Collapse sidebar"
          title="Collapse sidebar"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default SidebarHeader;
