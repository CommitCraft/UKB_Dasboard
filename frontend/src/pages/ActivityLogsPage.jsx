import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, 
  Search, 
  Filter, 
  Calendar, 
  Download, 
  RefreshCw, 
  User, 
  Shield, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Info, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Globe,
  SlidersHorizontal,
  X,
  Copy,
  Monitor,
  Check,
  Terminal,
  Layers,
  ArrowRight,
  Database,
  Key
} from 'lucide-react';
import { apiService, endpoints } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import PageHeader from '../components/PageHeader';
import { formatDate, formatDateTime, formatRelativeTime } from '../utils/helpers';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────
// Helper: Format Exact Time with Seconds & AM/PM
// ─────────────────────────────────────────────────────────────────
const formatFullDateTime = (dateInput) => {
  if (!dateInput) return '—';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    return d.toLocaleString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  } catch {
    return String(dateInput);
  }
};

const formatTimeOnly = (dateInput) => {
  if (!dateInput) return '';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  } catch {
    return '';
  }
};

const formatDateOnly = (dateInput) => {
  if (!dateInput) return '';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return '';
  }
};

// ─────────────────────────────────────────────────────────────────
// Action Badge Helper
// ─────────────────────────────────────────────────────────────────
const getActionBadge = (action) => {
  const act = (action || '').toLowerCase();
  
  if (act.includes('login')) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
        <CheckCircle className="h-3 w-3 mr-1" /> Login
      </span>
    );
  }
  if (act.includes('logout')) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
        <Clock className="h-3 w-3 mr-1" /> Logout
      </span>
    );
  }
  if (act.includes('create') || act.includes('add') || act.includes('insert')) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
        <User className="h-3 w-3 mr-1" /> Create
      </span>
    );
  }
  if (act.includes('update') || act.includes('edit') || act.includes('modify') || act.includes('change')) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
        <SlidersHorizontal className="h-3 w-3 mr-1" /> Update
      </span>
    );
  }
  if (act.includes('delete') || act.includes('remove')) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
        <XCircle className="h-3 w-3 mr-1" /> Delete
      </span>
    );
  }
  if (act.includes('export') || act.includes('download')) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
        <Download className="h-3 w-3 mr-1" /> Export
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
      <Info className="h-3 w-3 mr-1" /> {action || 'Action'}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────
// Generate Human-Readable Description of "What was done"
// ─────────────────────────────────────────────────────────────────
const generateActionNarrative = (log) => {
  if (!log) return '';
  const userStr = log.username || 'A user';
  const action = (log.action || 'performed an action').toLowerCase();
  const resource = log.resource ? log.resource.replace(/_/g, ' ') : '';
  const idStr = log.resource_id ? `(ID #${log.resource_id})` : '';

  if (action.includes('login')) {
    return `${userStr} logged into the dashboard successfully.`;
  }
  if (action.includes('logout')) {
    return `${userStr} logged out of the session.`;
  }
  if (action.includes('create')) {
    return `${userStr} created a new ${resource} ${idStr}.`;
  }
  if (action.includes('update')) {
    return `${userStr} updated details for ${resource} ${idStr}.`;
  }
  if (action.includes('delete')) {
    return `${userStr} deleted ${resource} ${idStr}.`;
  }
  if (action.includes('export')) {
    return `${userStr} exported data for ${resource || 'records'}.`;
  }

  return `${userStr} performed "${log.action}" on ${resource || 'the system'} ${idStr}.`;
};

