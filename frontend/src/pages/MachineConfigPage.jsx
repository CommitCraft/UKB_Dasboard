import React, { useState, useCallback } from 'react';
import {
  Server,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  CheckCircle2,
  Radio,
  ExternalLink,
  Wifi,
  WifiOff,
  Sparkles,
  ShieldCheck,
  Globe,
  Network,
  Info,
  ChevronRight,
  Copy
} from 'lucide-react';
import { useMachineConfig } from '../context/MachineConfigContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────
// Protocol colors
// ─────────────────────────────────────────────────────────────────
const protocolBadge = (protocol) =>
  protocol === 'https'
    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
    : 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800';

// ─────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────
const EmptyState = ({ onAdd }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg mb-5">
      <Server className="h-8 w-8" />
    </div>
    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">No Machines Configured</h3>
    <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed mb-5">
      Add your first machine (e.g. Node-RED server IP &amp; port) so all flow pages connect automatically — no manual entry needed.
    </p>
    <button
      onClick={onAdd}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
    >
      <Plus className="h-4 w-4" />
      Add First Machine
    </button>
  </div>
);

// ─────────────────────────────────────────────────────────────────
// Machine form (add / edit)
// ─────────────────────────────────────────────────────────────────
const EMPTY_FORM = { name: '', host: '', port: '1814', protocol: 'http', path: '', description: '' };

