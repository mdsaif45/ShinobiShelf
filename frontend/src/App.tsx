import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import OnboardingPage from './pages/OnboardingPage';
import LibraryPage from './pages/LibraryPage';
import ProfilePage from './pages/ProfilePage';
import { AuthProvider, useAuth } from './providers/AuthProvider';
import { ToastProvider } from './providers/ToastProvider';
import { InstallPrompt } from './components/pwa/InstallPrompt';
import { UpdateBanner } from './components/pwa/UpdateBanner';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
};

const RootRoute = () => {
  const { user } = useAuth();
  return user ? <Navigate to="/library" replace /> : <Navigate to="/auth" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/" element={<RootRoute />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
            <Route path="/library" element={<ProtectedRoute><LibraryPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          </Routes>
        </Router>
        {/* Outside Router: both are route-independent overlays. */}
        <UpdateBanner />
        <InstallPrompt />
      </ToastProvider>
    </AuthProvider>
  );
}
