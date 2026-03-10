import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Users } from './pages/Users';
import { Stores } from './pages/Stores';
import { Inventory } from './pages/Inventory';
import { Unauthorized } from './pages/Unauthorized';
export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route
            element={
            <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>

            <Route path="/" element={<Dashboard />} />

            {/* Super-Admin and Admin only routes */}
            <Route
              path="/stores"
              element={
              <ProtectedRoute allowedRoles={['super-admin', 'admin']}>
                  <Stores />
                </ProtectedRoute>
              } />

            <Route
              path="/users"
              element={
              <ProtectedRoute allowedRoles={['super-admin', 'admin']}>
                  <Users />
                </ProtectedRoute>
              } />


            {/* All authenticated users */}
            <Route path="/inventory" element={<Inventory />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>);

}