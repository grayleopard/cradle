
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider, useStore } from './context/StoreContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { StripeProvider } from './context/StripeContext';
import ToastContainer from './components/ToastContainer';
import { Layout } from './components/Layout';
import Home from './pages/Home';
import CreateListing from './pages/CreateListing';
import ListingDetail from './pages/ListingDetail';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import ParentVerification from './pages/ParentVerification';
import PublicProfile from './pages/PublicProfile';
import Inbox from './pages/Inbox';
import Chat from './pages/Chat';
import SafetyCheck from './pages/SafetyCheck';
import Premium from './pages/Premium';
import Transaction from './pages/Transaction';
import AdminDashboard from './pages/AdminDashboard';
import DevSettings from './pages/DevSettings';
import Compare from './pages/Compare';
import DesignPreview from './pages/DesignPreview';
import Notifications from './pages/Notifications';
import TrustSettingsPage from './pages/TrustSettingsPage';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import AuthCallback from './pages/AuthCallback';
import ResetPassword from './pages/ResetPassword';
import AccountSettings from './pages/AccountSettings';
import SellerAnalytics from './pages/SellerAnalytics';
import InventoryManagement from './pages/InventoryManagement';
import BulkListing from './pages/BulkListing';
import Wishlist from './pages/Wishlist';
import AvailabilitySettings from './pages/AvailabilitySettings';

// Wrapper for routes that require authentication
const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const { currentUser } = useStore();
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }
  return <Layout>{children}</Layout>;
};

// Wrapper for public routes (viewable without auth, still use Layout)
const PublicRoute = ({ children }: { children?: React.ReactNode }) => {
  return <Layout>{children}</Layout>;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Redirect old welcome page to home */}
      <Route path="/welcome" element={<Navigate to="/" replace />} />

      {/* Public routes - viewable without auth */}
      <Route path="/" element={<PublicRoute><Home /></PublicRoute>} />
      <Route path="/listing/:id" element={<PublicRoute><ListingDetail /></PublicRoute>} />
      <Route path="/user/:id" element={<PublicRoute><PublicProfile /></PublicRoute>} />

      {/* Protected routes - require authentication */}
      <Route path="/sell" element={<ProtectedRoute><CreateListing /></ProtectedRoute>} />
      <Route path="/edit/:id" element={<ProtectedRoute><CreateListing /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
      <Route path="/profile/verify" element={<ProtectedRoute><ParentVerification /></ProtectedRoute>} />
      <Route path="/profile/safety-check" element={<ProtectedRoute><SafetyCheck /></ProtectedRoute>} />
      <Route path="/profile/premium" element={<ProtectedRoute><Premium /></ProtectedRoute>} />
      <Route path="/profile/trust" element={<ProtectedRoute><TrustSettingsPage /></ProtectedRoute>} />
      <Route path="/profile/account" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
      <Route path="/profile/analytics" element={<ProtectedRoute><SellerAnalytics /></ProtectedRoute>} />
      <Route path="/profile/inventory" element={<ProtectedRoute><InventoryManagement /></ProtectedRoute>} />
      <Route path="/profile/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
      <Route path="/profile/availability" element={<ProtectedRoute><AvailabilitySettings /></ProtectedRoute>} />
      <Route path="/sell/bulk" element={<ProtectedRoute><BulkListing /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
      <Route path="/chat/:id" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/transaction/:id" element={<ProtectedRoute><Transaction /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path="/settings/dev" element={<ProtectedRoute><DevSettings /></ProtectedRoute>} />
      <Route path="/compare" element={<ProtectedRoute><Compare /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

      {/* Design Preview - standalone, no layout */}
      <Route path="/design" element={<DesignPreview />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />

      {/* Auth routes - standalone, no layout */}
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/auth/reset-password" element={<ResetPassword />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <StoreProvider>
          <StripeProvider>
            <Router>
              <AppRoutes />
              <ToastContainer />
            </Router>
          </StripeProvider>
        </StoreProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
