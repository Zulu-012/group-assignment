// src/components/StudentDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentTypeDashboard from './StudentTypeDashboard';
import Profile from './Profile';

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

const StudentDashboard = ({ user: propUser }) => {
  const [user, setUser] = useState(propUser);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showTranscriptForm, setShowTranscriptForm] = useState(false);
  const [showCertificateForm, setShowCertificateForm] = useState(false);
  const [transcripts, setTranscripts] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [applications, setApplications] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [jobPostings, setJobPostings] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  const [transcriptForm, setTranscriptForm] = useState({
    educationLevel: '',
    institutionName: '',
    yearCompleted: '',
    grades: '',
    file: null
  });

  const [certificateForm, setCertificateForm] = useState({
    name: '',
    issuingOrganization: '',
    dateIssued: '',
    file: null
  });

  const [selectedInstitution, setSelectedInstitution] = useState('');

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
      if (parsedUser.role !== 'student') {
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
    if (user && user.studentType) {
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
        loadAdmissions(),
        loadNotifications(),
        user.studentType === 'highschool' ? loadInstitutions() : loadJobPostings(),
        user.studentType === 'college' ? loadTranscripts() : Promise.resolve(),
        user.studentType === 'college' ? loadCertificates() : Promise.resolve()
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
      const data = await apiCall('/student/applications');
      setApplications(data.applications || []);
    } catch (error) {
      console.error('Error loading applications:', error);
      setApplications([]);
    }
  };

  const loadAdmissions = async () => {
    try {
      const data = await apiCall('/student/admissions');
      setAdmissions(data.admissions || []);
    } catch (error) {
      console.error('Error loading admissions:', error);
      setAdmissions([]);
    }
  };

  const loadNotifications = async () => {
    try {
      const data = await apiCall('/student/notifications');
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    }
  };

  const loadInstitutions = async () => {
    try {
      const data = await apiCall('/student/institutions');
      setInstitutions(data.institutions || []);
    } catch (error) {
      console.error('Error loading institutions:', error);
      setInstitutions([]);
    }
  };

  const loadJobPostings = async () => {
    try {
      const data = await apiCall('/student/jobs');
      setJobPostings(data.jobPostings || []);
    } catch (error) {
      console.error('Error loading job postings:', error);
      setJobPostings([]);
    }
  };

  const loadTranscripts = async () => {
    try {
      const data = await apiCall('/student/transcripts');
      setTranscripts(data.transcripts || []);
    } catch (error) {
      console.error('Error loading transcripts:', error);
      setTranscripts([]);
    }
  };

  const loadCertificates = async () => {
    try {
      const data = await apiCall('/student/certificates');
      setCertificates(data.certificates || []);
    } catch (error) {
      console.error('Error loading certificates:', error);
      setCertificates([]);
    }
  };

  const handleStudentTypeSelect = async (studentType) => {
    try {
      setLoading(true);
      await apiCall('/student/type', {
        method: 'PUT',
        body: { studentType }
      });
      
      const updatedUser = { ...user, studentType };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setMessage('Student type updated successfully!');
      await loadDashboardData();
    } catch (error) {
      setMessage(`Error updating student type: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileNavigation = () => {
    setActiveTab('profile');
  };

  const handleTranscriptSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const transcriptPayload = cleanFormData({
        educationLevel: transcriptForm.educationLevel,
        institution: transcriptForm.institutionName,
        year: transcriptForm.yearCompleted,
        grades: transcriptForm.grades
      });

      await apiCall('/student/transcript', {
        method: 'POST',
        body: transcriptPayload
      });

      setMessage('Transcript uploaded successfully!');
      setTranscriptForm({
        educationLevel: '',
        institutionName: '',
        yearCompleted: '',
        grades: '',
        file: null
      });
      setShowTranscriptForm(false);
      await loadTranscripts();
    } catch (error) {
      setMessage(`Error uploading transcript: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCertificateSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const certificatePayload = cleanFormData({
        name: certificateForm.name,
        issuingOrganization: certificateForm.issuingOrganization,
        dateIssued: certificateForm.dateIssued
      });

      await apiCall('/student/certificate', {
        method: 'POST',
        body: certificatePayload
      });

      setMessage('Certificate uploaded successfully!');
      setCertificateForm({
        name: '',
        issuingOrganization: '',
        dateIssued: '',
        file: null
      });
      setShowCertificateForm(false);
      await loadCertificates();
    } catch (error) {
      setMessage(`Error uploading certificate: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const formData = new FormData(e.target);
      
      // Helper function to safely get form values and convert empty strings to null
      const getFormValue = (fieldName) => {
        const value = formData.get(fieldName);
        return value === null || value === '' ? null : value;
      };

      // Get all form values with proper null handling
      const applicationData = cleanFormData({
        // Personal Information
        dateOfBirth: getFormValue('dateOfBirth'),
        gender: getFormValue('gender'),
        nationality: getFormValue('nationality'),
        idNumber: getFormValue('idNumber'),
        maritalStatus: getFormValue('maritalStatus') || 'single', // Default value
        homeAddress: getFormValue('homeAddress'),
        postalAddress: getFormValue('postalAddress') || null,
        homeNumber: getFormValue('homeNumber') || null,
        emergencyContact: getFormValue('emergencyContact') ? {
          name: getFormValue('emergencyContactName') || '',
          relationship: getFormValue('emergencyContactRelationship') || '',
          phone: getFormValue('emergencyContactPhone') || ''
        } : null,
        
        // Parent/Guardian Information
        parentGuardianName: getFormValue('parentGuardianName'),
        parentRelationship: getFormValue('parentRelationship') || 'parent',
        parentOccupation: getFormValue('parentOccupation') || null,
        parentContact: getFormValue('parentContact'),
        parentEmail: getFormValue('parentEmail') || null,
        parentAddress: getFormValue('parentAddress') || null,
        financialSponsor: getFormValue('financialSponsor') || null,
        
        // Academic Background
        highSchoolName: getFormValue('highSchoolName'),
        schoolAddress: getFormValue('schoolAddress') || null,
        finalYearCompleted: getFormValue('finalYearCompleted'),
        studentNumber: getFormValue('studentNumber') || null,
        subjectsTaken: getFormValue('subjectsTaken'),
        gradesResults: getFormValue('gradesResults'),
        awardsDistinctions: getFormValue('awardsDistinctions') || null,
        previousInstitution: getFormValue('previousInstitution') || null,
        
        // Academic Achievements
        certificatesEarned: getFormValue('certificatesEarned') || null,
        honorsAwards: getFormValue('honorsAwards') || null,
        extracurricularAchievements: getFormValue('extracurricularAchievements') || null,
        scholarshipsReceived: getFormValue('scholarshipsReceived') || null,
        
        // Course Information
        institutionId: getFormValue('institutionId'),
        courseId: getFormValue('courseId'),
        facultyDepartment: getFormValue('facultyDepartment') || null,
        courseCode: getFormValue('courseCode') || null,
        studyMode: getFormValue('studyMode') || 'full-time',
        studyLevel: getFormValue('studyLevel') || 'undergraduate',
        preferredCampus: getFormValue('preferredCampus') || null,
        academicYearEntry: getFormValue('academicYearEntry') || new Date().getFullYear().toString(),
        semesterEntry: getFormValue('semesterEntry') || '1',
        
        // Health & Disability
        medicalConditions: getFormValue('medicalConditions') || null,
        disabilityDeclaration: getFormValue('disabilityDeclaration') || 'none',
        supportServices: getFormValue('supportServices') || null,
        
        // Financial Information
        financialPayer: getFormValue('financialPayer') || 'self',
        proofOfSponsorship: getFormValue('proofOfSponsorship') || null,
        bursaryApplications: getFormValue('bursaryApplications') || null,
        
        // Declaration
        applicantSignature: getFormValue('applicantSignature') || 'digital',
        signatureDate: getFormValue('signatureDate') || new Date().toISOString().split('T')[0],
        parentSignature: getFormValue('parentSignature') || 'digital'
      });

      // Validate required fields
      if (!applicationData.institutionId || !applicationData.courseId) {
        throw new Error('Institution and course selection are required');
      }

      const response = await apiCall('/student/apply/course-comprehensive', {
        method: 'POST',
        body: applicationData
      });

      setMessage('Course application submitted successfully!');
      e.target.reset();
      setSelectedInstitution('');
      await loadApplications();
      
    } catch (error) {
      setMessage(`Error submitting application: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyForJob = async (jobId) => {
    try {
      setLoading(true);
      const response = await apiCall('/student/apply/job', {
        method: 'POST',
        body: { jobId }
      });
      setMessage('Job application submitted successfully!');
      await loadApplications();
    } catch (error) {
      setMessage(`Error applying for job: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyForCourse = async (courseId, institutionId) => {
    try {
      setLoading(true);
      const response = await apiCall('/student/apply/course', {
        method: 'POST',
        body: { courseId, institutionId }
      });
      setMessage('Course application submitted successfully!');
      await loadApplications();
    } catch (error) {
      setMessage(`Error applying for course: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkNotificationAsRead = async (notificationId) => {
    try {
      await apiCall(`/student/notifications/${notificationId}/read`, {
        method: 'PUT'
      });
      await loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
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

  // Render different dashboard based on student type
  if (!user || !user.studentType) {
    return <StudentTypeDashboard user={user} onStudentTypeSelect={handleStudentTypeSelect} />;
  }

  // Render Profile Tab
  const renderProfileTab = () => (
    <Profile user={user} />
  );

  const renderHighSchoolDashboard = () => (
    <div className="dashboard-module">
      <h2>Welcome to Your Higher Education Journey</h2>
      <div className="student-badge highschool-badge">
        🏫 High School Student
      </div>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>My Applications</h3>
          <p className="stat-number">{applications.filter(app => app.type === 'course').length}</p>
          <p>Course applications submitted</p>
        </div>
        <div className="stat-card">
          <h3>Admissions</h3>
          <p className="stat-number">{admissions.length}</p>
          <p>Admission offers received</p>
        </div>
        <div className="stat-card">
          <h3>Institutions</h3>
          <p className="stat-number">{institutions.length}</p>
          <p>Available institutions</p>
        </div>
        <div className="stat-card">
          <h3>Notifications</h3>
          <p className="stat-number">{notifications.filter(n => !n.read).length}</p>
          <p>Unread updates</p>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button 
            className="btn btn-primary"
            onClick={() => setActiveTab('apply')}
          >
            📝 Apply for Course
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => setActiveTab('institutions')}
          >
            Browse Institutions & Courses
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => setActiveTab('my-applications')}
          >
            View My Applications
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => setActiveTab('admissions')}
          >
            View Admissions
          </button>
        </div>
      </div>

      {notifications.length > 0 && (
        <div className="notifications-panel">
          <h3>Latest Notifications</h3>
          <div className="notifications-list">
            {notifications.slice(0, 5).map((notification) => (
              <div key={notification.id} className={`notification-item ${notification.read ? 'read' : 'unread'}`}>
                <span className="notification-icon">📢</span>
                <span className="notification-text">{notification.message}</span>
                <span className="notification-time">
                  {formatDate(notification.createdAt)}
                </span>
                {!notification.read && (
                  <button 
                    className="btn btn-sm"
                    onClick={() => handleMarkNotificationAsRead(notification.id)}
                  >
                    Mark Read
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderCollegeDashboard = () => (
    <div className="dashboard-module">
      <h2>Welcome to Your Career Journey</h2>
      <div className="student-badge college-badge">
        🎓 College Graduate
      </div>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Job Applications</h3>
          <p className="stat-number">{applications.filter(app => app.type === 'job').length}</p>
          <p>Job applications submitted</p>
        </div>
        <div className="stat-card">
          <h3>Transcripts</h3>
          <p className="stat-number">{transcripts.length}</p>
          <p>Academic transcripts uploaded</p>
        </div>
        <div className="stat-card">
          <h3>Certificates</h3>
          <p className="stat-number">{certificates.length}</p>
          <p>Additional certificates</p>
        </div>
        <div className="stat-card">
          <h3>Job Matches</h3>
          <p className="stat-number">{jobPostings.length}</p>
          <p>Available opportunities</p>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button 
            className="btn btn-primary"
            onClick={() => setActiveTab('jobs')}
          >
            Browse Job Opportunities
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => setShowTranscriptForm(true)}
          >
            Upload Transcript
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => setShowCertificateForm(true)}
          >
            Upload Certificate
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => setActiveTab('my-applications')}
          >
            My Applications
          </button>
        </div>
      </div>

      {notifications.length > 0 && (
        <div className="notifications-panel">
          <h3>Latest Notifications</h3>
          <div className="notifications-list">
            {notifications.slice(0, 5).map((notification) => (
              <div key={notification.id} className={`notification-item ${notification.read ? 'read' : 'unread'}`}>
                <span className="notification-icon">📢</span>
                <span className="notification-text">{notification.message}</span>
                <span className="notification-time">
                  {formatDate(notification.createdAt)}
                </span>
                {!notification.read && (
                  <button 
                    className="btn btn-sm"
                    onClick={() => handleMarkNotificationAsRead(notification.id)}
                  >
                    Mark Read
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderInstitutionsTab = () => (
    <div className="dashboard-module">
      <h2>Higher Learning Institutions in Lesotho</h2>
      
      <div className="section-actions">
        <button 
          className="btn btn-primary"
          onClick={() => setActiveTab('apply')}
        >
          📝 Apply for Course
        </button>
      </div>

      <div className="institutions-grid">
        {institutions.map((institution) => (
          <div key={institution.id} className="institution-card">
            <div className="institution-header">
              <h3>{institution.name}</h3>
            </div>
            
            <p className="institution-location">{institution.location || institution.address}</p>
            <p className="institution-description">{institution.description}</p>
            
            <div className="courses-section">
              <h4>Available Courses:</h4>
              {institution.courses && institution.courses.map((course) => (
                <div key={course.id} className="course-item">
                  <h5>{course.name}</h5>
                  <p>{course.description}</p>
                  <div className="course-meta">
                    <span>Duration: {course.duration}</span>
                    <span>Requirements: {course.requirements}</span>
                    <span>Available Seats: {course.availableSeats || course.totalSeats}</span>
                  </div>
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => handleApplyForCourse(course.id, institution.id)}
                    disabled={applications.some(app => 
                      app.courseId === course.id && app.institutionId === institution.id
                    )}
                  >
                    {applications.some(app => 
                      app.courseId === course.id && app.institutionId === institution.id
                    ) ? 'Applied ✓' : 'Apply Now'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderJobsTab = () => (
    <div className="dashboard-module">
      <h2>Available Job Opportunities</h2>
      <div className="jobs-grid">
        {jobPostings.map((job) => (
          <div key={job.id} className="job-card">
            <h3>{job.title}</h3>
            <p className="company-name">{job.company?.name || 'Company'}</p>
            <p className="job-location">{job.location}</p>
            <p className="job-description">{job.description}</p>
            
            <div className="job-details">
              <span className="job-salary">Salary: {job.salary}</span>
              <span className="job-type">Type: {job.jobType}</span>
              <span className="job-deadline">Deadline: {formatDate(job.deadline)}</span>
            </div>
            
            <div className="job-requirements">
              <h4>Requirements:</h4>
              <ul>
                {job.requirements && job.requirements.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </div>
            
            <button 
              className="btn btn-primary"
              onClick={() => handleApplyForJob(job.id)}
              disabled={applications.some(app => app.jobId === job.id)}
            >
              {applications.some(app => app.jobId === job.id) ? 'Applied ✓' : 'Apply Now'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMyApplicationsTab = () => (
    <div className="dashboard-module">
      <h2>My Applications</h2>
      <div className="applications-list">
        {applications.length === 0 ? (
          <div className="no-data">
            <p>No applications submitted yet. Start by applying for courses or jobs!</p>
            <button 
              className="btn btn-primary"
              onClick={() => setActiveTab(user.studentType === 'highschool' ? 'apply' : 'jobs')}
            >
              {user.studentType === 'highschool' ? 'Apply for Course' : 'Browse Jobs'}
            </button>
          </div>
        ) : (
          applications.map((application) => (
            <div key={application.id} className="application-card">
              <div className="application-header">
                <h3>{application.courseName || application.jobTitle}</h3>
                <span className={`status-badge ${application.status || 'pending'}`}>
                  {application.status || 'pending'}
                </span>
              </div>
              <p className="application-type">
                {application.type === 'course' ? '🎓 Course Application' : '💼 Job Application'}
              </p>
              <p className="application-institution">
                {application.institutionName || application.companyName}
              </p>
              <p className="application-date">
                Applied: {formatDate(application.appliedAt)}
              </p>
              {application.notes && (
                <p className="application-notes">
                  <strong>Notes:</strong> {application.notes}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderAdmissionsTab = () => (
    <div className="dashboard-module">
      <h2>My Admissions Results</h2>
      <div className="admissions-list">
        {admissions.length === 0 ? (
          <div className="no-data">
            <p>No admission results yet. Keep checking for updates!</p>
          </div>
        ) : (
          admissions.map((admission) => (
            <div key={admission.id} className="admission-card">
              <div className="admission-header">
                <h3>{admission.courseName}</h3>
                <span className={`status-badge ${admission.status}`}>
                  {admission.status}
                </span>
              </div>
              <p className="admission-institution">{admission.institutionName}</p>
              <p className="admission-date">
                Decision: {formatDate(admission.updatedAt)}
              </p>
              {admission.notes && (
                <p className="admission-notes">
                  <strong>Notes:</strong> {admission.notes}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderTranscriptsTab = () => (
    <div className="dashboard-module">
      <h2>My Academic Transcripts</h2>
      
      <div className="section-actions">
        <button 
          className="btn btn-primary"
          onClick={() => setShowTranscriptForm(true)}
        >
          📤 Upload New Transcript
        </button>
      </div>

      <div className="transcripts-list">
        {transcripts.length === 0 ? (
          <div className="no-data">
            <p>No transcripts uploaded yet. Upload your first transcript to get started!</p>
          </div>
        ) : (
          transcripts.map((transcript) => (
            <div key={transcript.id} className="transcript-card">
              <div className="transcript-header">
                <h3>{transcript.educationLevel}</h3>
                <span className="transcript-year">{transcript.year}</span>
              </div>
              
              <div className="transcript-details">
                <p><strong>Institution:</strong> {transcript.institution}</p>
                <p><strong>Grades:</strong> {transcript.grades}</p>
                <p><strong>Uploaded:</strong> {formatDate(transcript.uploadedAt)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderCertificatesTab = () => (
    <div className="dashboard-module">
      <h2>My Additional Certificates</h2>
      
      <div className="section-actions">
        <button 
          className="btn btn-primary"
          onClick={() => setShowCertificateForm(true)}
        >
          📜 Upload New Certificate
        </button>
      </div>

      <div className="certificates-list">
        {certificates.length === 0 ? (
          <div className="no-data">
            <p>No certificates uploaded yet. Upload your first certificate to enhance your profile!</p>
          </div>
        ) : (
          certificates.map((certificate) => (
            <div key={certificate.id} className="certificate-card">
              <div className="certificate-header">
                <h3>{certificate.name}</h3>
                <span className="certificate-date">{formatDate(certificate.dateIssued)}</span>
              </div>
              
              <div className="certificate-details">
                <p><strong>Issuing Organization:</strong> {certificate.issuingOrganization}</p>
                <p><strong>Uploaded:</strong> {formatDate(certificate.uploadedAt)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderApplyTab = () => (
    <div className="dashboard-module">
      <div className="application-form-container">
        <div className="form-header">
          <h2>Comprehensive Course Application Form</h2>
          <p>Please complete all sections below to submit your comprehensive course application</p>
        </div>

        <form onSubmit={handleApplicationSubmit} className="application-form">
          {/* Personal Information */}
          <div className="form-section">
            <h3>Personal Information</h3>
            
            <div className="form-group">
              <label htmlFor="institutionId" className="form-label required">
                Select Institution
              </label>
              <select
                id="institutionId"
                name="institutionId"
                className="form-select"
                value={selectedInstitution}
                onChange={(e) => setSelectedInstitution(e.target.value)}
                required
              >
                <option value="">Choose an institution</option>
                {institutions.map((institution) => (
                  <option key={institution.id} value={institution.id}>
                    {institution.name} - {institution.location || institution.address || 'Lesotho'}
                  </option>
                ))}
              </select>
            </div>

            {selectedInstitution && (
              <div className="form-group">
                <label htmlFor="courseId" className="form-label required">
                  Select Course
                </label>
                <select
                  id="courseId"
                  name="courseId"
                  className="form-select"
                  required
                >
                  <option value="">Choose a course</option>
                  {institutions
                    .find(inst => inst.id === selectedInstitution)
                    ?.courses?.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name} - {course.duration}
                      </option>
                    ))
                  }
                </select>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dateOfBirth" className="form-label required">
                  Date of Birth
                </label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="gender" className="form-label required">
                  Gender
                </label>
                <select
                  id="gender"
                  name="gender"
                  className="form-select"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="nationality" className="form-label required">
                Nationality
              </label>
              <input
                type="text"
                id="nationality"
                name="nationality"
                className="form-input"
                placeholder="Your nationality"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="idNumber" className="form-label required">
                ID Number/Passport
              </label>
              <input
                type="text"
                id="idNumber"
                name="idNumber"
                className="form-input"
                placeholder="Your ID number or passport"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="maritalStatus" className="form-label">
                Marital Status
              </label>
              <select
                id="maritalStatus"
                name="maritalStatus"
                className="form-select"
              >
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="homeAddress" className="form-label required">
                Home Address
              </label>
              <textarea
                id="homeAddress"
                name="homeAddress"
                className="form-input"
                rows="3"
                placeholder="Your complete home address"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="postalAddress" className="form-label">
                Postal Address (if different)
              </label>
              <textarea
                id="postalAddress"
                name="postalAddress"
                className="form-input"
                rows="2"
                placeholder="Your postal address"
              />
            </div>
          </div>

          {/* Parent/Guardian Information */}
          <div className="form-section">
            <h3>Parent/Guardian Information</h3>
            
            <div className="form-group">
              <label htmlFor="parentGuardianName" className="form-label required">
                Parent/Guardian Full Name
              </label>
              <input
                type="text"
                id="parentGuardianName"
                name="parentGuardianName"
                className="form-input"
                placeholder="Full name of parent or guardian"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="parentContact" className="form-label required">
                Parent/Guardian Contact Number
              </label>
              <input
                type="tel"
                id="parentContact"
                name="parentContact"
                className="form-input"
                placeholder="Contact number"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="parentRelationship" className="form-label">
                Relationship
              </label>
              <select
                id="parentRelationship"
                name="parentRelationship"
                className="form-select"
              >
                <option value="parent">Parent</option>
                <option value="guardian">Guardian</option>
                <option value="sibling">Sibling</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Academic Background */}
          <div className="form-section">
            <h3>Academic Background</h3>
            
            <div className="form-group">
              <label htmlFor="highSchoolName" className="form-label required">
                High School Name
              </label>
              <input
                type="text"
                id="highSchoolName"
                name="highSchoolName"
                className="form-input"
                placeholder="Name of your high school"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="finalYearCompleted" className="form-label required">
                Final Year Completed
              </label>
              <input
                type="number"
                id="finalYearCompleted"
                name="finalYearCompleted"
                className="form-input"
                placeholder="e.g., 2023"
                min="2000"
                max="2030"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="subjectsTaken" className="form-label required">
                Subjects Taken
              </label>
              <textarea
                id="subjectsTaken"
                name="subjectsTaken"
                className="form-input"
                rows="3"
                placeholder="List all subjects you completed"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="gradesResults" className="form-label required">
                Grades/Results
              </label>
              <textarea
                id="gradesResults"
                name="gradesResults"
                className="form-input"
                rows="3"
                placeholder="Enter your grades or examination results"
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => setActiveTab('dashboard')}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? '📤 Submitting Application...' : '📤 Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="student-dashboard">
      {/* Floating bubbles background elements */}
      <div className="floating-bubble"></div>
      <div className="floating-bubble"></div>
      <div className="floating-bubble"></div>
      <div className="floating-bubble"></div>
      
      <div className="dashboard-header">
        <div className="user-welcome">
          <h1>Welcome back, {user.name}!</h1>
          <p>Here's what's happening with your {user.studentType === 'highschool' ? 'education' : 'career'} journey</p>
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
          Dashboard
        </button>
        
        {user.studentType === 'highschool' && (
          <button 
            className={`tab-button ${activeTab === 'apply' ? 'active' : ''}`}
            onClick={() => setActiveTab('apply')}
          >
            Apply for Course
          </button>
        )}
        
        {user.studentType === 'highschool' ? (
          <>
            <button 
              className={`tab-button ${activeTab === 'institutions' ? 'active' : ''}`}
              onClick={() => setActiveTab('institutions')}
            >
              Institutions & Courses
            </button>
            <button 
              className={`tab-button ${activeTab === 'my-applications' ? 'active' : ''}`}
              onClick={() => setActiveTab('my-applications')}
            >
              My Applications
            </button>
            <button 
              className={`tab-button ${activeTab === 'admissions' ? 'active' : ''}`}
              onClick={() => setActiveTab('admissions')}
            >
              Admissions
            </button>
          </>
        ) : (
          <>
            <button 
              className={`tab-button ${activeTab === 'jobs' ? 'active' : ''}`}
              onClick={() => setActiveTab('jobs')}
            >
              Job Opportunities
            </button>
            <button 
              className={`tab-button ${activeTab === 'transcripts' ? 'active' : ''}`}
              onClick={() => setActiveTab('transcripts')}
            >
              My Transcripts
            </button>
            <button 
              className={`tab-button ${activeTab === 'certificates' ? 'active' : ''}`}
              onClick={() => setActiveTab('certificates')}
            >
              My Certificates
            </button>
            <button 
              className={`tab-button ${activeTab === 'my-applications' ? 'active' : ''}`}
              onClick={() => setActiveTab('my-applications')}
            >
              My Applications
            </button>
          </>
        )}
        
        {/* Profile Tab - Available for all student types */}
        <button 
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          👤 My Profile
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
            {activeTab === 'dashboard' && (
              user.studentType === 'highschool' 
                ? renderHighSchoolDashboard() 
                : renderCollegeDashboard()
            )}
            {activeTab === 'apply' && renderApplyTab()}
            {activeTab === 'institutions' && renderInstitutionsTab()}
            {activeTab === 'jobs' && renderJobsTab()}
            {activeTab === 'my-applications' && renderMyApplicationsTab()}
            {activeTab === 'admissions' && renderAdmissionsTab()}
            {activeTab === 'transcripts' && renderTranscriptsTab()}
            {activeTab === 'certificates' && renderCertificatesTab()}
            {activeTab === 'profile' && renderProfileTab()}
          </>
        )}
      </div>

      {/* Transcript Form Modal */}
      {showTranscriptForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Upload Academic Transcript</h3>
              <button 
                className="close-button"
                onClick={() => setShowTranscriptForm(false)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleTranscriptSubmit}>
              <div className="form-group">
                <label className="form-label required">Education Level</label>
                <select
                  value={transcriptForm.educationLevel}
                  onChange={(e) => setTranscriptForm({
                    ...transcriptForm,
                    educationLevel: e.target.value
                  })}
                  required
                  className="form-select"
                >
                  <option value="">Select Education Level</option>
                  <option value="highschool">High School</option>
                  <option value="certificate">Certificate</option>
                  <option value="diploma">Diploma</option>
                  <option value="bachelor">Bachelor's Degree</option>
                  <option value="master">Master's Degree</option>
                  <option value="phd">PhD</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label required">Institution Name</label>
                <input
                  type="text"
                  value={transcriptForm.institutionName}
                  onChange={(e) => setTranscriptForm({
                    ...transcriptForm,
                    institutionName: e.target.value
                  })}
                  placeholder="Enter the name of your institution"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label required">Year Completed</label>
                <input
                  type="number"
                  value={transcriptForm.yearCompleted}
                  onChange={(e) => setTranscriptForm({
                    ...transcriptForm,
                    yearCompleted: e.target.value
                  })}
                  placeholder="e.g., 2023"
                  min="1900"
                  max="2030"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label required">Grades/Results</label>
                <textarea
                  value={transcriptForm.grades}
                  onChange={(e) => setTranscriptForm({
                    ...transcriptForm,
                    grades: e.target.value
                  })}
                  placeholder="Enter your grades, GPA, or academic results"
                  rows="3"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowTranscriptForm(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  📤 Upload Transcript
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Certificate Form Modal */}
      {showCertificateForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Upload Additional Certificate</h3>
              <button 
                className="close-button"
                onClick={() => setShowCertificateForm(false)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCertificateSubmit}>
              <div className="form-group">
                <label className="form-label required">Certificate Name</label>
                <input
                  type="text"
                  value={certificateForm.name}
                  onChange={(e) => setCertificateForm({
                    ...certificateForm,
                    name: e.target.value
                  })}
                  placeholder="e.g., Microsoft Certified Professional, IELTS Certificate"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label required">Issuing Organization</label>
                <input
                  type="text"
                  value={certificateForm.issuingOrganization}
                  onChange={(e) => setCertificateForm({
                    ...certificateForm,
                    issuingOrganization: e.target.value
                  })}
                  placeholder="Name of the organization that issued the certificate"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label required">Date Issued</label>
                <input
                  type="date"
                  value={certificateForm.dateIssued}
                  onChange={(e) => setCertificateForm({
                    ...certificateForm,
                    dateIssued: e.target.value
                  })}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowCertificateForm(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  📜 Upload Certificate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;