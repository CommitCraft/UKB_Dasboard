import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Link,
  useLocation,
  useNavigate,
  Outlet,
} from "react-router-dom";

import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Globe,
  LogOut,
  Menu,
  Moon,
  Sun,
  User,
  X,
} from "lucide-react";
import { getIconComponent, renderAppIcon } from "../../utils/iconMap";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { apiService } from "../../utils/api";
import SidebarHeader from "./SidebarHeader";

/* -------------------------------------------------------------------------- */
/*                            NavItemTree Component                           */
/* -------------------------------------------------------------------------- */

const NavItemTree = ({
  pages,
  level = 1,
  expandedMenus,
  toggleMenu,
  onClose,
  isActive,
  isExternalPage,
  formatUrl,
  getPageIcon,
  location,
}) => {
  if (!Array.isArray(pages) || pages.length === 0) return null;

  return (
    <ul className={level === 1 ? "space-y-1.5" : level === 2 ? "space-y-1 mt-1" : "space-y-1 mt-1"}>
      {pages.map((page, pageIndex) => {
        const external = isExternalPage(page);
        const href = formatUrl(page?.url);

        const pageActive = external
          ? location.pathname === "/external" && new URLSearchParams(location.search).get("url") === href
          : isActive(href);

        const hasChildren = Array.isArray(page?.children) && page.children.length > 0;

        const pageKey =
          page?.id ??
          `assigned-page-lvl${level}-${page?.name || "untitled"}-${page?.url || ""}-${pageIndex}`;

        const expanded = Boolean(expandedMenus[pageKey]);
        const PageIcon =
          page?.icon && (typeof page.icon === "function" || typeof page.icon === "object")
            ? page.icon
            : getPageIcon(page);

        const targetUrl = external
          ? `/external?url=${encodeURIComponent(href)}&title=${encodeURIComponent(page?.name || "")}`
          : href;

        // Render Section Header Label
        if (page?.type === "section") {
          return (
            <li key={pageKey} className="mt-4 mb-1">
              <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center justify-between">
                <span>{page?.name}</span>
              </div>
              {hasChildren && (
                <div className="mt-1">
                  <NavItemTree
                    pages={page.children}
                    level={1}
                    expandedMenus={expandedMenus}
                    toggleMenu={toggleMenu}
                    onClose={onClose}
                    isActive={isActive}
                    isExternalPage={isExternalPage}
                    formatUrl={formatUrl}
                    getPageIcon={getPageIcon}
                    location={location}
                  />
                </div>
              )}
            </li>
          );
        }

        const isLvl1 = level === 1;
        const isLvl2 = level === 2;

        const linkStyle = isLvl1
          ? `group flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
              pageActive
                ? "bg-gradient-to-r from-[#00629F] to-[#004774] text-white shadow-md shadow-[#00629F]/25 scale-[1.01]"
                : "text-gray-700 hover:translate-x-1 hover:bg-gray-100/80 dark:text-gray-200 dark:hover:bg-gray-700/60"
            }`
          : isLvl2
          ? `group flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200 ${
              pageActive
                ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border-l-2 border-indigo-600"
                : "text-gray-600 hover:translate-x-1 hover:bg-gray-100/60 dark:text-gray-300 dark:hover:bg-gray-700/40"
            }`
          : `group flex min-w-0 flex-1 items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition-all duration-200 ${
              pageActive
                ? "text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/50 dark:bg-indigo-900/30"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:translate-x-1"
            }`;

        const iconStyle = isLvl1 ? "h-5 w-5 shrink-0" : isLvl2 ? "h-4 w-4 shrink-0" : "h-3.5 w-3.5 shrink-0";

        const btnStyle = isLvl1
          ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all duration-200"
          : "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-all duration-200";

        const subTreeWrapper = isLvl1
          ? "ml-4 pl-3 border-l-2 border-indigo-100 dark:border-gray-700"
          : "ml-4 pl-3 border-l border-dashed border-gray-300 dark:border-gray-700";

        const isActionable = page?.url && page.url !== '#' && page.url.trim() !== '';

        return (
          <li key={pageKey}>
            <div className="flex items-center gap-1">
              {isActionable ? (
                <Link to={targetUrl} onClick={onClose} className={linkStyle}>
                  <PageIcon className={`${iconStyle} ${pageActive && isLvl1 ? "text-white" : ""}`} />
                  <span className="min-w-0 truncate">{page?.name}</span>
                  {page?.badge_label && (
                    <span className={`ml-auto px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide shrink-0 ${
                      pageActive && isLvl1
                        ? "bg-white/20 text-white"
                        : "bg-[#00629F]/15 text-[#00629F] dark:bg-indigo-900/50 dark:text-indigo-300"
                    }`}>
                      {page.badge_label}
                    </span>
                  )}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => toggleMenu(pageKey)}
                  className={`${linkStyle} text-left cursor-pointer`}
                >
                  <PageIcon className={`${iconStyle} ${pageActive && isLvl1 ? "text-white" : ""}`} />
                  <span className="min-w-0 truncate">{page?.name}</span>
                  {page?.badge_label && (
                    <span className={`ml-auto px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide shrink-0 ${
                      pageActive && isLvl1
                        ? "bg-white/20 text-white"
                        : "bg-[#00629F]/15 text-[#00629F] dark:bg-indigo-900/50 dark:text-indigo-300"
                    }`}>
                      {page.badge_label}
                    </span>
                  )}
                </button>
              )}

              {hasChildren && (
                <button
                  type="button"
                  onClick={() => toggleMenu(pageKey)}
                  className={`${btnStyle} ${
                    pageActive && isLvl1
                      ? "bg-indigo-700 text-white"
                      : "text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                  }`}
                  aria-expanded={expanded}
                  aria-label={expanded ? `Collapse ${page?.name}` : `Expand ${page?.name}`}
                >
                  <ChevronRight className={`h-4 w-4 shrink-0 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`} />
                </button>
              )}
            </div>

            {/* Render Submenu (Level 2) / Child Menu (Level 3+) with smooth animation */}
            {hasChildren && (
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  expanded ? "max-h-[1000px] opacity-100 mt-1" : "max-h-0 opacity-0"
                } ${subTreeWrapper}`}
              >
                <NavItemTree
                  pages={page.children}
                  level={level + 1}
                  expandedMenus={expandedMenus}
                  toggleMenu={toggleMenu}
                  onClose={onClose}
                  isActive={isActive}
                  isExternalPage={isExternalPage}
                  formatUrl={formatUrl}
                  getPageIcon={getPageIcon}
                  location={location}
                />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
};

/* -------------------------------------------------------------------------- */
/*                                  Sidebar                                   */
/* -------------------------------------------------------------------------- */

const Sidebar = ({ isOpen, onClose, onOpenProfileSettings }) => {
  const location = useLocation();
  const { user } = useAuth();

  const [myPages, setMyPages] = useState([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});

  const menuItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: "LayoutDashboard",
      roles: ["Super Admin", "Admin", "Manager", "User"],
    },
    {
      name: "Users",
      path: "/users",
      icon: "Users",
      roles: ["Super Admin", "Admin"],
    },
    {
      name: "Roles",
      path: "/roles",
      icon: "Shield",
      roles: ["Super Admin", "Admin"],
    },
    {
      name: "Pages",
      path: "/pages",
      icon: "FileText",
      roles: ["Super Admin", "Admin"],
    },
    {
      name: "Menu Management",
      path: "/menus",
      icon: "FolderTree",
      roles: ["Super Admin", "Admin"],
    },
    {
      name: "Activity Logs",
      path: "/activity",
      icon: "Activity",
      roles: ["Super Admin", "Admin", "Manager"],
    },
  ];

  const roleMapping = {
    super_admin: "Super Admin",
    admin: "Admin",
    manager: "Manager",
    user: "User",
  };

  const filteredMenuItems = menuItems.filter((item) => {
    if (!Array.isArray(user?.roles)) {
      return false;
    }

    return user.roles.some((role) => {
      const roleName =
        typeof role === "string"
          ? role
          : role?.name;

      const displayRole =
        roleMapping[roleName] || roleName;

      return item.roles.includes(displayRole);
    });
  });

  const formatUrl = (url) => {
    if (!url) {
      return "#";
    }

    if (
      url.startsWith("http://") ||
      url.startsWith("https://")
    ) {
      return url;
    }

    return url.startsWith("/")
      ? url
      : `/${url}`;
  };

  const isActive = (path) => {
    if (!path || path === "#") {
      return false;
    }

    return location.pathname === path;
  };

  const isExternalPage = (page) => {
    return (
      Boolean(page?.is_external) ||
      (
        typeof page?.url === "string" &&
        (
          page.url.startsWith("http://") ||
          page.url.startsWith("https://")
        )
      )
    );
  };

  const toggleMenu = (pageKey) => {
    setExpandedMenus((previous) => ({
      ...previous,
      [pageKey]: !previous[pageKey],
    }));
  };

  const getPageIcon = (page) => {
    if (!page) return Globe;
    if (page.icon) {
      return getIconComponent(page.icon, isExternalPage(page) ? ExternalLink : Globe);
    }
    if (isExternalPage(page)) return ExternalLink;
    return getIconComponent(page.name, Globe);
  };

  const fetchMyPages = useCallback(async () => {
    try {
      if (!user?.id) {
        setMyPages([]);
        return;
      }

      setLoadingPages(true);

      const response = await apiService.get("/menus/tree");

      const items = response?.data?.data?.items || [];
      setMyPages(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error("Failed to load menu tree:", error);
      setMyPages([]);
    } finally {
      setLoadingPages(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchMyPages();
  }, [fetchMyPages]);

  useEffect(() => {
    const handlePermissionsUpdated = () => {
      fetchMyPages();
    };

    window.addEventListener(
      "permissions-updated",
      handlePermissionsUpdated,
    );

    return () => {
      window.removeEventListener(
        "permissions-updated",
        handlePermissionsUpdated,
      );
    };
  }, [fetchMyPages]);

  useEffect(() => {
    if (!Array.isArray(myPages) || myPages.length === 0) return;

    const findActiveKeys = (items) => {
      const keys = {};
      const traverse = (list) => {
        for (const item of list) {
          const itemKey = item.id;
          if (Array.isArray(item.children) && item.children.length > 0) {
            let hasActiveChild = false;
            for (const child of item.children) {
              const childExternal = isExternalPage(child);
              const childHref = formatUrl(child.url);
              const childActive = childExternal
                ? location.pathname === "/external" && new URLSearchParams(location.search).get("url") === childHref
                : isActive(childHref);
              if (childActive) {
                hasActiveChild = true;
                break;
              }
            }
            if (hasActiveChild) {
              keys[itemKey] = true;
            }
            traverse(item.children);
          }
        }
      };
      traverse(items);
      return keys;
    };

    const activeKeys = findActiveKeys(myPages);
    if (Object.keys(activeKeys).length > 0) {
      setExpandedMenus((prev) => ({ ...prev, ...activeKeys }));
    }
  }, [myPages, location.pathname, location.search]);

  const allMenuItems = useMemo(() => {
    if (Array.isArray(myPages) && myPages.length > 0) {
      const filterActive = (items) => {
        return items
          .filter((item) => item.status !== "inactive")
          .map((item) => ({
            ...item,
            children: Array.isArray(item.children) ? filterActive(item.children) : [],
          }));
      };
      return filterActive(myPages);
    }

    return filteredMenuItems.map((item) => ({
      id: `static-${item.path}`,
      name: item.name,
      url: item.path,
      icon: item.icon,
      children: [],
    }));
  }, [myPages, filteredMenuItems]);

  const { logout, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsProfileOpen(false);
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const userRole = user?.roles?.[0]
    ? typeof user.roles[0] === "string"
      ? user.roles[0].replaceAll("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
      : user.roles[0]?.name || "User"
    : "User";

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-50
          flex h-screen w-64 flex-col
          overflow-visible
          border-r border-gray-200
          bg-white
          shadow-sm
          transition-transform duration-300 ease-in-out
          dark:border-gray-700
          dark:bg-gray-800
          ${
            isOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        {/* Header Component */}
        <SidebarHeader onClose={onClose} isOpen={isOpen} />

        {/* Scrollable navigation */}
        <nav
          className="
            min-h-0 flex-1
            overflow-y-auto overflow-x-hidden
            overscroll-contain
            p-4
            [scrollbar-width:thin]
          "
        >
          {loadingPages && allMenuItems.length === 0 ? (
            <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-500 dark:bg-gray-900/30 dark:text-gray-400">
              Loading menu...
            </div>
          ) : (
            <NavItemTree
              pages={allMenuItems}
              level={1}
              expandedMenus={expandedMenus}
              toggleMenu={toggleMenu}
              onClose={onClose}
              isActive={isActive}
              isExternalPage={isExternalPage}
              formatUrl={formatUrl}
              getPageIcon={getPageIcon}
              location={location}
            />
          )}
        </nav>

        {/* User Profile Card & Dropdown at bottom of Sidebar */}
        <div className="shrink-0 p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/80 relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen((prev) => !prev)}
            className="flex w-full items-center gap-2.5 p-1.5 rounded-xl hover:bg-white dark:hover:bg-gray-700/60 transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-600 text-left cursor-pointer"
            aria-expanded={isProfileOpen}
            aria-label="User menu"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#00629F] to-[#004774] text-white shadow-sm">
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-gray-900 dark:text-white">
                {user?.username || "User"}
              </p>
              <p className="truncate text-[11px] font-medium text-gray-500 dark:text-gray-400">
                {user?.email || userRole}
              </p>
            </div>
            <ChevronRight className={`h-4 w-4 text-gray-400 shrink-0 transition-transform duration-200 ${isProfileOpen ? "-rotate-90" : "rotate-0"}`} />
          </button>

          {/* Profile Card Popup Dropdown */}
          {isProfileOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-2 rounded-2xl border border-gray-200 bg-white p-3 shadow-2xl transition-all dark:border-gray-700 dark:bg-gray-800 z-50">
              <div className="flex items-center gap-3 p-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#00629F] to-[#004774] text-white shadow-sm">
                  <User className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-gray-900 dark:text-white">
                    {user?.username || "User"}
                  </p>
                  <p className="truncate text-[11px] text-gray-500 dark:text-gray-400">
                    {user?.email || userRole}
                  </p>
                </div>
              </div>

              <div className="my-2 border-t border-gray-100 dark:border-gray-700" />

              {/* Super Admin Documentation Direct Link */}
              {isSuperAdmin && isSuperAdmin() && (
                <Link
                  to="/docs"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <BookOpen className="h-4 w-4 text-primary-500" />
                  <span>Documentation</span>
                </Link>
              )}

              {/* Profile Settings Item */}
              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  if (onOpenProfileSettings) onOpenProfileSettings();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 cursor-pointer"
              >
                <Settings className="h-4 w-4 text-[#00629F]" />
                <span>Profile Settings</span>
              </button>

              {/* Log Out Item */}
              <button
                type="button"
                onClick={handleLogout}
                className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 cursor-pointer"
              >
                <LogOut className="h-4 w-4 text-red-500" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

/* -------------------------------------------------------------------------- */
/*                            ProfileSettingsModal                            */
/* -------------------------------------------------------------------------- */

const ProfileSettingsModal = ({ isOpen, onClose }) => {
  const { user, updateProfile, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState("info"); // "info" | "password"

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setEmail(user.email || "");
    }
    setErrorMsg("");
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!username.trim()) {
      setErrorMsg("Username is required");
      return;
    }

    setSaving(true);
    try {
      const res = await updateProfile({ username: username.trim(), email: email.trim() });
      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.message || "Failed to update profile");
      }
    } catch (err) {
      setErrorMsg(err.message || "Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!currentPassword) {
      setErrorMsg("Current password is required");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("New passwords do not match");
      return;
    }

    setSaving(true);
    try {
      const res = await changePassword(currentPassword, newPassword);
      if (res.success) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        onClose();
      } else {
        setErrorMsg(res.message || "Failed to change password");
      }
    } catch (err) {
      setErrorMsg(err.message || "Error changing password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between border-b border-gray-200 pb-2.5 dark:border-gray-700">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400">
              <Settings className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Profile Settings
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Manage your account info and security
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => { setActiveTab("info"); setErrorMsg(""); }}
            className={`border-b-2 px-3 py-2 text-xs font-semibold transition-colors ${
              activeTab === "info"
                ? "border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            Personal Information
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("password"); setErrorMsg(""); }}
            className={`border-b-2 px-3 py-2 text-xs font-semibold transition-colors ${
              activeTab === "password"
                ? "border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            Change Password
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-600 dark:bg-red-900/30 dark:text-red-400">
            {errorMsg}
          </div>
        )}

        {/* Tab 1: Profile Info */}
        {activeTab === "info" && (
          <form onSubmit={handleProfileSave} className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                placeholder="Your username"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                placeholder="name@company.com"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:from-primary-600 hover:to-primary-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Change Password */}
        {activeTab === "password" && (
          <form onSubmit={handlePasswordSave} className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                placeholder="At least 6 characters"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                placeholder="Repeat new password"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:from-primary-600 hover:to-primary-700 disabled:opacity-50"
              >
                {saving ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                   Header                                   */
/* -------------------------------------------------------------------------- */

const Header = ({ onMenuClick }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="shrink-0 border-b border-gray-200 bg-white px-4 py-1.5 shadow-xs dark:border-gray-700 dark:bg-gray-800 lg:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <button
            type="button"
            onClick={onMenuClick}
            className="shrink-0 rounded-lg p-1.5 text-gray-500 transition-all hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 lg:hidden cursor-pointer"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-lg bg-gray-100 p-1.5 shadow-xs transition-all hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 cursor-pointer"
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4 text-gray-600" />
            ) : (
              <Sun className="h-4 w-4 text-yellow-500" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

/* -------------------------------------------------------------------------- */
/*                                   Layout                                   */
/* -------------------------------------------------------------------------- */

const Layout = ({ children }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const isFullCanvas = location.pathname === "/external" || location.pathname === "/nodered";

  // Check if rendered inside an iframe (like ZoomableIframeModal preview) or standalone mode
  const isIframe =
    typeof window !== "undefined" &&
    (window.self !== window.top ||
      new URLSearchParams(window.location.search).get("standalone") === "true");

  if (isIframe) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-4 overflow-y-auto">
        {children || <Outlet />}
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenProfileSettings={() => setIsProfileModalOpen(true)}
      />

      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden lg:pl-64">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className={`min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin] ${isFullCanvas ? "p-2 sm:p-2.5 flex flex-col" : "p-4 sm:p-6"}`}>
          {children || <Outlet />}
        </main>

        <footer className="shrink-0 border-t border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-1.5 sm:flex-row">
            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()}{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                Aplos Logix
              </span>
              . All rights reserved.
            </p>

            <div className="flex items-center gap-3 text-[11px] font-medium text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span>System Operational</span>
              </div>
              <span>•</span>
              <span className="rounded-md bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] dark:bg-gray-700 dark:text-gray-300">
                v1.0.0
              </span>
            </div>
          </div>
        </footer>
      </div>

      {/* Root Level Profile Settings Modal (Outside Sidebar) */}
      <ProfileSettingsModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
};

export default Layout;