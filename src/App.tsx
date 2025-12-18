import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { DrawerProvider, useDrawer } from "./contexts/DrawerContext";
import { MantenedoresProvider } from "./contexts/MantenedoresContext";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";
import Login from "./components/Login";
import Dashboard from "./pages/Dashboard";
import Accounting from "./pages/Accounting";
import UserManagement from "./pages/UserManagement";
import AppSettings from "./pages/AppSettings";
import Profile from "./pages/Profile";
import PDFGenerator from "./pages/PDFGenerator";
import MantenedorDrawer from "./components/mantenedorDrawer";
import { MantenedorType } from "./types/mantenedores";

const AppRoutes: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout>
              <AppSettings />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/accounting"
        element={
          <ProtectedRoute allowedRoles={["admin", "manager", "accountant"]}>
            <DashboardLayout>
              <Accounting />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout>
              <UserManagement />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Profile />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pdf-generator"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <PDFGenerator />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

/**
 * Global Drawer Manager
 * 
 * Renders MantenedorDrawer instances:
 * - Static drawers for each mantenedor type (for simple open/close)
 * - Dynamic drawers based on drawer stack (for nested creation)
 */
const GlobalDrawers: React.FC = () => {
  const { getDrawerStack } = useDrawer();
  const drawerStack = getDrawerStack();

  // Get drawer IDs that are in the stack but not covered by static drawers
  const staticDrawerIds = Object.values(MantenedorType).map(type => `mantenedor-${type}`);
  const dynamicDrawerIds = drawerStack.filter(id => 
    id.startsWith('mantenedor-') && !staticDrawerIds.includes(id)
  );

  return (
    <>
      {/* Static drawers for each mantenedor type */}
      {Object.values(MantenedorType).map((type) => (
        <MantenedorDrawer key={type} drawerId={`mantenedor-${type}`} />
      ))}
      
      {/* Dynamic drawers for nested creation (have unique timestamp IDs) */}
      {dynamicDrawerIds.map((drawerId) => (
        <MantenedorDrawer key={drawerId} drawerId={drawerId} />
      ))}
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <DrawerProvider>
        <MantenedoresProvider>
          <Router>
            <AppRoutes />
          </Router>
          {/* Global drawers available throughout the app */}
          <GlobalDrawers />
        </MantenedoresProvider>
      </DrawerProvider>
    </AuthProvider>
  );
}

export default App;
