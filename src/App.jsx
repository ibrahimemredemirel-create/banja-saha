import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DataProvider, useData } from './context/DataContext';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import FacilityFormPage from './pages/FacilityFormPage';
import FacilityListPage from './pages/FacilityListPage';
import FacilityReportPage from './pages/FacilityReportPage';
import VisitFormPage from './pages/VisitFormPage';
import ContractsPage from './pages/ContractsPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';

function AppRoutes() {
  const { isAuthenticated } = useData();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="new-facility" element={<FacilityFormPage />} />
          <Route path="manage-facilities" element={<FacilityListPage />} />
          <Route path="facility-report" element={<FacilityReportPage />} />
          <Route path="contracts" element={<ContractsPage />} />
          <Route path="visit-entry" element={<VisitFormPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <DataProvider>
      <AppRoutes />
    </DataProvider>
  );
}

export default App;
