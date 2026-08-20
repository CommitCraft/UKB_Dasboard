import { 
  X, 
  Search,
  ExternalLink, 
  Globe, 
  Lock, 
  Monitor, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize, 
  Minimize, 
  Move3D, 
  MousePointer
} from 'lucide-react';
import { apiService, endpoints } from '../utils/api';
import { renderAppIcon } from '../utils/iconMap';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';

const UserPagesModal = ({ isOpen, onClose, user }) => {
  const [pages, setPages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPage, setSelectedPage] = useState(null);
  const [iframeError, setIframeError] = useState(false);
  
  // Zoom and pan states
  const [zoom, setZoom] = useState(100);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const containerRef = useRef(null);
  const iframeRef = useRef(null);

  const fetchUserPages = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      // Fetch with hierarchy parameter directly from database
      const response = await apiService.get(`${endpoints.users.pages(user.id)}?hierarchy=true`);
      const allUserPages = response.data.data?.pages || [];
      
      setPages(allUserPages);
      
      // Auto-select first page if available (check both root and children)
      const selectFirstPage = (pagesArray) => {
        for (const page of pagesArray) {
          if (page.url) {
            setSelectedPage(page);
            return true;
          }
          if (page.children && page.children.length > 0) {
            if (selectFirstPage(page.children)) return true;
          }
        }
        return false;
      };
      
      if (allUserPages.length > 0) {
        selectFirstPage(allUserPages);
      }
    } catch (error) {
      console.error('Error fetching user pages:', error);
      toast.error('Failed to load user pages', {
        style: {
          background: '#1f2937',
          color: '#fca5a5',
          border: '1px solid #4b5563',
          borderRadius: '8px',
        },
        iconTheme: {
          primary: '#ef4444',
          secondary: '#1f2937',
        },
      });
      setPages([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isOpen && user?.id) {
      setSearchTerm('');
      fetchUserPages();
    } else {
      setPages([]);
      setSelectedPage(null);
      setIframeError(false);
      setSearchTerm('');
    }
  }, [isOpen, user?.id, fetchUserPages]);

  const handlePageSelect = (page) => {
    setSelectedPage(page);
    setIframeError(false);
    // Reset zoom and position when switching pages
    setZoom(100);
    setPosition({ x: 0, y: 0 });
    setIsPanning(false);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case '+':
        case '=':
          if (e.ctrlKey) {
            e.preventDefault();
            handleZoomIn();
          }
          break;
        case '-':
          if (e.ctrlKey) {
            e.preventDefault();
            handleZoomOut();
          }
          break;
        case '0':
          if (e.ctrlKey) {
            e.preventDefault();
            handleResetZoom();
          }
          break;
        case 'Escape':
          onClose();
          break;
        case 'f':
          if (!e.ctrlKey) {
            e.preventDefault();
            toggleFullscreen();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleIframeError = () => {
    setIframeError(true);
  };

  // Zoom functions
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 10, 300));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 50));
  };

  const handleResetZoom = () => {
    setZoom(100);
    setPosition({ x: 0, y: 0 });
  };

  const handleZoomChange = (e) => {
    const newZoom = parseInt(e.target.value);
    setZoom(newZoom);
  };

  // Pan functions
  const handleMouseDown = (e) => {
    if (!isPanning) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !isPanning) return;
    e.preventDefault();
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Pan mode toggle
  const togglePanMode = () => {
    setIsPanning(!isPanning);
    if (isPanning) {
      setPosition({ x: 0, y: 0 });
    }
  };

  // Mouse wheel zoom
  const handleWheel = (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -10 : 10;
      setZoom(prev => Math.max(50, Math.min(300, prev + delta)));
    }
  };

  const getPageIcon = (page, className = "h-4 w-4 shrink-0") => {
    if (!page) return <Globe className={className} />;
    const isExt = page.is_external || (typeof page.url === 'string' && (page.url.startsWith('http://') || page.url.startsWith('https://')));
    if (page.icon) {
      return renderAppIcon(page.icon, {
        className: `${className} ${isExt ? 'text-primary-500' : ''}`,
        defaultIcon: isExt ? ExternalLink : Globe
      });
    }
    if (isExt) {
      return <ExternalLink className={`${className} text-primary-500`} />;
    }
    return renderAppIcon(page.name, { className, defaultIcon: Globe });
  };

  const formatUrl = (url) => {
    if (!url) return '#';
    
    // If it's an external URL, return as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // For internal pages, use current origin dynamically
    if (url.startsWith('/')) {
      return `${window.location.origin}${url}`;
    }
    
    return url;
  };

  if (!isOpen) return null;

  const modalSize = isFullscreen 
    ? 'fixed inset-0' 
    : 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';

  const contentSize = isFullscreen
    ? 'w-full h-full'
    : 'w-full max-w-6xl h-5/6';

  return (
    <div className={modalSize}>
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl ${contentSize} flex flex-col overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center space-x-3">
            <Monitor className="h-5 w-5 text-primary-600" />
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Assigned Pages
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {user?.username} - {pages.length} page{pages.length !== 1 ? 's' : ''} assigned
              </p>
            </div>
          </div>

          {/* Zoom and control buttons */}
          {selectedPage && (
            <div className="flex items-center space-x-2">
              {/* Zoom controls */}
              <div className="flex items-center space-x-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 px-2 py-1">
                <button
                  onClick={handleZoomOut}
                  disabled={zoom <= 50}
                  className="p-1 rounded text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Zoom out (Ctrl + -)"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                
                <input
                  type="range"
                  min="50"
                  max="300"
                  step="10"
                  value={zoom}
                  onChange={handleZoomChange}
                  className="w-20 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-600"
                  title={`Zoom: ${zoom}%`}
                />
                
                <button
                  onClick={handleZoomIn}
                  disabled={zoom >= 300}
                  className="p-1 rounded text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Zoom in (Ctrl + +)"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                
                <span className="text-xs font-mono text-gray-600 dark:text-gray-400 min-w-[3rem] text-center">
                  {zoom}%
                </span>
              </div>

              {/* Action buttons */}
              <button
                onClick={handleResetZoom}
                className="p-2 rounded-lg text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                title="Reset zoom and position (Ctrl + 0)"
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              <button
                onClick={togglePanMode}
                className={`p-2 rounded-lg transition-colors ${
                  isPanning 
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' 
                    : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
                title="Toggle pan mode"
              >
                {isPanning ? <Move3D className="h-4 w-4" /> : <MousePointer className="h-4 w-4" />}
              </button>

              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-lg text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                title="Toggle fullscreen (F)"
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </button>
            </div>
          )}

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : pages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Pages Assigned
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                This user doesn't have access to any pages yet.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* Pages Sidebar */}
            <div className="w-72 bg-gray-50 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600 flex flex-col overflow-hidden">
              <div className="p-3 border-b border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Available Pages
                  </h4>
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                    {pages.length}
                  </span>
                </div>

                {/* Search Box */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search menu, route..."
                    className="w-full pl-8 pr-7 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 text-gray-900 dark:text-white placeholder-gray-400 shadow-xs"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {(() => {
                  const filterTree = (nodes) => {
                    if (!searchTerm.trim()) return nodes;
                    const term = searchTerm.trim().toLowerCase();
                    const result = [];

                    for (const node of nodes) {
                      const matchesSelf =
                        (node.name && node.name.toLowerCase().includes(term)) ||
                        (node.url && node.url.toLowerCase().includes(term)) ||
                        (node.badge_label && node.badge_label.toLowerCase().includes(term)) ||
                        (node.type && node.type.toLowerCase().includes(term));

                      const filteredChildren =
                        node.children && node.children.length > 0 ? filterTree(node.children) : [];

                      if (matchesSelf || filteredChildren.length > 0) {
                        result.push({
                          ...node,
                          children: filteredChildren,
                        });
                      }
                    }
                    return result;
                  };

                  const displayedPages = filterTree(pages);

                  if (displayedPages.length === 0) {
                    return (
                      <div className="text-center py-8 text-xs text-gray-500 dark:text-gray-400">
                        No pages match "{searchTerm}"
                      </div>
                    );
                  }

                  const renderPageTree = (pageList, level = 1) => {
                    return pageList.map((item) => {
                      const isSelected = selectedPage?.id === item.id;
                      const hasChildren = Array.isArray(item.children) && item.children.length > 0;
                      const isLvl1 = level === 1;

                      return (
                        <div key={item.id}>
                          <button
                            onClick={() => handlePageSelect(item)}
                            className={`w-full text-left rounded-lg transition-colors duration-150 ${
                              isLvl1 ? 'p-2.5' : 'p-2'
                            } ${
                              isSelected
                                ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                                : 'hover:bg-white dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              {!isLvl1 && <span className="text-gray-400">↳</span>}
                              {getPageIcon(item)}
                              <span className={`${isLvl1 ? 'text-xs font-semibold' : 'text-xs font-medium'} truncate`}>
                                {item.name}
                              </span>
                            </div>
                            {item.url && (
                              <div className={`text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate ${!isLvl1 ? 'ml-6' : 'ml-6'}`}>
                                {item.url}
                              </div>
                            )}
                          </button>

                          {hasChildren && (
                            <div className="ml-3 mt-1 space-y-1 border-l-2 border-gray-300 dark:border-gray-600 pl-2">
                              {renderPageTree(item.children, level + 1)}
                            </div>
                          )}
                        </div>
                      );
                    });
                  };

                  return renderPageTree(displayedPages);
                })()}
              </div>
            </div>

            {/* Iframe Content */}
            <div className="flex-1 flex flex-col">
              {selectedPage ? (
                <>
                  {/* Page Header */}
                  <div className="p-4 border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getPageIcon(selectedPage)}
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {selectedPage.name}
                        </h4>
                      </div>
                      {selectedPage.url && (
                        <a
                          href={formatUrl(selectedPage.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center space-x-1"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>Open in new tab</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Iframe with zoom and pan */}
                  <div 
                    ref={containerRef}
                    className={`flex-1 overflow-hidden bg-gray-100 dark:bg-gray-900 relative ${
                      isPanning ? 'cursor-move' : 'cursor-default'
                    }`}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={handleWheel}
                    style={{ 
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none'
                    }}
                  >
                    {iframeError ? (
                      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-700">
                        <div className="text-center">
                          <ExternalLink className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            Cannot Load Page
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 mb-4">
                            This page cannot be displayed in an iframe.
                          </p>
                          <a
                            href={formatUrl(selectedPage.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-150"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open in new tab
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{
                          transform: `translate(${position.x}px, ${position.y}px)`,
                        }}
                      >
                        <iframe
                          ref={iframeRef}
                          src={formatUrl(selectedPage.url)}
                          title={selectedPage.name}
                          className="border border-gray-300 dark:border-gray-600 shadow-lg"
                          style={{
                            width: '100%',
                            height: '100%',
                            minWidth: '320px',
                            minHeight: '240px',
                            maxWidth: '1200px',
                            maxHeight: '800px',
                            transform: `scale(${zoom / 100})`,
                            transformOrigin: 'center center',
                            transition: 'transform 0.2s ease-out',
                            pointerEvents: isPanning ? 'none' : 'auto',
                          }}
                          onError={handleIframeError}
                          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                        />
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-700">
                  <div className="text-center">
                    <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Select a Page
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Choose a page from the sidebar to view it here.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer with instructions */}
        {selectedPage && !loading && pages.length > 0 && (
          <div className="p-2 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-4">
                <span>Ctrl + Mouse wheel: Zoom</span>
                <span>Ctrl + 0: Reset</span>
                <span>F: Fullscreen</span>
                <span>Pan mode: Click and drag to move</span>
              </div>
              <div className="flex items-center space-x-2">
                {isPanning && (
                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                    Pan mode active
                  </span>
                )}
                <span>Zoom: {zoom}%</span>
                <span className="text-gray-500">•</span>
                <span>Range: 50%-300%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPagesModal;