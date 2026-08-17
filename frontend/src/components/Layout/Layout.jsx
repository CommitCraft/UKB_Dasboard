import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  Activity,
  BarChart2,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Cpu,
  Database,
  ExternalLink,
  FileText,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  Shield,
  Sun,
  User,
  Users,
  X,
} from "lucide-react";

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
    <ul
      className={
        level === 1 ? "space-y-2" : level === 2 ? "space-y-1.5" : "space-y-1"
      }
    >
      {pages.map((page, pageIndex) => {
        const external = isExternalPage(page);
        const href = formatUrl(page?.url);

        const pageActive = external
          ? location.pathname === "/external" &&
            new URLSearchParams(location.search).get("url") === href
          : isActive(href);

        const hasChildren =
          Array.isArray(page?.children) && page.children.length > 0;

        const pageKey =
          page?.id ??
          `assigned-page-lvl${level}-${page?.name || "untitled"}-${page?.url || ""}-${pageIndex}`;

        const expanded = Boolean(expandedMenus[pageKey]);
        const PageIcon =
          page?.icon &&
          (typeof page.icon === "function" || typeof page.icon === "object")
            ? page.icon
            : external
            ? ExternalLink
            : getPageIcon(page) || Globe;

        const targetUrl = external
          ? `/external?url=${encodeURIComponent(
              href,
            )}&title=${encodeURIComponent(page?.name || "")}`
          : href;

        // Level 1 = Menu, Level 2 = Submenu, Level 3+ = Child Menu
        const isLvl1 = level === 1;
        const isLvl2 = level === 2;

        const linkStyle = isLvl1
          ? `flex min-w-0 flex-1 items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
              pageActive
                ? "scale-[1.02] bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md"
                : "text-gray-700 hover:translate-x-1 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            }`
          : isLvl2
          ? `flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-200 ${
              pageActive
                ? "scale-[1.01] bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-sm"
                : "text-gray-600 hover:translate-x-1 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            }`
          : `flex min-w-0 flex-1 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200 ${
              pageActive
                ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-xs font-semibold"
                : "text-gray-500 hover:translate-x-1 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            }`;

        const iconStyle = isLvl1
          ? "h-5 w-5 shrink-0"
          : isLvl2
          ? "h-4 w-4 shrink-0"
          : "h-3.5 w-3.5 shrink-0";

        const btnStyle = isLvl1
          ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-200"
          : isLvl2
          ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200"
          : "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200";

        const subTreeWrapper = isLvl1
          ? "ml-3.5 mt-2 border-l-2 border-primary-200/70 pl-2.5 dark:border-gray-700"
          : isLvl2
          ? "ml-3 mt-1.5 border-l-2 border-dashed border-gray-300 pl-2.5 dark:border-gray-600"
          : "ml-2.5 mt-1 border-l border-dotted border-gray-300 pl-2 dark:border-gray-600";

        return (
          <li key={pageKey}>
            <div className="flex items-center gap-1">
              <Link to={targetUrl} onClick={onClose} className={linkStyle}>
                <PageIcon
                  className={`${iconStyle} ${
                    pageActive ? "text-white" : ""
                  }`}
                />
                <span className="min-w-0 truncate">{page?.name}</span>
              </Link>

              {hasChildren && (
                <button
                  type="button"
                  onClick={() => toggleMenu(pageKey)}
                  className={`${btnStyle} ${
                    pageActive
                      ? "bg-primary-600 text-white hover:bg-primary-700"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                  }`}
                  aria-expanded={expanded}
                  aria-label={
                    expanded ? `Collapse ${page?.name}` : `Expand ${page?.name}`
                  }
                >
                  {expanded ? (
                    <ChevronDown className="h-4 w-4 shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0" />
                  )}
                </button>
              )}
            </div>

            {/* Render Submenu (Level 2) / Child Menu (Level 3+) */}
            {hasChildren && expanded && (
              <div className={subTreeWrapper}>
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

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user } = useAuth();

  const [myPages, setMyPages] = useState([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});

  const menuItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
      roles: ["Super Admin", "Admin", "Manager", "User"],
    },
    {
      name: "Users",
      path: "/users",
      icon: Users,
      roles: ["Super Admin", "Admin"],
    },
    {
      name: "Roles",
      path: "/roles",
      icon: Shield,
      roles: ["Super Admin", "Admin"],
    },
    {
      name: "Pages",
      path: "/pages",
      icon: FileText,
      roles: ["Super Admin", "Admin"],
    },
    {
      name: "Activity Logs",
      path: "/activity",
      icon: Activity,
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
    const path = formatUrl(page?.url).toLowerCase();
    const name = page?.name?.toLowerCase() || "";

    if (
      path.includes("dashboard") ||
      name.includes("dashboard")
    ) {
      return LayoutDashboard;
    }

    if (
      path.includes("users") ||
      (
        path.includes("user") &&
        !path.includes("pages")
      )
    ) {
      return Users;
    }

    if (
      path.includes("roles") ||
      path.includes("role")
    ) {
      return Shield;
    }

    if (
      path.includes("pages") ||
      name.includes("pages")
    ) {
      return FileText;
    }

    if (
      path.includes("settings") ||
      name.includes("setting")
    ) {
      return Settings;
    }

    return Globe;
  };

  const fetchMyPages = useCallback(async () => {
    try {
      if (!user?.id) {
        setMyPages([]);
        return;
      }

      setLoadingPages(true);

      const response = await apiService.get(
        "/pages/my-pages-hierarchy",
        {
          params: {
            _t: Date.now(),
          },
        },
      );

      const pages =
        response?.data?.data?.pages || [];

      setMyPages(
        Array.isArray(pages)
          ? pages
          : [],
      );
    } catch (error) {
      console.error(
        "Failed to load assigned pages:",
        error,
      );

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


  const excludedPages = [
    "Company Website",
    "Documentation",
    "Help Center",
  ];

  const visibleAssignedPages = myPages.filter(
    (page) => !excludedPages.includes(page?.name),
  );

  const allMenuItems = [
    ...filteredMenuItems.map((item) => ({
      id: `static-${item.path}`,
      name: item.name,
      url: item.path,
      icon: item.icon,
      children: [],
    })),
    ...visibleAssignedPages.filter((page) => {
      const pageUrl = formatUrl(page?.url);
      return !filteredMenuItems.some(
        (staticItem) => staticItem.path === pageUrl,
      );
    }),
  ];

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
          overflow-hidden
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
        <SidebarHeader onClose={onClose} />

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
        <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Profile Settings
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Manage your account info and security
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
      <header className="shrink-0 border-b border-gray-200 bg-white px-4 py-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <button
              type="button"
              onClick={onMenuClick}
              className="shrink-0 rounded-xl p-2 text-gray-500 transition-all hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold text-gray-900 dark:text-white sm:text-xl">
                Welcome back,{" "}
                <span className="text-primary-600 dark:text-primary-400">
                  {user?.username || "User"}
                </span>
                !
              </h1>

              <p className="mt-0.5 truncate text-xs font-medium text-gray-500 dark:text-gray-400">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-xl bg-gray-100 p-2.5 shadow-sm transition-all hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5 text-gray-600" />
              ) : (
                <Sun className="h-5 w-5 text-yellow-500" />
              )}
            </button>

            {/* Profile Dropdown Container */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsProfileOpen((prev) => !prev)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-md transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                aria-expanded={isProfileOpen}
                aria-label="User menu"
              >
                <User className="h-6 w-6 text-white" />
              </button>

              {/* Profile Card Dropdown */}
              {isProfileOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-gray-200 bg-white p-3 shadow-2xl transition-all dark:border-gray-700 dark:bg-gray-800 z-50">
                  {/* User Overview */}
                  <div className="flex items-center gap-3 p-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-sm">
                      <User className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-gray-900 dark:text-white">
                        {user?.username || "User"}
                      </p>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {user?.email || userRole}
                      </p>
                    </div>
                  </div>

                  <div className="my-2 border-t border-gray-100 dark:border-gray-700" />

                  {/* Profile Settings Item */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      setIsModalOpen(true);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    <Settings className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span>Profile Settings</span>
                  </button>

                  {/* Log Out Item (Below Profile Settings) */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <LogOut className="h-4 w-4 text-red-500" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Profile Settings Modal */}
      <ProfileSettingsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

/* -------------------------------------------------------------------------- */
/*                                   Layout                                   */
/* -------------------------------------------------------------------------- */

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden lg:pl-64">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="min-h-0 flex-1 overflow-y-auto p-4 [scrollbar-width:thin] sm:p-6">
          {children}
        </main>

        <footer className="shrink-0 border-t border-gray-200 bg-white px-4 py-3.5 dark:border-gray-700 dark:bg-gray-800 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-2.5 sm:flex-row">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()}{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                Aplos Logix
              </span>
              . All rights reserved.
            </p>

            <div className="flex items-center gap-4 text-xs font-medium text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span>System Operational</span>
              </div>
              <span>•</span>
              <span className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-[11px] dark:bg-gray-700 dark:text-gray-300">
                v1.0.0
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;