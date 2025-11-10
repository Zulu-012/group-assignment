// src/components/InstituteDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const InstituteDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [faculties, setFaculties] = useState([]);
  const [courses, setCourses] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);

  // Form states
  const [facultyForm, setFacultyForm] = useState({ name: '', description: '' });
  const [courseForm, setCourseForm] = useState({
    name: '',
    description: '',
    facultyId: '',
    requirements: '',
    duration: '',
    seats: ''
  });

  // Use consistent URL for all components
  const API_BASE_URL = 'https://group-assignment-2-ypxs.onrender.com';

  useEffect(() => {
    loadDashboardData();
  }, [activeTab]);

  // Enhanced loadDashboardData with better error handling
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      if (activeTab === 'faculties') {
        const response = await fetch(`${API_BASE_URL}/api/institution/faculties`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        // Check if response is HTML (error page)
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          const text = await response.text();
          throw new Error(`Server returned HTML instead of JSON. Check if server is running. Response: ${text.substring(0, 100)}...`);
        }
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success) {
          setFaculties(data.faculties || []);
        } else {
          throw new Error(data.error || 'Failed to load faculties');
        }
      } else if (activeTab === 'courses') {
        const response = await fetch(`${API_BASE_URL}/api/institution/courses`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          throw new Error('Server returned HTML instead of JSON. Check if server is running.');
        }
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success) {
          setCourses(data.courses || []);
        } else {
          throw new Error(data.error || 'Failed to load courses');
        }
      } else if (activeTab === 'applications') {
        const response = await fetch(`${API_BASE_URL}/api/institution/applications`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          throw new Error('Server returned HTML instead of JSON. Check if server is running.');
        }
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success) {
          setApplications(data.applications || []);
        } else {
          throw new Error(data.error || 'Failed to load applications');
        }
      } else if (activeTab === 'profile') {
        const response = await fetch(`${API_BASE_URL}/api/profile`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          throw new Error('Server returned HTML instead of JSON. Check if server is running.');
        }
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success) {
          setProfile(data.profile);
        } else {
          throw new Error(data.error || 'Failed to load profile');
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      
      // Check if it's a JSON parse error (HTML response)
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        alert(`Server configuration error: Received HTML instead of JSON. Please check if the server is running on port 5000. Visit http://localhost:5000/api/health to verify.`);
      } else {
        alert(`Error loading ${activeTab}: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddFaculty = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/api/institution/faculties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(facultyForm)
      });
      
      // Check if response is HTML (error page)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        const text = await response.text();
        throw new Error(`Server returned HTML instead of JSON. Check if server is running. Response: ${text.substring(0, 100)}...`);
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setFacultyForm({ name: '', description: '' });
        document.getElementById('facultyModal').style.display = 'none';
        loadDashboardData();
        alert('Faculty added successfully!');
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error adding faculty:', error);
      alert('Error adding faculty: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/api/institution/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(courseForm)
      });
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error('Server returned HTML instead of JSON. Check if server is running.');
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setCourseForm({ name: '', description: '', facultyId: '', requirements: '', duration: '', seats: '' });
        document.getElementById('courseModal').style.display = 'none';
        loadDashboardData();
        alert('Course added successfully!');
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error adding course:', error);
      alert('Error adding course: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationAction = async (applicationId, status, notes = '') => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/api/institution/applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, notes })
      });
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error('Server returned HTML instead of JSON. Check if server is running.');
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        loadDashboardData();
        alert(`Application ${status} successfully!`);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error updating application:', error);
      alert('Error updating application: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profile)
      });

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error('Server returned HTML instead of JSON. Check if server is running.');
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        alert('Profile updated successfully!');
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const renderOverview = () => (
    <div className="dashboard-overview">
      <div className="overview-stats">
        <div className="stat-card">
          <h3>Total Applications</h3>
          <p className="stat-number">{applications.length}</p>
        </div>
        <div className="stat-card">
          <h3>Pending Review</h3>
          <p className="stat-number">
            {applications.filter(app => app.status === 'pending').length}
          </p>
        </div>
        <div className="stat-card">
          <h3>Approved</h3>
          <p className="stat-number">
            {applications.filter(app => app.status === 'approved').length}
          </p>
        </div>
        <div className="stat-card">
          <h3>Total Courses</h3>
          <p className="stat-number">{courses.length}</p>
        </div>
      </div>
      
      <div className="recent-activity">
        <h3>Recent Applications</h3>
        {applications.slice(0, 5).map(application => (
          <div key={application.id} className="activity-item">
            <span className="student-name">{application.studentName}</span>
            <span className="course-name">{application.courseName}</span>
            <span className={`status status-${application.status}`}>
              {application.status}
            </span>
          </div>
        ))}
        {applications.length === 0 && (
          <p className="no-data">No applications yet</p>
        )}
      </div>
    </div>
  );

  const renderFaculties = () => (
    <div className="faculties-section">
      <div className="section-header">
        <h3>Manage Faculties</h3>
        <button 
          className="btn-primary"
          onClick={() => document.getElementById('facultyModal').style.display = 'block'}
        >
          Add New Faculty
        </button>
      </div>

      <div className="faculties-list">
        {faculties.map(faculty => (
          <div key={faculty.id} className="faculty-card">
            <h4>{faculty.name}</h4>
            <p>{faculty.description}</p>
            <span className="faculty-meta">
              Created: {new Date(faculty.createdAt).toLocaleDateString()}
            </span>
          </div>
        ))}
        {faculties.length === 0 && (
          <p className="no-data">No faculties added yet</p>
        )}
      </div>

      {/* Faculty Modal */}
      <div id="facultyModal" className="modal">
        <div className="modal-content">
          <span className="close" onClick={() => document.getElementById('facultyModal').style.display = 'none'}>&times;</span>
          <h3>Add New Faculty</h3>
          <form onSubmit={handleAddFaculty}>
            <div className="form-group">
              <label>Faculty Name:</label>
              <input
                type="text"
                value={facultyForm.name}
                onChange={(e) => setFacultyForm({...facultyForm, name: e.target.value})}
                required
                placeholder="Enter faculty name"
              />
            </div>
            <div className="form-group">
              <label>Description:</label>
              <textarea
                value={facultyForm.description}
                onChange={(e) => setFacultyForm({...facultyForm, description: e.target.value})}
                required
                placeholder="Enter faculty description"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Adding...' : 'Add Faculty'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  const renderCourses = () => (
    <div className="courses-section">
      <div className="section-header">
        <h3>Manage Courses</h3>
        <button 
          className="btn-primary"
          onClick={() => document.getElementById('courseModal').style.display = 'block'}
        >
          Add New Course
        </button>
      </div>

      <div className="courses-list">
        {courses.map(course => (
          <div key={course.id} className="course-card">
            <h4>{course.name}</h4>
            <p>{course.description}</p>
            <div className="course-details">
              <span>Duration: {course.duration}</span>
              <span>Seats: {course.availableSeats}/{course.totalSeats}</span>
              <span className={`status status-${course.status}`}>{course.status}</span>
            </div>
          </div>
        ))}
        {courses.length === 0 && (
          <p className="no-data">No courses added yet</p>
        )}
      </div>

      {/* Course Modal */}
      <div id="courseModal" className="modal">
        <div className="modal-content">
          <span className="close" onClick={() => document.getElementById('courseModal').style.display = 'none'}>&times;</span>
          <h3>Add New Course</h3>
          <form onSubmit={handleAddCourse}>
            <div className="form-group">
              <label>Course Name:</label>
              <input
                type="text"
                value={courseForm.name}
                onChange={(e) => setCourseForm({...courseForm, name: e.target.value})}
                required
                placeholder="Enter course name"
              />
            </div>
            <div className="form-group">
              <label>Description:</label>
              <textarea
                value={courseForm.description}
                onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                required
                placeholder="Enter course description"
              />
            </div>
            <div className="form-group">
              <label>Faculty:</label>
              <select
                value={courseForm.facultyId}
                onChange={(e) => setCourseForm({...courseForm, facultyId: e.target.value})}
                required
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
              <label>Requirements:</label>
              <textarea
                value={courseForm.requirements}
                onChange={(e) => setCourseForm({...courseForm, requirements: e.target.value})}
                required
                placeholder="Enter course requirements"
              />
            </div>
            <div className="form-group">
              <label>Duration:</label>
              <input
                type="text"
                value={courseForm.duration}
                onChange={(e) => setCourseForm({...courseForm, duration: e.target.value})}
                placeholder="e.g., 4 years"
                required
              />
            </div>
            <div className="form-group">
              <label>Total Seats:</label>
              <input
                type="number"
                value={courseForm.seats}
                onChange={(e) => setCourseForm({...courseForm, seats: e.target.value})}
                required
                min="1"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Adding...' : 'Add Course'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  const renderApplications = () => (
    <div className="applications-section">
      <div className="section-header">
        <h3>Student Applications</h3>
        <div className="applications-filters">
          <button className="filter-btn active">All ({applications.length})</button>
          <button className="filter-btn">Pending ({applications.filter(app => app.status === 'pending').length})</button>
          <button className="filter-btn">Approved ({applications.filter(app => app.status === 'approved').length})</button>
          <button className="filter-btn">Rejected ({applications.filter(app => app.status === 'rejected').length})</button>
        </div>
      </div>

      <div className="applications-list">
        {applications.map(application => (
          <div key={application.id} className="application-card">
            <div className="application-header">
              <h4>{application.studentName}</h4>
              <span className={`status status-${application.status}`}>
                {application.status}
              </span>
            </div>
            <div className="application-details">
              <p><strong>Course:</strong> {application.courseName}</p>
              <p><strong>Email:</strong> {application.studentEmail}</p>
              <p><strong>Applied:</strong> {new Date(application.appliedAt).toLocaleDateString()}</p>
            </div>
            {application.comprehensiveApplicationId && (
              <button 
                className="btn-secondary"
                onClick={() => window.open(`/api/student/applications/comprehensive/${application.id}`, '_blank')}
              >
                View Full Application
              </button>
            )}
            <div className="application-actions">
              {application.status === 'pending' && (
                <>
                  <button 
                    className="btn-success"
                    onClick={() => handleApplicationAction(application.id, 'approved')}
                  >
                    Approve
                  </button>
                  <button 
                    className="btn-danger"
                    onClick={() => handleApplicationAction(application.id, 'rejected')}
                  >
                    Reject
                  </button>
                </>
              )}
              {application.status === 'approved' && (
                <button 
                  className="btn-warning"
                  onClick={() => handleApplicationAction(application.id, 'pending')}
                >
                  Mark as Pending
                </button>
              )}
              {application.status === 'rejected' && (
                <button 
                  className="btn-warning"
                  onClick={() => handleApplicationAction(application.id, 'pending')}
                >
                  Mark as Pending
                </button>
              )}
            </div>
          </div>
        ))}
        {applications.length === 0 && (
          <p className="no-data">No applications received yet</p>
        )}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="profile-section">
      <h3>Institution Profile</h3>
      {profile ? (
        <form onSubmit={handleProfileUpdate} className="profile-form">
          <div className="form-group">
            <label>Institution Name:</label>
            <input
              type="text"
              value={profile.name || ''}
              onChange={(e) => setProfile({...profile, name: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={profile.email || ''}
              onChange={(e) => setProfile({...profile, email: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Phone:</label>
            <input
              type="tel"
              value={profile.phone || ''}
              onChange={(e) => setProfile({...profile, phone: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Address:</label>
            <textarea
              value={profile.address || ''}
              onChange={(e) => setProfile({...profile, address: e.target.value})}
              rows="3"
            />
          </div>
          <div className="form-group">
            <label>Description:</label>
            <textarea
              value={profile.description || ''}
              onChange={(e) => setProfile({...profile, description: e.target.value})}
              rows="4"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      ) : (
        <p className="no-data">Loading profile...</p>
      )}
    </div>
  );

  return (
    <div className="institute-dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Institution Dashboard</h1>
        <p className="dashboard-subtitle">Manage your courses and student applications</p>
      </div>
      
      <div className="dashboard-layout">
        <div className="sidebar">
          <button
            className={`sidebar-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Overview
          </button>
          <button
            className={`sidebar-btn ${activeTab === 'faculties' ? 'active' : ''}`}
            onClick={() => setActiveTab('faculties')}
          >
            🏛️ Manage Faculties
          </button>
          <button
            className={`sidebar-btn ${activeTab === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveTab('courses')}
          >
            📚 Manage Courses
          </button>
          <button
            className={`sidebar-btn ${activeTab === 'applications' ? 'active' : ''}`}
            onClick={() => setActiveTab('applications')}
          >
            📝 Student Applications
          </button>
          <button
            className={`sidebar-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            ⚙️ Institution Profile
          </button>
          <button
            className="sidebar-btn logout-btn"
            onClick={handleLogout}
          >
            🚪 Logout
          </button>
        </div>
        
        <div className="dashboard-content">
          {loading && <div className="loading">Loading...</div>}
          
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'faculties' && renderFaculties()}
          {activeTab === 'courses' && renderCourses()}
          {activeTab === 'applications' && renderApplications()}
          {activeTab === 'profile' && renderProfile()}
        </div>
      </div>
    </div>
  );
};

export default InstituteDashboard;