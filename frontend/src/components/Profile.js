// src/components/Profile.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://group-assignment-2-ypxs.onrender.com/api';

const Profile = ({ user: propUser }) => {
  const [user, setUser] = useState(propUser);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    studentType: '',
    educationLevel: '',
    major: '',
    address: '',
    dateOfBirth: '',
    gender: '',
    nationality: '',
    idNumber: '',
    emergencyContact: '',
    highSchoolName: '',
    graduationYear: ''
  });

  const apiCall = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication token not found. Please log in again.');
    }

    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
      if (response.status === 401 || response.status === 403) {
        // Token expired or invalid
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        throw new Error('Session expired. Please log in again.');
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (!user) {
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/profile');
      
      if (data.profile) {
        setProfile(data.profile);
        // Populate form with existing data
        const userData = data.user || {};
        const profileData = data.profile || {};
        
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          phone: profileData.phone || userData.phone || '',
          studentType: userData.studentType || profileData.studentType || '',
          educationLevel: userData.educationLevel || profileData.educationLevel || '',
          major: userData.major || profileData.major || '',
          address: profileData.address || '',
          dateOfBirth: profileData.dateOfBirth || '',
          gender: profileData.gender || '',
          nationality: profileData.nationality || '',
          idNumber: profileData.idNumber || '',
          emergencyContact: profileData.emergencyContact || '',
          highSchoolName: profileData.highSchoolName || '',
          graduationYear: profileData.graduationYear || ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setMessage(`Error loading profile: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      await apiCall('/profile', {
        method: 'PUT',
        body: formData
      });

      // Update local user data
      const updatedUser = { 
        ...user, 
        name: formData.name,
        phone: formData.phone,
        studentType: formData.studentType,
        educationLevel: formData.educationLevel,
        major: formData.major
      };
      
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setMessage('Profile updated successfully!');
      setIsEditing(false);
      
      // Reload profile data
      await loadProfile();
    } catch (error) {
      setMessage(`Error updating profile: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reload original data
    loadProfile();
  };

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      await apiCall('/profile', {
        method: 'DELETE'
      });
      
      setMessage('Account deleted successfully!');
      
      // Logout and redirect to login
      setTimeout(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }, 2000);
      
    } catch (error) {
      setMessage(`Error deleting account: ${error.message}`);
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleBackToDashboard = () => {
    if (user.role === 'student') {
      navigate('/student/dashboard');
    } else if (user.role === 'institution') {
      navigate('/institution/dashboard');
    } else if (user.role === 'company') {
      navigate('/company/dashboard');
    } else if (user.role === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not provided';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (loading && !saving) {
    return (
      <div className="profile-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <button 
          className="btn btn-secondary back-button"
          onClick={handleBackToDashboard}
        >
          ← Back to Dashboard
        </button>
        <h1>My Profile</h1>
        <p>Manage your personal information and academic details</p>
      </div>

      {message && (
        <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-card-header">
            <h2>Personal Information</h2>
            <div className="profile-actions">
              {!isEditing ? (
                <button 
                  className="btn btn-primary"
                  onClick={handleEdit}
                >
                  ✏️ Edit Profile
                </button>
              ) : (
                <button 
                  className="btn btn-secondary"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {!isEditing ? (
            // Display Mode
            <div className="profile-display">
              <div className="info-section">
                <h3>Basic Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Full Name</label>
                    <span className="info-value">{formData.name || 'Not provided'}</span>
                  </div>
                  <div className="info-item">
                    <label>Email</label>
                    <span className="info-value">{formData.email || 'Not provided'}</span>
                  </div>
                  <div className="info-item">
                    <label>Phone</label>
                    <span className="info-value">{formData.phone || 'Not provided'}</span>
                  </div>
                  {user?.role === 'student' && (
                    <div className="info-item">
                      <label>Student Type</label>
                      <span className="info-value">
                        {formData.studentType === 'highschool' ? '🏫 High School Student' : 
                         formData.studentType === 'college' ? '🎓 College Graduate' : 
                         'Not specified'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {user?.role === 'student' && (
                <div className="info-section">
                  <h3>Academic Information</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Education Level</label>
                      <span className="info-value">{formData.educationLevel || 'Not provided'}</span>
                    </div>
                    <div className="info-item">
                      <label>Major/Field of Study</label>
                      <span className="info-value">{formData.major || 'Not provided'}</span>
                    </div>
                    {formData.studentType === 'highschool' && (
                      <>
                        <div className="info-item">
                          <label>High School</label>
                          <span className="info-value">{formData.highSchoolName || 'Not provided'}</span>
                        </div>
                        <div className="info-item">
                          <label>Graduation Year</label>
                          <span className="info-value">{formData.graduationYear || 'Not provided'}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="info-section">
                <h3>Additional Details</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Date of Birth</label>
                    <span className="info-value">{formatDate(formData.dateOfBirth)}</span>
                  </div>
                  <div className="info-item">
                    <label>Gender</label>
                    <span className="info-value">{formData.gender || 'Not provided'}</span>
                  </div>
                  <div className="info-item">
                    <label>Nationality</label>
                    <span className="info-value">{formData.nationality || 'Not provided'}</span>
                  </div>
                  <div className="info-item">
                    <label>ID Number/Passport</label>
                    <span className="info-value">{formData.idNumber || 'Not provided'}</span>
                  </div>
                  <div className="info-item full-width">
                    <label>Address</label>
                    <span className="info-value">{formData.address || 'Not provided'}</span>
                  </div>
                  <div className="info-item full-width">
                    <label>Emergency Contact</label>
                    <span className="info-value">{formData.emergencyContact || 'Not provided'}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Edit Mode
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-section">
                <h3>Basic Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name" className="form-label required">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className="form-input"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

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
                      disabled
                      title="Email cannot be changed"
                    />
                    <small className="form-help">Email cannot be changed</small>
                  </div>
                </div>

                <div className="form-row">
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
                      onChange={handleInputChange}
                      placeholder="+266 XXX XXX"
                    />
                  </div>

                  {user?.role === 'student' && (
                    <div className="form-group">
                      <label htmlFor="studentType" className="form-label required">
                        Student Type
                      </label>
                      <select
                        id="studentType"
                        name="studentType"
                        className="form-select"
                        value={formData.studentType}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Type</option>
                        <option value="highschool">High School Student</option>
                        <option value="college">College Graduate</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {user?.role === 'student' && (
                <div className="form-section">
                  <h3>Academic Information</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="educationLevel" className="form-label">
                        Education Level
                      </label>
                      <select
                        id="educationLevel"
                        name="educationLevel"
                        className="form-select"
                        value={formData.educationLevel}
                        onChange={handleInputChange}
                      >
                        <option value="">Select Level</option>
                        <option value="highschool">High School</option>
                        <option value="certificate">Certificate</option>
                        <option value="diploma">Diploma</option>
                        <option value="bachelor">Bachelor's Degree</option>
                        <option value="master">Master's Degree</option>
                        <option value="phd">PhD</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="major" className="form-label">
                        Major/Field of Study
                      </label>
                      <input
                        type="text"
                        id="major"
                        name="major"
                        className="form-input"
                        value={formData.major}
                        onChange={handleInputChange}
                        placeholder="e.g., Computer Science, Business Administration"
                      />
                    </div>
                  </div>

                  {formData.studentType === 'highschool' && (
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="highSchoolName" className="form-label">
                          High School Name
                        </label>
                        <input
                          type="text"
                          id="highSchoolName"
                          name="highSchoolName"
                          className="form-input"
                          value={formData.highSchoolName}
                          onChange={handleInputChange}
                          placeholder="Name of your high school"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="graduationYear" className="form-label">
                          Graduation Year
                        </label>
                        <input
                          type="number"
                          id="graduationYear"
                          name="graduationYear"
                          className="form-input"
                          value={formData.graduationYear}
                          onChange={handleInputChange}
                          placeholder="e.g., 2024"
                          min="2000"
                          max="2030"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="form-section">
                <h3>Additional Details</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="dateOfBirth" className="form-label">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      id="dateOfBirth"
                      name="dateOfBirth"
                      className="form-input"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="gender" className="form-label">
                      Gender
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      className="form-select"
                      value={formData.gender}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="nationality" className="form-label">
                      Nationality
                    </label>
                    <input
                      type="text"
                      id="nationality"
                      name="nationality"
                      className="form-input"
                      value={formData.nationality}
                      onChange={handleInputChange}
                      placeholder="Your nationality"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="idNumber" className="form-label">
                      ID Number/Passport
                    </label>
                    <input
                      type="text"
                      id="idNumber"
                      name="idNumber"
                      className="form-input"
                      value={formData.idNumber}
                      onChange={handleInputChange}
                      placeholder="Your ID number or passport"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="address" className="form-label">
                    Home Address
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    className="form-input"
                    rows="3"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Your complete home address"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="emergencyContact" className="form-label">
                    Emergency Contact
                  </label>
                  <input
                    type="text"
                    id="emergencyContact"
                    name="emergencyContact"
                    className="form-input"
                    value={formData.emergencyContact}
                    onChange={handleInputChange}
                    placeholder="Name and phone number of emergency contact"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? '💾 Saving...' : '💾 Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="profile-sidebar">
          <div className="info-card">
            <h3>Profile Status</h3>
            <div className="status-item">
              <span className="status-label">Profile Completion</span>
              <span className="status-value">
                {calculateProfileCompletion(formData)}%
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Account Type</span>
              <span className="status-value">{user?.role || 'Student'}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Member Since</span>
              <span className="status-value">
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Recently'}
              </span>
            </div>
          </div>

          <div className="info-card">
            <h3>Quick Actions</h3>
            <div className="action-buttons">
              <button 
                className="btn btn-primary btn-full"
                onClick={handleEdit}
                disabled={isEditing}
              >
                ✏️ Edit Profile
              </button>
              <button 
                className="btn btn-danger btn-full"
                onClick={() => setShowDeleteConfirm(true)}
              >
                🗑️ Delete Account
              </button>
            </div>
          </div>

          <div className="info-card">
            <h3>Quick Tips</h3>
            <ul className="tips-list">
              <li>Keep your profile updated for better opportunities</li>
              <li>Complete all required fields for full functionality</li>
              <li>Your email is used for important notifications</li>
              {user?.role === 'student' && formData.studentType === 'highschool' && (
                <li>Update your high school information for course applications</li>
              )}
              {user?.role === 'student' && formData.studentType === 'college' && (
                <li>Keep your education level and major current for job matches</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Confirm Account Deletion</h3>
              <button 
                className="close-button"
                onClick={() => setShowDeleteConfirm(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <p>Are you sure you want to delete your account? This action cannot be undone.</p>
              <p>All your data, including applications and profile information, will be permanently deleted.</p>
            </div>
            
            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger"
                onClick={handleDeleteAccount}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Yes, Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to calculate profile completion percentage
const calculateProfileCompletion = (formData) => {
  const requiredFields = ['name', 'email'];
  if (formData.studentType) {
    requiredFields.push('studentType');
  }
  
  const optionalFields = ['phone', 'educationLevel', 'major', 'dateOfBirth', 'gender', 'nationality', 'address'];
  
  const totalFields = requiredFields.length + optionalFields.length;
  let completedFields = 0;

  // Check required fields
  requiredFields.forEach(field => {
    if (formData[field] && formData[field].trim() !== '') {
      completedFields++;
    }
  });

  // Check optional fields (weighted less)
  optionalFields.forEach(field => {
    if (formData[field] && formData[field].trim() !== '') {
      completedFields += 0.5; // Optional fields count half
    }
  });

  return Math.min(100, Math.round((completedFields / totalFields) * 100));
};

export default Profile;