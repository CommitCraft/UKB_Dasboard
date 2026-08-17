import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Users,
  FileText,
  CheckSquare,
  Square,
  Search,
  Settings,
  ChevronLeft,
  ChevronRight,
  Lock,
  Crown,
  Award,
  UserCheck,
  Key,
  Star,
  Sliders,
  Database,
  Activity,
  Globe,
  BarChart2,
  Briefcase,
  Terminal,
  Feather,
  Target,
  Eye
} from "lucide-react";
import Layout from "../components/Layout/Layout";
import { apiService, endpoints } from "../utils/api";
import { formatDateTime } from "../utils/helpers";
import LoadingSpinner from "../components/LoadingSpinner";
import PageArrangement from "../components/PageArrangement";
import toast from "react-hot-toast";

// Role Icons Dictionary
const ROLE_ICON_OPTIONS = [
  { name: 'Shield', icon: Shield, label: 'Shield' },
  { name: 'Lock', icon: Lock, label: 'Security' },
  { name: 'Crown', icon: Crown, label: 'Admin / Super' },
  { name: 'Award', icon: Award, label: 'Manager' },
  { name: 'UserCheck', icon: UserCheck, label: 'User Access' },
  { name: 'Key', icon: Key, label: 'Permissions' },
  { name: 'Users', icon: Users, label: 'Team' },
  { name: 'Star', icon: Star, label: 'Special' },
  { name: 'Settings', icon: Settings, label: 'Settings' },
  { name: 'Sliders', icon: Sliders, label: 'Control' },
  { name: 'FileText', icon: FileText, label: 'Content' },
  { name: 'Database', icon: Database, label: 'Database' },
  { name: 'Activity', icon: Activity, label: 'Audit' },
  { name: 'Globe', icon: Globe, label: 'Public' },
  { name: 'BarChart2', icon: BarChart2, label: 'Reports' },
  { name: 'Briefcase', icon: Briefcase, label: 'Business' },
  { name: 'Terminal', icon: Terminal, label: 'Developer' },
  { name: 'Feather', icon: Feather, label: 'Editor' },
  { name: 'Target', icon: Target, label: 'Supervisor' },
  { name: 'Eye', icon: Eye, label: 'Viewer' },
];

const renderRoleIcon = (iconName) => {
  if (!iconName) {
    return <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />;
  }
  const matched = ROLE_ICON_OPTIONS.find(opt => opt.name === iconName);
  if (matched) {
    const IconComp = matched.icon;
    return <IconComp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />;
  }
  return <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />;
};

