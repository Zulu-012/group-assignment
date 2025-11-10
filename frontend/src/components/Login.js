// src/components/Login.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://group-assignment-2-ypxs.onrender.com/api';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔐 Attempting login for:', formData.email);
      
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });

      const result = await response.json();

      console.log('📨 Login response:', result);

      if (!response.ok) {
        throw new Error(result.error || `Login failed with status: ${response.status}`);
      }

      if (!result.success) {
        throw new Error(result.error || 'Login failed');
      }

      console.log('✅ Login successful:', result.user);
      
      // Store user data and token
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      
      // Call parent login function if provided
      if (onLogin) {
        onLogin(result.user, result.token);
      }
      
      // Navigate to dashboard based on role
      if (result.user.role === 'student') {
        navigate('/student/dashboard');
      } else if (result.user.role === 'institution') {
        navigate('/institution/dashboard');
      } else if (result.user.role === 'company') {
        navigate('/company/dashboard');
      } else if (result.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
      
    } catch (error) {
      console.error('❌ Login error:', error);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.message.includes('Invalid email or password')) {
        errorMessage = 'Invalid email or password';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Cannot connect to server. Please make sure the backend server is running on port 5000.';
      } else if (error.message.includes('User not found')) {
        errorMessage = 'No account found with this email. Please register first.';
      } else {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Test server connection
  const testConnection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const result = await response.json();
      alert(`Server status: ${result.message}\nDatabase: ${result.firebase}`);
    } catch (error) {
      alert('Cannot connect to server. Make sure the backend is running.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-panel">
        <div className="auth-right">
          <div className="auth-header">
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">Sign in to your account</p>
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
              {error.includes('Cannot connect to server') && (
                <div style={{ marginTop: '10px', fontSize: '14px' }}>
                  Make sure your backend server is running with: <code>node server.js</code>
                </div>
              )}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className="form-input"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                disabled={loading}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="auth-link">
                Create one here
              </Link>
            </p>
            <p style={{ marginTop: '10px', fontSize: '14px' }}>
              <button 
                type="button" 
                onClick={testConnection}
                style={{ 
                  background: 'transparent', 
                  border: '1px solid #007bff', 
                  color: '#007bff',
                  padding: '5px 10px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Test Server Connection
              </button>
            </p>
          </div>
        </div>
        <div className="auth-left">
          <h2>WELCOME BACK!</h2>
          <p>Sign in to continue your career journey and access personalized opportunities.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;