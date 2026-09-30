import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

import Login from './pages/Login';
import Register from './pages/Register';
import LandingPage from './pages/LandingPage';
import StudentDashboard from './pages/student/StudentDashboard';
import NewRequest from './pages/student/NewRequest';
import RequestDetail from './pages/student/RequestDetail';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRequestDetail from './pages/admin/AdminRequestDetail';
import AdminSignatureSetup from './pages/admin/AdminSignatureSetup';

function Layout({ children }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      {children}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Student routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute role="student"><Layout><StudentDashboard /></Layout></ProtectedRoute>
          } />
          <Route path="/requests/new" element={
            <ProtectedRoute role="student"><Layout><NewRequest /></Layout></ProtectedRoute>
          } />
          <Route path="/requests/:id" element={
            <ProtectedRoute role="student"><Layout><RequestDetail /></Layout></ProtectedRoute>
          } />

          {/* Admin routes */}
          <Route path="/admin" element={
            <ProtectedRoute role="admin"><Layout><AdminDashboard /></Layout></ProtectedRoute>
          } />
          <Route path="/admin/requests/:id" element={
            <ProtectedRoute role="admin"><Layout><AdminRequestDetail /></Layout></ProtectedRoute>
          } />
          <Route path="/admin/signature" element={
            <ProtectedRoute role="admin"><Layout><AdminSignatureSetup /></Layout></ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
