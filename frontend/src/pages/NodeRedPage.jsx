import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ExternalLink,
  RotateCcw,
  Maximize,
  Minimize,
  AlertTriangle,
  Server,
  Network,
  Sliders,
  Check,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  History,
  Trash2
} from 'lucide-react';
import { renderAppIcon } from '../utils/iconMap';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'nodered_connection_config';
const RECENT_KEY = 'nodered_recent_connections';

const NodeRedPage = () => {
  // Environment defaults (if available)
  const envHost = import.meta.env.VITE_NODE_RED_HOST || '';
  const envPort = import.meta.env.VITE_NODE_RED_PORT || '';
  const envProtocol = import.meta.env.VITE_NODE_RED_PROTOCOL || 'http';
  const envPath = import.meta.env.VITE_NODE_RED_PATH || '';

  // State for connection configuration
  const [config, setConfig] = useState({
    host: '',
    port: '',
    protocol: 'http',
    path: ''
  });

  const [formInput, setFormInput] = useState({
    host: '',
    port: '',
    protocol: 'http',
    path: ''
  });

  const [isConnected, setIsConnected] = useState(false);
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [recentConnections, setRecentConnections] = useState([]);
  const [formErrors, setFormErrors] = useState({});

  // Iframe states
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(Date.now());
  const iframeRef = useRef(null);

  // Load saved connection settings on component mount
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem(STORAGE_KEY);
      const savedRecents = localStorage.getItem(RECENT_KEY);

      if (savedRecents) {
        setRecentConnections(JSON.parse(savedRecents) || []);
      }

      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        if (parsed && parsed.host) {
          setConfig(parsed);
          setFormInput(parsed);
          setIsConnected(true);
          return;
        }
      }

      // If no localStorage, fallback to env variables if defined
      if (envHost) {
        const initialConfig = {
          host: envHost,
          port: envPort || '1881',
          protocol: envProtocol || 'http',
          path: envPath || ''
        };
        setConfig(initialConfig);
        setFormInput(initialConfig);
        setIsConnected(true);
      } else {
        // Default initial form input values for convenience
        setFormInput({
          host: '',
          port: '1881',
          protocol: 'http',
          path: ''
        });
        setIsConnected(false);
      }
    } catch (e) {
      console.error('Failed to parse saved Node-RED config:', e);
    }
  }, [envHost, envPort, envProtocol, envPath]);

  // Construct active URL
  const activeUrl = useMemo(() => {
    if (!config.host) return '';
    const cleanHost = config.host.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
    const portPart = config.port ? `:${config.port.toString().trim()}` : '';
    const cleanPath = config.path ? (config.path.startsWith('/') ? config.path : `/${config.path}`) : '';
    return `${config.protocol || 'http'}://${cleanHost}${portPart}${cleanPath}`;
  }, [config]);

  // Validate form fields
  const validateForm = () => {
    const errors = {};
    const hostTrimmed = formInput.host.trim();
    const portTrimmed = formInput.port.toString().trim();

    if (!hostTrimmed) {
      errors.host = 'IP Address or Hostname is required';
    } else {
      // Remove any accidental protocol prefix if user typed http://...
      const cleanHost = hostTrimmed.replace(/^https?:\/\//, '');
      if (!cleanHost) {
        errors.host = 'Please enter a valid IP address (e.g. 192.168.1.99) or hostname';
      }
    }

    if (portTrimmed) {
      const portNum = parseInt(portTrimmed, 10);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        errors.port = 'Port must be a valid number between 1 and 65535';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Connect and save settings to localStorage
  const handleConnect = (e) => {
    if (e) e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const cleanHost = formInput.host.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
    const cleanPort = formInput.port.toString().trim();
    const cleanProtocol = formInput.protocol || 'http';
    const cleanPath = formInput.path ? formInput.path.trim() : '';

    const newConfig = {
      host: cleanHost,
      port: cleanPort,
      protocol: cleanProtocol,
      path: cleanPath
    };

    // Save active configuration
    setConfig(newConfig);
    setIsConnected(true);
    setIsEditingConfig(false);
    setIsLoading(true);
    setHasError(false);
    setIframeKey(Date.now());

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));

      // Update recent connections list
      const updatedRecents = [
        newConfig,
        ...recentConnections.filter(
          (item) => !(item.host === newConfig.host && item.port === newConfig.port && item.protocol === newConfig.protocol)
        )
      ].slice(0, 5);

      setRecentConnections(updatedRecents);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updatedRecents));
      toast.success(`Connecting to Node-RED (${newConfig.protocol}://${cleanHost}:${cleanPort})...`);
    } catch (err) {
      console.error('Failed to save connection config to localStorage:', err);
    }
  };

  // Quick connect from a recent connection badge
  const handleQuickConnect = (item) => {
    setFormInput(item);
    setConfig(item);
    setIsConnected(true);
    setIsEditingConfig(false);
    setIsLoading(true);
    setHasError(false);
    setIframeKey(Date.now());

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(item));
      toast.success(`Connected to ${item.host}:${item.port}`);
    } catch (err) {
      console.error('Storage error:', err);
    }
  };

  // Clear a recent item
  const handleRemoveRecent = (e, index) => {
    e.stopPropagation();
    const updated = recentConnections.filter((_, i) => i !== index);
    setRecentConnections(updated);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Storage error:', err);
    }
  };

  // Reset connection timeout safety
  useEffect(() => {
    if (!activeUrl || !isConnected) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 7000);

    return () => clearTimeout(timer);
  }, [iframeKey, activeUrl, isConnected]);

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
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs mb-3">
        {/* Title & Active Connection Details */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-700 text-white shadow-xs">
            {renderAppIcon('Workflow', { className: 'h-5 w-5' })}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-gray-900 dark:text-white truncate">
                Flow Editor
              </h1>
              {isConnected && activeUrl ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Connection
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Not Connected
                </span>
              )}
            </div>

            {isConnected && activeUrl && (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-mono font-medium text-gray-600 dark:text-gray-300 truncate">
                  {activeUrl}
                </span>
                <span className="text-[10px] text-gray-400 font-sans hidden md:inline">
                  (Saved in local storage)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Change / Edit Connection Settings Button */}
          <button
            type="button"
            onClick={() => {
              setFormInput(config);
              setFormErrors({});
              setIsEditingConfig((prev) => !prev);
            }}
            title="Configure Node-RED IP Address and Port"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              isEditingConfig
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700/80 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>{isEditingConfig ? 'Close Settings' : 'Edit Connection'}</span>
          </button>

          {isConnected && activeUrl && (
            <>
              {/* Refresh Iframe */}
              <button
                type="button"
                onClick={handleRefresh}
                title="Reload Node-RED Workspace"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700/80 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
              >
                <RotateCcw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              {/* Open in New Window */}
              <a
                href={activeUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Open Node-RED in full new tab"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#00629F] hover:bg-[#004f80] transition-colors cursor-pointer shadow-xs"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Open Direct</span>
              </a>

              {/* Fullscreen Toggle */}
              <button
                type="button"
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Canvas'}
                className="p-1.5 rounded-xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Edit / Quick Configuration Drawer / Card */}
      {isEditingConfig && (
        <div className="mb-3 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Network className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Configure Node-RED Target Server
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsEditingConfig(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs font-bold p-1 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleConnect} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              {/* Protocol Select */}
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                  Protocol
                </label>
                <select
                  value={formInput.protocol}
                  onChange={(e) => setFormInput((prev) => ({ ...prev, protocol: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-mono"
                >
                  <option value="http">http:// (Standard)</option>
                  <option value="https">https:// (Secure)</option>
                </select>
              </div>

              {/* IP / Host Input */}
              <div className="sm:col-span-6">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                    IP Address / Hostname <span className="text-red-500">*</span>
                  </label>
                  {/* Quick Helper Badges */}
                  <div className="flex gap-1">
                    {['192.168.1.99', 'localhost', '127.0.0.1'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setFormInput((prev) => ({ ...prev, host: preset }))}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-gray-600 dark:text-gray-300 transition-colors font-mono cursor-pointer"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="text"
                  value={formInput.host}
                  onChange={(e) => {
                    setFormInput((prev) => ({ ...prev, host: e.target.value }));
                    if (formErrors.host) setFormErrors((prev) => ({ ...prev, host: '' }));
                  }}
                  placeholder="e.g. 192.168.1.99 or nodered.local"
                  className={`w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-900 border rounded-xl font-mono text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 ${
                    formErrors.host ? 'border-red-400 dark:border-red-600' : 'border-gray-200 dark:border-gray-700'
                  }`}
                />
                {formErrors.host && (
                  <p className="mt-1 text-[11px] text-red-500 font-medium">{formErrors.host}</p>
                )}
              </div>

              {/* Port Input */}
              <div className="sm:col-span-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                    Port
                  </label>
                  <div className="flex gap-1">
                    {['1881', '1880'].map((presetPort) => (
                      <button
                        key={presetPort}
                        type="button"
                        onClick={() => setFormInput((prev) => ({ ...prev, port: presetPort }))}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-gray-600 dark:text-gray-300 transition-colors font-mono cursor-pointer"
                      >
                        :{presetPort}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="text"
                  value={formInput.port}
                  onChange={(e) => {
                    setFormInput((prev) => ({ ...prev, port: e.target.value }));
                    if (formErrors.port) setFormErrors((prev) => ({ ...prev, port: '' }));
                  }}
                  placeholder="e.g. 1881"
                  className={`w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-900 border rounded-xl font-mono text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 ${
                    formErrors.port ? 'border-red-400 dark:border-red-600' : 'border-gray-200 dark:border-gray-700'
                  }`}
                />
                {formErrors.port && (
                  <p className="mt-1 text-[11px] text-red-500 font-medium">{formErrors.port}</p>
                )}
              </div>
            </div>

            {/* Submit Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>Configuration is saved locally in browser memory and persists across sessions.</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingConfig(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-xs cursor-pointer"
                >
                  <span>Open Node-RED</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Main Canvas Area */}
      <div className="relative flex-1 bg-gray-100 dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-inner flex flex-col">
        {/* Not Connected View (Initial Setup Card) */}
        {!isConnected || !activeUrl ? (
          <div className="flex-1 flex items-center justify-center p-6 text-center">
            <div className="max-w-lg w-full p-6 sm:p-8 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-2xl space-y-6">
              {/* Header Icon */}
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-700 text-white shadow-lg ring-4 ring-rose-100 dark:ring-rose-950/50">
                {renderAppIcon('Workflow', { className: 'h-7 w-7' })}
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Connect Node-RED Flow Editor
                </h2>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1.5 leading-relaxed">
                  Enter the IP Address and Port where your Node-RED service is running to launch the editor inside this dashboard.
                </p>
              </div>

              {/* Connection Form */}
              <form onSubmit={handleConnect} className="space-y-4 text-left">
                <div className="space-y-3">
                  {/* IP Address Field */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        IP Address / Host <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-1">
                        {['192.168.1.99', 'localhost'].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setFormInput((prev) => ({ ...prev, host: preset }))}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-gray-600 dark:text-gray-300 transition-colors font-mono cursor-pointer"
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="text"
                      value={formInput.host}
                      onChange={(e) => {
                        setFormInput((prev) => ({ ...prev, host: e.target.value }));
                        if (formErrors.host) setFormErrors((prev) => ({ ...prev, host: '' }));
                      }}
                      placeholder="e.g. 192.168.1.99"
                      className={`w-full px-3.5 py-2.5 text-xs bg-gray-50 dark:bg-gray-900 border rounded-xl font-mono text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 ${
                        formErrors.host ? 'border-red-400 dark:border-red-600' : 'border-gray-200 dark:border-gray-700'
                      }`}
                    />
                    {formErrors.host && (
                      <p className="mt-1 text-[11px] text-red-500 font-medium">{formErrors.host}</p>
                    )}
                  </div>

                  {/* Port Field */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                          Port Number
                        </label>
                        <button
                          type="button"
                          onClick={() => setFormInput((prev) => ({ ...prev, port: '1881' }))}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 hover:bg-indigo-100 text-gray-600 dark:text-gray-300 font-mono cursor-pointer"
                        >
                          1881
                        </button>
                      </div>
                      <input
                        type="text"
                        value={formInput.port}
                        onChange={(e) => {
                          setFormInput((prev) => ({ ...prev, port: e.target.value }));
                          if (formErrors.port) setFormErrors((prev) => ({ ...prev, port: '' }));
                        }}
                        placeholder="1881"
                        className={`w-full px-3.5 py-2.5 text-xs bg-gray-50 dark:bg-gray-900 border rounded-xl font-mono text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 ${
                          formErrors.port ? 'border-red-400 dark:border-red-600' : 'border-gray-200 dark:border-gray-700'
                        }`}
                      />
                    </div>

                    {/* Protocol Select */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                        Protocol
                      </label>
                      <select
                        value={formInput.protocol}
                        onChange={(e) => setFormInput((prev) => ({ ...prev, protocol: e.target.value }))}
                        className="w-full px-3.5 py-2.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-mono"
                      >
                        <option value="http">http://</option>
                        <option value="https">https://</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 transition-all shadow-md hover:shadow-lg cursor-pointer"
                >
                  <span>Open Node-RED</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              {/* Recent Connections List */}
              {recentConnections.length > 0 && (
                <div className="pt-4 border-t border-gray-100 dark:border-gray-700 text-left">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">
                    <History className="h-3.5 w-3.5" />
                    <span>Recent Connections:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentConnections.map((item, index) => (
                      <div
                        key={`${item.host}-${item.port}-${index}`}
                        onClick={() => handleQuickConnect(item)}
                        className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-600 text-xs font-mono text-gray-700 dark:text-gray-300 transition-all cursor-pointer"
                      >
                        <span>{item.protocol}://{item.host}:{item.port}</span>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveRecent(e, index)}
                          className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Loading Spinner Overlay */}
            {isLoading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/85 dark:bg-gray-900/85 backdrop-blur-xs transition-opacity">
                <div className="relative flex items-center justify-center">
                  <div className="h-14 w-14 rounded-full border-3 border-rose-200 dark:border-rose-900 border-t-red-600 animate-spin"></div>
                  <div className="absolute">
                    {renderAppIcon('Workflow', { className: 'h-6 w-6 text-red-600' })}
                  </div>
                </div>
                <p className="mt-4 text-sm font-bold text-gray-800 dark:text-gray-200 font-mono">
                  Connecting to {activeUrl}...
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Loading Node-RED flows workspace and palettes
                </p>
              </div>
            )}

            {/* Error / Fallback State */}
            {hasError && (
              <div className="absolute inset-0 z-20 flex items-center justify-center p-6 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xs">
                <div className="max-w-lg p-6 sm:p-8 bg-white dark:bg-gray-800 rounded-3xl border border-red-200 dark:border-red-800 shadow-2xl space-y-4 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                    <AlertTriangle className="h-7 w-7" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      Unable to Load Node-RED
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1.5 leading-relaxed">
                      Could not reach <code className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{activeUrl}</code>.
                    </p>
                  </div>

                  <div className="p-3.5 bg-gray-50 dark:bg-gray-900/60 rounded-2xl text-left text-xs text-gray-600 dark:text-gray-300 space-y-1.5 border border-gray-200 dark:border-gray-700">
                    <p className="font-semibold text-gray-900 dark:text-white text-xs">Troubleshooting checklist:</p>
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                      <li>Check if Node-RED service is running at <span className="font-mono text-gray-800 dark:text-gray-200">{config.host}:{config.port}</span>.</li>
                      <li>Confirm that port <span className="font-mono text-gray-800 dark:text-gray-200">{config.port}</span> is open in Windows/Linux Firewall.</li>
                      <li>Ensure both machines are connected to the same local network or VPN.</li>
                    </ul>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleRefresh}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
                    >
                      Retry Connection
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormInput(config);
                        setIsEditingConfig(true);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                    >
                      Change IP / Port
                    </button>
                    <a
                      href={activeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1.5"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open Direct Tab
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Embedded Iframe */}
            <iframe
              key={iframeKey}
              ref={iframeRef}
              src={activeUrl}
              title="Node-RED Flow Editor"
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