const RoleModal = ({ isOpen, onClose, role, pages, onSave }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "Shield",
    page_ids: [],
    pagesWithOrder: [],
  });
  const [loading, setLoading] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const loadRolePageOrder = async () => {
      if (role && role.id) {
        setLoadingOrder(true);
        try {
          const response = await apiService.get(endpoints.roles.pageOrder(role.id));
          let pageOrder = response.data.data?.pages || response.data.pages || [];
          
          if ((!pageOrder || pageOrder.length === 0) && role.page_ids && role.page_ids.length > 0 && pages && pages.length > 0) {
            pageOrder = pages
              .filter(p => role.page_ids.includes(p.id) || role.page_ids.includes(String(p.id)) || role.page_ids.includes(Number(p.id)))
              .map((p, idx) => ({
                page_id: p.id,
                name: p.name,
                url: p.url,
                icon: p.icon,
                parent_page_id: null,
                display_order: idx
              }));
          }
          
          setFormData({
            name: role.name || "",
            description: role.description || "",
            icon: role.icon || "Shield",
            page_ids: role.page_ids || [],
            pagesWithOrder: pageOrder,
          });
        } catch (error) {
          console.error('Failed to load role page order:', error);
          let fallbackOrder = [];
          if (role.page_ids && role.page_ids.length > 0 && pages && pages.length > 0) {
            fallbackOrder = pages
              .filter(p => role.page_ids.includes(p.id) || role.page_ids.includes(String(p.id)) || role.page_ids.includes(Number(p.id)))
              .map((p, idx) => ({
                page_id: p.id,
                name: p.name,
                url: p.url,
                icon: p.icon,
                parent_page_id: null,
                display_order: idx
              }));
          }
          setFormData({
            name: role.name || "",
            description: role.description || "",
            icon: role.icon || "Shield",
            page_ids: role.page_ids || [],
            pagesWithOrder: fallbackOrder,
          });
        } finally {
          setLoadingOrder(false);
        }
      } else {
        setFormData({
          name: "",
          description: "",
          icon: "Shield",
          page_ids: [],
          pagesWithOrder: [],
        });
      }
      setErrors({});
    };
    
    if (isOpen) {
      loadRolePageOrder();
    }
  }, [role, isOpen, pages]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Role name is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const submitData = {
        name: formData.name,
        description: formData.description,
        icon: formData.icon,
        pagesWithOrder: formData.pagesWithOrder,
      };

      if (role) {
        await apiService.put(`${endpoints.roles.list}/${role.id}`, submitData);
        toast.success("Role updated successfully");
      } else {
        await apiService.post(endpoints.roles.list, submitData);
        toast.success("Role created successfully");
      }

      onSave();
      onClose();
    } catch (error) {
      const message = error.response?.data?.message || "Failed to save role";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handlePageOrderChange = (orderedPages) => {
    setFormData((prev) => ({
      ...prev,
      pagesWithOrder: orderedPages,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            {role ? "Edit Role" : "Add New Role"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Role Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white ${
                errors.name
                  ? "border-red-300 dark:border-red-600"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              placeholder="Enter role name (e.g. Sales Manager)"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.name}
              </p>
            )}
          </div>

          {/* Role Icon Picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Role Icon
              </label>
              {formData.icon && (
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
                  Selected: {formData.icon}
                </span>
              )}
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 max-h-36 overflow-y-auto">
              {ROLE_ICON_OPTIONS.map((item) => {
                const IconComponent = item.icon;
                const isSelected = formData.icon === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, icon: item.name }))}
                    title={item.label}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-indigo-100 dark:bg-indigo-900/40 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-bold shadow-sm ring-2 ring-indigo-500/20'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
                    }`}
                  >
                    <IconComponent className="h-5 w-5 mb-1" />
                    <span className="text-[10px] truncate max-w-full text-center">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={2}
              className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white ${
                errors.description
                  ? "border-red-300 dark:border-red-600"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              placeholder="Enter role description"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.description}
              </p>
            )}
          </div>

          {/* Page Permissions with Arrangement */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Page Permissions & Menu Structure
            </h4>
            {loadingOrder ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="md" />
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading page order...</span>
              </div>
            ) : (
              <PageArrangement
                pages={pages}
                value={formData.pagesWithOrder}
                initialPagesWithOrder={formData.pagesWithOrder}
                onChange={handlePageOrderChange}
              />
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center shadow-md shadow-indigo-600/20"
            >
              {loading && <LoadingSpinner size="sm" className="mr-2" />}
              {role ? "Update Role" : "Create Role"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const RolesPage = () => {
  const [roles, setRoles] = useState([]);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const rolesPerPage = 10;

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);

      const response = await apiService.get(endpoints.roles.list, {
        params: { _t: Date.now() },
        headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
      });

      const newRoles = response.data.data?.roles || [];
      setRoles(newRoles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast.error("Failed to fetch roles");
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPages = useCallback(async () => {
    try {
      const response = await apiService.get(endpoints.pages.list);
      const allPages = response.data.data?.pages || [];

      const unwantedPages = [
        "activity logs",
        "company website",
        "documentation",
        "help center",
      ];
      const filteredPages = allPages.filter(
        (page) =>
          !unwantedPages.some((unwanted) =>
            page.name?.toLowerCase().includes(unwanted.toLowerCase())
          )
      );

      setPages(filteredPages);
    } catch (error) {
      console.error("Error fetching pages:", error);
      setPages([]);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
    fetchPages();
  }, [fetchRoles, fetchPages]);

  const handleDeleteRole = async (roleId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this role? Users with this role will lose their permissions."
      )
    ) {
      try {
        await apiService.delete(`${endpoints.roles.list}/${roleId}`);
        toast.success("Role deleted successfully");
        fetchRoles();
      } catch (error) {
        const message =
          error.response?.data?.message || "Failed to delete role";
        toast.error(message);
      }
    }
  };

  const handleAddRole = () => {
    setSelectedRole(null);
    setIsModalOpen(true);
  };

  const handleEditRole = (role) => {
    setSelectedRole(role);
    setIsModalOpen(true);
  };

  const filteredRoles = useMemo(() => {
    return Array.isArray(roles)
      ? roles.filter(
          (role) =>
            role.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            role.description?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : [];
  }, [roles, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredRoles.length / rolesPerPage));
  const paginatedRoles = filteredRoles.slice(
    (currentPage - 1) * rolesPerPage,
    currentPage * rolesPerPage
  );

  const getAssignedPagesDisplay = (pageIds, rolePages) => {
    if (rolePages && Array.isArray(rolePages) && rolePages.length > 0) {
      return rolePages.length <= 3
        ? rolePages.join(", ")
        : `${rolePages.slice(0, 3).join(", ")} +${rolePages.length - 3} more`;
    }

    if (
      pageIds &&
      Array.isArray(pageIds) &&
      pageIds.length > 0 &&
      pages.length > 0
    ) {
      const assignedPages = pages.filter(
        (page) =>
          pageIds.includes(parseInt(page.id)) ||
          pageIds.includes(String(page.id))
      );

      if (assignedPages.length > 0) {
        const names = assignedPages.map((p) => p.name);
        return names.length <= 3
          ? names.join(", ")
          : `${names.slice(0, 3).join(", ")} +${names.length - 3} more`;
      }
    }

    return "No pages assigned";
  };

  const getPageCount = (pageIds, rolePages) => {
    if (rolePages && Array.isArray(rolePages)) return rolePages.length;
    if (pageIds && Array.isArray(pageIds)) return pageIds.length;
    return 0;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/60">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20">
                <Shield className="h-6 w-6" />
              </div>
              Roles Management
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Configure roles, role icons, and assign page permissions.
            </p>
          </div>

          <button
            onClick={handleAddRole}
            className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Role
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/60">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search roles by name or description..."
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
                    <th className="py-4 px-6">Role & Icon</th>
                    <th className="py-4 px-6">Assigned Pages</th>
                    <th className="py-4 px-6">Users</th>
                    <th className="py-4 px-6">Created</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 text-sm">
                  {paginatedRoles.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-16 text-center">
                        <Shield className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">No roles found matching criteria.</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedRoles.map((role) => (
                      <tr key={role.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center border border-indigo-100 dark:border-indigo-800/50">
                              {renderRoleIcon(role.icon)}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {role.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {role.description}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6 text-gray-700 dark:text-gray-300">
                          {getAssignedPagesDisplay(role.page_ids, role.pages)}
                          <span className="ml-1 text-xs text-gray-400">
                            ({getPageCount(role.page_ids, role.pages)})
                          </span>
                        </td>

                        <td className="py-4 px-6 text-gray-700 dark:text-gray-300">
                          <div className="flex items-center gap-1.5">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{role.user_count || 0}</span>
                          </div>
                        </td>

                        <td className="py-4 px-6 text-xs text-gray-500 dark:text-gray-400">
                          {role.created_at ? formatDateTime(role.created_at) : "Unknown"}
                        </td>

                        <td className="py-4 px-6 text-right space-x-2">
                          <button
                            onClick={() => handleEditRole(role)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all"
                            title="Edit Role"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRole(role.id)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all"
                            title="Delete Role"
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
                <span className="font-semibold text-gray-900 dark:text-white">{totalPages}</span> ({filteredRoles.length} roles)
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
      </div>

      <RoleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        role={selectedRole}
        pages={pages}
        onSave={fetchRoles}
      />
    </Layout>
  );
};

export default RolesPage;
