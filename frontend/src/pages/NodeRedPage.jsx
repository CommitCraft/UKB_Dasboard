import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ExternalLink,
  RotateCcw,
  Maximize,
  Minimize,
  AlertTriangle,
  Server,
  Network,
  Info,
  RefreshCw
} from 'lucide-react';
import { renderAppIcon } from '../utils/iconMap';

const NodeRedPage = () => {
  // Read host, port and protocol strictly from Vite frontend environment variables
  const nodeRedHost = import.meta.env.VITE_NODE_RED_HOST || '';
  const nodeRedPort = import.meta.env.VITE_NODE_RED_PORT || '';
  const nodeRedProtocol = import.meta.env.VITE_NODE_RED_PROTOCOL || 'http';
  const nodeRedPath = import.meta.env.VITE_NODE_RED_PATH || '';

  // Build target Node-RED URL dynamically from environment variables (Zero hardcoding)
  const nodeRedUrl = useMemo(() => {
    if (!nodeRedHost) return '';
    const portPart = nodeRedPort ? `:${nodeRedPort}` : '';
    const cleanPath = nodeRedPath ? (nodeRedPath.startsWith('/') ? nodeRedPath : `/${nodeRedPath}`) : '';
    return `${nodeRedProtocol}://${nodeRedHost}${portPart}${cleanPath}`;
  }, [nodeRedHost, nodeRedPort, nodeRedProtocol, nodeRedPath]);

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(Date.now());
  const iframeRef = useRef(null);

  // Set timeout safety in case iframe load event is blocked by cross-origin
  useEffect(() => {
    if (!nodeRedUrl) {
      setIsLoading(false);
      setHasError(true);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    const timer = setTimeout(() => {
      // If still in loading state after 8 seconds, clear loading overlay so user can see iframe
      setIsLoading(false);
    }, 8000);

    return () => clearTimeout(timer);
  }, [iframeKey, nodeRedUrl]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setHasError(false);
    setIframeKey(Date.now());
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  return (
    <div
      className={`flex flex-col transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900 p-3'
          : 'h-[calc(100vh-5rem)] flex-1 overflow-hidden'
      }`}
    >
      {/* Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs mb-3">
        {/* Left Title & Status */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-700 text-white shadow-xs">
            {renderAppIcon('Workflow', { className: 'h-5 w-5' })}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-gray-900 dark:text-white truncate">
                Flow Editor
              </h1>
              {nodeRedUrl ? (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Configured
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Not Configured
                </span>
              )}
            </div>
            {/* <p className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">
              {nodeRedUrl || 'VITE_NODE_RED_HOST is missing in .env'}
            </p> */}
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleRefresh}
            title="Reload Node-RED Iframe"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {nodeRedUrl && (
            <a
              href={nodeRedUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open Node-RED directly in new tab"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#00629F] hover:bg-[#004f80] transition-colors cursor-pointer shadow-xs"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Open Direct</span>
            </a>
          )}

          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen View'}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Main Iframe Canvas Container */}
      <div className="relative flex-1 bg-gray-100 dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-inner flex flex-col">
        {/* Missing Config View */}
        {!nodeRedUrl ? (
          <div className="flex-1 flex items-center justify-center p-6 text-center">
            <div className="max-w-md p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Node-RED Environment Variables Missing
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1.5 leading-relaxed">
                  Please specify <code className="bg-gray-100 dark:bg-gray-900 px-1.5 py-0.5 rounded font-mono text-[11px]">VITE_NODE_RED_HOST</code> and <code className="bg-gray-100 dark:bg-gray-900 px-1.5 py-0.5 rounded font-mono text-[11px]">VITE_NODE_RED_PORT</code> in your frontend <code className="font-mono text-indigo-500">.env</code> file.
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl text-left font-mono text-[11px] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                <p className="text-gray-400 font-sans text-[10px] mb-1 font-semibold">Example .env entries:</p>
                <p>VITE_NODE_RED_HOST=192.168.1.99</p>
                <p>VITE_NODE_RED_PORT=1881</p>
              </div>
              <p className="text-[11px] text-gray-400">
                After saving <code className="font-mono">.env</code>, rebuild frontend (<code className="font-mono">npm run build</code>) and restart PM2.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-xs transition-opacity">
                <div className="relative flex items-center justify-center">
                  <div className="h-12 w-12 rounded-full border-3 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 animate-spin"></div>
                  <div className="absolute">
                    {renderAppIcon('Workflow', { className: 'h-5 w-5 text-indigo-600' })}
                  </div>
                </div>
                <p className="mt-3 text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Connecting to Node-RED ({nodeRedHost}:{nodeRedPort})...
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Loading dashboard flows and workspace
                </p>
              </div>
            )}

            {/* Error State Fallback Banner */}
            {hasError && (
              <div className="absolute inset-0 z-20 flex items-center justify-center p-6 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xs">
                <div className="max-w-lg p-6 bg-white dark:bg-gray-800 rounded-2xl border border-red-200 dark:border-red-800 shadow-2xl space-y-4 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      Unable to Connect to Node-RED
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1.5 leading-relaxed">
                      Could not establish connection to <code className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{nodeRedUrl}</code>.
                    </p>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl text-left text-xs text-gray-600 dark:text-gray-300 space-y-1 border border-gray-200 dark:border-gray-700">
                    <p className="font-semibold text-gray-900 dark:text-white text-[11px]">Troubleshooting checklist:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                      <li>Ensure Node-RED service is running at IP <span className="font-mono text-gray-800 dark:text-gray-200">{nodeRedHost}</span> port <span className="font-mono text-gray-800 dark:text-gray-200">{nodeRedPort}</span>.</li>
                      <li>Confirm that port <span className="font-mono text-gray-800 dark:text-gray-200">{nodeRedPort}</span> is open in Windows/Linux Firewall.</li>
                      <li>If Node-RED restricts iframe embedding, verify <code className="font-mono">httpNodeCors</code> or X-Frame-Options in <code className="font-mono">settings.js</code>.</li>
                    </ul>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleRefresh}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
                    >
                      Retry Connection
                    </button>
                    <a
                      href={nodeRedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1.5"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open in New Window
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Embedded Iframe */}
            <iframe
              key={iframeKey}
              ref={iframeRef}
              src={nodeRedUrl}
              title="Node-RED Workspace"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              className="w-full h-full border-0 rounded-2xl"
              allow="fullscreen; clipboard-read; clipboard-write;"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"
            />
          </>
        )}
      </div>
    </div>
  );
};

export default NodeRedPage;
