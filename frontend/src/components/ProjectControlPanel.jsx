import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Activity,
  Play,
  Square,
  RotateCcw,
  RefreshCw,
  Server,
  Database,
  Cpu,
  HardDrive,
  Clock,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Layers,
  Wrench,
  Sparkles,
  Info,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiService, endpoints } from '../utils/api';
import LoadingSpinner from './LoadingSpinner';

export const ProjectControlPanel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(15); // seconds
  const [confirmModal, setConfirmModal] = useState({ open: false, action: null, title: '', message: '', confirmText: '', isDanger: false });
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  
  const timerRef = useRef(null);

  // Fetch live telemetry status
  const fetchStatus = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const response = await apiService.get(endpoints.control.status);
      if (response.data?.success) {
        setData(response.data.data);
        setLastRefreshed(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch project control status:', error);
      if (!isSilent) {
        toast.error(error.response?.data?.message || 'Failed to fetch project status');
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  // Execute control actions (start, stop, restart)
  const handleExecuteAction = async (action) => {
    setActionLoading(true);
    setCurrentAction(action);

    const toastId = toast.loading(`Executing ${action.toUpperCase()} command...`, {
      style: { background: '#1f2937', color: '#f3f4f6' }
    });

    try {
      const response = await apiService.post(endpoints.control.action, { action });
      if (response.data?.success) {
        toast.success(response.data.message || `Action ${action.toUpperCase()} completed successfully!`, {
          id: toastId,
          duration: 4000
        });
        // Immediate refresh and another after short delay to let PM2 settle
        await fetchStatus(true);
        setTimeout(() => {
          fetchStatus(true);
        }, 2000);
      } else {
        toast.error(response.data?.message || `Failed to execute ${action}`, { id: toastId });
      }
    } catch (error) {
      console.error(`Action ${action} execution error:`, error);
      toast.error(error.response?.data?.message || `Failed to execute action ${action}`, { id: toastId });
    } finally {
      setActionLoading(false);
      setCurrentAction(null);
      setConfirmModal({ open: false, action: null, title: '', message: '', confirmText: '', isDanger: false });
    }
  };

  // Open confirmation modal for sensitive actions (Stop / Restart)
  const requestAction = (action) => {
    if (action === 'stop') {
      setConfirmModal({
        open: true,
        action: 'stop',
        title: 'Stop Application Services?',
        message: 'This will intentionally stop the PM2 application and enable MAINTENANCE MODE. The automated health-check task will be paused so services stay stopped until you manually start them.',
        confirmText: 'Yes, Stop Services',
        isDanger: true
      });
    } else if (action === 'restart') {
      setConfirmModal({
        open: true,
        action: 'restart',
        title: 'Restart Application Services?',
        message: 'This will safely restart all PM2 application processes (Backend & Frontend) and refresh the environment variables. Ongoing user requests may experience a momentary blip.',
        confirmText: 'Yes, Restart Services',
        isDanger: false
      });
    } else {
      // Direct start
      handleExecuteAction('start');
    }
  };

  // Auto-refresh interval
  useEffect(() => {
    fetchStatus();

    if (autoRefresh) {
      timerRef.current = setInterval(() => {
        fetchStatus(true);
      }, refreshInterval * 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchStatus, autoRefresh, refreshInterval]);

  const summary = data?.summary || {};
  const pm2Data = data?.pm2 || {};
  const database = data?.database || {};
  const windows = data?.windows || {};
  const system = data?.system || {};

  // Status badges & color helpers
  const getHealthBadge = (health) => {
    switch (health) {
      case 'HEALTHY':
        return { bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-500', label: 'HEALTHY' };
      case 'WARNING':
        return { bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30', dot: 'bg-amber-500', label: 'WARNING' };
      case 'UNHEALTHY':
      case 'ERROR':
        return { bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30', dot: 'bg-rose-500', label: 'UNHEALTHY' };
      case 'MAINTENANCE':
        return { bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30', dot: 'bg-amber-500', label: 'MAINTENANCE' };
      default:
        return { bg: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30', dot: 'bg-gray-400', label: health || 'UNKNOWN' };
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'ONLINE':
      case 'CONNECTED':
        return { bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800', dot: 'bg-emerald-500', label: status };
      case 'MAINTENANCE':
        return { bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800', dot: 'bg-amber-500', label: 'MAINTENANCE' };
      case 'DEGRADED':
        return { bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800', dot: 'bg-amber-500', label: 'DEGRADED' };
      case 'OFFLINE':
      case 'STOPPED':
      case 'DISCONNECTED':
      case 'ERROR':
        return { bg: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-300 dark:border-rose-800', dot: 'bg-rose-500', label: status };
      default:
        return { bg: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-300 dark:border-gray-700', dot: 'bg-gray-400', label: status || 'UNKNOWN' };
    }
  };

  const healthBadge = getHealthBadge(summary.systemHealth);
  const appBadge = getStatusBadge(summary.appStatus);
  const dbBadge = getStatusBadge(summary.dbStatus);
  const pm2Badge = getStatusBadge(summary.pm2Status);

  return (
    <div className="space-y-6">
      {/* ============================================================== */}
      {/* HEADER WITH LIVE STATUS, REFRESH & QUICK ACTIONS              */}
      {/* ============================================================== */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700/80 p-5 sm:p-7 relative overflow-hidden">
        {/* Subtle decorative gradient glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-500/10 via-sky-500/5 to-transparent rounded-full pointer-events-none blur-3xl" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                    Project Status & Control Panel
                  </h2>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
                    <Sparkles className="w-3 h-3" /> Super Admin Only
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Live infrastructure telemetry, PM2 daemon supervisor, and one-click operational controls.
                </p>
              </div>
            </div>
          </div>

          {/* Controls Bar: Start, Stop, Restart, Refresh */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* START */}
            <button
              id="control-start-btn"
              onClick={() => requestAction('start')}
              disabled={actionLoading || summary.appStatus === 'ONLINE'}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all duration-200 ${
                summary.appStatus === 'ONLINE'
                  ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed border border-gray-200 dark:border-gray-700'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 hover:shadow-lg active:scale-95 disabled:opacity-50'
              }`}
              title="Start all PM2 processes and clear maintenance mode"
            >
              <Play className={`w-4 h-4 ${currentAction === 'start' ? 'animate-spin' : ''}`} />
              <span>START</span>
            </button>

            {/* STOP */}
            <button
              id="control-stop-btn"
              onClick={() => requestAction('stop')}
              disabled={actionLoading || summary.appStatus === 'OFFLINE' || summary.appStatus === 'MAINTENANCE'}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all duration-200 ${
                summary.appStatus === 'OFFLINE' || summary.appStatus === 'MAINTENANCE'
                  ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed border border-gray-200 dark:border-gray-700'
                  : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20 hover:shadow-lg active:scale-95 disabled:opacity-50'
              }`}
              title="Stop all PM2 processes and activate maintenance mode"
            >
              <Square className={`w-4 h-4 ${currentAction === 'stop' ? 'animate-spin' : ''}`} />
              <span>STOP</span>
            </button>

            {/* RESTART */}
            <button
              id="control-restart-btn"
              onClick={() => requestAction('restart')}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-amber-600 hover:bg-amber-700 text-white shadow-sm shadow-amber-500/20 hover:shadow-lg active:scale-95 disabled:opacity-50 transition-all duration-200"
              title="Safely restart all PM2 processes"
            >
              <RotateCcw className={`w-4 h-4 ${currentAction === 'restart' ? 'animate-spin' : ''}`} />
              <span>RESTART</span>
            </button>

            {/* REFRESH STATUS */}
            <button
              id="control-refresh-btn"
              onClick={() => fetchStatus(false)}
              disabled={loading || actionLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 active:scale-95 disabled:opacity-50 transition-all duration-200"
              title="Refresh telemetry status immediately"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-500' : ''}`} />
              <span className="hidden sm:inline">REFRESH</span>
            </button>
          </div>
        </div>

        {/* Live Auto-Refresh Bar & Last Polled */}
        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700/60 flex flex-wrap items-center justify-between text-xs text-gray-500 dark:text-gray-400 gap-3">
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
              />
              <span className="font-semibold text-gray-700 dark:text-gray-300">Live Telemetry Auto-Refresh</span>
            </label>
            {autoRefresh && (
              <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 rounded-full text-blue-700 dark:text-blue-300 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                <span>Every {refreshInterval}s</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {summary.isMaintenanceMode && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                <AlertTriangle className="w-3.5 h-3.5" /> Maintenance Mode Active (Health-Check Paused)
              </span>
            )}
            <span>Last polled: <strong className="text-gray-700 dark:text-gray-300">{lastRefreshed.toLocaleTimeString()}</strong></span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 7 EXECUTIVE SUMMARY STATUS CARDS (Requested Spec)              */}
      {/* ============================================================== */}
      {loading && !data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-center h-28">
              <LoadingSpinner size="sm" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
          {/* Card 1: System Health */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700/80 shadow-md hover:shadow-lg transition-all duration-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">System Health</span>
              <Activity className={`w-4 h-4 ${summary.systemHealth === 'HEALTHY' ? 'text-emerald-500' : summary.systemHealth === 'WARNING' ? 'text-amber-500' : 'text-rose-500'}`} />
            </div>
            <div className="mt-2">
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black border ${healthBadge.bg}`}>
                <span className={`w-2 h-2 rounded-full ${healthBadge.dot} ${summary.systemHealth === 'HEALTHY' ? 'animate-pulse' : ''}`} />
                {summary.systemHealth || 'UNKNOWN'}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">v{summary.version || '1.0.0'}</p>
            </div>
          </div>

          {/* Card 2: Application */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700/80 shadow-md hover:shadow-lg transition-all duration-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Application</span>
              <Server className={`w-4 h-4 ${summary.appStatus === 'ONLINE' ? 'text-emerald-500' : summary.appStatus === 'MAINTENANCE' ? 'text-amber-500' : 'text-rose-500'}`} />
            </div>
            <div className="mt-2">
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black border ${appBadge.bg}`}>
                <span className={`w-2 h-2 rounded-full ${appBadge.dot} ${summary.appStatus === 'ONLINE' ? 'animate-pulse' : ''}`} />
                {summary.appStatus || 'UNKNOWN'}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">{summary.appStatus === 'MAINTENANCE' ? 'Maintenance active' : 'Express + Vite'}</p>
            </div>
          </div>

          {/* Card 3: Database */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700/80 shadow-md hover:shadow-lg transition-all duration-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Database</span>
              <Database className={`w-4 h-4 ${database.connected ? 'text-emerald-500' : 'text-rose-500'}`} />
            </div>
            <div className="mt-2">
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black border ${dbBadge.bg}`}>
                <span className={`w-2 h-2 rounded-full ${dbBadge.dot} ${database.connected ? 'animate-pulse' : ''}`} />
                {summary.dbStatus || 'UNKNOWN'}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">{database.connected ? `${database.latencyMs || 1}ms latency` : 'Check MySQL'}</p>
            </div>
          </div>

          {/* Card 4: PM2 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700/80 shadow-md hover:shadow-lg transition-all duration-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">PM2 Daemon</span>
              <Layers className={`w-4 h-4 ${summary.pm2Status === 'ONLINE' ? 'text-emerald-500' : summary.pm2Status === 'DEGRADED' ? 'text-amber-500' : 'text-rose-500'}`} />
            </div>
            <div className="mt-2">
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black border ${pm2Badge.bg}`}>
                <span className={`w-2 h-2 rounded-full ${pm2Badge.dot}`} />
                {summary.pm2Status || 'STOPPED'}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">{pm2Data.processes?.length || 0} process(es) tracked</p>
            </div>
          </div>

          {/* Card 5: CPU */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700/80 shadow-md hover:shadow-lg transition-all duration-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">CPU Usage</span>
              <Cpu className={`w-4 h-4 ${summary.cpuUsagePercent > 80 ? 'text-rose-500' : summary.cpuUsagePercent > 50 ? 'text-amber-500' : 'text-sky-500'}`} />
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-gray-900 dark:text-white">{summary.cpuUsagePercent ?? 0}</span>
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    summary.cpuUsagePercent > 80 ? 'bg-rose-500' : summary.cpuUsagePercent > 50 ? 'bg-amber-500' : 'bg-sky-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, summary.cpuUsagePercent || 0))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 6: Memory */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700/80 shadow-md hover:shadow-lg transition-all duration-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Memory</span>
              <HardDrive className={`w-4 h-4 ${summary.memoryPercent > 85 ? 'text-rose-500' : summary.memoryPercent > 70 ? 'text-amber-500' : 'text-indigo-500'}`} />
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-gray-900 dark:text-white">{summary.memoryUsedMB ?? 0}</span>
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">MB</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    summary.memoryPercent > 85 ? 'bg-rose-500' : summary.memoryPercent > 70 ? 'bg-amber-500' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, summary.memoryPercent || 0))}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">{summary.memoryPercent || 0}% of {Math.round((summary.memoryTotalMB || 0) / 1024)}GB</p>
            </div>
          </div>

          {/* Card 7: Server Uptime */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700/80 shadow-md hover:shadow-lg transition-all duration-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Host Uptime</span>
              <Clock className="w-4 h-4 text-purple-500" />
            </div>
            <div className="mt-2">
              <div className="text-xl font-extrabold text-gray-900 dark:text-white truncate">
                {summary.serverUptimeFormatted || '0s'}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">PM2: {pm2Data.uptimeFormatted || '0s'}</p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* DETAILED PM2 PROCESSES & WINDOWS SERVICES TELEMETRY            */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: PM2 Managed Process Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700/80 p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">PM2 Monitored Process Instances</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Real-time status for backend API & frontend UI processes</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                Restarts: {pm2Data.totalRestarts || 0}
              </span>
            </div>

            {pm2Data.processes && pm2Data.processes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pm2Data.processes.map((proc, idx) => {
                  const isOnline = proc.status === 'online';
                  return (
                    <div
                      key={proc.name || idx}
                      className={`p-4 rounded-xl border transition-all duration-200 ${
                        isOnline
                          ? 'bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-gray-800/60 border-emerald-200 dark:border-emerald-800/50'
                          : 'bg-gradient-to-br from-rose-50/50 to-white dark:from-rose-950/20 dark:to-gray-800/60 border-rose-200 dark:border-rose-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                          <h4 className="font-bold text-sm text-gray-900 dark:text-white">{proc.name}</h4>
                        </div>
                        <span className={`text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${getStatusBadge(proc.status).bg}`}>
                          {proc.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 text-xs">
                        <div className="bg-white/80 dark:bg-gray-800/80 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                          <span className="text-gray-400 block text-[10px] uppercase font-bold">PID / PM_ID</span>
                          <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{proc.pid || 'N/A'} (ID: {proc.pm_id ?? 'N/A'})</span>
                        </div>
                        <div className="bg-white/80 dark:bg-gray-800/80 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                          <span className="text-gray-400 block text-[10px] uppercase font-bold">CPU Usage</span>
                          <span className="font-semibold text-gray-800 dark:text-gray-200">{proc.cpu || 0}%</span>
                        </div>
                        <div className="bg-white/80 dark:bg-gray-800/80 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                          <span className="text-gray-400 block text-[10px] uppercase font-bold">Memory</span>
                          <span className="font-semibold text-gray-800 dark:text-gray-200">{proc.memoryMB || 0} MB</span>
                        </div>
                        <div className="bg-white/80 dark:bg-gray-800/80 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                          <span className="text-gray-400 block text-[10px] uppercase font-bold">Uptime</span>
                          <span className="font-semibold text-gray-800 dark:text-gray-200">{proc.uptimeFormatted || '0s'}</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                        <span>Restarts: <strong className="text-gray-700 dark:text-gray-300">{proc.restartCount || 0}</strong></span>
                        <span className="truncate max-w-[150px]">Last: {proc.lastRestartTime || 'N/A'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
                <AlertTriangle className="w-8 h-8 mx-auto text-amber-500 mb-2" />
                <p className="font-bold text-sm text-gray-800 dark:text-gray-200">No active PM2 processes detected</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Click the <strong className="text-emerald-600">START</strong> button above to launch applications through PM2.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Windows Task Scheduler & Service Health */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700/80 p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">Windows Service Automation</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Scheduled task triggers & self-healing health checks</p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Auto-start Task */}
                <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600/60">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" /> Auto-Start on Boot
                    </span>
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      windows.autoStart?.configured
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {windows.autoStart?.configured ? 'Active' : 'Unregistered'}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Task: <code className="font-mono text-gray-700 dark:text-gray-300">Aplos_Logix-PM2-Startup</code> (90s boot delay)
                  </p>
                </div>

                {/* Health Check Task */}
                <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600/60">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 text-purple-500" /> Watchdog Health-Check
                    </span>
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      windows.healthCheck?.configured
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {windows.healthCheck?.configured ? 'Every 3 min' : 'Unregistered'}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Task: <code className="font-mono text-gray-700 dark:text-gray-300">Aplos_Logix-PM2-HealthCheck</code>
                  </p>
                  {windows.lastHealthCheckTime && (
                    <p className="text-[10px] text-gray-400 mt-1">
                      Last watchdog check: {windows.lastHealthCheckTime}
                    </p>
                  )}
                </div>

                {/* Database Endpoint Telemetry */}
                <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600/60">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-emerald-500" /> Database Cluster
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      MySQL 8.x
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                    <span>Host: <strong className="text-gray-700 dark:text-gray-300">{database.host || '127.0.0.1'}</strong></span>
                    <span>Database: <strong className="text-gray-700 dark:text-gray-300">{database.database || 'aplos_logix'}</strong></span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 text-[11px] text-gray-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 flex-shrink-0 text-blue-500" />
              <span>Node.js: {system.nodeVersion || 'v22'} • OS: {system.platform || 'win32'} ({system.arch || 'x64'})</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* CONFIRMATION MODAL                                             */}
      {/* ============================================================== */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700 transform transition-all animate-scaleUp">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                confirmModal.isDanger
                  ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                  : 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
              }`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white">
                  {confirmModal.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Super Admin Authorization Confirmation</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
              {confirmModal.message}
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmModal({ open: false, action: null, title: '', message: '', confirmText: '', isDanger: false })}
                disabled={actionLoading}
                className="px-4 py-2.5 rounded-xl font-bold text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleExecuteAction(confirmModal.action)}
                disabled={actionLoading}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-lg active:scale-95 transition-all flex items-center gap-2 ${
                  confirmModal.isDanger
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                    : 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20'
                }`}
              >
                {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                <span>{confirmModal.confirmText}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectControlPanel;
