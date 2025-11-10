// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import CompanyDashboard from './components/CompanyDashboard';
import StudentDashboard from './components/StudentDashboard';
import InstitutionDashboard from './components/InstituteDashboard';
import AdminDashboard from './components/AdminDashboard';
import Register from './components/Register';
import WelcomePage from './components/WelcomePage';
import './App.css';

function App() {
  // Check if user is logged in
  const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  };

  // Get user role for route protection
  const getUserRole = () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user).role : null;
    } catch (error) {
      return null;
    }
  };

  // Protected Route component
  const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    if (!isAuthenticated()) {
      return <Navigate to="/login" replace />;
    }

    const userRole = getUserRole();
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      return <Navigate to="/login" replace />;
    }

    return children;
  };

  // Public Route component (redirect to dashboard if already logged in)
  const PublicRoute = ({ children }) => {
    if (isAuthenticated()) {
      const userRole = getUserRole();
      switch (userRole) {
        case 'student':
          return <Navigate to="/student/dashboard" replace />;
        case 'institution':
          return <Navigate to="/institution/dashboard" replace />;
        case 'company':
          return <Navigate to="/company/dashboard" replace />;
        case 'admin':
          return <Navigate to="/admin/dashboard" replace />;
        default:
          return <Navigate to="/login" replace />;
      }
    }
    return children;
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } 
          />
          
          {/* Protected Routes */}
          <Route 
            path="/company/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['company']}>
                <CompanyDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/institution/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['institution']}>
                <InstitutionDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Default Route */}
          <Route
            path="/"
            element={
              <PublicRoute>
                <WelcomePage />
              </PublicRoute>
            }
          />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;