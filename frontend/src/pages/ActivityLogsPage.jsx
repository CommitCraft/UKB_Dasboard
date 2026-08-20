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
  X
} from 'lucide-react';
import { apiService, endpoints } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';

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

  // Fetch Activity Logs
  const fetchActivityLogs = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const params = {
        page: currentPage,
        limit: limit
      };

      if (actionFilter) params.action = actionFilter;
      if (resourceFilter) params.resource = resourceFilter;

      // Use /api/stats/recent-activity or /api/stats/activity depending on backend endpoints
      const response = await apiService.get(endpoints.stats.recentActivity, {
        limit: 50
      });

      let rawLogs = [];
      if (response.data && Array.isArray(response.data.data)) {
        // Flat array response
        rawLogs = response.data.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data.logs)) {
        // Nested { data: { logs: [], pagination: {} } } response from findAll
        rawLogs = response.data.data.logs;
      } else if (response.data && Array.isArray(response.data.logs)) {
        rawLogs = response.data.logs;
      }

      // Apply client-side search & filtering if backend returns array list
      let filtered = rawLogs;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(log => 
          (log.username && log.username.toLowerCase().includes(term)) ||
          (log.action && log.action.toLowerCase().includes(term)) ||
          (log.resource && log.resource.toLowerCase().includes(term)) ||
          (log.ip_address && log.ip_address.includes(term))
        );
      }

      if (actionFilter) {
        filtered = filtered.filter(log => log.action === actionFilter);
      }

      if (resourceFilter) {
        filtered = filtered.filter(log => log.resource === resourceFilter);
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

  // Helper for Action Badges
  const getActionBadge = (action) => {
    const act = (action || '').toLowerCase();
    
    if (act.includes('login')) {
      return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50"><CheckCircle className="h-3 w-3 mr-1" /> Login</span>;
    }
    if (act.includes('logout')) {
      return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"><Clock className="h-3 w-3 mr-1" /> Logout</span>;
    }
    if (act.includes('create')) {
      return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50"><User className="h-3 w-3 mr-1" /> Create</span>;
    }
    if (act.includes('update') || act.includes('edit')) {
      return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700/50"><SlidersHorizontal className="h-3 w-3 mr-1" /> Update</span>;
    }
    if (act.includes('delete') || act.includes('remove')) {
      return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-700/50"><XCircle className="h-3 w-3 mr-1" /> Delete</span>;
    }
    if (act.includes('export') || act.includes('download')) {
      return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-700/50"><Download className="h-3 w-3 mr-1" /> Export</span>;
    }

    return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/50"><Info className="h-3 w-3 mr-1" /> {action}</span>;
  };

  return (
    <div className="space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/60">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-[#00629F] to-[#004774] text-white shadow-md shadow-[#00629F]/20">
                <Activity className="h-6 w-6" />
              </div>
              Activity Logs
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Audit trail and real-time user action monitoring across the system.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchActivityLogs(true)}
              disabled={refreshing}
              className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleExportLogs}
              className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#00629F] hover:bg-[#00558c] text-white shadow-md shadow-[#00629F]/20 transition-all duration-200"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Logs
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/60 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by user, action, IP..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
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
              className="w-full py-2.5 px-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
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
              className="w-full py-2.5 px-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            >
              <option value="">All Resources</option>
              <option value="user">Users</option>
              <option value="role">Roles</option>
              <option value="page">Pages</option>
              <option value="dashboard_stats">Dashboard</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/60 overflow-hidden">
          {loading ? (
            <div className="py-16">
              <LoadingSpinner />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Activity className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">No activity logs found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                No matching log entries were found for your current search or filter criteria.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-900/30 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    <th className="py-4 px-6">User</th>
                    <th className="py-4 px-6">Action</th>
                    <th className="py-4 px-6">Resource</th>
                    <th className="py-4 px-6">IP Address</th>
                    <th className="py-4 px-6">Timestamp</th>
                    <th className="py-4 px-6 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 text-sm">
                  {logs.map((log) => (
                    <tr 
                      key={log.id || `${log.username}-${log.created_at}`}
                      className="hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors duration-150"
                    >
                      <td className="py-4 px-6 font-medium text-gray-900 dark:text-white">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs">
                            {(log.username || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {log.username || 'System'}
                            </div>
                            {log.user_email && (
                              <div className="text-xs text-gray-400">{log.user_email}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        {getActionBadge(log.action)}
                      </td>

                      <td className="py-4 px-6 font-medium text-gray-700 dark:text-gray-300">
                        {log.resource ? (
                          <span className="capitalize">{log.resource.replace('_', ' ')}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                        {log.resource_id && (
                          <span className="ml-1 text-xs text-gray-400">#{log.resource_id}</span>
                        )}
                      </td>

                      <td className="py-4 px-6 font-mono text-xs text-gray-600 dark:text-gray-400">
                        {log.ip_address || '127.0.0.1'}
                      </td>

                      <td className="py-4 px-6 text-gray-500 dark:text-gray-400 text-xs">
                        {formatDate(log.created_at || new Date())}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-900/30">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Showing page <span className="font-semibold text-gray-900 dark:text-white">{currentPage}</span> of{' '}
                <span className="font-semibold text-gray-900 dark:text-white">{totalPages}</span> ({totalLogs} items)
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Log Details Modal */}
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-indigo-500" />
                  Log Entry Details
                </h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-gray-400 uppercase tracking-wider block font-semibold mb-1">User</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{selectedLog.username || 'System'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 uppercase tracking-wider block font-semibold mb-1">Action</span>
                    {getActionBadge(selectedLog.action)}
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 uppercase tracking-wider block font-semibold mb-1">Resource</span>
                    <span className="text-gray-800 dark:text-gray-200 capitalize">{selectedLog.resource || '—'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 uppercase tracking-wider block font-semibold mb-1">IP Address</span>
                    <span className="font-mono text-gray-800 dark:text-gray-200">{selectedLog.ip_address || '127.0.0.1'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-gray-400 uppercase tracking-wider block font-semibold mb-1">Timestamp</span>
                  <span className="text-gray-800 dark:text-gray-200">{formatDate(selectedLog.created_at || new Date())}</span>
                </div>

                {selectedLog.details && (
                  <div>
                    <span className="text-xs text-gray-400 uppercase tracking-wider block font-semibold mb-2">Raw Metadata</span>
                    <pre className="p-3 bg-gray-900 text-emerald-400 rounded-xl text-xs overflow-x-auto font-mono max-h-48 border border-gray-800">
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div className="pt-2 text-right">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-5 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
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
