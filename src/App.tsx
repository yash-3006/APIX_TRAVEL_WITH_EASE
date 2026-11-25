import React from 'react';
import { ApixProvider, useApix } from './context/ApixContext';
import { AppShell } from './components/layout/AppShell';
import { ToastContainer } from './components/ui/CommonUI';
import { AuthPage } from './pages/AuthPage';
import { TravelerDashboard } from './pages/traveler/TravelerDashboard';
import { FlightSearchPage } from './pages/traveler/FlightSearchPage';
import { FareComparisonPage } from './pages/traveler/FareComparisonPage';
import { PriceAnalyticsPage } from './pages/traveler/PriceAnalyticsPage';
import { ProfilePage } from './pages/traveler/ProfilePage';
import { ReportsPage } from './pages/ReportsPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AirlineManagementPage } from './pages/admin/AirlineManagementPage';
import { RouteManagementPage } from './pages/admin/RouteManagementPage';
import { FareDataManagementPage } from './pages/admin/FareDataManagementPage';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

function ApixRouter() {
  const { currentUser, activePage, toasts, dismissToast } = useApix();

  const renderPage = () => {
    if (!currentUser) return <AuthPage />;

    if (currentUser.role === 'admin') {
      switch (activePage) {
        case 'admin-airlines':
          return <AirlineManagementPage />;
        case 'admin-routes':
          return <RouteManagementPage />;
        case 'admin-fares':
          return <FareDataManagementPage />;
        case 'admin-users':
          return <UserManagementPage />;
        case 'admin-reports':
          return <ReportsPage />;
        case 'admin-settings':
          return <AdminSettingsPage />;
        case 'admin-dashboard':
        default:
          return <AdminDashboard />;
      }
    }

    switch (activePage) {
      case 'search':
        return <FlightSearchPage />;
      case 'compare':
        return <FareComparisonPage />;
      case 'analytics':
        return <PriceAnalyticsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'profile':
        return <ProfilePage />;
      case 'dashboard':
      default:
        return <TravelerDashboard />;
    }
  };

  return (
    <>
      {currentUser ? <AppShell>{renderPage()}</AppShell> : <AuthPage />}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}

export default function App() {
  return (
    <ApixProvider>
      <ApixRouter />
    </ApixProvider>
  );
}
