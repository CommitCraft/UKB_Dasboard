import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const ExternalPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const url = searchParams.get('url');
  const title = searchParams.get('title') || 'External Page';

  useEffect(() => {
    if (!url) {
      navigate('/dashboard');
    }
  }, [url, navigate]);

  if (!url) {
    return null;
  }

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 w-full">
      {/* Sleek Page Title Header */}
      <div className="mb-2 flex items-center justify-between gap-2 shrink-0 px-1">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-xs cursor-pointer"
            title="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">
            {title}
          </h1>
        </div>
      </div>

      {/* Main Full-Height Iframe Canvas */}
      <div className="relative flex-1 min-h-0 w-full bg-white dark:bg-gray-800 rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
        <iframe
          src={url}
          className="w-full flex-1 h-full min-h-0 border-0"
          title={title}
          allow="fullscreen; clipboard-read; clipboard-write;"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"
        />
      </div>
    </div>
  );
};

export default ExternalPage;