// ─────────────────────────────────────────────────────────────────
// Main Component: ActivityLogsPage
// ─────────────────────────────────────────────────────────────────
const ActivityLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filtering & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const limit = 10;

  // Selected Log Modal
  const [selectedLog, setSelectedLog] = useState(null);
  const [copiedRaw, setCopiedRaw] = useState(false);

  // Fetch Activity Logs
  const fetchActivityLogs = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const params = {
        page: currentPage,
        limit: 100
      };

      if (actionFilter) params.action = actionFilter;
      if (resourceFilter) params.resource = resourceFilter;

      const response = await apiService.get(endpoints.stats.recentActivity, {
        limit: 100
      });

      let rawLogs = [];
      if (response.data && Array.isArray(response.data.data)) {
        rawLogs = response.data.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data.logs)) {
        rawLogs = response.data.data.logs;
      } else if (response.data && Array.isArray(response.data.logs)) {
        rawLogs = response.data.logs;
      }

      // Apply search & filtering
      let filtered = rawLogs;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(log => 
          (log.username && log.username.toLowerCase().includes(term)) ||
          (log.user_email && log.user_email.toLowerCase().includes(term)) ||
          (log.action && log.action.toLowerCase().includes(term)) ||
          (log.resource && log.resource.toLowerCase().includes(term)) ||
          (log.ip_address && log.ip_address.includes(term))
        );
      }

      if (actionFilter) {
        filtered = filtered.filter(log => (log.action || '').toLowerCase() === actionFilter.toLowerCase());
      }

      if (resourceFilter) {
        filtered = filtered.filter(log => (log.resource || '').toLowerCase() === resourceFilter.toLowerCase());
      }

      setTotalLogs(filtered.length);
      setTotalPages(Math.max(1, Math.ceil(filtered.length / limit)));

      // Paginate locally
      const startIndex = (currentPage - 1) * limit;
      const paginatedLogs = filtered.slice(startIndex, startIndex + limit);
      
      setLogs(paginatedLogs);
    } catch (error) {
      console.error('Failed to fetch activity logs:', error);
      toast.error('Failed to load activity logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, actionFilter, resourceFilter, searchTerm]);

  useEffect(() => {
    fetchActivityLogs();
  }, [fetchActivityLogs]);

  // Export Activity Logs
  const handleExportLogs = async () => {
    try {
      toast.loading('Exporting activity logs...', { id: 'export-toast' });
      await apiService.download(endpoints.exports.activityLogs, 'activity_logs.csv');
      toast.success('Activity logs exported successfully!', { id: 'export-toast' });
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed. Please try again.', { id: 'export-toast' });
    }
  };

  const handleCopyJson = (data) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => {
      setCopiedRaw(true);
      toast.success('Log details copied to clipboard!');
      setTimeout(() => setCopiedRaw(false), 2000);
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <PageHeader
        icon={<Activity className="h-6 w-6" />}
        title="Activity Logs"
        subtitle="Audit trail, timestamps with exact time, and real-time user action monitoring."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchActivityLogs(true)}
              disabled={refreshing}
              className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleExportLogs}
              className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#00629F] hover:bg-[#00558c] text-white shadow-md shadow-[#00629F]/20 transition-all duration-200 cursor-pointer"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Logs
            </button>
          </div>
        }
      />

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-700/60 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
        {/* Search Box */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by username, email, action, resource, IP..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
          />
        </div>

        {/* Action Filter */}
        <div className="w-full sm:w-48">
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full py-2.5 px-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
          >
            <option value="">All Actions</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="view">View</option>
            <option value="export">Export</option>
          </select>
        </div>

        {/* Resource Filter */}
        <div className="w-full sm:w-48">
          <select
            value={resourceFilter}
            onChange={(e) => {
              setResourceFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full py-2.5 px-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
          >
            <option value="">All Resources</option>
            <option value="user">Users</option>
            <option value="role">Roles</option>
            <option value="page">Pages</option>
            <option value="menu">Menus</option>
            <option value="dashboard_stats">Dashboard</option>
            <option value="system">System</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-700/60 overflow-hidden">
        {loading ? (
          <div className="py-16">
            <LoadingSpinner />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Activity className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">No activity logs found</h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              No matching log entries were found for your current search or filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700/60 bg-gray-50/70 dark:bg-gray-900/40 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <th className="py-3.5 px-5">User / Actor</th>
                  <th className="py-3.5 px-5">Action Performed</th>
                  <th className="py-3.5 px-5">Target Resource</th>
                  <th className="py-3.5 px-5">IP Address</th>
                  <th className="py-3.5 px-5">Exact Timestamp (Date &amp; Time)</th>
                  <th className="py-3.5 px-5 text-right">View Full Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 text-xs">
                {logs.map((log) => {
                  const timestamp = log.created_at || log.timestamp || new Date();
                  return (
                    <tr 
                      key={log.id || `${log.username}-${timestamp}`}
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-indigo-50/40 dark:hover:bg-gray-750 transition-colors duration-150 cursor-pointer group"
                    >
                      {/* User Info */}
                      <td className="py-3.5 px-5 font-medium text-gray-900 dark:text-white">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs shrink-0">
                            {(log.username || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-gray-900 dark:text-white truncate">
                              {log.username || 'System'}
                            </div>
                            {log.user_email && (
                              <div className="text-[11px] text-gray-400 truncate max-w-[180px]">{log.user_email}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Action Badge */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        {getActionBadge(log.action)}
                      </td>

                      {/* Resource Target */}
                      <td className="py-3.5 px-5 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          <span className="capitalize">{log.resource ? log.resource.replace(/_/g, ' ') : 'System'}</span>
                          {log.resource_id && (
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-semibold">
                              #{log.resource_id}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* IP Address */}
                      <td className="py-3.5 px-5 font-mono text-[11px] text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {log.ip_address || '127.0.0.1'}
                      </td>

                      {/* EXACT TIMESTAMP WITH TIME */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-900 dark:text-gray-100">
                            <Clock className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                            <span>{formatTimeOnly(timestamp)}</span>
                            <span className="text-[10px] font-normal text-gray-400">({formatDateOnly(timestamp)})</span>
                          </div>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium pl-5">
                            {formatRelativeTime(timestamp)}
                          </span>
                        </div>
                      </td>

                      {/* Details View Button */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer"
                          title="View Full Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-900/30 text-xs">
            <span className="text-gray-500 dark:text-gray-400">
              Showing page <span className="font-bold text-gray-900 dark:text-white">{currentPage}</span> of{' '}
              <span className="font-bold text-gray-900 dark:text-white">{totalPages}</span> ({totalLogs} items)
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-all cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-all cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          COMPREHENSIVE LOG DETAILS MODAL (KAB AUR KYA KIYA FULL VIEW)
         ───────────────────────────────────────────────────────────── */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
                  <Activity className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      Activity Log Details
                    </h3>
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                      Log #{selectedLog.id || 'N/A'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Complete audit trail information for this action
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 1. ACTION NARRATIVE SUMMARY BANNER */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-100 dark:border-indigo-800/60 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Action Overview
                </span>
                {getActionBadge(selectedLog.action)}
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white leading-relaxed">
                {generateActionNarrative(selectedLog)}
              </p>
            </div>

            {/* 2. EXECUTION TIME & ACTOR INFORMATION — STRUCTURED GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* TIMESTAMP CARD */}
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700/70 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
                  <Clock className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Execution Timestamp</span>
                </div>
                <div className="space-y-1 pl-6">
                  <div>
                    <span className="text-[11px] text-gray-400 block">Exact Date &amp; Time:</span>
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      {formatFullDateTime(selectedLog.created_at || selectedLog.timestamp)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-400 block">Relative Time:</span>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatRelativeTime(selectedLog.created_at || selectedLog.timestamp)}
                    </span>
                  </div>
                </div>
              </div>

              {/* ACTOR CARD */}
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700/70 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
                  <User className="h-4 w-4 text-indigo-500 shrink-0" />
                  <span>Triggered By (Actor)</span>
                </div>
                <div className="space-y-1 pl-6">
                  <div>
                    <span className="text-[11px] text-gray-400 block">Username:</span>
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      {selectedLog.username || 'System Actor'}
                    </span>
                  </div>
                  {selectedLog.user_email && (
                    <div>
                      <span className="text-[11px] text-gray-400 block">User Email:</span>
                      <span className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate block">
                        {selectedLog.user_email}
                      </span>
                    </div>
                  )}
                  {selectedLog.user_id && (
                    <div>
                      <span className="text-[11px] text-gray-400 block">User ID:</span>
                      <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
                        #{selectedLog.user_id}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 3. NETWORK & TARGET RESOURCE DETAILS */}
            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700/70 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                  Target Resource
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 dark:text-white capitalize">
                    {selectedLog.resource ? selectedLog.resource.replace(/_/g, ' ') : 'System'}
                  </span>
                  {selectedLog.resource_id && (
                    <span className="px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 font-mono text-[11px]">
                      ID #{selectedLog.resource_id}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                  Client IP Address
                </span>
                <div className="flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-gray-400" />
                  <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">
                    {selectedLog.ip_address || '127.0.0.1'}
                  </span>
                </div>
              </div>

              {selectedLog.user_agent && (
                <div className="sm:col-span-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                    User Agent / Client Browser
                  </span>
                  <div className="flex items-start gap-2">
                    <Monitor className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
                    <span className="font-mono text-[11px] text-gray-600 dark:text-gray-400 break-all">
                      {selectedLog.user_agent}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 4. EXTENDED DETAILS / JSON METADATA */}
            {selectedLog.details && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                    <Terminal className="h-3.5 w-3.5 text-indigo-500" />
                    Detailed Payload &amp; Parameters
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyJson(selectedLog.details)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    {copiedRaw ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedRaw ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                </div>

                <pre className="p-4 bg-gray-900 text-emerald-400 rounded-2xl text-xs overflow-x-auto font-mono max-h-56 border border-gray-800 shadow-inner leading-relaxed">
                  {typeof selectedLog.details === 'object'
                    ? JSON.stringify(selectedLog.details, null, 2)
                    : String(selectedLog.details)}
                </pre>
              </div>
            )}

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={() => handleCopyJson(selectedLog)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Full Log Record</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLogsPage;
