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
    <div className="flex flex-col border-b border-gray-200 dark:border-gray-700 relative">

      {/* Full width logo — outside padded container */}
      <div className="w-full flex items-center justify-center overflow-hidden">
        <img
          src={logoSrc}
          alt={logoAlt}
          className="w-full h-20 object-contain"
        />
      </div>

      {/* Padded section: greeting & date */}
      <div className="flex flex-col items-center w-full text-center px-2.5 pb-2.5 pt-1.5">
        <span className="text-xs font-extrabold text-gray-900 dark:text-white">
          Welcome back, <span className="text-[#00629F] dark:text-sky-400">{user?.username || 'superadmin'}!</span>
        </span>
        <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
          <Calendar className="h-3 w-3 text-[#00629F]" />
          {formattedDate}
        </span>
      </div>

      {/* Collapse toggle button (mobile only) */}
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
