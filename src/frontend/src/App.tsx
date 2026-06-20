import type { JSX } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme as antTheme } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { useOrgConfigStore } from './store/orgConfigStore';
import { lightTheme, darkTheme } from './styles/theme';

import { AppLayout } from './components/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CustomersPage } from './pages/CustomersPage';
import { CustomerDetailPage } from './pages/CustomerDetailPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { EnterprisePage } from './pages/EnterprisePage';
import { EmployeeProfilePage } from './pages/EmployeeProfilePage';
import { ProfilePage } from './pages/ProfilePage';
import { AlertsPage } from './pages/AlertsPage';
import { SetupWizardPage } from './pages/SetupWizardPage';

import './styles/global.css';

const queryClient = new QueryClient();

function RequireAuth({ children }: { children: JSX.Element }): JSX.Element {
  const { currentUser } = useAuthStore();
  if (!currentUser) return <Navigate to="/login" replace />;
  return children;
}

function RequireConfig({ children }: { children: JSX.Element }): JSX.Element {
  const { isConfigured } = useOrgConfigStore();
  if (!isConfigured) return <Navigate to="/configurazione" replace />;
  return children;
}

export default function App(): JSX.Element {
  const { mode } = useThemeStore();
  const themeConfig =
    mode === 'dark'
      ? { ...darkTheme, algorithm: antTheme.darkAlgorithm }
      : { ...lightTheme, algorithm: antTheme.defaultAlgorithm };

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={themeConfig}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/configurazione"
              element={
                <RequireAuth>
                  <SetupWizardPage />
                </RequireAuth>
              }
            />
            <Route
              element={
                <RequireAuth>
                  <RequireConfig>
                    <AppLayout />
                  </RequireConfig>
                </RequireAuth>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="clienti" element={<CustomersPage />} />
              <Route path="clienti/:id" element={<CustomerDetailPage />} />
              <Route path="clienti/:customerId/progetti/:id" element={<ProjectDetailPage />} />
              <Route path="enterprise" element={<EnterprisePage />} />
              <Route path="enterprise/:id" element={<EmployeeProfilePage />} />
              <Route path="profilo" element={<ProfilePage />} />
              <Route path="alerts" element={<AlertsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
