// src/components/Register.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// Use relative path for same-domain deployment, or absolute for cross-domain
const API_BASE_URL = window.location.hostname === 'group-assignment-94en.onrender.com' 
  ? 'https://group-assignment-94en.onrender.com/api'
  : '/api';

const Register = ({ onLogin }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    name: '',
    phone: '',
    studentType: 'highschool',
    educationLevel: '',
    major: '',
    institutionName: '',
    address: '',
    companyName: '',
    industry: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const roles = [
    { value: 'student', name: 'Student', description: 'Looking for courses and career opportunities', icon: '🎓' },
    { value: 'institution', name: 'Institution', description: 'Educational institution offering courses', icon: '🏫' },
    { value: 'company', name: 'Company', description: 'Hiring talented students and graduates', icon: '💼' }
  ];

  const studentTypes = [
    { value: 'highschool', name: 'High School Student', description: 'Currently in high school looking for higher education' },
    { value: 'college', name: 'College Student/Graduate', description: 'Currently in college or completed studies, looking for career opportunities' }
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleRoleSelect = (role) => {
    setFormData({
      ...formData,
      role
    });
  };

  const handleStudentTypeSelect = (studentType) => {
    setFormData({
      ...formData,
      studentType
    });
  };

  const handleStep1Submit = (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (!formData.role) {
      setError('Please select a role');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    setStep(2);
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name) {
      setError('Please fill in your full name');
      return;
    }
    
    // Role-specific validations
    if (formData.role === 'institution' && !formData.institutionName) {
      setError('Please fill in institution name');
      return;
    }
    
    if (formData.role === 'company' && !formData.companyName) {
      setError('Please fill in company name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Prepare registration data matching your backend structure
      const registerData = {
        email: formData.email,
        password: formData.password,
        role: formData.role,
        name: formData.name,
        phone: formData.phone || '',
        ...(formData.role === 'student' && {
          studentType: formData.studentType,
          educationLevel: formData.educationLevel || '',
          major: formData.major || ''
        }),
        ...(formData.role === 'institution' && {
          institutionName: formData.institutionName,
          address: formData.address || ''
        }),
        ...(formData.role === 'company' && {
          companyName: formData.companyName,
          industry: formData.industry || ''
        })
      };

      console.log('📝 Registering user:', registerData);
      console.log('🌐 Sending to:', `${API_BASE_URL}/register`);

      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      let result;
      
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server returned non-JSON response: ${text}`);
      }

      console.log('📨 Registration response:', result);

      if (!response.ok) {
        throw new Error(result.error || `Registration failed with status: ${response.status}`);
      }

      if (!result.success) {
        throw new Error(result.error || 'Registration failed');
      }

      console.log('✅ Registration successful:', result.user);

      // Auto-login after successful registration
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      
      if (onLogin) {
        onLogin(result.user, result.token);
      }
      
      // Navigate to appropriate dashboard
      if (formData.role === 'student') {
        navigate('/student/dashboard');
      } else if (formData.role === 'institution') {
        navigate('/institution/dashboard');
      } else if (formData.role === 'company') {
        navigate('/company/dashboard');
      } else {
        navigate('/dashboard');
      }

    } catch (error) {
      console.error('❌ Registration error:', error);
      
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.message.includes('User already exists')) {
        errorMessage = 'An account with this email already exists. Please try logging in.';
      } else if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
        errorMessage = 'Cannot connect to server due to CORS policy. Please try again or contact support.';
      } else if (error.message.includes('Invalid email')) {
        errorMessage = 'Invalid email address.';
      } else if (error.message.includes('is required')) {
        errorMessage = error.message;
      } else {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setStep(1);
    setError('');
  };

  // Test server connection with CORS handling
  const testConnection = async () => {
    try {
      console.log('Testing connection to:', `${API_BASE_URL}/health`);
      const response = await fetch(`${API_BASE_URL}/health`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      alert(`✅ Server is running!\nMessage: ${result.message}\nDatabase: ${result.firebase}\nURL: ${API_BASE_URL}`);
    } catch (error) {
      console.error('Connection test failed:', error);
      alert(`❌ Cannot connect to server:\n${error.message}\n\nThis is likely a CORS issue. Please ensure the backend allows requests from this domain.`);
    }
  };

  return (
    <div className="auth-container register-active">
      <div className="register-panel">
        <div className="auth-left">
          <h2>JOIN OUR COMMUNITY!</h2>
          <p>Start your journey towards academic and career success with us.</p>
        </div>
        <div className="auth-right">
          <div className="auth-header">
            <h1 className="auth-title">
              {step === 1 ? 'Create Account' : 'Complete Profile'}
            </h1>
            <p className="auth-subtitle">
              {step === 1 ? 'Choose your role to get started' : `Tell us about yourself as a ${formData.role}`}
            </p>
          </div>

          {error && (
            <div className="alert alert-error">
              <strong>Error:</strong> {error}
              <div style={{ marginTop: '10px', fontSize: '14px', padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
                <div><strong>Frontend:</strong> {window.location.origin}</div>
                <div><strong>Backend:</strong> {API_BASE_URL}</div>
                <div style={{ marginTop: '5px', color: '#dc3545' }}>
                  <small>
                    CORS Issue: The backend needs to allow requests from {window.location.origin}
                  </small>
                </div>
              </div>
            </div>
          )}

          {step === 1 ? (
            <form className="auth-form" onSubmit={handleStep1Submit}>
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
                  placeholder="Create a password (min. 6 characters)"
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  className="form-input"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">I am a...</label>
                <div className="role-selection">
                  {roles.map((role) => (
                    <div
                      key={role.value}
                      className={`role-option ${formData.role === role.value ? 'selected' : ''}`}
                      onClick={() => handleRoleSelect(role.value)}
                    >
                      <div className="role-icon">{role.icon}</div>
                      <div className="role-name">{role.name}</div>
                      <div className="role-description">{role.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-full"
                disabled={loading || !formData.role}
              >
                Continue to Profile
              </button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleStep2Submit}>
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="form-input"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone" className="form-label">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className="form-input"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number (optional)"
                  disabled={loading}
                />
              </div>

              {formData.role === 'student' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Student Type *</label>
                    <div className="student-type-selection">
                      {studentTypes.map((type) => (
                        <div
                          key={type.value}
                          className={`student-type-option ${formData.studentType === type.value ? 'selected' : ''}`}
                          onClick={() => handleStudentTypeSelect(type.value)}
                        >
                          <div className="student-type-header">
                            <div className="student-type-name">{type.name}</div>
                            <div className="selection-indicator">
                              {formData.studentType === type.value ? '✓' : ''}
                            </div>
                          </div>
                          <div className="student-type-description">{type.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {formData.studentType && (
                    <>
                      <div className="form-group">
                        <label htmlFor="educationLevel" className="form-label">
                          {formData.studentType === 'highschool' ? 'Current Education Level' : 'Highest Education Level'}
                        </label>
                        <select
                          id="educationLevel"
                          name="educationLevel"
                          className="form-select"
                          value={formData.educationLevel}
                          onChange={handleChange}
                          disabled={loading}
                        >
                          <option value="">Select education level</option>
                          {formData.studentType === 'highschool' ? (
                            <>
                              <option value="form4">Form 4</option>
                              <option value="form5">Form 5</option>
                              <option value="lgsce">LGSCE Completed</option>
                            </>
                          ) : (
                            <>
                              <option value="certificate">Certificate</option>
                              <option value="diploma">Diploma</option>
                              <option value="bachelor">Bachelor's Degree</option>
                              <option value="master">Master's Degree</option>
                              <option value="phd">PhD</option>
                            </>
                          )}
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="major" className="form-label">
                          {formData.studentType === 'highschool' ? 'Interested Field of Study' : 'Major/Field of Study'}
                        </label>
                        <input
                          type="text"
                          id="major"
                          name="major"
                          className="form-input"
                          value={formData.major}
                          onChange={handleChange}
                          placeholder={
                            formData.studentType === 'highschool' 
                              ? "Enter your preferred field of study" 
                              : "Enter your major/field of study"
                          }
                          disabled={loading}
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              {formData.role === 'institution' && (
                <>
                  <div className="form-group">
                    <label htmlFor="institutionName" className="form-label">
                      Institution Name *
                    </label>
                    <input
                      type="text"
                      id="institutionName"
                      name="institutionName"
                      className="form-input"
                      value={formData.institutionName}
                      onChange={handleChange}
                      placeholder="Enter institution name"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="address" className="form-label">
                      Address
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      className="form-input"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Enter institution address (optional)"
                      disabled={loading}
                    />
                  </div>
                </>
              )}

              {formData.role === 'company' && (
                <>
                  <div className="form-group">
                    <label htmlFor="companyName" className="form-label">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      id="companyName"
                      name="companyName"
                      className="form-input"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="Enter company name"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="industry" className="form-label">
                      Industry
                    </label>
                    <input
                      type="text"
                      id="industry"
                      name="industry"
                      className="form-input"
                      value={formData.industry}
                      onChange={handleChange}
                      placeholder="Enter industry (optional)"
                      disabled={loading}
                    />
                  </div>
                </>
              )}

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={goBack}
                  disabled={loading}
                >
                  Back
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Creating Account...
                    </>
                  ) : (
                    'Complete Registration'
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="auth-link">
                Sign in here
              </Link>
            </p>
            <div style={{ marginTop: '10px', fontSize: '12px', padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
              <button 
                type="button" 
                onClick={testConnection}
                style={{ 
                  background: 'transparent', 
                  border: '1px solid #007bff', 
                  color: '#007bff',
                  padding: '5px 10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  marginBottom: '5px'
                }}
              >
                Test Server Connection
              </button>
              <div>
                <strong>Frontend:</strong> {window.location.origin}
              </div>
              <div>
                <strong>Backend API:</strong> {API_BASE_URL}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;