const MachineForm = ({ initial = EMPTY_FORM, onSave, onCancel, title }) => {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial });
  const [errors, setErrors] = useState({});

  const set = (key, val) => {
    setForm(p => ({ ...p, [key]: val }));
    if (errors[key]) setErrors(p => ({ ...p, [key]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())   e.name = 'Machine name is required';
    if (!form.host.trim())   e.host = 'IP address or hostname is required';
    if (form.port) {
      const n = parseInt(form.port, 10);
      if (isNaN(n) || n < 1 || n > 65535) e.port = 'Port must be 1 – 65535';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    onSave({
      name:        form.name.trim(),
      host:        form.host.trim().replace(/^https?:\/\//, '').replace(/\/+$/, ''),
      port:        form.port.toString().trim(),
      protocol:    form.protocol,
      path:        form.path.trim(),
      description: form.description.trim()
    });
  };

  const previewUrl = (() => {
    const h = form.host.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
    if (!h) return '';
    const p = form.port ? `:${form.port}` : '';
    const pa = form.path ? (form.path.startsWith('/') ? form.path : `/${form.path}`) : '';
    return `${form.protocol}://${h}${p}${pa}`;
  })();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <Network className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h3>
        </div>
        <button type="button" onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Name */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
            Machine Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="e.g. Production Node-RED, Machine-A"
            className={`w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-900 border rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition ${errors.name ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`}
          />
          {errors.name && <p className="mt-1 text-[11px] text-red-500">{errors.name}</p>}
        </div>

        {/* Protocol */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
            Protocol
          </label>
          <select
            value={form.protocol}
            onChange={e => set('protocol', e.target.value)}
            className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
          >
            <option value="http">http:// (Standard)</option>
            <option value="https">https:// (Secure)</option>
          </select>
        </div>

        {/* Port */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
              Port
            </label>
            <div className="flex gap-1">
              {['1814', '1880', '1881'].map(p => (
                <button key={p} type="button" onClick={() => set('port', p)}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-gray-600 dark:text-gray-300 font-mono cursor-pointer transition-colors">
                  :{p}
                </button>
              ))}
            </div>
          </div>
          <input
            type="text"
            value={form.port}
            onChange={e => set('port', e.target.value)}
            placeholder="e.g. 1814"
            className={`w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-900 border rounded-xl font-mono text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition ${errors.port ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`}
          />
          {errors.port && <p className="mt-1 text-[11px] text-red-500">{errors.port}</p>}
        </div>

        {/* Host */}
        <div className="sm:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
              IP Address / Hostname <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-1">
              {['192.168.1.37', '192.168.1.99', 'localhost'].map(h => (
                <button key={h} type="button" onClick={() => set('host', h)}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-gray-600 dark:text-gray-300 font-mono cursor-pointer transition-colors">
                  {h}
                </button>
              ))}
            </div>
          </div>
          <input
            type="text"
            value={form.host}
            onChange={e => set('host', e.target.value)}
            placeholder="e.g. 192.168.1.37"
            className={`w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-900 border rounded-xl font-mono text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition ${errors.host ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`}
          />
          {errors.host && <p className="mt-1 text-[11px] text-red-500">{errors.host}</p>}
        </div>

        {/* Path (optional) */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
            Path <span className="text-gray-400 font-normal normal-case">(optional, e.g. /node-red)</span>
          </label>
          <input
            type="text"
            value={form.path}
            onChange={e => set('path', e.target.value)}
            placeholder="Leave blank for root /"
            className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-mono text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
          />
        </div>

        {/* Description */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
            Description <span className="text-gray-400 font-normal normal-case">(optional)</span>
          </label>
          <input
            type="text"
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="e.g. Sri City production server"
            className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
          />
        </div>
      </div>

      {/* URL Preview */}
      {previewUrl && (
        <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl">
          <Globe className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
          <span className="text-xs font-mono text-indigo-700 dark:text-indigo-300 truncate">{previewUrl}</span>
          <a href={previewUrl} target="_blank" rel="noopener noreferrer" title="Test in new tab"
            className="ml-auto shrink-0 text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
        <button type="button" onClick={onCancel}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
          Cancel
        </button>
        <button type="submit"
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-sm cursor-pointer">
          <Check className="h-3.5 w-3.5" />
          Save Machine
        </button>
      </div>
    </form>
  );
};

// ─────────────────────────────────────────────────────────────────
// Machine Card
// ─────────────────────────────────────────────────────────────────
const MachineCard = ({ machine, isActive, onSelect, onEdit, onDelete, buildUrl, canEdit }) => {
  const url = buildUrl(machine);

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => toast.success('URL copied!'));
  };

  return (
    <div
      className={`relative group rounded-2xl border-2 p-4 transition-all duration-200 ${
        isActive
          ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/20 shadow-md shadow-indigo-100 dark:shadow-indigo-900/20'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-sm'
      }`}
    >
      {/* Active badge */}
      {isActive && (
        <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          ACTIVE
        </span>
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`shrink-0 h-10 w-10 rounded-xl flex items-center justify-center shadow-sm ${
          isActive
            ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
        }`}>
          <Server className="h-5 w-5" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">{machine.name}</h3>
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${protocolBadge(machine.protocol)}`}>
              {machine.protocol.toUpperCase()}
            </span>
          </div>

          <p className="mt-0.5 text-xs font-mono text-gray-600 dark:text-gray-300 truncate">{url}</p>

          {machine.description && (
            <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500 truncate">{machine.description}</p>
          )}

          {/* URL row */}
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <button onClick={handleCopy} title="Copy URL"
              className="inline-flex items-center gap-1 text-[10px] font-mono text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer">
              <Copy className="h-3 w-3" />
              Copy URL
            </button>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              <ExternalLink className="h-3 w-3" />
              Open
            </a>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Set Active */}
          {!isActive && (
            <button onClick={() => onSelect(machine.id)} title="Set as Active Machine"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors cursor-pointer border border-indigo-200 dark:border-indigo-800">
              <Radio className="h-3 w-3" />
              Use This
            </button>
          )}

          {canEdit && (
            <>
              <button onClick={() => onEdit(machine)} title="Edit"
                className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => onDelete(machine.id)} title="Delete"
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────
const MachineConfigPage = () => {
  const { machines, activeMachineId, addMachine, updateMachine, deleteMachine, selectActiveMachine, buildUrl } = useMachineConfig();
  const { isSuperAdmin, isAdmin } = useAuth();

  const canEdit = isSuperAdmin || isAdmin;

  const [showForm, setShowForm]   = useState(false);
  const [editTarget, setEditTarget] = useState(null); // machine object being edited
  const [deleteConfirm, setDeleteConfirm] = useState(null); // machine id to confirm delete

  // ── Handlers ────────────────────────────────────────────────────
  const handleSave = useCallback((data) => {
    if (editTarget) {
      updateMachine(editTarget.id, data);
      toast.success(`"${data.name}" updated successfully`);
      setEditTarget(null);
    } else {
      const m = addMachine(data);
      toast.success(`"${m.name}" added successfully`);
      setShowForm(false);
    }
  }, [editTarget, addMachine, updateMachine]);

  const handleEdit = useCallback((machine) => {
    setEditTarget(machine);
    setShowForm(false);
  }, []);

  const handleDelete = useCallback((id) => {
    setDeleteConfirm(id);
  }, []);

  const confirmDelete = useCallback(() => {
    const m = machines.find(x => x.id === deleteConfirm);
    deleteMachine(deleteConfirm);
    toast.success(`"${m?.name}" removed`);
    setDeleteConfirm(null);
  }, [deleteConfirm, deleteMachine, machines]);

  const handleSelect = useCallback((id) => {
    selectActiveMachine(id);
    const m = machines.find(x => x.id === id);
    toast.success(`Active machine set to "${m?.name}"`);
  }, [selectActiveMachine, machines]);

  const cancelForm = () => { setShowForm(false); setEditTarget(null); };

  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto">

      {/* ── Page Header ────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md">
            <Server className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Machine Configuration</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Define IP &amp; port once — all flow pages auto-connect</p>
          </div>
        </div>

        {canEdit && (
          <button
            onClick={() => { setShowForm(true); setEditTarget(null); }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Machine
          </button>
        )}
      </div>

      {/* ── How It Works Info ──────────────────────────── */}
      <div className="flex items-start gap-3 p-3.5 bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800 rounded-2xl">
        <Info className="h-4 w-4 text-sky-500 shrink-0 mt-0.5" />
        <div className="text-xs text-sky-700 dark:text-sky-300 space-y-0.5">
          <p className="font-semibold">How it works</p>
          <p className="text-sky-600 dark:text-sky-400 leading-relaxed">
            Add your Node-RED server(s) below. Mark one as <strong>Active</strong> — the Flow Editor page will auto-connect without any manual IP / port entry. Switch active machine anytime to redirect all flow pages instantly.
          </p>
        </div>
      </div>

      {/* ── Read-only notice for non-admins ────────────── */}
      {!canEdit && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-700 dark:text-amber-300">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>You have read-only access. Contact an Admin to add or modify machines.</span>
        </div>
      )}

      {/* ── Add Form ───────────────────────────────────── */}
      {showForm && canEdit && (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 shadow-lg animate-in fade-in duration-200">
          <MachineForm
            title="Add New Machine"
            onSave={handleSave}
            onCancel={cancelForm}
          />
        </div>
      )}

      {/* ── Edit Form ──────────────────────────────────── */}
      {editTarget && canEdit && (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 shadow-lg animate-in fade-in duration-200">
          <MachineForm
            title={`Edit — ${editTarget.name}`}
            initial={editTarget}
            onSave={handleSave}
            onCancel={cancelForm}
          />
        </div>
      )}

      {/* ── Machine List ───────────────────────────────── */}
      {machines.length === 0 && !showForm ? (
        <EmptyState onAdd={canEdit ? () => setShowForm(true) : undefined} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {machines.map(machine => (
            <MachineCard
              key={machine.id}
              machine={machine}
              isActive={machine.id === activeMachineId}
              onSelect={handleSelect}
              onEdit={handleEdit}
              onDelete={handleDelete}
              buildUrl={buildUrl}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}

      {/* ── Summary Footer ─────────────────────────────── */}
      {machines.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 pt-1">
          <Sparkles className="h-3.5 w-3.5" />
          <span>{machines.length} machine{machines.length !== 1 ? 's' : ''} configured — stored in browser localStorage</span>
        </div>
      )}

      {/* ── Delete Confirm Modal ───────────────────────── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl p-6 max-w-sm w-full space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Remove Machine?</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  "{machines.find(m => m.id === deleteConfirm)?.name}" will be deleted permanently.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteConfirm(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                Cancel
              </button>
              <button onClick={confirmDelete}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm cursor-pointer">
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MachineConfigPage;
