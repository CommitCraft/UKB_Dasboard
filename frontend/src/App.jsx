import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { apiService } from './utils/api';

// Import pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import RolesPage from './pages/RolesPage';
import PagesPage from './pages/PagesPage';
import IframeTestPage from './pages/IframeTestPage';
import ExternalPage from './pages/ExternalPage';
import ActivityLogsPage from './pages/ActivityLogsPage';
import MenuManagementPage from './pages/MenuManagementPage';
import LoadingSpinner from './components/LoadingSpinner';

// Protected Route Component with role page assignment verification
const ProtectedRoute = ({ requiredPath, children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const [allowed, setAllowed] = useState(true);
  const [checking, setChecking] = useState(Boolean(requiredPath));

  useEffect(() => {
    if (!isAuthenticated || !requiredPath) {
      setChecking(false);
      return;
    }

    // Super Admin has full unrestricted access
    if (Array.isArray(user?.roles) && user.roles.includes('super_admin')) {
      setAllowed(true);
      setChecking(false);
      return;
    }

    // Check user's assigned pages tree
    apiService
      .get('/menus/tree')
      .then((res) => {
        const flatPages = res.data.data?.flat || [];
        const normRequired = requiredPath.toLowerCase().trim().replace(/^\/+|\/+$/g, '');

        const isAssigned = flatPages.some((p) => {
          if (!p.url) return false;
          const normUrl = p.url.toLowerCase().trim().replace(/^\/+|\/+$/g, '');
          return normUrl === normRequired;
        });

        if (!isAssigned) {
          toast.error('Access denied: Page not assigned to your role');
        }

        setAllowed(isAssigned);
      })
      .catch(() => {
        setAllowed(false);
      })
      .finally(() => {
        setChecking(false);
      });
  }, [user, isAuthenticated, requiredPath]);

  if (loading || checking) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPath && !allowed) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <Routes>
              {/* Public Routes */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute requiredPath="/users">
                    <UsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/roles"
                element={
                  <ProtectedRoute requiredPath="/roles">
                    <RolesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pages"
                element={
                  <ProtectedRoute requiredPath="/pages">
                    <PagesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/menus"
                element={
                  <ProtectedRoute requiredPath="/menus">
                    <MenuManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/activity"
                element={
                  <ProtectedRoute requiredPath="/activity">
                    <ActivityLogsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/iframe-test"
                element={
                  <ProtectedRoute>
                    <IframeTestPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/external"
                element={
                  <ProtectedRoute>
                    <ExternalPage />
                  </ProtectedRoute>
                }
              />

              {/* Default Redirects */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            <Toaster position="top-right" />
          </div>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
