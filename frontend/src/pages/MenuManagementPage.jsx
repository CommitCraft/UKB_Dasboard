import React, { useState, useEffect, useCallback } from 'react';
import {
  FolderTree,
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  Search,
  ArrowUp,
  ArrowDown,
  Globe,
  ExternalLink,
  Shield,
  Layers,
  LayoutDashboard,
  Users,
  FileText,
  Activity,
  CheckCircle2,
  XCircle,
  Eye,
  Sliders,
  Settings,
  Database,
  BarChart2,
  Briefcase,
  Terminal,
  Feather,
  Target,
  Lock,
  Crown,
  Award,
  UserCheck,
  Key,
  Star,
  CheckSquare,
  Square,
  ListPlus,
  Tag
} from 'lucide-react';
import Layout from '../components/Layout/Layout';
import { apiService, endpoints } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ZoomableIframeModal from '../components/ZoomableIframeModal';
import toast from 'react-hot-toast';

// 24 Lucide Icons for selection
const ICON_LIST = [
  { name: 'FolderTree', icon: FolderTree, label: 'Tree' },
  { name: 'LayoutDashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { name: 'Users', icon: Users, label: 'Users' },
  { name: 'Shield', icon: Shield, label: 'Shield' },
  { name: 'FileText', icon: FileText, label: 'File' },
  { name: 'Activity', icon: Activity, label: 'Activity' },
  { name: 'Settings', icon: Settings, label: 'Settings' },
  { name: 'Database', icon: Database, label: 'Database' },
  { name: 'Globe', icon: Globe, label: 'Globe' },
  { name: 'BarChart2', icon: BarChart2, label: 'Analytics' },
  { name: 'Briefcase', icon: Briefcase, label: 'Business' },
  { name: 'Lock', icon: Lock, label: 'Security' },
  { name: 'Crown', icon: Crown, label: 'Admin' },
  { name: 'Award', icon: Award, label: 'Manager' },
  { name: 'UserCheck', icon: UserCheck, label: 'Access' },
  { name: 'Key', icon: Key, label: 'Key' },
  { name: 'Star', icon: Star, label: 'Star' },
  { name: 'Sliders', icon: Sliders, label: 'Control' },
  { name: 'Terminal', icon: Terminal, label: 'Developer' },
  { name: 'Feather', icon: Feather, label: 'Editor' },
  { name: 'Target', icon: Target, label: 'Target' },
  { name: 'Eye', icon: Eye, label: 'Viewer' },
  { name: 'Layers', icon: Layers, label: 'Layers' },
  { name: 'ExternalLink', icon: ExternalLink, label: 'Link' }
];

const renderMenuIcon = (iconName) => {
  const match = ICON_LIST.find((i) => i.name === iconName);
  if (match) {
    const IconComp = match.icon;
    return <IconComp className="h-4 w-4" />;
  }
  return <Globe className="h-4 w-4" />;
};

const TYPE_CONFIG = {
  section: { label: 'Section Label', bg: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
  menu: { label: 'Menu (Level 1)', bg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' },
  submenu: { label: 'Sub Menu (Level 2)', bg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
  child: { label: 'Child Menu (Level 3)', bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' }
};

const MenuModal = ({ isOpen, onClose, item, parentItem, flatItems, availablePages, onSave }) => {
  const [modalMode, setModalMode] = useState('single');
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    icon: 'Globe',
    type: 'menu',
    parent_id: '',
    status: 'active',
    is_external: false,
    selected_page_id: '',
    badge_label: ''
  });

  const [batchTargetParent, setBatchTargetParent] = useState('');
  const [batchTargetType, setBatchTargetType] = useState('submenu');
  const [selectedBatchPages, setSelectedBatchPages] = useState([]);
  const [batchSearchTerm, setBatchSearchTerm] = useState('');
  const [batchBadgeLabel, setBatchBadgeLabel] = useState('');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const activePages = availablePages.filter((p) => p.status === 'active');

  useEffect(() => {
    if (item) {
      setModalMode('single');
      const matchedPage = availablePages.find(
        (p) => p.url?.toLowerCase().trim() === item.url?.toLowerCase().trim()
      );

      setFormData({
        name: item.name || '',
        url: item.url || '',
        icon: item.icon || 'Globe',
        type: item.type || 'menu',
        parent_id: item.parent_id ? String(item.parent_id) : '',
        status: item.status || 'active',
        is_external: Boolean(item.is_external),
        selected_page_id: matchedPage ? String(matchedPage.id) : '',
        badge_label: item.badge_label || ''
      });
    } else if (parentItem) {
      setModalMode('single');
      let childType = 'submenu';
      if (parentItem.type === 'section') childType = 'menu';
      else if (parentItem.type === 'menu') childType = 'submenu';
      else if (parentItem.type === 'submenu') childType = 'child';

      setFormData({
        name: '',
        url: '',
        icon: 'Globe',
        type: childType,
        parent_id: String(parentItem.id),
        status: 'active',
        is_external: false,
        selected_page_id: '',
        badge_label: ''
      });

      setBatchTargetParent(String(parentItem.id));
      setBatchTargetType(childType);
    } else {
      setModalMode('single');
      setFormData({
        name: '',
        url: '',
        icon: 'Globe',
        type: 'menu',
        parent_id: '',
        status: 'active',
        is_external: false,
        selected_page_id: '',
        badge_label: ''
      });
      setBatchTargetParent('');
      setBatchTargetType('submenu');
    }
    setSelectedBatchPages([]);
    setBatchSearchTerm('');
    setBatchBadgeLabel('');
    setErrors({});
  }, [item, parentItem, isOpen, availablePages]);

  const handlePageSelect = (pageId) => {
    const matched = availablePages.find((p) => String(p.id) === String(pageId));
    if (matched) {
      setFormData((prev) => ({
        ...prev,
        selected_page_id: String(pageId),
        name: prev.name ? prev.name : matched.name,
        url: matched.url,
        icon: matched.icon || prev.icon
      }));
      if (errors.url) setErrors((prev) => ({ ...prev, url: '' }));
      if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
    } else {
      setFormData((prev) => ({
        ...prev,
        selected_page_id: '',
        url: ''
      }));
    }
  };

  const toggleBatchPageSelect = (page) => {
    const pageId = String(page.id);
    setSelectedBatchPages((prev) => {
      const exists = prev.some((p) => String(p.id) === pageId);
      if (exists) {
        return prev.filter((p) => String(p.id) !== pageId);
      }
      return [...prev, page];
    });
  };

  const handleSelectAllBatch = () => {
    if (selectedBatchPages.length === activePages.length) {
      setSelectedBatchPages([]);
    } else {
      setSelectedBatchPages(activePages);
    }
  };

  const validate = () => {
    const errs = {};
    if (modalMode === 'single') {
      if (!formData.name.trim()) errs.name = 'Menu item name is required';
      if (formData.type !== 'section' && !formData.url.trim()) {
        errs.url = 'Please select a page from Page Management or enter an external URL';
      }
    } else {
      if (selectedBatchPages.length === 0) {
        errs.batch = 'Please select at least one page from the checklist to add as Sub/Child Menus';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (modalMode === 'single') {
        const payload = {
          name: formData.name.trim(),
          url: formData.type === 'section' ? '' : formData.url.trim(),
          icon: formData.icon,
          type: formData.type,
          parent_id: formData.parent_id ? parseInt(formData.parent_id) : null,
          status: formData.status,
          is_external: formData.is_external,
          badge_label: formData.badge_label.trim() || null
        };

        if (item) {
          await apiService.put(endpoints.menus.update(item.id), payload);
          toast.success('Menu item updated successfully');
        } else {
          await apiService.post(endpoints.menus.create, payload);
          toast.success('Menu item created successfully');
        }
      } else {
        const parentId = batchTargetParent ? parseInt(batchTargetParent) : null;
        let createdCount = 0;

        for (const pageItem of selectedBatchPages) {
          const payload = {
            name: pageItem.name,
            url: pageItem.url,
            icon: pageItem.icon || 'Globe',
            type: batchTargetType,
            parent_id: parentId,
            status: 'active',
            is_external: Boolean(pageItem.is_external),
            badge_label: batchBadgeLabel.trim() || null
          };
          await apiService.post(endpoints.menus.create, payload);
          createdCount++;
        }

        toast.success(`Successfully added ${createdCount} ${TYPE_CONFIG[batchTargetType]?.label || 'items'} under parent`);
      }

      window.dispatchEvent(new CustomEvent('permissions-updated'));
      onSave();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save menu items';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const parentOptions = flatItems.filter((i) => {
    if (item && i.id === item.id) return false;
    return true;
  });

  const filteredBatchPages = activePages.filter((p) =>
    p.name.toLowerCase().includes(batchSearchTerm.toLowerCase()) ||
    p.url.toLowerCase().includes(batchSearchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FolderTree className="h-5 w-5 text-[#00629F]" />
            {item ? 'Edit Menu Item' : parentItem ? `Add Items under "${parentItem.name}"` : 'Add Menu Items'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            ✕
          </button>
        </div>

        {/* Mode Selector Tabs */}
        {!item && (
          <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 px-6 pt-3">
            <button
              type="button"
              onClick={() => setModalMode('single')}
              className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
                modalMode === 'single'
                  ? 'border-[#00629F] text-[#00629F] font-bold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <Plus className="h-4 w-4" />
              Single Item Creation
            </button>

            <button
              type="button"
              onClick={() => setModalMode('multi')}
              className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
                modalMode === 'multi'
                  ? 'border-[#00629F] text-[#00629F] font-bold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <ListPlus className="h-4 w-4 text-[#00629F]" />
              Multi-Select Batch Add
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {modalMode === 'single' ? (
            <>
              {/* Hierarchy Type Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Item Level Hierarchy
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.keys(TYPE_CONFIG).map((tKey) => (
                    <button
                      key={tKey}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, type: tKey }))}
                      className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                        formData.type === tKey
                          ? 'border-[#00629F] bg-indigo-50 dark:bg-indigo-900/40 text-[#00629F] dark:text-indigo-300 shadow-sm ring-2 ring-[#00629F]/20'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      {TYPE_CONFIG[tKey].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Select Target Page / URL Route from Page Management */}
              {formData.type !== 'section' && !formData.is_external && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Select Page / URL Route (from Page Management) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.selected_page_id}
                    onChange={(e) => handlePageSelect(e.target.value)}
                    className={`w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900/50 border rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-[#00629F] ${
                      errors.url ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <option value="">-- Select Page from Page Management --</option>
                    {activePages.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.url})
                      </option>
                    ))}
                  </select>
                  {formData.url && (
                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 font-mono">
                      <span className="font-semibold text-gray-700 dark:text-gray-300 font-sans">Configured Route:</span> {formData.url}
                    </p>
                  )}
                  {errors.url && <p className="mt-1 text-xs text-red-500">{errors.url}</p>}
                </div>
              )}

              {/* External URL Route */}
              {formData.type !== 'section' && formData.is_external && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    External URL Route <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.url}
                    onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
                    placeholder="https://example.com"
                    className={`w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900/50 border rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-[#00629F] ${
                      errors.url ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                    }`}
                  />
                  {errors.url && <p className="mt-1 text-xs text-red-500">{errors.url}</p>}
                </div>
              )}

              {/* Item Name / Label */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Menu Name / Display Label <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Master, User Management, Product List"
                  className={`w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900/50 border rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-[#00629F] ${
                    errors.name ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                  }`}
                />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
              </div>

              {/* Custom Display Badge Tag / Label */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-[#00629F]" />
                  Custom Display Tag / Badge Label <span className="text-xs text-gray-400 font-normal">(Optional, e.g. NEW, HOT, PRO, BETA)</span>
                </label>
                <input
                  type="text"
                  value={formData.badge_label}
                  onChange={(e) => setFormData((prev) => ({ ...prev, badge_label: e.target.value }))}
                  placeholder="e.g. NEW, HOT, PRO, LABEL"
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-[#00629F]"
                />
              </div>

              {/* Parent Item Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Parent Menu Item
                </label>
                <select
                  value={formData.parent_id}
                  onChange={(e) => setFormData((prev) => ({ ...prev, parent_id: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-[#00629F]"
                >
                  <option value="">No Parent (Root Level Item)</option>
                  {parentOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.type.toUpperCase()}] {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Icon Selector Grid */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Menu Icon
                  </label>
                  <span className="text-xs text-[#00629F] dark:text-indigo-400 font-semibold flex items-center gap-1">
                    Selected: {formData.icon}
                  </span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 max-h-36 overflow-y-auto">
                  {ICON_LIST.map((item) => {
                    const IconComponent = item.icon;
                    const isSelected = formData.icon === item.name;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, icon: item.name }))}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-indigo-100 dark:bg-indigo-900/40 border-[#00629F] text-[#00629F] dark:text-indigo-300 font-bold shadow-sm ring-2 ring-[#00629F]/20'
                            : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
                        }`}
                      >
                        <IconComponent className="h-4 w-4 mb-1" />
                        <span className="text-[10px] truncate max-w-full text-center">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* External Link & Status Toggles */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.is_external}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        is_external: e.target.checked,
                        url: e.target.checked ? prev.url : '',
                        selected_page_id: e.target.checked ? '' : prev.selected_page_id
                      }))
                    }
                    className="rounded text-[#00629F] focus:ring-[#00629F]"
                  />
                  External URL
                </label>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Status:</span>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, status: prev.status === 'active' ? 'inactive' : 'active' }))}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                      formData.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {formData.status === 'active' ? 'Active' : 'Disabled'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Multi-Select Batch Add Mode */
            <div className="space-y-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-xl text-xs text-indigo-900 dark:text-indigo-200">
                <p className="font-semibold mb-1">Multi-Select Sub/Child Menus Mode:</p>
                <p>Select multiple pages from Page Management below. They will be added as independent Sub Menus or Child Menus under the selected parent menu.</p>
              </div>

              {/* Target Parent Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Target Parent Menu <span className="text-red-500">*</span>
                </label>
                <select
                  value={batchTargetParent}
                  onChange={(e) => setBatchTargetParent(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-[#00629F]"
                >
                  <option value="">No Parent (Root Level Items)</option>
                  {flatItems.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.type.toUpperCase()}] {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Level Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Assigned Item Level Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['menu', 'submenu', 'child'].map((tKey) => (
                    <button
                      key={tKey}
                      type="button"
                      onClick={() => setBatchTargetType(tKey)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                        batchTargetType === tKey
                          ? 'border-[#00629F] bg-indigo-50 dark:bg-indigo-900/40 text-[#00629F] dark:text-indigo-300 shadow-sm ring-2 ring-[#00629F]/20'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      {TYPE_CONFIG[tKey]?.label || tKey}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Badge Tag for Batch Add */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Optional Badge Tag for Batch Items (e.g. NEW, HOT, PRO)
                </label>
                <input
                  type="text"
                  value={batchBadgeLabel}
                  onChange={(e) => setBatchBadgeLabel(e.target.value)}
                  placeholder="e.g. NEW, HOT, PRO"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white"
                />
              </div>

              {/* Checklist Header */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Select Pages ({selectedBatchPages.length} selected)
                  </span>
                  <button
                    type="button"
                    onClick={handleSelectAllBatch}
                    className="text-xs text-[#00629F] font-semibold hover:underline"
                  >
                    {selectedBatchPages.length === activePages.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                {/* Filter input */}
                <div className="relative mb-2">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search pages to add..."
                    value={batchSearchTerm}
                    onChange={(e) => setBatchSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white"
                  />
                </div>

                {/* Checklist Container */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                  {filteredBatchPages.map((page) => {
                    const isChecked = selectedBatchPages.some((p) => String(p.id) === String(page.id));
                    return (
                      <label
                        key={page.id}
                        onClick={() => toggleBatchPageSelect(page)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-indigo-50 dark:bg-indigo-900/40 border-[#00629F] text-[#00629F] dark:text-indigo-300 font-semibold'
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {isChecked ? (
                            <CheckSquare className="h-4 w-4 text-[#00629F] shrink-0" />
                          ) : (
                            <Square className="h-4 w-4 text-gray-400 shrink-0" />
                          )}
                          <span className="text-xs truncate">{page.name}</span>
                        </div>
                        <span className="text-[10px] font-mono text-gray-400 shrink-0 ml-1">{page.url}</span>
                      </label>
                    );
                  })}
                </div>
                {errors.batch && <p className="mt-1 text-xs text-red-500">{errors.batch}</p>}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#00629F] hover:bg-[#00558c] rounded-xl disabled:opacity-50 flex items-center shadow-md shadow-[#00629F]/20"
            >
              {loading && <LoadingSpinner size="sm" className="mr-2" />}
              {modalMode === 'single' ? (item ? 'Save Changes' : 'Create Item') : `Add ${selectedBatchPages.length} Selected Items`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const MenuManagementPage = () => {
  const [treeItems, setTreeItems] = useState([]);
  const [flatItems, setFlatItems] = useState([]);
  const [availablePages, setAvailablePages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [expandedNodes, setExpandedNodes] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [parentForNewChild, setParentForNewChild] = useState(null);

  const [previewUrl, setPreviewUrl] = useState('');

  const fetchMenuTree = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.get(endpoints.menus.tree, { params: { all: 'true' } });
      const items = res.data.data?.items || [];
      const flat = res.data.data?.flat || [];
      setTreeItems(items);
      setFlatItems(flat);

      const initExpanded = {};
      flat.forEach((i) => {
        initExpanded[i.id] = true;
      });
      setExpandedNodes(initExpanded);
    } catch (err) {
      console.error('Failed to fetch menu tree:', err);
      toast.error('Failed to load menu hierarchy');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPages = useCallback(async () => {
    try {
      const res = await apiService.get(endpoints.pages.list);
      const pages = res.data.data?.pages || [];
      setAvailablePages(pages);
    } catch (err) {
      console.error('Failed to fetch pages from Page Management:', err);
      setAvailablePages([]);
    }
  }, []);

  useEffect(() => {
    fetchMenuTree();
    fetchPages();
  }, [fetchMenuTree, fetchPages]);

  const toggleExpand = (id) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const all = {};
    flatItems.forEach((i) => (all[i.id] = true));
    setExpandedNodes(all);
  };

  const collapseAll = () => {
    setExpandedNodes({});
  };

  const handleToggleStatus = async (id) => {
    try {
      await apiService.patch(endpoints.menus.toggleStatus(id));
      toast.success('Status updated');
      fetchMenuTree();
      window.dispatchEvent(new CustomEvent('permissions-updated'));
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error('Failed to update status');
    }
  };

  const handleDeleteItem = async (item) => {
    if (item.children && item.children.length > 0) {
      toast.error('Cannot delete menu item with sub-menu items assigned to it');
      return;
    }
    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      try {
        await apiService.delete(endpoints.menus.delete(item.id));
        toast.success('Menu item deleted');
        fetchMenuTree();
        window.dispatchEvent(new CustomEvent('permissions-updated'));
      } catch (err) {
        const msg = err.response?.data?.message || 'Failed to delete menu item';
        toast.error(msg);
      }
    }
  };

  const handleMoveOrder = async (item, direction, siblings) => {
    const idx = siblings.findIndex((s) => s.id === item.id);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= siblings.length) return;

    const targetItem = siblings[targetIdx];
    const updatePayload = [
      { id: item.id, parent_id: item.parent_id, display_order: targetItem.display_order || targetIdx },
      { id: targetItem.id, parent_id: targetItem.parent_id, display_order: item.display_order || idx }
    ];

    try {
      await apiService.put(endpoints.menus.reorder, { items: updatePayload });
      toast.success('Order updated');
      fetchMenuTree();
      window.dispatchEvent(new CustomEvent('permissions-updated'));
    } catch (err) {
      console.error('Failed to reorder menu items:', err);
      toast.error('Failed to reorder menu items');
    }
  };

  const renderTreeNodes = (nodes, level = 1, siblings = []) => {
    if (!Array.isArray(nodes) || nodes.length === 0) return null;

    return nodes
      .filter((node) => {
        if (typeFilter && node.type !== typeFilter) return false;
        if (searchTerm) {
          const matchSelf = node.name.toLowerCase().includes(searchTerm.toLowerCase()) || node.url.toLowerCase().includes(searchTerm.toLowerCase());
          const matchChildren = node.children && node.children.some((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
          return matchSelf || matchChildren;
        }
        return true;
      })
      .map((node, index) => {
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = Boolean(expandedNodes[node.id]);

        return (
          <React.Fragment key={node.id}>
            <tr className="hover:bg-gray-50/80 dark:hover:bg-gray-700/40 transition-colors border-b border-gray-100 dark:border-gray-700/60">
              {/* Name & Hierarchy */}
              <td className="py-3 px-4">
                <div className="flex items-center" style={{ paddingLeft: `${(level - 1) * 1.5}rem` }}>
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={() => toggleExpand(node.id)}
                      className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-md mr-1.5 transition-transform"
                    >
                      <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                  ) : (
                    <span className="w-6 inline-block" />
                  )}

                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 text-[#00629F] dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
                      {renderMenuIcon(node.icon)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${level === 1 ? 'font-bold text-gray-900 dark:text-white' : level === 2 ? 'font-semibold text-gray-800 dark:text-gray-200' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                        {node.name}
                      </span>
                      {node.badge_label && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00629F]/10 text-[#00629F] dark:bg-[#00629F]/30 dark:text-sky-300 border border-[#00629F]/20 uppercase tracking-wide">
                          {node.badge_label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </td>

              {/* Type Badge */}
              <td className="py-3 px-4">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${TYPE_CONFIG[node.type]?.bg || 'bg-gray-100 text-gray-800'}`}>
                  {TYPE_CONFIG[node.type]?.label || node.type}
                </span>
              </td>

              {/* URL Route */}
              <td className="py-3 px-4 text-xs font-mono text-gray-600 dark:text-gray-400">
                {node.url ? (
                  <span className="flex items-center gap-1">
                    {node.url}
                    {node.is_external && <ExternalLink className="h-3 w-3 text-[#00629F] inline" />}
                  </span>
                ) : (
                  <span className="text-gray-400 italic">None (Section Header)</span>
                )}
              </td>

              {/* Status Toggle */}
              <td className="py-3 px-4">
                <button
                  onClick={() => handleToggleStatus(node.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                    node.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                      : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                  }`}
                >
                  {node.status === 'active' ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Active
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" /> Disabled
                    </>
                  )}
                </button>
              </td>

              {/* Actions */}
              <td className="py-3 px-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  {/* Add Sub Item */}
                  {node.type !== 'child' && (
                    <button
                      onClick={() => {
                        setSelectedItem(null);
                        setParentForNewChild(node);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 text-[#00629F] hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors flex items-center gap-1"
                      title="Add Sub-Menu / Child Menu"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  )}

                  {/* Move Up */}
                  <button
                    onClick={() => handleMoveOrder(node, 'up', siblings)}
                    disabled={index === 0}
                    className="p-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 rounded-lg"
                    title="Move Up"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>

                  {/* Move Down */}
                  <button
                    onClick={() => handleMoveOrder(node, 'down', siblings)}
                    disabled={index === siblings.length - 1}
                    className="p-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 rounded-lg"
                    title="Move Down"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => {
                      setSelectedItem(node);
                      setParentForNewChild(null);
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 text-[#00629F] hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                    title="Edit Item"
                  >
                    <Edit className="h-4 w-4" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDeleteItem(node)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                    title="Delete Item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>

            {hasChildren && isExpanded && renderTreeNodes(node.children, level + 1, node.children)}
          </React.Fragment>
        );
      });
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/60">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-[#00629F] to-[#004774] text-white shadow-md shadow-[#00629F]/20">
                <FolderTree className="h-6 w-6" />
              </div>
              Menu Management
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Configure 4-Level Sidebar Hierarchy (**Section Label → Menu → Sub Menu → Child Menu**) with Custom Display Labels/Badges.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedItem(null);
                setParentForNewChild(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#00629F] hover:bg-[#00558c] text-white shadow-md shadow-[#00629F]/20 transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add Menu Item
            </button>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/60">
          <div className="flex flex-1 items-center gap-3 w-full">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search menu items by name, badge, or route..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-[#00629F]"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-[#00629F]"
            >
              <option value="">All Item Levels</option>
              <option value="section">Section Labels</option>
              <option value="menu">Menus (Level 1)</option>
              <option value="submenu">Sub Menus (Level 2)</option>
              <option value="child">Child Menus (Level 3)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-700"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-700"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Tree View Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/60 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : treeItems.length === 0 ? (
            <div className="text-center py-16 px-4">
              <FolderTree className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">No menu items found.</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold bg-[#00629F] text-white shadow-md shadow-[#00629F]/20"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Your First Menu Item
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-900/30 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    <th className="py-3.5 px-4">Menu Hierarchy & Label</th>
                    <th className="py-3.5 px-4">Level Type</th>
                    <th className="py-3.5 px-4">URL Route</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                  {renderTreeNodes(treeItems, 1, treeItems)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <MenuModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedItem(null);
          setParentForNewChild(null);
        }}
        item={selectedItem}
        parentItem={parentForNewChild}
        flatItems={flatItems}
        availablePages={availablePages}
        onSave={fetchMenuTree}
      />

      {previewUrl && (
        <ZoomableIframeModal
          isOpen={Boolean(previewUrl)}
          onClose={() => setPreviewUrl('')}
          url={previewUrl}
          pageName="Menu Preview"
        />
      )}
    </Layout>
  );
};

export default MenuManagementPage;
