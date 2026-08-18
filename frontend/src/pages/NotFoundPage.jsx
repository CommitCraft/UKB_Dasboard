import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  Compass, 
  LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NotFoundPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-radial from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-slate-950 dark:to-black p-4 sm:p-6 transition-colors duration-200 overflow-hidden relative">
      
      {/* Background Decorative Glow Circles */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-500/10 dark:bg-primary-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-rose-500/10 dark:bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-xl w-full text-center space-y-8">
        
        {/* Animated 404 Badge & Graphic */}
        <div className="relative inline-block">
          <div className="text-8xl sm:text-9xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-indigo-500 to-rose-500 dark:from-primary-400 dark:via-indigo-400 dark:to-rose-400 select-none drop-shadow-sm animate-pulse">
            404
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md flex items-center gap-2 whitespace-nowrap">
            <Compass className="w-4 h-4 text-primary-500 animate-spin" style={{ animationDuration: '8s' }} />
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
              Page Not Found
            </span>
          </div>
        </div>

        {/* Headings & Path Info */}
        <div className="space-y-3 pt-2">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Oops! You've navigated into unknown territory
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
            The page at <code className="px-2 py-1 rounded-lg bg-gray-200/80 dark:bg-gray-800 font-mono text-[11px] text-rose-600 dark:text-rose-400 border border-gray-300 dark:border-gray-700 font-semibold">{location.pathname}</code> does not exist, has been moved, or you may not have sufficient access rights.
          </p>
        </div>

        {/* Action Buttons Group */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/90 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/80 text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>

          <button
            type="button"
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white text-xs font-bold shadow-md shadow-primary-500/20 transition-all cursor-pointer"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>{isAuthenticated ? 'Go to Dashboard' : 'Go to Login'}</span>
          </button>
        </div>

        {/* Quick Help Footer Card */}
        <div className="pt-6 border-t border-gray-200/80 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Aplos Logix MES Portal</span>
          </div>
          <p className="font-mono text-[11px]">Error Code: 404_NOT_FOUND</p>
        </div>

      </div>
    </div>
  );
};

export default NotFoundPage;
