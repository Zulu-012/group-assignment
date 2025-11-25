// src/components/InstituteDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://group-assignment-94en.onrender.com';

// Helper function to remove undefined and empty string values from objects
const cleanFormData = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(cleanFormData);
  }
  
  const cleanObj = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null && value !== '') {
      cleanObj[key] = cleanFormData(value);
    }
  }
  return cleanObj;
};

const InstituteDashboard = ({ user: propUser }) => {
  const [user, setUser] = useState(propUser);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [faculties, setFaculties] = useState([]);
  const [courses, setCourses] = useState([]);
  const [applications, setApplications] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // Form states
  const [showFacultyForm, setShowFacultyForm] = useState(false);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [facultyForm, setFacultyForm] = useState({ 
    name: '', 
    description: '' 
  });
  const [courseForm, setCourseForm] = useState({
    name: '',
    description: '',
    facultyId: '',
    requirements: '',
    duration: '',
    seats: ''
  });

  // Enhanced API call with proper authentication
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
      const response = await fetch(`${API_BASE_URL}/api${endpoint}`, config);
      
      if (response.status === 401 || response.status === 403) {
        // Token expired or invalid
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        throw new Error('Session expired. Please log in again.');
      }
      
      // Check if response is HTML (error page)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        const text = await response.text();
        throw new Error(`Server returned HTML instead of JSON. Check if server is running. Response: ${text.substring(0, 100)}...`);
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'institution') {
        navigate('/login');
        return;
      }
      setUser(parsedUser);
    } catch (e) {
      navigate('/login');
      return;
    }
  }, [navigate]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, activeTab]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load real data from server
      await Promise.all([
        loadProfile(),
        loadApplications(),
        loadFaculties(),
        loadCourses()
      ]);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setMessage(`Error loading data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      const data = await apiCall('/profile');
      setProfile(data.profile);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadApplications = async () => {
    try {
      const data = await apiCall('/institution/applications');
      setApplications(data.applications || []);
    } catch (error) {
      console.error('Error loading applications:', error);
      setApplications([]);
    }
  };

  const loadFaculties = async () => {
    try {
      const data = await apiCall('/institution/faculties');
      setFaculties(data.faculties || []);
    } catch (error) {
      console.error('Error loading faculties:', error);
      setFaculties([]);
    }
  };

  const loadCourses = async () => {
    try {
      const data = await apiCall('/institution/courses');
      setCourses(data.courses || []);
    } catch (error) {
      console.error('Error loading courses:', error);
      setCourses([]);
    }
  };

  const handleProfileNavigation = () => {
    setActiveTab('profile');
  };

  const handleAddFaculty = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const facultyPayload = cleanFormData({
        name: facultyForm.name,
        description: facultyForm.description
      });

      await apiCall('/institution/faculties', {
        method: 'POST',
        body: facultyPayload
      });

      setMessage('Faculty added successfully!');
      setFacultyForm({ name: '', description: '' });
      setShowFacultyForm(false);
      await loadFaculties();
    } catch (error) {
      setMessage(`Error adding faculty: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const coursePayload = cleanFormData({
        name: courseForm.name,
        description: courseForm.description,
        facultyId: courseForm.facultyId,
        requirements: courseForm.requirements,
        duration: courseForm.duration,
        totalSeats: parseInt(courseForm.seats)
      });

      await apiCall('/institution/courses', {
        method: 'POST',
        body: coursePayload
      });

      setMessage('Course added successfully!');
      setCourseForm({ 
        name: '', 
        description: '', 
        facultyId: '', 
        requirements: '', 
        duration: '', 
        seats: '' 
      });
      setShowCourseForm(false);
      await loadCourses();
    } catch (error) {
      setMessage(`Error adding course: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationAction = async (applicationId, status, notes = '') => {
    setLoading(true);
    try {
      await apiCall(`/institution/applications/${applicationId}`, {
        method: 'PUT',
        body: { status, notes }
      });

      setMessage(`Application ${status} successfully!`);
      await loadApplications();
    } catch (error) {
      setMessage(`Error updating application: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const profilePayload = cleanFormData({
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
        description: profile.description
      });

      await apiCall('/profile', {
        method: 'PUT',
        body: profilePayload
      });

      setMessage('Profile updated successfully!');
    } catch (error) {
      setMessage(`Error updating profile: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const renderDashboardTab = () => (
    <div className="dashboard-module">
      <h2>Welcome to Your Institution Dashboard</h2>
      <div className="institution-badge">
        🏛️ {profile?.name || 'Institution'}
      </div>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Total Applications</h3>
          <p className="stat-number">{applications.length}</p>
          <p>Applications received</p>
        </div>
        <div className="stat-card">
          <h3>Pending Review</h3>
          <p className="stat-number">
            {applications.filter(app => app.status === 'pending').length}
          </p>
          <p>Applications pending</p>
        </div>
        <div className="stat-card">
          <h3>Approved</h3>
          <p className="stat-number">
            {applications.filter(app => app.status === 'approved').length}
          </p>
          <p>Applications approved</p>
        </div>
        <div className="stat-card">
          <h3>Total Courses</h3>
          <p className="stat-number">{courses.length}</p>
          <p>Courses offered</p>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button 
            className="btn btn-primary"
            onClick={() => setActiveTab('applications')}
          >
            📝 Review Applications
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => setShowCourseForm(true)}
          >
            ➕ Add New Course
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => setShowFacultyForm(true)}
          >
            🏛️ Add New Faculty
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => setActiveTab('courses')}
          >
            📚 Manage Courses
          </button>
        </div>
      </div>

      <div className="recent-activity">
        <h3>Recent Applications</h3>
        <div className="applications-list">
          {applications.slice(0, 5).map(application => (
            <div key={application.id} className="application-card">
              <div className="application-header">
                <h4>{application.studentName}</h4>
                <span className={`status-badge ${application.status}`}>
                  {application.status}
                </span>
              </div>
              <p className="application-course">{application.courseName}</p>
              <p className="application-date">
                Applied: {formatDate(application.appliedAt)}
              </p>
            </div>
          ))}
          {applications.length === 0 && (
            <div className="no-data">
              <p>No applications received yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderApplicationsTab = () => (
    <div className="dashboard-module">
      <h2>Student Applications</h2>
      
      <div className="applications-filters">
        <button className="filter-btn active">
          All ({applications.length})
        </button>
        <button className="filter-btn">
          Pending ({applications.filter(app => app.status === 'pending').length})
        </button>
        <button className="filter-btn">
          Approved ({applications.filter(app => app.status === 'approved').length})
        </button>
        <button className="filter-btn">
          Rejected ({applications.filter(app => app.status === 'rejected').length})
        </button>
      </div>

      <div className="applications-grid">
        {applications.length === 0 ? (
          <div className="no-data">
            <p>No applications received yet</p>
          </div>
        ) : (
          applications.map(application => (
            <div key={application.id} className="application-card">
              <div className="application-header">
                <h3>{application.studentName}</h3>
                <span className={`status-badge ${application.status}`}>
                  {application.status}
                </span>
              </div>
              
              <div className="application-details">
                <p><strong>Course:</strong> {application.courseName}</p>
                <p><strong>Email:</strong> {application.studentEmail}</p>
                <p><strong>Applied:</strong> {formatDate(application.appliedAt)}</p>
              </div>

              {application.comprehensiveApplicationId && (
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => window.open(`/api/student/applications/comprehensive/${application.id}`, '_blank')}
                >
                  View Full Application
                </button>
              )}

              <div className="application-actions">
                {application.status === 'pending' && (
                  <>
                    <button 
                      className="btn btn-success btn-sm"
                      onClick={() => handleApplicationAction(application.id, 'approved')}
                    >
                      Approve
                    </button>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleApplicationAction(application.id, 'rejected')}
                    >
                      Reject
                    </button>
                  </>
                )}
                {application.status === 'approved' && (
                  <button 
                    className="btn btn-warning btn-sm"
                    onClick={() => handleApplicationAction(application.id, 'pending')}
                  >
                    Mark as Pending
                  </button>
                )}
                {application.status === 'rejected' && (
                  <button 
                    className="btn btn-warning btn-sm"
                    onClick={() => handleApplicationAction(application.id, 'pending')}
                  >
                    Mark as Pending
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderFacultiesTab = () => (
    <div className="dashboard-module">
      <h2>Manage Faculties</h2>
      
      <div className="section-actions">
        <button 
          className="btn btn-primary"
          onClick={() => setShowFacultyForm(true)}
        >
          ➕ Add New Faculty
        </button>
      </div>

      <div className="faculties-grid">
        {faculties.length === 0 ? (
          <div className="no-data">
            <p>No faculties added yet. Add your first faculty to get started!</p>
          </div>
        ) : (
          faculties.map(faculty => (
            <div key={faculty.id} className="faculty-card">
              <div className="faculty-header">
                <h3>{faculty.name}</h3>
                <span className="faculty-meta">
                  Created: {formatDate(faculty.createdAt)}
                </span>
              </div>
              
              <div className="faculty-details">
                <p>{faculty.description}</p>
                <p><strong>Courses:</strong> {faculty.courses?.length || 0}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderCoursesTab = () => (
    <div className="dashboard-module">
      <h2>Manage Courses</h2>
      
      <div className="section-actions">
        <button 
          className="btn btn-primary"
          onClick={() => setShowCourseForm(true)}
        >
          ➕ Add New Course
        </button>
      </div>

      <div className="courses-grid">
        {courses.length === 0 ? (
          <div className="no-data">
            <p>No courses added yet. Add your first course to get started!</p>
          </div>
        ) : (
          courses.map(course => (
            <div key={course.id} className="course-card">
              <div className="course-header">
                <h3>{course.name}</h3>
                <span className={`status-badge ${course.status || 'active'}`}>
                  {course.status || 'active'}
                </span>
              </div>
              
              <div className="course-details">
                <p>{course.description}</p>
                <div className="course-meta">
                  <span>Duration: {course.duration}</span>
                  <span>Seats: {course.availableSeats || 0}/{course.totalSeats}</span>
                  <span>Faculty: {course.faculty?.name || 'N/A'}</span>
                </div>
                <p><strong>Requirements:</strong> {course.requirements}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderProfileTab = () => (
    <div className="dashboard-module">
      <h2>Institution Profile</h2>
      
      {profile ? (
        <form onSubmit={handleProfileUpdate} className="profile-form">
          <div className="form-section">
            <h3>Basic Information</h3>
            
            <div className="form-group">
              <label htmlFor="institutionName" className="form-label required">
                Institution Name
              </label>
              <input
                type="text"
                id="institutionName"
                className="form-input"
                value={profile.name || ''}
                onChange={(e) => setProfile({...profile, name: e.target.value})}
                required
                placeholder="Enter institution name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="institutionEmail" className="form-label required">
                Email Address
              </label>
              <input
                type="email"
                id="institutionEmail"
                className="form-input"
                value={profile.email || ''}
                onChange={(e) => setProfile({...profile, email: e.target.value})}
                required
                placeholder="Enter institution email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="institutionPhone" className="form-label">
                Phone Number
              </label>
              <input
                type="tel"
                id="institutionPhone"
                className="form-input"
                value={profile.phone || ''}
                onChange={(e) => setProfile({...profile, phone: e.target.value})}
                placeholder="Enter institution phone number"
              />
            </div>

            <div className="form-group">
              <label htmlFor="institutionAddress" className="form-label">
                Address
              </label>
              <textarea
                id="institutionAddress"
                className="form-input"
                value={profile.address || ''}
                onChange={(e) => setProfile({...profile, address: e.target.value})}
                rows="3"
                placeholder="Enter institution address"
              />
            </div>

            <div className="form-group">
              <label htmlFor="institutionDescription" className="form-label">
                Description
              </label>
              <textarea
                id="institutionDescription"
                className="form-input"
                value={profile.description || ''}
                onChange={(e) => setProfile({...profile, description: e.target.value})}
                rows="4"
                placeholder="Enter institution description"
              />
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? '🔄 Updating...' : '💾 Update Profile'}
            </button>
          </div>
        </form>
      ) : (
        <div className="no-data">
          <p>Loading profile...</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="institute-dashboard">
      {/* Floating bubbles background elements */}
      <div className="floating-bubble"></div>
      <div className="floating-bubble"></div>
      <div className="floating-bubble"></div>
      <div className="floating-bubble"></div>
      
      <div className="dashboard-header">
        <div className="user-welcome">
          <h1>Welcome back, {profile?.name || 'Institution'}!</h1>
          <p>Manage your courses, faculties, and student applications</p>
        </div>
        <div className="user-actions">
          <button 
            className="btn btn-secondary"
            onClick={handleProfileNavigation}
          >
            👤 Update Profile
          </button>
          <button 
            className="btn btn-secondary"
            onClick={loadDashboardData}
          >
            🔄 Refresh Data
          </button>
          <button 
            className="btn btn-secondary"
            onClick={handleLogout}
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {message && (
        <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="dashboard-tabs">
        <button 
          className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        
        <button 
          className={`tab-button ${activeTab === 'applications' ? 'active' : ''}`}
          onClick={() => setActiveTab('applications')}
        >
          📝 Student Applications
        </button>
        
        <button 
          className={`tab-button ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          📚 Manage Courses
        </button>
        
        <button 
          className={`tab-button ${activeTab === 'faculties' ? 'active' : ''}`}
          onClick={() => setActiveTab('faculties')}
        >
          🏛️ Manage Faculties
        </button>
        
        <button 
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          👤 Institution Profile
        </button>
      </div>

      <div className="dashboard-content">
        {loading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
            Loading...
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && renderDashboardTab()}
            {activeTab === 'applications' && renderApplicationsTab()}
            {activeTab === 'courses' && renderCoursesTab()}
            {activeTab === 'faculties' && renderFacultiesTab()}
            {activeTab === 'profile' && renderProfileTab()}
          </>
        )}
      </div>

      {/* Faculty Form Modal */}
      {showFacultyForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add New Faculty</h3>
              <button 
                className="close-button"
                onClick={() => setShowFacultyForm(false)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAddFaculty}>
              <div className="form-group">
                <label className="form-label required">Faculty Name</label>
                <input
                  type="text"
                  value={facultyForm.name}
                  onChange={(e) => setFacultyForm({
                    ...facultyForm,
                    name: e.target.value
                  })}
                  placeholder="Enter faculty name"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label required">Description</label>
                <textarea
                  value={facultyForm.description}
                  onChange={(e) => setFacultyForm({
                    ...facultyForm,
                    description: e.target.value
                  })}
                  placeholder="Enter faculty description"
                  rows="4"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowFacultyForm(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? '🔄 Adding...' : '➕ Add Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Course Form Modal */}
      {showCourseForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add New Course</h3>
              <button 
                className="close-button"
                onClick={() => setShowCourseForm(false)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAddCourse}>
              <div className="form-group">
                <label className="form-label required">Course Name</label>
                <input
                  type="text"
                  value={courseForm.name}
                  onChange={(e) => setCourseForm({
                    ...courseForm,
                    name: e.target.value
                  })}
                  placeholder="Enter course name"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label required">Description</label>
                <textarea
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({
                    ...courseForm,
                    description: e.target.value
                  })}
                  placeholder="Enter course description"
                  rows="3"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label required">Faculty</label>
                <select
                  value={courseForm.facultyId}
                  onChange={(e) => setCourseForm({
                    ...courseForm,
                    facultyId: e.target.value
                  })}
                  required
                  className="form-select"
                >
                  <option value="">Select Faculty</option>
                  {faculties.map(faculty => (
                    <option key={faculty.id} value={faculty.id}>
                      {faculty.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label required">Requirements</label>
                <textarea
                  value={courseForm.requirements}
                  onChange={(e) => setCourseForm({
                    ...courseForm,
                    requirements: e.target.value
                  })}
                  placeholder="Enter course requirements"
                  rows="3"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">Duration</label>
                  <input
                    type="text"
                    value={courseForm.duration}
                    onChange={(e) => setCourseForm({
                      ...courseForm,
                      duration: e.target.value
                    })}
                    placeholder="e.g., 4 years"
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label required">Total Seats</label>
                  <input
                    type="number"
                    value={courseForm.seats}
                    onChange={(e) => setCourseForm({
                      ...courseForm,
                      seats: e.target.value
                    })}
                    min="1"
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowCourseForm(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? '🔄 Adding...' : '➕ Add Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstituteDashboard;