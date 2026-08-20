import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  ExternalLink, 
  Home, 
  Search, 
  Link as LinkIcon, 
  Eye, 
  Shield, 
  Globe, 
  Monitor, 
  LayoutDashboard, 
  Users, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiService, endpoints } from '../utils/api';
import { isValidUrl } from '../utils/helpers';
import { renderAppIcon } from '../utils/iconMap';
import IconPicker from '../components/IconPicker';
import LoadingSpinner from '../components/LoadingSpinner';
import PageHeader from '../components/PageHeader';
import ZoomableIframeModal from '../components/ZoomableIframeModal';
import toast from 'react-hot-toast';

const renderPageIcon = (iconNameOrUrl, className = "h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0") => {
  return renderAppIcon(iconNameOrUrl, { className, defaultIcon: FileText });
};

const PageModal = ({ isOpen, onClose, page, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    url_type: 'internal',
    icon: 'FileText',
    is_active: true
  });
  const [iconFile, setIconFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (page) {
      setFormData({
        name: page.name || '',
        url: page.url || '',
        url_type: page.is_external ? 'external' : 'internal',
        icon: page.icon || 'FileText',
        is_active: page.status === 'active'
      });
    } else {
      setFormData({
        name: '',
        url: '',
        url_type: 'internal',
        icon: 'FileText',
        is_active: true
      });
    }
    setIconFile(null);
    setErrors({});
  }, [page, isOpen]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Page name is required';
    }
    
    if (!formData.url.trim()) {
      newErrors.url = 'URL is required';
    } else if (formData.url_type === 'external' && !isValidUrl(formData.url)) {
      newErrors.url = 'Please enter a valid URL';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const formDataToSend = new FormData();
      
      const backendData = {
        name: formData.name,
        url: formData.url,
        is_external: formData.url_type === 'external' ? 1 : 0,
        status: formData.is_active ? 'active' : 'inactive',
        icon: formData.icon
      };
      
      Object.keys(backendData).forEach(key => {
        formDataToSend.append(key, backendData[key]);
      });

      if (iconFile) {
        formDataToSend.append('icon', iconFile);
      }
      
      if (page) {
        await apiService.put(`${endpoints.pages.list}/${page.id}`, formDataToSend);
        toast.success('Page updated successfully');
      } else {
        await apiService.post(endpoints.pages.list, formDataToSend);
        toast.success('Page created successfully');
      }
      
      onSave();
      onClose();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to save page';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-gray-700">
        <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            {page ? 'Edit Page' : 'Add New Page'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer">
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {/* Page Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Page Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white ${
                errors.name ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Enter page name (e.g. Sales Reports)"
            />
            {errors.name && (
              <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">{errors.name}</p>
            )}
          </div>

          {/* Searchable Icon Picker & Custom Upload */}
          <div>
            <IconPicker
              value={formData.icon}
              onChange={(iconName) => {
                setFormData(prev => ({ ...prev, icon: iconName }));
                setIconFile(null);
              }}
              label="Page Icon"
            />

            {/* Custom Icon Image Upload */}
            <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium shrink-0">Or upload:</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setIconFile(e.target.files[0]);
                  }
                }}
                className="text-xs text-gray-500 file:mr-1.5 file:py-0.5 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900/50 dark:file:text-indigo-300"
              />
              {iconFile && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium truncate">
                  {iconFile.name}
                </span>
              )}
            </div>
          </div>

          {/* URL Type */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
              URL Type
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="url_type"
                  value="internal"
                  checked={formData.url_type === 'internal'}
                  onChange={handleInputChange}
                  className="h-3.5 w-3.5 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="ml-1.5 text-xs text-gray-900 dark:text-white">Internal Route</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="url_type"
                  value="external"
                  checked={formData.url_type === 'external'}
                  onChange={handleInputChange}
                  className="h-3.5 w-3.5 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="ml-1.5 text-xs text-gray-900 dark:text-white">External URL</span>
              </label>
            </div>
          </div>

          {/* URL */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
              {formData.url_type === 'internal' ? 'Route Path' : 'External URL'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {formData.url_type === 'internal' ? (
                  <Home className="h-3.5 w-3.5 text-gray-400" />
                ) : (
                  <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
                )}
              </div>
              <input
                type="text"
                name="url"
                value={formData.url}
                onChange={handleInputChange}
                className={`w-full pl-9 pr-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white ${
                  errors.url ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder={formData.url_type === 'internal' ? '/dashboard' : 'https://example.com'}
              />
            </div>
            {errors.url && (
              <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">{errors.url}</p>
            )}
          </div>

          {/* Active Status */}
          <div>
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                className="h-3.5 w-3.5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="text-xs text-gray-900 dark:text-white font-medium">Active</span>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center shadow-md shadow-indigo-600/20"
            >
              {loading && <LoadingSpinner size="sm" className="mr-2" />}
              {page ? 'Update Page' : 'Create Page'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PagesPage = () => {
  const { hasRole } = useAuth();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState(null);

  // Preview Page State
  const [previewPage, setPreviewPage] = useState(null);

  const fetchPages = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = hasRole('Super Admin') ? endpoints.pages.list : endpoints.pages.myPages;
      const response = await apiService.get(endpoint);
      setPages(response.data.data?.pages || response.data.pages || response.data.data || []);
    } catch (error) {
      console.error('Error fetching pages:', error);
      toast.error('Failed to fetch pages');
      setPages([]);
    } finally {
      setLoading(false);
    }
  }, [hasRole]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const handleDeletePage = async (pageId) => {
    if (window.confirm('Are you sure you want to delete this page? This will also remove it from all roles.')) {
      try {
        await apiService.delete(`${endpoints.pages.list}/${pageId}`);
        toast.success('Page deleted successfully');
        fetchPages();
      } catch (error) {
        const message = error.response?.data?.message || 'Failed to delete page';
        toast.error(message);
      }
    }
  };

  const handleAddPage = () => {
    setSelectedPage(null);
    setIsModalOpen(true);
  };

  const handleEditPage = (page) => {
    setSelectedPage(page);
    setIsModalOpen(true);
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredPages = pages.filter(page =>
    page.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (page.url || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredPages.length / itemsPerPage));
  const paginatedPages = filteredPages.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
        {/* Header */}
        <PageHeader
          icon={<FileText className="h-6 w-6" />}
          title="Pages Management"
          subtitle="Manage system pages, internal routes, icons, and live page previews."
          actions={
            <button
              onClick={handleAddPage}
              className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#00629F] hover:bg-[#00558c] text-white shadow-md shadow-[#00629F]/20 transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Page
            </button>
          }
        />

        {/* Toolbar */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/60">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search pages by name or URL..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/60 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-900/30 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    <th className="py-4 px-6">Page & Icon</th>
                    <th className="py-4 px-6">Route / URL</th>
                    <th className="py-4 px-6">Type</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 text-sm">
                  {paginatedPages.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-16 text-center">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">No pages found matching criteria.</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedPages.map((page) => (
                      <tr key={page.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center border border-indigo-100 dark:border-indigo-800/50">
                              {renderPageIcon(page.icon)}
                            </div>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {page.name}
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-6 font-mono text-xs">
                          {page.url ? (
                            <span className="text-indigo-600 dark:text-indigo-400">{page.url}</span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 italic">— no route —</span>
                          )}
                        </td>

                        <td className="py-4 px-6">
                          {page.is_external ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                              <ExternalLink className="h-3 w-3 mr-1" /> External
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                              <Home className="h-3 w-3 mr-1" /> Internal
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            page.status === 'active' 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {page.status}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-right space-x-2">
                          <button
                            onClick={() => setPreviewPage(page)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all"
                            title="Preview / View Page"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditPage(page)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all"
                            title="Edit Page"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePage(page.id)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all"
                            title="Delete Page"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-900/30">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Showing page <span className="font-semibold text-gray-900 dark:text-white">{currentPage}</span> of{' '}
                <span className="font-semibold text-gray-900 dark:text-white">{totalPages}</span> ({filteredPages.length} pages)
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

        <PageModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          page={selectedPage}
          onSave={fetchPages}
        />

        {/* Live View / Preview Page Modal */}
        {previewPage && (
          <ZoomableIframeModal
            isOpen={!!previewPage}
            onClose={() => setPreviewPage(null)}
            title={`Preview: ${previewPage.name}`}
            url={previewPage.url}
          />
        )}
      </div>
  );
};

export default PagesPage;