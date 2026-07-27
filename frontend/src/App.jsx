import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Import pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import RolesPage from './pages/RolesPage';
import PagesPage from './pages/PagesPage';
import IframeTestPage from './pages/IframeTestPage';
import LoadingSpinner from './components/LoadingSpinner';
import Cff_Complete_Log from './pages/complete_log/CffCompleteLog';
import WMCompleteLog from './pages/complete_log/WMCompleteLog';
import ExternalPage from './pages/ExternalPage';
import UswLogs from './pages/complete_log/UswLogs';
import MC6Log from './pages/complete_log/MC6Log';
import MC8Log from './pages/complete_log/MC8Log';
import RunOut from './pages/complete_log/RunOut';
import OvenLog from './pages/complete_log/OvenLog';
import CffBalancing1Data from './pages/complete_log/CffBalancing1Data';
import ReliabilitySpecMaster from './pages/ReliabilitySpecMaster';
import ReliabilityLabTestLog from './pages/ReliabilityLabTestLog';
import ReliabilityDashboard from './pages/ReliabilityDashboard';


// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
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
                  <ProtectedRoute>
                    <UsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/roles"
                element={
                  <ProtectedRoute>
                    <RolesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pages"
                element={
                  <ProtectedRoute>
                    <PagesPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/cffcompletelog"
                element={
                  <ProtectedRoute>
                    <Cff_Complete_Log />
                  </ProtectedRoute>} />

                  <Route path='/cffbalancing1data'
                  element={
                    <ProtectedRoute>
                      <CffBalancing1Data/>
                    </ProtectedRoute>
                  }/>

                  <Route path='/reliabilitydashboard'
                  element={
                    <ProtectedRoute>
                     <ReliabilityDashboard/>
                    </ProtectedRoute>
                  }/>

                  <Route path='/reliabilityspecmaster'
                  element={
                    <ProtectedRoute>
                      <ReliabilitySpecMaster/>
                    </ProtectedRoute>
                  }/>
                  <Route path='/reliabilitylabtestlog'
                  element={
                    <ProtectedRoute>
                      <ReliabilityLabTestLog/>
                    </ProtectedRoute>
                  }/>

              <Route path="/uswlogs"
                element={
                  <ProtectedRoute>
                    <UswLogs />
                  </ProtectedRoute>} />

              <Route path="/wmcompletelog"
                element={
                  <ProtectedRoute>
                    <WMCompleteLog />
                  </ProtectedRoute>} />

                  <Route path="/mc6_log"
                element={
                  <ProtectedRoute>
                    <MC6Log/>
                  </ProtectedRoute>} />

                  <Route path="/mc8_log"
                element={
                  <ProtectedRoute>
                    <MC8Log/>
                  </ProtectedRoute>} />

                  <Route path="/runout_log"
                element={
                  <ProtectedRoute>
                    <RunOut/>
                  </ProtectedRoute>} />

                  <Route path="/oventimelog"
                element={
                  <ProtectedRoute>
                   <OvenLog/>
                  </ProtectedRoute>} />
                  
                  
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

              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* 404 fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>

            {/* Global Toast Notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--toast-bg)',
                  color: 'var(--toast-color)',
                },
                className: 'dark:bg-gray-800 dark:text-white',
              }}
            />
          </div>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
