// src/components/CompanyDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://group-assignment-2-ypxs.onrender.com';

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

const CompanyDashboard = ({ user: propUser }) => {
  const [user, setUser] = useState(propUser);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showJobForm, setShowJobForm] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [qualifiedApplicants, setQualifiedApplicants] = useState([]);
  const [hiredApplicants, setHiredApplicants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobToEdit, setJobToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailedApplicantData, setDetailedApplicantData] = useState({});
  const navigate = useNavigate();

  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    requirements: '',
    qualifications: '',
    skills: '',
    deadline: '',
    location: '',
    salary: '',
    jobType: 'full-time',
    requiredEducation: '',
    experienceLevel: 'entry'
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
    // Check authentication
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'company') {
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
        loadJobs(),
        loadApplications(),
        loadQualifiedApplicants(),
        loadHiredApplicants()
      ]);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setMessage(`Error loading data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadJobs = async () => {
    try {
      const data = await apiCall('/company/jobs');
      setJobs(data.jobs || []);
    } catch (error) {
      console.error('Error loading jobs:', error);
      setJobs([]);
    }
  };

  const loadApplications = async () => {
    try {
      const data = await apiCall('/company/applications');
      // Filter out hired applicants from main applications list
      const nonHiredApplications = (data.applications || []).filter(app => app.status !== 'hired');
      setApplications(nonHiredApplications);
    } catch (error) {
      console.error('Error loading applications:', error);
      setApplications([]);
    }
  };

  const loadQualifiedApplicants = async () => {
    try {
      const data = await apiCall('/company/qualified-applicants');
      // Filter out hired applicants from qualified list
      const nonHiredQualified = (data.applications || []).filter(app => app.status !== 'hired');
      setQualifiedApplicants(nonHiredQualified);
    } catch (error) {
      console.error('Error loading qualified applicants:', error);
      setQualifiedApplicants([]);
    }
  };

  const loadHiredApplicants = async () => {
    try {
      const data = await apiCall('/company/applications');
      // Get only hired applicants
      const hiredApps = (data.applications || []).filter(app => app.status === 'hired');
      setHiredApplicants(hiredApps);
    } catch (error) {
      console.error('Error loading hired applicants:', error);
      setHiredApplicants([]);
    }
  };

  // Load detailed applicant profile data
  const loadApplicantDetails = async (applicantId) => {
    try {
      const data = await apiCall(`/company/applicant/${applicantId}`);
      setDetailedApplicantData(prev => ({
        ...prev,
        [applicantId]: data.profile || data.user || {}
      }));
      return data.profile || data.user || {};
    } catch (error) {
      console.error('Error loading applicant details:', error);
      return {};
    }
  };

  // Statistics calculation - exclude hired applicants from active counts
  const stats = {
    totalJobs: jobs.length,
    totalApplications: applications.length, // This now excludes hired applicants
    qualifiedApplicants: qualifiedApplicants.length, // This now excludes hired applicants
    hiredApplicants: hiredApplicants.length,
    interviewScheduled: applications.filter(app => app.status === 'interview').length,
    pendingReview: applications.filter(app => app.status === 'pending').length
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const jobPayload = cleanFormData({
        ...jobForm,
        requirements: jobForm.requirements.split(',').map(req => req.trim()).filter(req => req),
        qualifications: jobForm.qualifications.split(',').map(qual => qual.trim()).filter(qual => qual),
        skills: jobForm.skills.split(',').map(skill => skill.trim()).filter(skill => skill)
      });

      await apiCall('/company/jobs', {
        method: 'POST',
        body: jobPayload
      });

      setMessage('Job posting created successfully!');
      setJobForm({
        title: '',
        description: '',
        requirements: '',
        qualifications: '',
        skills: '',
        deadline: '',
        location: '',
        salary: '',
        jobType: 'full-time',
        requiredEducation: '',
        experienceLevel: 'entry'
      });
      setShowJobForm(false);
      await loadJobs();
    } catch (error) {
      setMessage(`Error creating job posting: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateJob = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const jobPayload = cleanFormData({
        ...jobToEdit,
        requirements: jobToEdit.requirements.split(',').map(req => req.trim()).filter(req => req),
        qualifications: jobToEdit.qualifications.split(',').map(qual => qual.trim()).filter(qual => qual),
        skills: jobToEdit.skills.split(',').map(skill => skill.trim()).filter(skill => skill)
      });

      await apiCall(`/company/jobs/${jobToEdit.id}`, {
        method: 'PUT',
        body: jobPayload
      });

      setMessage('Job posting updated successfully!');
      setJobToEdit(null);
      await loadJobs();
    } catch (error) {
      setMessage(`Error updating job posting: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (window.confirm('Are you sure you want to delete this job posting?')) {
      try {
        setLoading(true);
        await apiCall(`/company/jobs/${jobId}`, {
          method: 'DELETE'
        });

        setMessage('Job posting deleted successfully!');
        await loadJobs();
      } catch (error) {
        setMessage(`Error deleting job posting: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleUpdateApplicationStatus = async (applicationId, status) => {
    try {
      setLoading(true);
      await apiCall(`/company/applications/${applicationId}`, {
        method: 'PUT',
        body: { status }
      });

      setMessage(`Application ${status} successfully!`);
      
      // Reload all data to reflect changes
      await Promise.all([
        loadApplications(),
        loadQualifiedApplicants(),
        loadHiredApplicants()
      ]);
      
      // Close modal if status is not interview
      if (status !== 'interview') {
        setShowApplicationModal(false);
      }
      
      // If hired, show success message and close modal
      if (status === 'hired') {
        setMessage('🎉 Applicant hired successfully! They have been moved to the Hired Applicants section.');
        setShowApplicationModal(false);
      }
    } catch (error) {
      setMessage(`Error updating application status: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewApplication = async (application) => {
    setSelectedApplication(application);
    
    // Load detailed applicant data if not already loaded
    if (application.studentId && !detailedApplicantData[application.studentId]) {
      await loadApplicantDetails(application.studentId);
    }
    
    setShowApplicationModal(true);
  };

  const handleEditJob = (job) => {
    setJobToEdit({
      ...job,
      requirements: Array.isArray(job.requirements) ? job.requirements.join(', ') : job.requirements,
      qualifications: Array.isArray(job.qualifications) ? job.qualifications.join(', ') : job.qualifications,
      skills: Array.isArray(job.skills) ? job.skills.join(', ') : job.skills
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Filter applications based on search and status (excludes hired by default)
  const filteredApplications = applications.filter(app => {
    const matchesSearch = searchTerm === '' || 
      app.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'draft': return 'warning';
      default: return 'default';
    }
  };

  // Get detailed applicant data
  const getApplicantDetails = (application) => {
    if (!application.studentId) return null;
    return detailedApplicantData[application.studentId] || null;
  };

  // Calculate profile completion percentage
  const calculateProfileCompletion = (profile) => {
    if (!profile) return 0;
    
    const fields = ['name', 'email', 'phone', 'educationLevel', 'major', 'address'];
    const completedFields = fields.filter(field => profile[field] && profile[field].trim() !== '').length;
    
    return Math.round((completedFields / fields.length) * 100);
  };

  // Check if user has company role
  if (user && user.role !== 'company') {
    return (
      <div className="company-dashboard">
        <div className="dashboard-header">
          <div className="error-banner">
            <div className="error-content">
              <h4>Access Denied</h4>
              <p>This dashboard is only available for company accounts.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderDashboardTab = () => (
    <div className="dashboard-module">
      <h2>Recruitment Overview</h2>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Active Jobs</h3>
          <p className="stat-number">{stats.totalJobs}</p>
          <p>Job postings</p>
        </div>
        <div className="stat-card">
          <h3>Applications</h3>
          <p className="stat-number">{stats.totalApplications}</p>
          <p>Active applications</p>
        </div>
        <div className="stat-card">
          <h3>Qualified</h3>
          <p className="stat-number">{stats.qualifiedApplicants}</p>
          <p>Qualified applicants</p>
        </div>
        <div className="stat-card">
          <h3>Hired</h3>
          <p className="stat-number hired-count">{stats.hiredApplicants}</p>
          <p>Successful hires</p>
        </div>
        <div className="stat-card">
          <h3>Interviews</h3>
          <p className="stat-number">{stats.interviewScheduled}</p>
          <p>Scheduled interviews</p>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button 
            className="btn btn-primary"
            onClick={() => setShowJobForm(true)}
          >
            📝 Create Job Posting
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => setActiveTab('jobs')}
          >
            Manage Job Postings
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => setActiveTab('applications')}
          >
            View Applications
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => setActiveTab('qualified')}
          >
            Qualified Applicants
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => setActiveTab('hired')}
          >
            🎉 Hired Applicants ({stats.hiredApplicants})
          </button>
        </div>
      </div>

      {stats.totalApplications > 0 && (
        <div className="notifications-panel">
          <h3>Recent Activity</h3>
          <div className="notifications-list">
            {applications.slice(0, 5).map((application) => (
              <div key={application.id} className="notification-item unread">
                <span className="notification-icon">📢</span>
                <span className="notification-text">
                  New application from {application.student?.name || 'Unknown'} for {application.jobTitle}
                </span>
                <span className="notification-time">
                  {formatDate(application.appliedAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderJobsTab = () => (
    <div className="dashboard-module">
      <h2>Job Postings Management</h2>
      
      <div className="section-actions">
        <button 
          className="btn btn-primary"
          onClick={() => setShowJobForm(true)}
        >
          📝 Create Job Posting
        </button>
      </div>

      <div className="jobs-grid">
        {jobs.map((job) => {
          const jobApplications = applications.filter(app => app.jobId === job.id);
          const jobHiredCount = hiredApplicants.filter(app => app.jobId === job.id).length;
          
          return (
            <div key={job.id} className="job-card">
              <div className="job-header">
                <h3>{job.title}</h3>
                <span className={`status-badge ${job.status || 'active'}`}>
                  {job.status || 'active'}
                </span>
              </div>
              
              <div className="job-meta">
                <span>📍 {job.location}</span>
                <span>💼 {job.jobType}</span>
                <span>💰 {job.salary}</span>
              </div>

              <p className="job-description">
                {job.description && job.description.length > 120 
                  ? `${job.description.substring(0, 120)}...` 
                  : job.description || 'No description provided'}
              </p>

              <div className="job-stats">
                <div className="stat">
                  <span className="stat-number">{jobApplications.length}</span>
                  <span className="stat-label">Active Applications</span>
                </div>
                <div className="stat">
                  <span className="stat-number hired-count">{jobHiredCount}</span>
                  <span className="stat-label">Hired</span>
                </div>
              </div>

              <p className="application-date">
                Deadline: {formatDate(job.deadline)}
              </p>

              <div className="job-actions">
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setSelectedJob(job);
                    setActiveTab('applications');
                  }}
                >
                  View Applications
                </button>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleEditJob(job)}
                >
                  Edit
                </button>
                <button 
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDeleteJob(job.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {jobs.length === 0 && (
        <div className="no-data">
          <p>No job postings yet. Create your first job posting to start receiving applications!</p>
          <button 
            className="btn btn-primary"
            onClick={() => setShowJobForm(true)}
          >
            Create Your First Job Posting
          </button>
        </div>
      )}
    </div>
  );

  const renderApplicationsTab = () => (
    <div className="dashboard-module">
      <h2>Active Job Applications</h2>
      <div className="info-banner">
        <p>💡 <strong>Note:</strong> Hired applicants are automatically moved to the "Hired Applicants" section.</p>
      </div>
      
      {selectedJob && (
        <div className="warning-banner">
          <p>Filtering applications for: <strong>{selectedJob.title}</strong></p>
          <button 
            className="btn btn-sm"
            onClick={() => setSelectedJob(null)}
          >
            Clear Filter
          </button>
        </div>
      )}
      
      <div className="section-actions">
        <div className="filter-controls">
          <input
            type="text"
            placeholder="Search applicants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{width: '200px'}}
          />
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-select"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="interview">Interview</option>
          </select>
          
          <span className="application-count">
            Active: {filteredApplications.length}
          </span>
        </div>
      </div>

      <div className="applications-list">
        {filteredApplications.map((application) => {
          const applicantDetails = getApplicantDetails(application);
          const profileCompletion = calculateProfileCompletion(applicantDetails);
          
          return (
            <div key={application.id} className="application-card">
              <div className="application-header">
                <div className="applicant-info">
                  <h3>{application.student?.name || 'Unknown Applicant'}</h3>
                  <p className="applicant-email">{application.student?.email || 'No email'}</p>
                  <p className="position">{application.jobTitle}</p>
                  
                  {applicantDetails && (
                    <div className="applicant-profile-summary">
                      <span className="profile-completion">
                        Profile: {profileCompletion}% complete
                      </span>
                      {applicantDetails.educationLevel && (
                        <span className="education-level">
                          🎓 {applicantDetails.educationLevel}
                        </span>
                      )}
                      {applicantDetails.major && (
                        <span className="major">
                          📚 {applicantDetails.major}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="applicant-score">
                  <div className={`score-badge ${application.score >= 70 ? 'qualified' : ''}`}>
                    {application.score || 0}%
                  </div>
                  {application.score >= 70 && (
                    <span className="qualified-badge">Qualified</span>
                  )}
                </div>
              </div>

              <div className="applicant-meta">
                <span className="applied-date">
                  Applied: {formatDate(application.appliedAt)}
                </span>
                <span className={`status-badge ${application.status}`}>
                  {application.status}
                </span>
              </div>

              <div className="applicant-actions">
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => handleViewApplication(application)}
                >
                  View Details
                </button>
                
                {application.status === 'pending' && (
                  <>
                    <button 
                      className="btn btn-success btn-sm"
                      onClick={() => handleUpdateApplicationStatus(application.id, 'interview')}
                    >
                      Schedule Interview
                    </button>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleUpdateApplicationStatus(application.id, 'rejected')}
                    >
                      Reject
                    </button>
                  </>
                )}
                
                {application.status === 'interview' && (
                  <>
                    <button 
                      className="btn btn-success btn-sm"
                      onClick={() => handleUpdateApplicationStatus(application.id, 'approved')}
                    >
                      Approve
                    </button>
                    <button 
                      className="btn btn-primary btn-sm hire-btn"
                      onClick={() => handleUpdateApplicationStatus(application.id, 'hired')}
                    >
                      🎉 Hire
                    </button>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleUpdateApplicationStatus(application.id, 'rejected')}
                    >
                      Reject
                    </button>
                  </>
                )}

                {application.status === 'approved' && (
                  <button 
                    className="btn btn-primary btn-sm hire-btn"
                    onClick={() => handleUpdateApplicationStatus(application.id, 'hired')}
                  >
                    🎉 Hire
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredApplications.length === 0 && (
        <div className="no-data">
          <p>
            {selectedJob 
              ? `No active applications for "${selectedJob.title}" yet` 
              : searchTerm || statusFilter !== 'all'
              ? 'No applications match your search criteria'
              : 'No active applications received yet'
            }
          </p>
          {(searchTerm || statusFilter !== 'all') && (
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  );

  const renderQualifiedTab = () => (
    <div className="dashboard-module">
      <h2>Qualified Applicants (Score ≥ 70%)</h2>

      <div className="applicants-list compact">
        {qualifiedApplicants.map((applicant) => {
          const applicantDetails = getApplicantDetails(applicant);
          const profileCompletion = calculateProfileCompletion(applicantDetails);
          
          return (
            <div key={applicant.id} className="applicant-card compact">
              <div className="applicant-header">
                <div className="applicant-info">
                  <h4>{applicant.student?.name || 'Unknown Applicant'}</h4>
                  <p className="applicant-email">{applicant.student?.email || 'No email'}</p>
                  <p className="position">{applicant.jobTitle}</p>
                  
                  {applicantDetails && (
                    <div className="applicant-profile-summary">
                      <span className="profile-completion">
                        Profile: {profileCompletion}% complete
                      </span>
                      {applicantDetails.educationLevel && (
                        <span className="education-level">
                          🎓 {applicantDetails.educationLevel}
                        </span>
                      )}
                      {applicantDetails.major && (
                        <span className="major">
                          📚 {applicantDetails.major}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="applicant-score">
                  <div className="score-circle" style={{
                    background: `conic-gradient(#00f7ff ${applicant.score * 3.6}deg, #e1e5e9 0deg)`
                  }}>
                    <span>{applicant.score}%</span>
                  </div>
                  <span className="score-level">Excellent Match</span>
                </div>
              </div>

              {applicantDetails && (
                <div className="applicant-details">
                  <div className="detail-section">
                    <h4>Education</h4>
                    <p>
                      {applicantDetails.educationLevel || 'Not specified'} 
                      {applicantDetails.major && ` in ${applicantDetails.major}`}
                    </p>
                    {applicantDetails.highSchoolName && (
                      <p className="high-school">
                        🏫 {applicantDetails.highSchoolName}
                        {applicantDetails.graduationYear && ` (${applicantDetails.graduationYear})`}
                      </p>
                    )}
                  </div>
                  
                  {applicantDetails.skills && applicantDetails.skills.length > 0 && (
                    <div className="detail-section">
                      <h4>Skills</h4>
                      <div className="skills-list">
                        {applicantDetails.skills.slice(0, 4).map((skill, index) => (
                          <span key={index} className="skill-tag">{skill}</span>
                        ))}
                        {applicantDetails.skills.length > 4 && (
                          <span className="skill-tag">+{applicantDetails.skills.length - 4} more</span>
                        )}
                      </div>
                    </div>
                  )}

                  {applicantDetails.phone && (
                    <div className="detail-section">
                      <h4>Contact</h4>
                      <p>📞 {applicantDetails.phone}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="applicant-footer">
                <div className="application-meta">
                  <span>Applied: {formatDate(applicant.appliedAt)}</span>
                </div>
                
                <div className="applicant-actions">
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => handleViewApplication(applicant)}
                  >
                    View Details
                  </button>
                  <button 
                    className="btn btn-warning btn-sm"
                    onClick={() => handleUpdateApplicationStatus(applicant.id, 'interview')}
                  >
                    Schedule Interview
                  </button>
                  <button 
                    className="btn btn-primary btn-sm hire-btn"
                    onClick={() => handleUpdateApplicationStatus(applicant.id, 'hired')}
                  >
                    🎉 Hire
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {qualifiedApplicants.length === 0 && (
        <div className="no-data">
          <p>No qualified applicants yet. Qualified applicants will appear here automatically when they score 70% or higher.</p>
        </div>
      )}
    </div>
  );

  const renderInterviewsTab = () => (
    <div className="dashboard-module">
      <h2>Interview Scheduling ({stats.interviewScheduled})</h2>

      <div className="applicants-list">
        {applications
          .filter(app => app.status === 'interview')
          .map((applicant) => {
            const applicantDetails = getApplicantDetails(applicant);
            
            return (
              <div key={applicant.id} className="applicant-card">
                <div className="applicant-header">
                  <div className="applicant-info">
                    <h3>{applicant.student?.name || 'Unknown Applicant'}</h3>
                    <p className="applicant-email">{applicant.student?.email || 'No email'}</p>
                    <p className="position">{applicant.jobTitle}</p>
                    
                    {applicantDetails && (
                      <div className="applicant-profile-summary">
                        {applicantDetails.educationLevel && (
                          <span className="education-level">
                            🎓 {applicantDetails.educationLevel}
                          </span>
                        )}
                        {applicantDetails.major && (
                          <span className="major">
                            📚 {applicantDetails.major}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <span className="status-badge interview">INTERVIEW</span>
                </div>

                <div className="applicant-meta">
                  {applicantDetails?.phone && (
                    <span>📞 {applicantDetails.phone}</span>
                  )}
                  {applicantDetails?.address && (
                    <span>📍 {applicantDetails.address}</span>
                  )}
                </div>

                <div className="applicant-actions">
                  <button 
                    className="btn btn-success btn-sm"
                    onClick={() => handleUpdateApplicationStatus(applicant.id, 'approved')}
                  >
                    Approve
                  </button>
                  <button 
                    className="btn btn-primary btn-sm hire-btn"
                    onClick={() => handleUpdateApplicationStatus(applicant.id, 'hired')}
                  >
                    🎉 Hire
                  </button>
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => handleUpdateApplicationStatus(applicant.id, 'rejected')}
                  >
                    Reject
                  </button>
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => handleViewApplication(applicant)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
      </div>

      {applications.filter(app => app.status === 'interview').length === 0 && (
        <div className="no-data">
          <p>No interviews scheduled. Schedule interviews from the Qualified Applicants tab.</p>
          <button
            className="btn btn-primary"
            onClick={() => setActiveTab('qualified')}
          >
            View Qualified Applicants
          </button>
        </div>
      )}
    </div>
  );

  const renderHiredTab = () => (
    <div className="dashboard-module">
      <h2>🎉 Hired Applicants ({stats.hiredApplicants})</h2>
      
      <div className="success-banner">
        <p>Congratulations! These applicants have been successfully hired.</p>
      </div>

      <div className="applicants-list hired-list">
        {hiredApplicants.map((applicant) => {
          const applicantDetails = getApplicantDetails(applicant);
          
          return (
            <div key={applicant.id} className="applicant-card hired-card">
              <div className="applicant-header">
                <div className="applicant-info">
                  <h3>{applicant.student?.name || 'Unknown Applicant'}</h3>
                  <p className="applicant-email">{applicant.student?.email || 'No email'}</p>
                  <p className="position">{applicant.jobTitle}</p>
                  
                  {applicantDetails && (
                    <div className="applicant-profile-summary">
                      {applicantDetails.educationLevel && (
                        <span className="education-level">
                          🎓 {applicantDetails.educationLevel}
                        </span>
                      )}
                      {applicantDetails.major && (
                        <span className="major">
                          📚 {applicantDetails.major}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                <span className="status-badge hired">HIRED 🎉</span>
              </div>

              <div className="applicant-meta">
                <span className="applied-date">
                  Hired: {formatDate(applicant.updatedAt || applicant.appliedAt)}
                </span>
                {applicantDetails?.phone && (
                  <span>📞 {applicantDetails.phone}</span>
                )}
              </div>

              <div className="applicant-actions">
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => handleViewApplication(applicant)}
                >
                  View Details
                </button>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleUpdateApplicationStatus(applicant.id, 'interview')}
                >
                  Move Back to Interview
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {hiredApplicants.length === 0 && (
        <div className="no-data">
          <p>No hired applicants yet. Hire applicants from the Interviews or Qualified Applicants tabs.</p>
          <div className="action-buttons">
            <button
              className="btn btn-primary"
              onClick={() => setActiveTab('interviews')}
            >
              View Interviews
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setActiveTab('qualified')}
            >
              View Qualified Applicants
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="company-dashboard">
      {/* Floating bubbles background elements */}
      <div className="floating-bubble"></div>
      <div className="floating-bubble"></div>
      <div className="floating-bubble"></div>
      <div className="floating-bubble"></div>
      
      <div className="dashboard-header">
        <div className="header-main">
          <div className="user-welcome">
            <h1>{user?.companyName || user?.name} - Company Dashboard</h1>
            <p>Recruitment Management Portal</p>
          </div>
          <div className="user-actions">
            <button 
              className="btn btn-secondary"
              onClick={loadDashboardData}
            >
              🔄 Refresh Data
            </button>
            <button 
              className="btn btn-secondary logout-btn"
              onClick={handleLogout}
            >
              🚪 Logout
            </button>
          </div>
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
          className={`tab-button ${activeTab === 'jobs' ? 'active' : ''}`}
          onClick={() => setActiveTab('jobs')}
        >
          💼 Job Postings
        </button>
        
        <button 
          className={`tab-button ${activeTab === 'applications' ? 'active' : ''}`}
          onClick={() => setActiveTab('applications')}
        >
          📋 Active Applications
          {stats.totalApplications > 0 && (
            <span className="notification-badge">{stats.totalApplications}</span>
          )}
        </button>
        
        <button 
          className={`tab-button ${activeTab === 'qualified' ? 'active' : ''}`}
          onClick={() => setActiveTab('qualified')}
        >
          ⭐ Qualified Applicants
          {stats.qualifiedApplicants > 0 && (
            <span className="notification-badge success">{stats.qualifiedApplicants}</span>
          )}
        </button>
        
        <button 
          className={`tab-button ${activeTab === 'interviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('interviews')}
        >
          🗓️ Interviews
          {stats.interviewScheduled > 0 && (
            <span className="notification-badge warning">{stats.interviewScheduled}</span>
          )}
        </button>

        <button 
          className={`tab-button ${activeTab === 'hired' ? 'active' : ''}`}
          onClick={() => setActiveTab('hired')}
        >
          🎉 Hired
          {stats.hiredApplicants > 0 && (
            <span className="notification-badge hired">{stats.hiredApplicants}</span>
          )}
        </button>
      </div>

      <div className="dashboard-content">
        {loading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
            Loading company dashboard...
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && renderDashboardTab()}
            {activeTab === 'jobs' && renderJobsTab()}
            {activeTab === 'applications' && renderApplicationsTab()}
            {activeTab === 'qualified' && renderQualifiedTab()}
            {activeTab === 'interviews' && renderInterviewsTab()}
            {activeTab === 'hired' && renderHiredTab()}
          </>
        )}
      </div>

      {/* Create Job Modal */}
      {showJobForm && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h3>Create New Job Posting</h3>
              <button 
                className="close-button"
                onClick={() => setShowJobForm(false)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateJob}>
              <div className="form-section">
                <h3>Job Details</h3>
                
                <div className="form-group">
                  <label className="form-label required">Job Title</label>
                  <input
                    type="text"
                    value={jobForm.title}
                    onChange={(e) => setJobForm({...jobForm, title: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label required">Job Description</label>
                  <textarea
                    value={jobForm.description}
                    onChange={(e) => setJobForm({...jobForm, description: e.target.value})}
                    className="form-input"
                    rows="3"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">Location</label>
                    <input
                      type="text"
                      value={jobForm.location}
                      onChange={(e) => setJobForm({...jobForm, location: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Salary</label>
                    <input
                      type="text"
                      value={jobForm.salary}
                      onChange={(e) => setJobForm({...jobForm, salary: e.target.value})}
                      className="form-input"
                      placeholder="e.g., $50,000 - $70,000"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Job Type</label>
                    <select
                      value={jobForm.jobType}
                      onChange={(e) => setJobForm({...jobForm, jobType: e.target.value})}
                      className="form-select"
                    >
                      <option value="full-time">Full Time</option>
                      <option value="part-time">Part Time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
                      <option value="remote">Remote</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Experience Level</label>
                    <select
                      value={jobForm.experienceLevel}
                      onChange={(e) => setJobForm({...jobForm, experienceLevel: e.target.value})}
                      className="form-select"
                    >
                      <option value="entry">Entry Level (0-2 years)</option>
                      <option value="mid">Mid Level (2-5 years)</option>
                      <option value="senior">Senior Level (5+ years)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Requirements (comma separated)</label>
                  <textarea
                    value={jobForm.requirements}
                    onChange={(e) => setJobForm({...jobForm, requirements: e.target.value})}
                    className="form-input"
                    placeholder="Bachelor's degree, 2 years experience, ..."
                    rows="2"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Qualifications (comma separated)</label>
                  <textarea
                    value={jobForm.qualifications}
                    onChange={(e) => setJobForm({...jobForm, qualifications: e.target.value})}
                    className="form-input"
                    placeholder="JavaScript, React, Node.js, ..."
                    rows="2"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Skills (comma separated)</label>
                  <textarea
                    value={jobForm.skills}
                    onChange={(e) => setJobForm({...jobForm, skills: e.target.value})}
                    className="form-input"
                    placeholder="Communication, Teamwork, Problem-solving, ..."
                    rows="2"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label required">Application Deadline</label>
                  <input
                    type="date"
                    value={jobForm.deadline}
                    onChange={(e) => setJobForm({...jobForm, deadline: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowJobForm(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={!jobForm.title || !jobForm.description || !jobForm.location || !jobForm.salary || !jobForm.deadline}
                >
                  Create Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Job Modal */}
      {jobToEdit && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h3>Edit Job Posting</h3>
              <button 
                className="close-button"
                onClick={() => setJobToEdit(null)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleUpdateJob}>
              <div className="form-section">
                <h3>Job Details</h3>
                
                <div className="form-group">
                  <label className="form-label required">Job Title</label>
                  <input
                    type="text"
                    value={jobToEdit.title}
                    onChange={(e) => setJobToEdit({...jobToEdit, title: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label required">Job Description</label>
                  <textarea
                    value={jobToEdit.description}
                    onChange={(e) => setJobToEdit({...jobToEdit, description: e.target.value})}
                    className="form-input"
                    rows="3"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">Location</label>
                    <input
                      type="text"
                      value={jobToEdit.location}
                      onChange={(e) => setJobToEdit({...jobToEdit, location: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Salary</label>
                    <input
                      type="text"
                      value={jobToEdit.salary}
                      onChange={(e) => setJobToEdit({...jobToEdit, salary: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label required">Application Deadline</label>
                  <input
                    type="date"
                    value={jobToEdit.deadline}
                    onChange={(e) => setJobToEdit({...jobToEdit, deadline: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setJobToEdit(null)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  Update Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Application Details Modal */}
      {showApplicationModal && selectedApplication && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h3>Application Details</h3>
              <div className="applicant-score">
                <div className={`score-badge ${selectedApplication.score >= 70 ? 'qualified' : ''}`}>
                  {selectedApplication.score || 0}%
                </div>
              </div>
              <button 
                className="close-button"
                onClick={() => setShowApplicationModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-section">
                <h3>Applicant Information</h3>
                
                {(() => {
                  const applicantDetails = getApplicantDetails(selectedApplication);
                  const profileCompletion = calculateProfileCompletion(applicantDetails);
                  
                  return (
                    <div className="info-grid">
                      <div className="info-item">
                        <label>Name</label>
                        <div className="info-value">
                          {applicantDetails?.name || selectedApplication.student?.name || 'Not available'}
                        </div>
                      </div>
                      
                      <div className="info-item">
                        <label>Email</label>
                        <div className="info-value">
                          {applicantDetails?.email || selectedApplication.student?.email || 'Not available'}
                        </div>
                      </div>
                      
                      <div className="info-item">
                        <label>Phone</label>
                        <div className="info-value">
                          {applicantDetails?.phone || 'Not available'}
                        </div>
                      </div>
                      
                      <div className="info-item">
                        <label>Profile Completion</label>
                        <div className="info-value">
                          <div className="completion-bar">
                            <div 
                              className="completion-fill" 
                              style={{width: `${profileCompletion}%`}}
                            ></div>
                            <span className="completion-text">{profileCompletion}%</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="info-item">
                        <label>Student Type</label>
                        <div className="info-value">
                          {applicantDetails?.studentType === 'highschool' ? '🏫 High School Student' : 
                           applicantDetails?.studentType === 'college' ? '🎓 College Graduate' : 
                           'Not specified'}
                        </div>
                      </div>
                      
                      <div className="info-item">
                        <label>Education Level</label>
                        <div className="info-value">
                          {applicantDetails?.educationLevel || 'Not available'}
                        </div>
                      </div>
                      
                      <div className="info-item">
                        <label>Major/Field</label>
                        <div className="info-value">
                          {applicantDetails?.major || 'Not available'}
                        </div>
                      </div>
                      
                      {applicantDetails?.highSchoolName && (
                        <div className="info-item">
                          <label>High School</label>
                          <div className="info-value">
                            {applicantDetails.highSchoolName}
                            {applicantDetails.graduationYear && ` (Graduation: ${applicantDetails.graduationYear})`}
                          </div>
                        </div>
                      )}
                      
                      <div className="info-item full-width">
                        <label>Address</label>
                        <div className="info-value">
                          {applicantDetails?.address || 'Not available'}
                        </div>
                      </div>
                      
                      <div className="info-item">
                        <label>Date of Birth</label>
                        <div className="info-value">
                          {applicantDetails?.dateOfBirth ? formatDate(applicantDetails.dateOfBirth) : 'Not available'}
                        </div>
                      </div>
                      
                      <div className="info-item">
                        <label>Gender</label>
                        <div className="info-value">
                          {applicantDetails?.gender || 'Not available'}
                        </div>
                      </div>
                      
                      <div className="info-item">
                        <label>Nationality</label>
                        <div className="info-value">
                          {applicantDetails?.nationality || 'Not available'}
                        </div>
                      </div>
                      
                      <div className="info-item">
                        <label>ID Number</label>
                        <div className="info-value">
                          {applicantDetails?.idNumber || 'Not available'}
                        </div>
                      </div>
                      
                      <div className="info-item full-width">
                        <label>Emergency Contact</label>
                        <div className="info-value">
                          {applicantDetails?.emergencyContact || 'Not available'}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="form-section">
                <h3>Application for: {selectedApplication.jobTitle}</h3>
                
                {selectedApplication.transcripts && selectedApplication.transcripts.length > 0 && (
                  <div className="info-section">
                    <h4>Education History</h4>
                    {selectedApplication.transcripts.map((transcript, index) => (
                      <div key={index} className="info-item">
                        <div className="info-value">
                          <strong>{transcript.institution}</strong><br />
                          {transcript.educationLevel} - {transcript.year} | GPA: {transcript.gpa || 'N/A'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedApplication.certificates && selectedApplication.certificates.length > 0 && (
                  <div className="info-section">
                    <h4>Certifications</h4>
                    {selectedApplication.certificates.map((certificate, index) => (
                      <div key={index} className="info-item">
                        <div className="info-value">
                          <strong>{certificate.name}</strong><br />
                          {certificate.issuingOrganization} | {certificate.year}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {(!selectedApplication.transcripts || selectedApplication.transcripts.length === 0) &&
                 (!selectedApplication.certificates || selectedApplication.certificates.length === 0) && (
                  <div className="no-data">
                    <p>No qualifications uploaded yet</p>
                  </div>
                )}
              </div>

              <div className="form-section">
                <h3>Application Status</h3>
                <p>Current status: <strong>{selectedApplication.status}</strong></p>
                
                <div className="action-buttons">
                  <button 
                    className={`btn ${selectedApplication.status === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleUpdateApplicationStatus(selectedApplication.id, 'pending')}
                  >
                    Pending
                  </button>
                  <button 
                    className={`btn ${selectedApplication.status === 'interview' ? 'btn-warning' : 'btn-secondary'}`}
                    onClick={() => handleUpdateApplicationStatus(selectedApplication.id, 'interview')}
                  >
                    Interview
                  </button>
                  <button 
                    className={`btn ${selectedApplication.status === 'approved' ? 'btn-success' : 'btn-secondary'}`}
                    onClick={() => handleUpdateApplicationStatus(selectedApplication.id, 'approved')}
                  >
                    Approved
                  </button>
                  <button 
                    className={`btn btn-primary hire-btn ${selectedApplication.status === 'hired' ? 'active' : ''}`}
                    onClick={() => handleUpdateApplicationStatus(selectedApplication.id, 'hired')}
                  >
                    🎉 Hire
                  </button>
                  <button 
                    className={`btn ${selectedApplication.status === 'rejected' ? 'btn-danger' : 'btn-secondary'}`}
                    onClick={() => handleUpdateApplicationStatus(selectedApplication.id, 'rejected')}
                  >
                    Rejected
                  </button>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowApplicationModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyDashboard;