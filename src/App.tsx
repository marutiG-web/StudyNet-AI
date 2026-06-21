import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { OfflineSyncProvider } from './context/OfflineSyncContext';
import Navbar from './components/Navbar';
import UserSidebar from './components/UserSidebar';

// Page Imports
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';
import HistoryPage from './pages/HistoryPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminChats from './pages/AdminChats';
import AdminSettings from './pages/AdminSettings';
import LibraryPage from './pages/LibraryPage';
import AdminPages from './pages/AdminPages';
import CustomPageViewer from './pages/CustomPageViewer';


// Protected Route Helpers
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-400 font-sans">
        <div className="w-8 h-8 rounded-full border-4 border-slate-800 border-t-indigo-600 animate-spin mb-3" />
        <span className="text-xs font-bold uppercase tracking-widest text-[#4f46e5]">Validating Learner Session...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-400 font-sans">
        <div className="w-8 h-8 rounded-full border-4 border-slate-800 border-t-rose-500 animate-spin mb-3" />
        <span className="text-xs font-bold uppercase tracking-widest text-rose-500">Unlocking Control Hub...</span>
      </div>
    );
  }

  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

// Layout wrapper including navbar
const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar />
      <div className="flex-1 flex min-h-0">
        <UserSidebar />
        <main className="flex-1 min-w-0 flex flex-col">
          <Routes>
            <Route index element={<LandingPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
            <Route path="library" element={<LibraryPage />} />
            <Route path="p/:slug" element={<CustomPageViewer />} />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <OfflineSyncProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Admin routes (no header navbar wrapper, uses dedicated dark sidebar dashboard) */}
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
              <Route path="/admin/chats" element={<AdminRoute><AdminChats /></AdminRoute>} />
              <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
              <Route path="/admin/pages" element={<AdminRoute><AdminPages /></AdminRoute>} />

              {/* User & General routes with header bar layout */}
              <Route path="/*" element={<Layout />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </OfflineSyncProvider>
    </ToastProvider>
  );
}
