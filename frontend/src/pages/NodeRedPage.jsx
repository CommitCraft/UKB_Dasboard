import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  ArrowLeft,
  ShieldCheck,
  History,
  Trash2,
  Settings2,
  Plus,
  Search,
  Copy,
  Edit2,
  Radio,
  Play,
  Globe,
  Layers,
  ChevronRight,
  CheckCircle2,
  Info,
  Clock,
  Activity,
  Zap
} from 'lucide-react';
import { renderAppIcon } from '../utils/iconMap';
import { useMachineConfig } from '../context/MachineConfigContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────
// Helper: Format Relative Time & Absolute Date
// ─────────────────────────────────────────────────────────────────
const formatTimeAgo = (dateString) => {
  if (!dateString) return 'Never';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Never';

    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 30) return 'Just now';
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Recently';
  }
};

const formatExactDateTime = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return dateString;
  }
};

// ─────────────────────────────────────────────────────────────────
// Protocol Badge Component
// ─────────────────────────────────────────────────────────────────
const ProtocolBadge = ({ protocol }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-bold border ${
      protocol === 'https'
        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
        : 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800'
    }`}
  >
    {protocol.toUpperCase()}
  </span>
);

// ─────────────────────────────────────────────────────────────────
// Machine Add / Edit Modal Form
// ─────────────────────────────────────────────────────────────────
const EMPTY_MACHINE_FORM = {
  name: '',
  host: '',
  port: '1814',
  protocol: 'http',
  path: '',
  description: ''
};

const MachineModalForm = ({ isOpen, onClose, initial = EMPTY_MACHINE_FORM, onSave, title }) => {
  const [form, setForm] = useState({ ...EMPTY_MACHINE_FORM, ...initial });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm({ ...EMPTY_MACHINE_FORM, ...initial });
    setErrors({});
  }, [initial, isOpen]);

  if (!isOpen) return null;

  const setField = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Machine / Line name is required';
    if (!form.host.trim()) errs.host = 'IP Address or Hostname is required';
    if (form.port) {
      const portNum = parseInt(form.port, 10);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        errs.port = 'Port must be between 1 and 65535';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      name: form.name.trim(),
      host: form.host.trim().replace(/^https?:\/\//, '').replace(/\/+$/, ''),
      port: form.port.toString().trim(),
      protocol: form.protocol,
      path: form.path.trim(),
      description: form.description.trim()
    });
  };

  const previewUrl = (() => {
    const cleanHost = form.host.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
    if (!cleanHost) return '';
    const portPart = form.port ? `:${form.port.trim()}` : '';
    const pathPart = form.path ? (form.path.startsWith('/') ? form.path : `/${form.path}`) : '';
    return `${form.protocol}://${cleanHost}${portPart}${pathPart}`;
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-2xl max-w-lg w-full p-6 space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Configure machine connection details</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
              Machine / Line Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="e.g. Line 1 (Sri City Production) or Node-RED Server"
              className={`w-full px-3.5 py-2.5 text-xs bg-gray-50 dark:bg-gray-900 border rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition ${
                errors.name ? 'border-red-400 dark:border-red-600' : 'border-gray-200 dark:border-gray-700'
              }`}
            />
            {errors.name && <p className="mt-1 text-[11px] text-red-500 font-medium">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Protocol */}
            <div className="sm:col-span-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                Protocol
              </label>
              <select
                value={form.protocol}
                onChange={(e) => setField('protocol', e.target.value)}
                className="w-full px-3 py-2.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-mono outline-none"
              >
                <option value="http">http://</option>
                <option value="https">https://</option>
              </select>
            </div>

            {/* Port */}
            <div className="sm:col-span-8">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Port Number
                </label>
                <div className="flex gap-1">
                  {['1814', '1880', '1881'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setField('port', p)}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-gray-600 dark:text-gray-300 font-mono transition-colors cursor-pointer"
                    >
                      :{p}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="text"
                value={form.port}
                onChange={(e) => setField('port', e.target.value)}
                placeholder="1814"
                className={`w-full px-3.5 py-2.5 text-xs bg-gray-50 dark:bg-gray-900 border rounded-xl font-mono text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition ${
                  errors.port ? 'border-red-400 dark:border-red-600' : 'border-gray-200 dark:border-gray-700'
                }`}
              />
              {errors.port && <p className="mt-1 text-[11px] text-red-500 font-medium">{errors.port}</p>}
            </div>
          </div>

          {/* IP Address */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                IP Address / Hostname <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-1">
                {['192.168.1.37', '192.168.1.99', 'localhost'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setField('host', preset)}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-gray-600 dark:text-gray-300 font-mono transition-colors cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="text"
              value={form.host}
              onChange={(e) => setField('host', e.target.value)}
              placeholder="e.g. 192.168.1.37"
              className={`w-full px-3.5 py-2.5 text-xs bg-gray-50 dark:bg-gray-900 border rounded-xl font-mono text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition ${
                errors.host ? 'border-red-400 dark:border-red-600' : 'border-gray-200 dark:border-gray-700'
              }`}
            />
            {errors.host && <p className="mt-1 text-[11px] text-red-500 font-medium">{errors.host}</p>}
          </div>

          {/* Path (optional) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
              Custom Path <span className="text-gray-400 font-normal normal-case">(optional)</span>
            </label>
            <input
              type="text"
              value={form.path}
              onChange={(e) => setField('path', e.target.value)}
              placeholder="e.g. /node-red (leave blank for root)"
              className="w-full px-3.5 py-2.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-mono text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
              Description <span className="text-gray-400 font-normal normal-case">(optional)</span>
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="e.g. Main Production Line Node-RED Service"
              className="w-full px-3.5 py-2.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
            />
          </div>

          {/* Live URL Preview */}
          {previewUrl && (
            <div className="flex items-center gap-2 p-2.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl">
              <Globe className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="text-xs font-mono text-indigo-800 dark:text-indigo-300 truncate">{previewUrl}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-sm cursor-pointer"
            >
              <Check className="h-4 w-4" />
              Save Machine
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// Main Component: NodeRedPage (Table View + Flow Canvas View)
// ─────────────────────────────────────────────────────────────────
const NodeRedPage = () => {
  const navigate = useNavigate();
  const { user, isSuperAdmin, isAdmin } = useAuth();
  const canEdit = isSuperAdmin || isAdmin;

  // Machine Config context with recent activities tracking
  const {
    machines,
    activeMachine,
    activeMachineId,
    recentActivities,
    recordMachineOpen,
    clearRecentActivities,
    addMachine,
    updateMachine,
    deleteMachine,
    selectActiveMachine,
    buildUrl
  } = useMachineConfig();

  // Page View Mode: 'list' (Table) or 'canvas' (Embedded Iframe Flow Editor)
  const [viewMode, setViewMode] = useState('list');
  const [selectedMachineForCanvas, setSelectedMachineForCanvas] = useState(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Iframe Canvas states
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(Date.now());
  const iframeRef = useRef(null);

  // Filtered machines
  const filteredMachines = useMemo(() => {
    if (!searchQuery.trim()) return machines;
    const q = searchQuery.toLowerCase();
    return machines.filter(
      (m) =>
        (m.name && m.name.toLowerCase().includes(q)) ||
        (m.host && m.host.toLowerCase().includes(q)) ||
        (m.port && m.port.toString().includes(q)) ||
        (m.description && m.description.toLowerCase().includes(q))
    );
  }, [machines, searchQuery]);

  // Compute active target URL for the canvas view
  const currentCanvasMachine = selectedMachineForCanvas || activeMachine || (machines.length > 0 ? machines[0] : null);
  const activeUrl = useMemo(() => {
    return currentCanvasMachine ? buildUrl(currentCanvasMachine) : '';
  }, [currentCanvasMachine, buildUrl]);

  // Action: Launch Flow Editor for a specific machine from the Table or Recent list
  const handleLaunchMachine = (machine) => {
    const userName = user?.name || user?.email || 'Admin';
    selectActiveMachine(machine.id);
    setSelectedMachineForCanvas(machine);
    recordMachineOpen(machine, userName);
    setViewMode('canvas');
    setIsLoading(true);
    setHasError(false);
    setIframeKey(Date.now());
    toast.success(`Opening Flow Editor: ${machine.name}`);
  };

  // Quick Re-open from Recent Activity Card
  const handleQuickReopen = (activity) => {
    const targetMachine = machines.find((m) => m.id === activity.machineId) || {
      id: activity.machineId,
      name: activity.name,
      host: activity.host,
      port: activity.port,
      protocol: activity.protocol || 'http',
      path: ''
    };
    handleLaunchMachine(targetMachine);
  };

  // Handlers for Add/Edit/Delete
  const handleOpenAddModal = () => {
    setEditingMachine(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (e, machine) => {
    e.stopPropagation();
    setEditingMachine(machine);
    setIsModalOpen(true);
  };

  const handleSaveMachine = (formData) => {
    if (editingMachine) {
      updateMachine(editingMachine.id, formData);
      toast.success(`"${formData.name}" updated successfully!`);
      if (selectedMachineForCanvas?.id === editingMachine.id) {
        setSelectedMachineForCanvas({ ...editingMachine, ...formData });
      }
    } else {
      const newM = addMachine(formData);
      toast.success(`"${newM.name}" added to machines!`);
    }
    setIsModalOpen(false);
    setEditingMachine(null);
  };

  const handleDeleteMachine = (e, id) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  const confirmDeleteMachine = () => {
    const target = machines.find((m) => m.id === deleteConfirmId);
    deleteMachine(deleteConfirmId);
    toast.success(`"${target?.name || 'Machine'}" deleted`);
    setDeleteConfirmId(null);
    if (selectedMachineForCanvas?.id === deleteConfirmId) {
      setSelectedMachineForCanvas(null);
      setViewMode('list');
    }
  };

  const handleCopyUrl = (e, url) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Machine URL copied to clipboard!');
    });
  };

  // Iframe Event handlers
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

  // Reset connection timeout safety
  useEffect(() => {
    if (viewMode !== 'canvas' || !activeUrl) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 7000);

    return () => clearTimeout(timer);
  }, [iframeKey, activeUrl, viewMode]);

  // ═════════════════════════════════════════════════════════════════
  // VIEW 1: TABLE FORMAT MACHINE CONFIGURATION VIEW (WITH TOP RECENT)
  // ═════════════════════════════════════════════════════════════════
  if (viewMode === 'list') {
    return (
      <div className="flex flex-col gap-4 h-full overflow-y-auto pb-4">
        {/* Header Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-700 text-white shadow-md">
              {renderAppIcon('Workflow', { className: 'h-6 w-6' })}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  Flow Editor &amp; Machine Lines
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  Node-RED Central
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Select a line or machine from the table below to launch its flow editor directly.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-xs cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add Machine / Line</span>
              </button>
            )}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            TOP SECTION: RECENT ACTIVITY / RECENTLY OPENED MACHINES
           ───────────────────────────────────────────────────────────── */}
        {recentActivities.length > 0 && (
          <div className="bg-gradient-to-br from-indigo-900/5 via-white to-rose-900/5 dark:from-indigo-950/30 dark:via-gray-800 dark:to-rose-950/30 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                    Recent Activity — Top 4 Recently Opened Machines
                  </h2>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Top 4 most recent active sessions with 1-click re-open
                  </p>
                </div>
              </div>

              {canEdit && (
                <button
                  type="button"
                  onClick={clearRecentActivities}
                  title="Clear recent history"
                  className="text-[11px] font-semibold text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer px-2 py-1"
                >
                  Clear History
                </button>
              )}
            </div>

            {/* Recent Cards Horizontal Scroll / Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {recentActivities.slice(0, 4).map((item, idx) => (
                <div
                  key={`${item.machineId}-${idx}`}
                  onClick={() => handleQuickReopen(item)}
                  className="group relative flex flex-col justify-between p-3 rounded-xl bg-white dark:bg-gray-800/90 border border-indigo-100 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all duration-150 cursor-pointer overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-7 w-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <Server className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {item.name}
                        </h3>
                        <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400 truncate block">
                          {item.host}:{item.port}
                        </span>
                      </div>
                    </div>

                    <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {formatTimeAgo(item.openedAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700/60 text-[10px]">
                    <span
                      className="text-gray-400 dark:text-gray-500 truncate"
                      title={`Last opened at: ${formatExactDateTime(item.openedAt)}`}
                    >
                      {item.openedAt ? new Date(item.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>

                    <span className="flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                      <span>Launch Flow</span>
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Informational Alert & Search Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Quick Help Pill */}
          <div className="md:col-span-7 flex items-center gap-2.5 px-3.5 py-2.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-xl text-xs text-blue-800 dark:text-blue-300">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="leading-tight">
              <strong>Tip:</strong> Click any table row to connect and open the live Node-RED Flow Editor for that machine.
            </span>
          </div>

          {/* Search Box */}
          <div className="md:col-span-5 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by machine name, IP, port..."
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none transition"
            />
          </div>
        </div>

        {/* Machine Table Container */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs overflow-hidden flex flex-col flex-1">
          {filteredMachines.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center my-auto">
              <div className="h-14 w-14 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 mb-3">
                <Server className="h-7 w-7" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">No Machines Found</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mt-1 mb-4">
                {searchQuery
                  ? 'No machines matched your search filter. Try clearing your search.'
                  : 'Get started by adding your first machine IP and Port configuration.'}
              </p>
              {canEdit && (
                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add First Machine</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/40 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Status / Active</th>
                    <th className="py-3 px-4">Line / Machine Name</th>
                    <th className="py-3 px-4">IP Address / Host</th>
                    <th className="py-3 px-4">Port</th>
                    <th className="py-3 px-4">Protocol</th>
                    <th className="py-3 px-4">Last Opened / Activity</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                  {filteredMachines.map((machine) => {
                    const url = buildUrl(machine);
                    const isActive = machine.id === activeMachineId;

                    return (
                      <tr
                        key={machine.id}
                        onClick={() => handleLaunchMachine(machine)}
                        className={`group cursor-pointer transition-colors duration-150 ${
                          isActive
                            ? 'bg-indigo-50/60 dark:bg-indigo-950/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/30'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-750'
                        }`}
                      >
                        {/* Status Column */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                              Standby
                            </span>
                          )}
                        </td>

                        {/* Machine Name */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                                isActive
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 group-hover:text-indigo-600 transition-colors'
                              }`}
                            >
                              <Server className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                                {machine.name}
                              </div>
                              {machine.description && (
                                <div className="text-[11px] text-gray-400 dark:text-gray-500 truncate max-w-xs">
                                  {machine.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* IP Address */}
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono font-medium text-gray-800 dark:text-gray-200">
                          <div className="flex items-center gap-1.5">
                            <span>{machine.host}</span>
                            <button
                              type="button"
                              onClick={(e) => handleCopyUrl(e, url)}
                              title="Copy URL"
                              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition-opacity cursor-pointer"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        </td>

                        {/* Port */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-mono px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700/70 text-gray-700 dark:text-gray-300 font-semibold text-[11px]">
                            :{machine.port || '1880'}
                          </span>
                        </td>

                        {/* Protocol */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <ProtocolBadge protocol={machine.protocol || 'http'} />
                        </td>

                        {/* Last Opened / Activity Column */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            <span
                              className="text-[11px] font-medium text-gray-600 dark:text-gray-300"
                              title={formatExactDateTime(machine.lastOpenedAt)}
                            >
                              {formatTimeAgo(machine.lastOpenedAt)}
                            </span>
                          </div>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {/* Open Direct in New Tab */}
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Open directly in new tab"
                              className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>

                            {/* Edit Button */}
                            {canEdit && (
                              <button
                                type="button"
                                onClick={(e) => handleOpenEditModal(e, machine)}
                                title="Edit Machine Settings"
                                className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                            )}

                            {/* Delete Button */}
                            {canEdit && (
                              <button
                                type="button"
                                onClick={(e) => handleDeleteMachine(e, machine.id)}
                                title="Delete Machine"
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}

                            {/* Primary Action: Launch Flow */}
                            <button
                              type="button"
                              onClick={() => handleLaunchMachine(machine)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 transition-all shadow-xs cursor-pointer ml-1"
                            >
                              <Play className="h-3 w-3 fill-current" />
                              <span>Open Flow</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Footer */}
          <div className="p-3 bg-gray-50/60 dark:bg-gray-900/40 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>
                Total <strong>{machines.length}</strong> machine line{machines.length !== 1 ? 's' : ''} configured. Stored locally in browser storage.
              </span>
            </div>
            {activeMachine && (
              <span className="text-[11px] font-mono font-medium text-indigo-600 dark:text-indigo-400">
                Currently Active: {activeMachine.name} ({activeMachine.host}:{activeMachine.port})
              </span>
            )}
          </div>
        </div>

        {/* Add / Edit Machine Modal */}
        <MachineModalForm
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initial={editingMachine || EMPTY_MACHINE_FORM}
          onSave={handleSaveMachine}
          title={editingMachine ? `Edit Machine: ${editingMachine.name}` : 'Add New Machine / Line'}
        />

        {/* Delete Confirmation Modal */}
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-2xl p-6 max-w-sm w-full space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-950/60 flex items-center justify-center text-red-600">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Delete Machine?</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Are you sure you want to remove this machine configuration?
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteMachine}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-xs cursor-pointer"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════
  // VIEW 2: EMBEDDED FLOW CANVAS VIEW (IFRAME)
  // ═════════════════════════════════════════════════════════════════
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
        {/* Left Side: Back button, Title & Active Machine Details */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Back to Table List Button */}
          <button
            type="button"
            onClick={() => setViewMode('list')}
            title="Return to Machine List Table"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer border border-gray-200 dark:border-gray-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Machine List</span>
          </button>

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-700 text-white shadow-xs shrink-0">
            {renderAppIcon('Workflow', { className: 'h-5 w-5' })}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-bold text-gray-900 dark:text-white truncate">
                {currentCanvasMachine?.name || 'Node-RED Flow Editor'}
              </h1>
              {activeUrl ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Not Connected
                </span>
              )}
            </div>

            {activeUrl && (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-mono font-medium text-gray-600 dark:text-gray-300 truncate">
                  {activeUrl}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Machine Switcher Dropdown & Canvas Action Controls */}
        <div className="flex items-center gap-2">
          {/* Quick Machine Switcher Dropdown */}
          {machines.length > 1 && (
            <select
              value={currentCanvasMachine?.id || ''}
              onChange={(e) => {
                const found = machines.find((m) => m.id === e.target.value);
                if (found) {
                  handleLaunchMachine(found);
                }
              }}
              className="px-3 py-1.5 text-xs font-semibold bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
            >
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  Switch: {m.name} ({m.host}:{m.port})
                </option>
              ))}
            </select>
          )}

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
          {activeUrl && (
            <a
              href={activeUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open Node-RED in full new browser tab"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#00629F] hover:bg-[#004f80] transition-colors cursor-pointer shadow-xs"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Open Direct</span>
            </a>
          )}

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Canvas'}
            className="p-1.5 rounded-xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative flex-1 bg-gray-100 dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-inner flex flex-col">
        {!activeUrl ? (
          <div className="flex-1 flex items-center justify-center p-6 text-center">
            <div className="max-w-md p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">No Machine Selected</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Please return to the machine list table to select a configured machine or add a new one.
              </p>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                Go to Machine Table
              </button>
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
                  Loading flows workspace for {currentCanvasMachine?.name || 'machine'}
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
                      Unable to Load Node-RED Canvas
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1.5 leading-relaxed">
                      Could not reach <code className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{activeUrl}</code>.
                    </p>
                  </div>

                  <div className="p-3.5 bg-gray-50 dark:bg-gray-900/60 rounded-2xl text-left text-xs text-gray-600 dark:text-gray-300 space-y-1.5 border border-gray-200 dark:border-gray-700">
                    <p className="font-semibold text-gray-900 dark:text-white text-xs">Troubleshooting checklist:</p>
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                      <li>Check if Node-RED is running on <span className="font-mono text-gray-800 dark:text-gray-200">{currentCanvasMachine?.host}:{currentCanvasMachine?.port}</span>.</li>
                      <li>Confirm that the port is open in firewall and accessible on the local network.</li>
                      <li>Ensure your browser allows loading local network iframes.</li>
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
                      onClick={() => setViewMode('list')}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                    >
                      Back to Table
                    </button>
                    <a
                      href={activeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1.5"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open in Tab
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
              title={`Node-RED - ${currentCanvasMachine?.name || 'Flow Editor'}`}
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
