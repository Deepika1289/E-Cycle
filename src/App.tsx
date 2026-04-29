import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Toaster as ShadcnToaster } from './components/ui/toaster';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { lazy, Suspense } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import RequestOtpPage from './pages/RequestOtp';
import VerifyOtpPage from './pages/VerifyOtpPage';

// User Pages
import { HomePage } from './pages/HomePage';
import { CyclesPage } from './pages/CyclesPage';
import { BookingPage } from './pages/BookingPage';
import { RidePage } from './pages/RidePage';
import { HistoryPage } from './pages/HistoryPage';
import { ScanPage } from './pages/ScanPage';
import { IssuesPage } from './pages/IssuesPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';

// Management Pages
import AdminPage from './pages/admin/AdminPage';
import { DashboardPage } from './pages/DashboardPage';
import { LandingPage } from './pages/LandingPage';

// Lazy-loaded Management Modules
const ManagerPage = lazy(() => import('./pages/manager/ManagerPage').then(module => ({ default: module.ManagerPage })));

function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
      <div className="min-h-screen w-full bg-gray-50 text-primary">
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AuthProvider>
            <Routes>
                    <Route path="/" element={<LandingPage />} />
                    
                    {/* Auth Routes */}
                    <Route path="/auth/login" element={<Login />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/auth/register" element={<Register />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/auth/verify-otp" element={<VerifyOtpPage />} />
                    <Route path="/auth/request-otp" element={<RequestOtpPage />} />

                    {/* Public History Page - no authentication required */}
                    <Route path="/history" element={
                      <Layout>
                        <HistoryPage />
                      </Layout>
                    } />

                    {/* Protected User Routes */}
                    <Route path="/user/dashboard" element={
                      <ProtectedRoute allowedRoles={["USER"]}>
                        <Layout>
                          <HomePage />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/user/cycles" element={
                      <ProtectedRoute allowedRoles={["USER"]}>
                        <Layout>
                          <CyclesPage />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/user/book/:cycleId" element={
                      <ProtectedRoute allowedRoles={["USER"]}>
                        <Layout>
                          <BookingPage />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    
                    {/* Public Ride Page - no authentication required */}
                    <Route path="/user/ride/:rideId" element={
                      <Layout>
                        <RidePage />
                      </Layout>
                    } />
                    
                    {/* Removed ProtectedRoute wrapper for HistoryPage to make it public */}
                    <Route path="/user/history" element={
                      <Layout>
                        <HistoryPage />
                      </Layout>
                    } />
                    
                    <Route path="/user/scan" element={
                      <ProtectedRoute allowedRoles={["USER"]}>
                        <Layout>
                          <ScanPage />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/user/issues" element={
                      <ProtectedRoute allowedRoles={["USER"]}>
                        <Layout>
                          <IssuesPage />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/user/profile" element={
                      <ProtectedRoute allowedRoles={["USER"]}>
                        <Layout>
                          <ProfilePage />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/user/notifications" element={
                      <ProtectedRoute allowedRoles={["USER"]}>
                        <Layout>
                          <NotificationsPage />
                        </Layout>
                      </ProtectedRoute>
                    } />

                    {/* Protected Manager Routes */}
                    <Route path="/manager/profile" element={
                      <ProtectedRoute allowedRoles={["MANAGER"]}>
                        <Layout>
                          <ProfilePage />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/manager/notifications" element={
                      <ProtectedRoute allowedRoles={["MANAGER"]}>
                        <Layout>
                          <NotificationsPage />
                        </Layout>
                      </ProtectedRoute>
                    } />

                    {/* Public Manager Routes - no authentication required */}
                    <Route path="/manager/*" element={
                      <Layout>
                        <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
                          <ManagerPage />
                        </Suspense>
                      </Layout>
                    } />

                    {/* Protected Admin Routes */}
                    <Route path="/admin/profile" element={
                      <ProtectedRoute allowedRoles={["ADMIN"]}>
                        <Layout>
                          <ProfilePage />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/admin/notifications" element={
                      <ProtectedRoute allowedRoles={["ADMIN"]}>
                        <Layout>
                          <NotificationsPage />
                        </Layout>
                      </ProtectedRoute>
                    } />

                    {/* Public Admin Routes with proper sub-routing */}
                    <Route path="/admin/*" element={
                      <Layout>
                        <AdminPage />
                      </Layout>
                    } />

                    {/* Fallback Route */}
                    <Route path="*" element={<Navigate to="/auth/login" replace />} />
                  </Routes>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'linear-gradient(135deg, #6A11CB 0%, #2575FC 100%)',
              color: '#fff',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            },
            success: { 
              style: { 
                background: 'linear-gradient(135deg, #2ECC71 0%, #27AE60 100%)' 
              } 
            },
            error: { 
              style: { 
                background: 'linear-gradient(135deg, #E74C3C 0%, #C0392B 100%)' 
              } 
            }
          }}
        />
          </AuthProvider>
        </Router>
        <ShadcnToaster />
      </div>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;