import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Toaster as ShadcnToaster } from './components/ui/toaster';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { lazy, Suspense } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';

// Auth Pages (small — keep eager)
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import RequestOtpPage from './pages/RequestOtp';
import VerifyOtpPage from './pages/VerifyOtpPage';
import { LandingPage } from './pages/LandingPage';

// Lazy-loaded User Pages
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const CyclesPage = lazy(() => import('./pages/CyclesPage').then(m => ({ default: m.CyclesPage })));
const BookingPage = lazy(() => import('./pages/BookingPage').then(m => ({ default: m.BookingPage })));
const RidePage = lazy(() => import('./pages/RidePage').then(m => ({ default: m.RidePage })));
const HistoryPage = lazy(() => import('./pages/HistoryPage').then(m => ({ default: m.HistoryPage })));
const ScanPage = lazy(() => import('./pages/ScanPage').then(m => ({ default: m.ScanPage })));
const IssuesPage = lazy(() => import('./pages/IssuesPage').then(m => ({ default: m.IssuesPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));

// Lazy-loaded Management Pages
const AdminPage = lazy(() => import('./pages/admin/AdminPage'));
const ManagerPage = lazy(() => import('./pages/manager/ManagerPage').then(m => ({ default: m.ManagerPage })));

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
            <Suspense fallback={<LoadingSpinner />}>
            <Routes>
                    <Route path="/" element={<LandingPage />} />
                    
                    {/* Auth Routes */}
                    <Route path="/auth/login" element={<Login />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/auth/register" element={<Register />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/auth/verify-otp" element={<VerifyOtpPage />} />
                    <Route path="/auth/request-otp" element={<RequestOtpPage />} />

                    {/* Protected User Routes */}
                    <Route path="/history" element={
                      <ProtectedRoute allowedRoles={["USER"]}>
                        <Layout>
                          <HistoryPage />
                        </Layout>
                      </ProtectedRoute>
                    } />

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
                    
                    <Route path="/user/ride/:rideId" element={
                      <ProtectedRoute allowedRoles={["USER"]}>
                        <Layout>
                          <RidePage />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/user/history" element={
                      <ProtectedRoute allowedRoles={["USER"]}>
                        <Layout>
                          <HistoryPage />
                        </Layout>
                      </ProtectedRoute>
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

                    <Route path="/manager/*" element={
                      <ProtectedRoute allowedRoles={["MANAGER", "ADMIN"]}>
                        <Layout>
                          <ManagerPage />
                        </Layout>
                      </ProtectedRoute>
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

                    {/* Protected Admin Dashboard with sub-routing */}
                    <Route path="/admin/*" element={
                      <ProtectedRoute allowedRoles={["ADMIN"]}>
                        <Layout>
                          <AdminPage />
                        </Layout>
                      </ProtectedRoute>
                    } />

                    {/* Fallback Route */}
                    <Route path="*" element={<Navigate to="/auth/login" replace />} />
                  </Routes>
            </Suspense>
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