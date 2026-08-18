import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import axios from "axios";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import { api } from "../utils/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Configure axios defaults
axios.defaults.baseURL = import.meta.env.VITE_API_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Try to restore user from localStorage
    try {
      const storedUser = localStorage.getItem("aplos_logix-user") || localStorage.getItem("cmscrm-user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => {
    // Try localStorage first, then cookies as fallback
    const localToken = localStorage.getItem("aplos_logix-token") || localStorage.getItem("cmscrm-token");
    const cookieToken = Cookies.get("aplos_logix-token") || Cookies.get("cmscrm-token");
    const storedToken = localToken || cookieToken;
    // Only return token if it exists and looks valid (not empty)
    return storedToken && storedToken.length > 10 ? storedToken : null;
  });
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const logoutTimeoutRef = useRef(null);

  const handleSessionExpired = useCallback(() => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    // Cleanly remove tokens and user session data
    localStorage.removeItem("aplos_logix-token");
    localStorage.removeItem("aplos_logix-user");
    localStorage.removeItem("cmscrm-token");
    localStorage.removeItem("cmscrm-user");
    Cookies.remove("aplos_logix-token");
    Cookies.remove("cmscrm-token");
    setToken(null);
    setUser(null);

    toast.error("Session expired. Please log in again.", {
      id: "session-expired-toast",
      style: {
        background: "#1f2937",
        color: "#fca5a5",
        border: "1px solid #4b5563",
        borderRadius: "8px",
        padding: "10px 14px",
      },
      iconTheme: {
        primary: "#ef4444",
        secondary: "#1f2937",
      },
    });

    setTimeout(() => {
      setIsLoggingOut(false);
    }, 1000);
  }, [isLoggingOut]);

  const verifyToken = useCallback(async () => {
    if (isLoggingOut) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get("/auth/verify");
      // Handle both response.data.user and response.data.data.user structures
      const userData = response.data.data?.user || response.data.user;
      setUser(userData);
      localStorage.setItem("aplos_logix-user", JSON.stringify(userData));
      setIsLoggingOut(false); // Reset logout flag on successful verification
    } catch (error) {
      console.error("Token verification failed:", error);
      localStorage.removeItem("aplos_logix-token");
      localStorage.removeItem("aplos_logix-user");
      localStorage.removeItem("cmscrm-token");
      localStorage.removeItem("cmscrm-user");
      Cookies.remove("aplos_logix-token");
      Cookies.remove("cmscrm-token");
      setToken(null);
      setUser(null);
      setIsLoggingOut(false);
    } finally {
      setLoading(false);
    }
  }, [isLoggingOut]);

  const logout = useCallback(
    async (showToast = true) => {
      if (isLoggingOut) {
        return; // Prevent multiple logout calls
      }

      setIsLoggingOut(true);

      try {
        // Only call logout API if we have a valid token
        if (token) {
          await api.post("/auth/logout");
        }
      } catch (error) {
        // Ignore logout API errors - we're clearing local state anyway
        console.error("Logout API error:", error);
      }

      // Clear local state
      localStorage.removeItem("aplos_logix-token");
      localStorage.removeItem("aplos_logix-user");
      localStorage.removeItem("cmscrm-token");
      localStorage.removeItem("cmscrm-user");
      Cookies.remove("aplos_logix-token");
      Cookies.remove("cmscrm-token");
      setToken(null);
      setUser(null);
      setIsLoggingOut(false);

      // Clear any pending logout timeouts
      if (logoutTimeoutRef.current) {
        clearTimeout(logoutTimeoutRef.current);
        logoutTimeoutRef.current = null;
      }

      // Only show toast if requested
      if (showToast) {
        toast.success("Logged out successfully", {
          style: {
            background: "#1f2937",
            color: "#e5e7eb",
            border: "1px solid #374151",
            borderRadius: "8px",
            padding: "10px 14px",
          },
          iconTheme: {
            primary: "#22c55e",
            secondary: "#1f2937",
          },
        });
      }
    },
    [isLoggingOut, token]
  );

  const login = async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      const { token: authToken, user: userData } = response.data.data;

      // Store in both localStorage and cookies for redundancy
      localStorage.setItem("aplos_logix-token", authToken);
      Cookies.set("aplos_logix-token", authToken, {
        expires: 2,
        secure: window.location.protocol === "https:",
        sameSite: "strict",
      });

      // Also store user data for faster loading
      localStorage.setItem("aplos_logix-user", JSON.stringify(userData));

      setToken(authToken);
      setUser(userData);
      setIsLoggingOut(false);

      toast.success(`Welcome back, ${userData?.username || "User"}!`, {
        style: {
          background: "#1f2937",
          color: "#e5e7eb",
          border: "1px solid #374151",
          borderRadius: "8px",
          padding: "10px 14px",
        },
        iconTheme: {
          primary: "#22c55e",
          secondary: "#1f2937",
        },
      });

      return { success: true, user: userData, token: authToken };
    } catch (error) {
      const message = error.response?.data?.message || "Login failed";
      toast.error(message || "Something went wrong", {
        style: {
          background: "#1f2937",
          color: "#fca5a5",
          border: "1px solid #4b5563",
          borderRadius: "8px",
          padding: "10px 14px",
        },
        iconTheme: {
          primary: "#ef4444",
          secondary: "#1f2937",
        },
      });

      return { success: false, message };
    }
  };

  useEffect(() => {
    const handleUnauthorizedEvent = () => {
      console.warn("auth:unauthorized event received, logging out...");
      handleSessionExpired();
    };

    window.addEventListener("auth:unauthorized", handleUnauthorizedEvent);

    const apiInterceptorId = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && !isLoggingOut) {
          const isLogoutUrl = error.config?.url?.includes("/auth/logout");
          if (!isLogoutUrl) {
            handleSessionExpired();
          }
        }
        return Promise.reject(error);
      }
    );

    const axiosInterceptorId = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && !isLoggingOut) {
          const isLogoutUrl = error.config?.url?.includes("/auth/logout");
          if (!isLogoutUrl) {
            handleSessionExpired();
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorizedEvent);
      api.interceptors.response.eject(apiInterceptorId);
      axios.interceptors.response.eject(axiosInterceptorId);
    };
  }, [isLoggingOut, handleSessionExpired]);

  useEffect(() => {
    const verifyTimer = setTimeout(() => {
      if (token && !isLoggingOut && user === null) {
        verifyToken();
      } else if (!token) {
        setLoading(false);
        setUser(null);
      } else if (token && user) {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(verifyTimer);
  }, [token, user, isLoggingOut, verifyToken]);

  const updateProfile = async (profileData) => {
    try {
      const response = await api.put("/auth/profile", profileData);
      const updatedUser = response.data?.data?.user || response.data?.user;
      if (updatedUser) {
        setUser(updatedUser);
        localStorage.setItem("aplos_logix-user", JSON.stringify(updatedUser));
      }
      toast.success("Profile updated successfully", {
        style: {
          background: "#1f2937",
          color: "#e5e7eb",
          border: "1px solid #374151",
          borderRadius: "8px",
          padding: "10px 14px",
        },
        iconTheme: {
          primary: "#22c55e",
          secondary: "#1f2937",
        },
      });
      return { success: true, user: updatedUser };
    } catch (error) {
      const message = error.response?.data?.message || "Profile update failed";
      toast.error(message || "Something went wrong", {
        style: {
          background: "#1f2937",
          color: "#fca5a5",
          border: "1px solid #4b5563",
          borderRadius: "8px",
          padding: "10px 14px",
        },
        iconTheme: {
          primary: "#ef4444",
          secondary: "#1f2937",
        },
      });

      return { success: false, message };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await api.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      toast.success("Password changed successfully", {
        style: {
          background: "#1f2937",
          color: "#e5e7eb",
          border: "1px solid #374151",
          borderRadius: "8px",
          padding: "10px 14px",
        },
        iconTheme: {
          primary: "#22c55e",
          secondary: "#1f2937",
        },
      });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Password change failed";
      toast.error(message || "Something went wrong", {
        style: {
          background: "#1f2937",
          color: "#fca5a5",
          border: "1px solid #4b5563",
          borderRadius: "8px",
          padding: "10px 14px",
        },
        iconTheme: {
          primary: "#ef4444",
          secondary: "#1f2937",
        },
      });

      return { success: false, message };
    }
  };

  const hasRole = (roleName) => {
    if (!user?.roles) return false;

    // Handle both string roles and object roles
    return user.roles.some((role) => {
      const roleValue = typeof role === "string" ? role : role.name;

      // Map backend role names to display names
      const roleMapping = {
        super_admin: "Super Admin",
        admin: "Admin",
        manager: "Manager",
        user: "User",
      };

      // Check both original role and mapped role
      return roleValue === roleName || roleMapping[roleValue] === roleName;
    });
  };

  const hasPermission = (pageUrl) => {
    return user?.accessiblePages?.some((page) => page.url === pageUrl) || false;
  };

  const isSuperAdmin = () => {
    return hasRole("Super Admin") || (Array.isArray(user?.roles) && user.roles.includes('super_admin'));
  };

  const isAdmin = () => {
    return isSuperAdmin() || hasRole("Admin") || (Array.isArray(user?.roles) && user.roles.includes('admin'));
  };

  const isManager = () => hasRole("Manager");
  const isUser = () => hasRole("User");

  const forceLogout = () => {
    console.log("Force logout initiated...");
    setIsLoggingOut(false);
    setLoading(false);
    setUser(null);
    setToken(null);
    localStorage.removeItem("aplos_logix-token");
    localStorage.removeItem("aplos_logix-user");
    localStorage.removeItem("cmscrm-token");
    localStorage.removeItem("cmscrm-user");
    Cookies.remove("aplos_logix-token");
    Cookies.remove("cmscrm-token");

    if (logoutTimeoutRef.current) {
      clearTimeout(logoutTimeoutRef.current);
      logoutTimeoutRef.current = null;
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    forceLogout,
    updateProfile,
    changePassword,
    hasRole,
    hasPermission,
    isSuperAdmin,
    isAdmin,
    isManager,
    isUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
