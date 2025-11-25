// CompanyDashboard.js - FULLY UPDATED VERSION
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Snackbar,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  CardActions,
  Avatar,
  LinearProgress,
  Tooltip,
  alpha,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Work as WorkIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  School as SchoolIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// API base URL
const API_BASE_URL = 'https://group-assignment-2-ypxs.onrender.com';

const CompanyDashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [qualifiedApplicants, setQualifiedApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createJobOpen, setCreateJobOpen] = useState(false);
  const [viewApplicationOpen, setViewApplicationOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [editJobOpen, setEditJobOpen] = useState(false);
  const [jobToEdit, setJobToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // New job form state
  const [newJob, setNewJob] = useState({
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

  // Statistics
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalApplications: 0,
    qualifiedApplicants: 0,
    hiredApplicants: 0,
    interviewScheduled: 0,
    pendingReview: 0
  });

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Enhanced fetch function with better error handling
  const apiFetch = async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
        ...options,
      });

      // Check if response is HTML (error page) instead of JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
          throw new Error('Server error - please try again later');
        }
        throw new Error(`Invalid response format: ${contentType}`);
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.error('API fetch error:', err);
      throw err;
    }
  };

  // Fetch company data
  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [jobsData, applicationsData, qualifiedData] = await Promise.all([
        apiFetch('/api/company/jobs'),
        apiFetch('/api/company/applications'),
        apiFetch('/api/company/qualified-applicants')
      ]);

      if (jobsData.success) setJobs(jobsData.jobs || []);
      if (applicationsData.success) setApplications(applicationsData.applications || []);
      if (qualifiedData.success) setQualifiedApplicants(qualifiedData.applications || []);

      // Calculate enhanced statistics
      const applicationsList = applicationsData.applications || [];
      setStats({
        totalJobs: jobsData.jobs?.length || 0,
        totalApplications: applicationsList.length,
        qualifiedApplicants: qualifiedData.applications?.length || 0,
        hiredApplicants: applicationsList.filter(app => app.status === 'hired').length,
        interviewScheduled: applicationsList.filter(app => app.status === 'interview').length,
        pendingReview: applicationsList.filter(app => app.status === 'pending').length
      });

    } catch (err) {
      setError(`Failed to load data: ${err.message}`);
      // Set empty arrays to prevent further errors
      setJobs([]);
      setApplications([]);
      setQualifiedApplicants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if user is actually a company
    if (user.role !== 'company') {
      setError('Access denied. Company role required.');
      return;
    }
    
    if (token) {
      fetchCompanyData();
    } else {
      navigate('/login');
    }
  }, []);

  // Create new job posting
  const handleCreateJob = async () => {
    try {
      setError('');
      
      const data = await apiFetch('/api/company/jobs', {
        method: 'POST',
        body: JSON.stringify({
          ...newJob,
          requirements: newJob.requirements.split(',').map(req => req.trim()).filter(req => req),
          qualifications: newJob.qualifications.split(',').map(qual => qual.trim()).filter(qual => qual),
          skills: newJob.skills.split(',').map(skill => skill.trim()).filter(skill => skill)
        })
      });

      if (data.success) {
        setSuccess('Job posting created successfully!');
        setCreateJobOpen(false);
        setNewJob({
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
        fetchCompanyData();
      } else {
        setError(data.error || 'Failed to create job posting');
      }
    } catch (err) {
      setError(err.message || 'Failed to create job posting');
    }
  };

  // Update job posting
  const handleUpdateJob = async () => {
    try {
      setError('');
      
      const data = await apiFetch(`/api/company/jobs/${jobToEdit.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...jobToEdit,
          requirements: jobToEdit.requirements.split(',').map(req => req.trim()).filter(req => req),
          qualifications: jobToEdit.qualifications.split(',').map(qual => qual.trim()).filter(qual => qual),
          skills: jobToEdit.skills.split(',').map(skill => skill.trim()).filter(skill => skill)
        })
      });

      if (data.success) {
        setSuccess('Job posting updated successfully!');
        setEditJobOpen(false);
        setJobToEdit(null);
        fetchCompanyData();
      } else {
        setError(data.error || 'Failed to update job posting');
      }
    } catch (err) {
      setError(err.message || 'Failed to update job posting');
    }
  };

  // Delete job posting
  const handleDeleteJob = async (jobId) => {
    if (window.confirm('Are you sure you want to delete this job posting?')) {
      try {
        setError('');
        
        const data = await apiFetch(`/api/company/jobs/${jobId}`, {
          method: 'DELETE'
        });

        if (data.success) {
          setSuccess('Job posting deleted successfully!');
          fetchCompanyData();
        } else {
          setError(data.error || 'Failed to delete job posting');
        }
      } catch (err) {
        setError(err.message || 'Failed to delete job posting');
      }
    }
  };

  // Update application status
  const handleUpdateApplicationStatus = async (applicationId, status) => {
    try {
      setError('');
      
      const data = await apiFetch(`/api/company/applications/${applicationId}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });

      if (data.success) {
        setSuccess('Application status updated successfully!');
        fetchCompanyData();
        if (status !== 'interview') {
          setViewApplicationOpen(false);
        }
      } else {
        setError(data.error || 'Failed to update application status');
      }
    } catch (err) {
      setError(err.message || 'Failed to update application status');
    }
  };

  // View application details
  const handleViewApplication = (application) => {
    setSelectedApplication(application);
    setViewApplicationOpen(true);
  };

  // Edit job posting
  const handleEditJob = (job) => {
    setJobToEdit({
      ...job,
      requirements: Array.isArray(job.requirements) ? job.requirements.join(', ') : job.requirements,
      qualifications: Array.isArray(job.qualifications) ? job.qualifications.join(', ') : job.qualifications,
      skills: Array.isArray(job.skills) ? job.skills.join(', ') : job.skills
    });
    setEditJobOpen(true);
  };

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Close dialogs
  const handleCloseSnackbar = () => {
    setError('');
    setSuccess('');
  };

  const handleCloseCreateJob = () => {
    setCreateJobOpen(false);
    setNewJob({
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
  };

  const handleCloseViewApplication = () => {
    setViewApplicationOpen(false);
    setSelectedApplication(null);
  };

  const handleCloseEditJob = () => {
    setEditJobOpen(false);
    setJobToEdit(null);
  };

  // Filter applications based on search and status
  const filteredApplications = applications.filter(app => {
    const matchesSearch = searchTerm === '' || 
      app.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Tab panel component
  const TabPanel = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'draft': return 'warning';
      default: return 'default';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Check if user has company role
  if (user.role !== 'company') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Alert severity="error" sx={{ borderRadius: 2, boxShadow: 1 }}>
          Access Denied. This dashboard is only available for company accounts.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px" flexDirection="column">
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 3, color: 'text.secondary' }}>
          Loading company dashboard...
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
          Preparing your recruitment data
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, bgcolor: 'grey.50', minHeight: '100vh' }}>
      <AppBar 
        position="static" 
        color="primary" 
        elevation={1}
        sx={{ 
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${alpha(theme.palette.primary.dark, 0.9)} 100%)`,
        }}
      >
        <Toolbar>
          <BusinessIcon sx={{ mr: 2, fontSize: 32 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
              {user.companyName || user.name} - Company Dashboard
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Recruitment Management Portal
            </Typography>
          </Box>
          <Button 
            color="inherit" 
            onClick={handleLogout}
            startIcon={<BusinessIcon />}
            sx={{ 
              borderRadius: 2,
              px: 3,
              fontWeight: 600
            }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Statistics Cards */}
      <Container maxWidth="xl" sx={{ mt: 4, mb: 2 }}>
        <Typography variant="h4" gutterBottom sx={{ 
          fontWeight: 700, 
          color: 'text.primary',
          mb: 4,
          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
        }}>
          Recruitment Overview
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card 
              elevation={2}
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${alpha(theme.palette.primary.dark, 0.8)} 100%)`,
                color: 'white',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="inherit" gutterBottom variant="overline" sx={{ opacity: 0.9, fontWeight: 600 }}>
                      Active Jobs
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>{stats.totalJobs}</Typography>
                  </Box>
                  <WorkIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2.4}>
            <Card 
              elevation={2}
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${alpha(theme.palette.secondary.dark, 0.8)} 100%)`,
                color: 'white',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="inherit" gutterBottom variant="overline" sx={{ opacity: 0.9, fontWeight: 600 }}>
                      Applications
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>{stats.totalApplications}</Typography>
                  </Box>
                  <PeopleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2.4}>
            <Card 
              elevation={2}
              sx={{
                background: `linear-gradient(135deg, #00c853 0%, ${alpha('#00c853', 0.8)} 100%)`,
                color: 'white',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="inherit" gutterBottom variant="overline" sx={{ opacity: 0.9, fontWeight: 600 }}>
                      Qualified
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>{stats.qualifiedApplicants}</Typography>
                  </Box>
                  <TrendingUpIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2.4}>
            <Card 
              elevation={2}
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${alpha(theme.palette.warning.dark, 0.8)} 100%)`,
                color: 'white',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="inherit" gutterBottom variant="overline" sx={{ opacity: 0.9, fontWeight: 600 }}>
                      Interviews
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>{stats.interviewScheduled}</Typography>
                  </Box>
                  <ScheduleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2.4}>
            <Card 
              elevation={2}
              sx={{
                background: `linear-gradient(135deg, #9c27b0 0%, ${alpha('#9c27b0', 0.8)} 100%)`,
                color: 'white',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="inherit" gutterBottom variant="overline" sx={{ opacity: 0.9, fontWeight: 600 }}>
                      Pending Review
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>{stats.pendingReview}</Typography>
                  </Box>
                  <NotificationsIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ mt: 2 }}>
        <Card 
          elevation={2}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            background: 'white',
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => {
              setActiveTab(newValue);
              setSelectedJob(null);
              setSearchTerm('');
              setStatusFilter('all');
            }}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': {
                fontWeight: 600,
                fontSize: '0.95rem',
                py: 2,
                minHeight: 64,
              }
            }}
          >
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <WorkIcon sx={{ mr: 1, fontSize: 20 }} />
                  Job Postings
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PeopleIcon sx={{ mr: 1, fontSize: 20 }} />
                  All Applications
                  {stats.totalApplications > 0 && (
                    <Chip 
                      label={stats.totalApplications} 
                      size="small" 
                      sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                    />
                  )}
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUpIcon sx={{ mr: 1, fontSize: 20 }} />
                  Qualified Applicants
                  {stats.qualifiedApplicants > 0 && (
                    <Chip 
                      label={stats.qualifiedApplicants} 
                      size="small" 
                      color="success"
                      sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                    />
                  )}
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ScheduleIcon sx={{ mr: 1, fontSize: 20 }} />
                  Interviews
                  {stats.interviewScheduled > 0 && (
                    <Chip 
                      label={stats.interviewScheduled} 
                      size="small" 
                      color="warning"
                      sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                    />
                  )}
                </Box>
              } 
            />
          </Tabs>

          {/* Job Postings Tab */}
          <TabPanel value={activeTab} index={0}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                Job Postings Management
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateJobOpen(true)}
                sx={{ 
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                }}
              >
                Create Job Posting
              </Button>
            </Box>

            <Grid container spacing={3}>
              {jobs.map((job) => (
                <Grid item xs={12} md={6} lg={4} key={job.id}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.3s ease',
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      '&:hover': {
                        boxShadow: 6,
                        transform: 'translateY(-4px)',
                        borderColor: theme.palette.primary.light,
                      }
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, flex: 1, color: 'text.primary' }}>
                          {job.title}
                        </Typography>
                        <Chip 
                          label={job.status || 'active'} 
                          color={getStatusColor(job.status)}
                          size="small" 
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                      
                      <Box display="flex" alignItems="center" mb={1}>
                        <LocationIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="textSecondary">
                          {job.location}
                        </Typography>
                      </Box>
                      
                      <Box display="flex" alignItems="center" mb={1}>
                        <WorkIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="textSecondary" textTransform="capitalize">
                          {job.jobType}
                        </Typography>
                      </Box>
                      
                      <Box display="flex" alignItems="center" mb={2}>
                        <MoneyIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="textSecondary">
                          {job.salary}
                        </Typography>
                      </Box>

                      <Typography variant="body2" paragraph sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                        {job.description && job.description.length > 120 
                          ? `${job.description.substring(0, 120)}...` 
                          : job.description || 'No description provided'}
                      </Typography>

                      <Box mb={2}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                          <Typography variant="caption" color="textSecondary">
                            Applications: {applications.filter(app => app.jobId === job.id).length}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {Math.min((applications.filter(app => app.jobId === job.id).length / 10) * 100, 100)}%
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={Math.min((applications.filter(app => app.jobId === job.id).length / 10) * 100, 100)}
                          sx={{ 
                            height: 6, 
                            borderRadius: 3,
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 3,
                              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                            }
                          }}
                        />
                      </Box>

                      <Typography variant="caption" color="textSecondary" display="block" sx={{ fontStyle: 'italic' }}>
                        Deadline: {formatDate(job.deadline)}
                      </Typography>
                    </CardContent>
                    
                    <CardActions sx={{ p: 2, pt: 0, gap: 1 }}>
                      <Button 
                        size="small" 
                        startIcon={<ViewIcon />}
                        onClick={() => {
                          setSelectedJob(job);
                          setActiveTab(1);
                        }}
                        sx={{ borderRadius: 1 }}
                      >
                        View Apps
                      </Button>
                      <Button 
                        size="small" 
                        startIcon={<EditIcon />}
                        onClick={() => handleEditJob(job)}
                        sx={{ borderRadius: 1 }}
                      >
                        Edit
                      </Button>
                      <Button 
                        size="small" 
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeleteJob(job.id)}
                        sx={{ borderRadius: 1 }}
                      >
                        Delete
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {jobs.length === 0 && (
              <Box textAlign="center" py={8}>
                <WorkIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                <Typography variant="h5" color="textSecondary" gutterBottom>
                  No job postings yet
                </Typography>
                <Typography variant="body1" color="textSecondary" sx={{ mt: 1, mb: 4, maxWidth: 400, mx: 'auto' }}>
                  Create your first job posting to start receiving applications from qualified candidates
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<AddIcon />}
                  onClick={() => setCreateJobOpen(true)}
                  sx={{ 
                    borderRadius: 2,
                    px: 4,
                    py: 1.5,
                    fontWeight: 600,
                  }}
                >
                  Create Your First Job Posting
                </Button>
              </Box>
            )}
          </TabPanel>

          {/* All Applications Tab */}
          <TabPanel value={activeTab} index={1}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                Job Applications
                {selectedJob && (
                  <Chip 
                    label={`Filtering: ${selectedJob.title}`} 
                    onDelete={() => setSelectedJob(null)}
                    sx={{ ml: 2 }}
                    color="primary"
                    variant="outlined"
                  />
                )}
              </Typography>
              
              <Box display="flex" gap={2} alignItems="center">
                <TextField
                  size="small"
                  placeholder="Search applicants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                  sx={{ width: 200 }}
                />
                
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                    <MenuItem value="interview">Interview</MenuItem>
                    <MenuItem value="hired">Hired</MenuItem>
                  </Select>
                </FormControl>
                
                <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 600 }}>
                  Total: {filteredApplications.length}
                </Typography>
              </Box>
            </Box>

            <TableContainer 
              component={Paper} 
              elevation={0}
              sx={{ 
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                borderRadius: 2,
              }}
            >
              <Table>
                <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, py: 2 }}>Applicant</TableCell>
                    <TableCell sx={{ fontWeight: 700, py: 2 }}>Job Title</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, py: 2 }}>Match Score</TableCell>
                    <TableCell sx={{ fontWeight: 700, py: 2 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, py: 2 }}>Applied Date</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, py: 2 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredApplications.map((application) => (
                    <TableRow 
                      key={application.id}
                      sx={{ 
                        '&:last-child td, &:last-child th': { border: 0 },
                        transition: 'background-color 0.2s ease',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.02),
                        },
                        bgcolor: application.status === 'hired' ? alpha('#4caf50', 0.05) : 'transparent'
                      }}
                    >
                      <TableCell sx={{ py: 2 }}>
                        <Box display="flex" alignItems="center">
                          <Avatar 
                            sx={{ 
                              width: 40, 
                              height: 40, 
                              mr: 2, 
                              bgcolor: theme.palette.primary.main,
                              fontWeight: 600 
                            }}
                          >
                            {application.student?.name?.charAt(0) || 'A'}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {application.student?.name || 'Unknown Applicant'}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {application.student?.email || 'No email'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {application.jobTitle}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ py: 2 }}>
                        <Tooltip title={`Match score: ${application.score || 0}%`}>
                          <Box>
                            <Chip 
                              label={`${application.score || 0}%`}
                              color={
                                application.score >= 80 ? 'success' :
                                application.score >= 60 ? 'warning' : 'default'
                              }
                              size="small"
                              variant={application.score >= 70 ? 'filled' : 'outlined'}
                              sx={{ fontWeight: 600 }}
                            />
                            {application.score >= 70 && (
                              <TrendingUpIcon 
                                sx={{ 
                                  fontSize: 16, 
                                  ml: 0.5, 
                                  color: 'success.main',
                                  verticalAlign: 'middle' 
                                }} 
                              />
                            )}
                          </Box>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Chip 
                          label={application.status?.toUpperCase()}
                          color={
                            application.status === 'approved' ? 'success' :
                            application.status === 'rejected' ? 'error' :
                            application.status === 'interview' ? 'warning' :
                            application.status === 'hired' ? 'primary' : 'default'
                          }
                          size="small"
                          sx={{ fontWeight: 600, minWidth: 80 }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Typography variant="body2">
                          {application.appliedAt ? formatDate(application.appliedAt) : 'Unknown'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ py: 2 }}>
                        <Tooltip title="View application details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewApplication(application)}
                            color="primary"
                            sx={{ 
                              borderRadius: 1,
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                              }
                            }}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {filteredApplications.length === 0 && (
              <Box textAlign="center" py={8}>
                <PeopleIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                <Typography variant="h5" color="textSecondary" gutterBottom>
                  No applications found
                </Typography>
                <Typography variant="body1" color="textSecondary" sx={{ mt: 1 }}>
                  {selectedJob 
                    ? `No applications for "${selectedJob.title}" yet` 
                    : searchTerm || statusFilter !== 'all'
                    ? 'No applications match your search criteria'
                    : 'No applications received yet'
                  }
                </Typography>
                {(searchTerm || statusFilter !== 'all') && (
                  <Button
                    variant="outlined"
                    sx={{ mt: 2 }}
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </Box>
            )}
          </TabPanel>

          {/* Qualified Applicants Tab */}
          <TabPanel value={activeTab} index={2}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>
              Qualified Applicants (Score ≥ 70%)
            </Typography>

            <Grid container spacing={3}>
              {qualifiedApplicants.map((applicant) => (
                <Grid item xs={12} md={6} lg={4} key={applicant.id}>
                  <Card 
                    variant="outlined"
                    sx={{
                      transition: 'all 0.3s ease',
                      border: `2px solid ${alpha('#00c853', 0.1)}`,
                      '&:hover': {
                        boxShadow: 4,
                        transform: 'translateY(-4px)',
                        borderColor: '#00c853',
                      }
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box display="flex" alignItems="flex-start" mb={2}>
                        <Avatar 
                          sx={{ 
                            width: 52, 
                            height: 52, 
                            mr: 2, 
                            bgcolor: 'success.main',
                            fontWeight: 600 
                          }}
                        >
                          {applicant.student?.name?.charAt(0) || 'A'}
                        </Avatar>
                        <Box flex={1}>
                          <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                            {applicant.student?.name || 'Unknown Applicant'}
                          </Typography>
                          <Typography color="textSecondary" variant="body2">
                            {applicant.student?.email || 'No email'}
                          </Typography>
                        </Box>
                        <Chip 
                          label={`${applicant.score}%`}
                          color="success"
                          sx={{ fontWeight: 700 }}
                        />
                      </Box>
                      
                      <Box display="flex" alignItems="center" mb={1}>
                        <SchoolIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {applicant.student?.educationLevel || 'Not specified'} in {applicant.student?.major || 'Not specified'}
                        </Typography>
                      </Box>

                      <Box display="flex" alignItems="center" mb={2}>
                        <WorkIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                          {applicant.jobTitle}
                        </Typography>
                      </Box>

                      {applicant.student?.skills && applicant.student.skills.length > 0 && (
                        <Box mb={2}>
                          <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
                            KEY SKILLS:
                          </Typography>
                          <Box display="flex" gap={0.5} flexWrap="wrap">
                            {applicant.student.skills.slice(0, 4).map((skill, index) => (
                              <Chip 
                                key={index}
                                label={skill}
                                size="small"
                                variant="outlined"
                                color="primary"
                              />
                            ))}
                            {applicant.student.skills.length > 4 && (
                              <Chip 
                                label={`+${applicant.student.skills.length - 4} more`}
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </Box>
                      )}

                      <Box mt={2} display="flex" gap={1} flexWrap="wrap">
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleViewApplication(applicant)}
                          sx={{ borderRadius: 1 }}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<ScheduleIcon />}
                          onClick={() => handleUpdateApplicationStatus(applicant.id, 'interview')}
                          sx={{ 
                            borderRadius: 1,
                            background: `linear-gradient(45deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`,
                          }}
                        >
                          Schedule Interview
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {qualifiedApplicants.length === 0 && (
              <Box textAlign="center" py={8}>
                <TrendingUpIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                <Typography variant="h5" color="textSecondary" gutterBottom>
                  No qualified applicants yet
                </Typography>
                <Typography variant="body1" color="textSecondary" sx={{ mt: 1, mb: 4, maxWidth: 500, mx: 'auto' }}>
                  Qualified applicants will appear here automatically when they score 70% or higher based on skills, education, and experience matching.
                </Typography>
              </Box>
            )}
          </TabPanel>

          {/* Interviews Tab */}
          <TabPanel value={activeTab} index={3}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>
              Interview Scheduling ({stats.interviewScheduled})
            </Typography>

            <Grid container spacing={3}>
              {applications
                .filter(app => app.status === 'interview')
                .map((applicant) => (
                <Grid item xs={12} md={6} key={applicant.id}>
                  <Card 
                    variant="outlined"
                    sx={{
                      border: `2px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                      background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.05)} 0%, ${alpha(theme.palette.warning.light, 0.02)} 100%)`,
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box display="flex" alignItems="center" mb={2}>
                        <Avatar 
                          sx={{ 
                            width: 48, 
                            height: 48, 
                            mr: 2, 
                            bgcolor: 'warning.main',
                            fontWeight: 600 
                          }}
                        >
                          {applicant.student?.name?.charAt(0) || 'A'}
                        </Avatar>
                        <Box flex={1}>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {applicant.student?.name || 'Unknown Applicant'}
                          </Typography>
                          <Typography color="textSecondary" variant="body2">
                            For: {applicant.jobTitle}
                          </Typography>
                        </Box>
                        <Chip 
                          label="INTERVIEW"
                          color="warning"
                          sx={{ fontWeight: 700 }}
                        />
                      </Box>

                      <Box display="flex" alignItems="center" mb={1}>
                        <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {applicant.student?.email || 'No email'}
                        </Typography>
                      </Box>

                      {applicant.student?.phone && (
                        <Box display="flex" alignItems="center" mb={2}>
                          <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {applicant.student.phone}
                          </Typography>
                        </Box>
                      )}

                      <Box display="flex" gap={1} mt={2} flexWrap="wrap">
                        <Button
                          variant="contained"
                          size="small"
                          color="success"
                          onClick={() => handleUpdateApplicationStatus(applicant.id, 'approved')}
                          sx={{ borderRadius: 1, fontWeight: 600 }}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          onClick={() => handleUpdateApplicationStatus(applicant.id, 'rejected')}
                          sx={{ borderRadius: 1 }}
                        >
                          Reject
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleViewApplication(applicant)}
                          sx={{ borderRadius: 1 }}
                        >
                          View Details
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {applications.filter(app => app.status === 'interview').length === 0 && (
              <Box textAlign="center" py={8}>
                <ScheduleIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                <Typography variant="h5" color="textSecondary" gutterBottom>
                  No interviews scheduled
                </Typography>
                <Typography variant="body1" color="textSecondary" sx={{ mt: 1, mb: 4 }}>
                  Schedule interviews from the Qualified Applicants tab to see them here.
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => setActiveTab(2)}
                  sx={{ borderRadius: 2 }}
                >
                  View Qualified Applicants
                </Button>
              </Box>
            )}
          </TabPanel>
        </Card>
      </Container>

      {/* Create Job Dialog */}
      <Dialog 
        open={createJobOpen} 
        onClose={handleCloseCreateJob} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h5" component="div" sx={{ fontWeight: 700 }}>
            Create New Job Posting
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Fill in the details to create a new job opportunity
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Job Title *"
                value={newJob.title}
                onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                error={!newJob.title}
                helperText={!newJob.title ? "Job title is required" : ""}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Job Description *"
                value={newJob.description}
                onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                error={!newJob.description}
                helperText={!newJob.description ? "Job description is required" : ""}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location *"
                value={newJob.location}
                onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                error={!newJob.location}
                helperText={!newJob.location ? "Location is required" : ""}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Salary *"
                value={newJob.salary}
                onChange={(e) => setNewJob({ ...newJob, salary: e.target.value })}
                error={!newJob.salary}
                helperText={!newJob.salary ? "Salary is required" : ""}
                placeholder="e.g., $50,000 - $70,000"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Job Type</InputLabel>
                <Select
                  value={newJob.jobType}
                  label="Job Type"
                  onChange={(e) => setNewJob({ ...newJob, jobType: e.target.value })}
                >
                  <MenuItem value="full-time">Full Time</MenuItem>
                  <MenuItem value="part-time">Part Time</MenuItem>
                  <MenuItem value="contract">Contract</MenuItem>
                  <MenuItem value="internship">Internship</MenuItem>
                  <MenuItem value="remote">Remote</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Experience Level</InputLabel>
                <Select
                  value={newJob.experienceLevel}
                  label="Experience Level"
                  onChange={(e) => setNewJob({ ...newJob, experienceLevel: e.target.value })}
                >
                  <MenuItem value="entry">Entry Level (0-2 years)</MenuItem>
                  <MenuItem value="mid">Mid Level (2-5 years)</MenuItem>
                  <MenuItem value="senior">Senior Level (5+ years)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Requirements (comma separated)"
                value={newJob.requirements}
                onChange={(e) => setNewJob({ ...newJob, requirements: e.target.value })}
                placeholder="Bachelor's degree, 2 years experience, ..."
                helperText="List each requirement separated by commas"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Qualifications (comma separated)"
                value={newJob.qualifications}
                onChange={(e) => setNewJob({ ...newJob, qualifications: e.target.value })}
                placeholder="JavaScript, React, Node.js, ..."
                helperText="List technical skills and qualifications"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Skills (comma separated)"
                value={newJob.skills}
                onChange={(e) => setNewJob({ ...newJob, skills: e.target.value })}
                placeholder="Communication, Teamwork, Problem-solving, ..."
                helperText="List soft skills and competencies"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="date"
                label="Application Deadline *"
                InputLabelProps={{ shrink: true }}
                value={newJob.deadline}
                onChange={(e) => setNewJob({ ...newJob, deadline: e.target.value })}
                error={!newJob.deadline}
                helperText={!newJob.deadline ? "Deadline is required" : "Applications will close on this date"}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={handleCloseCreateJob}
            sx={{ borderRadius: 1 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateJob} 
            variant="contained"
            disabled={!newJob.title || !newJob.description || !newJob.location || !newJob.salary || !newJob.deadline}
            sx={{ 
              minWidth: 120,
              borderRadius: 1,
              fontWeight: 600,
            }}
          >
            Create Job
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Job Dialog */}
      <Dialog 
        open={editJobOpen} 
        onClose={handleCloseEditJob} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h5" component="div" sx={{ fontWeight: 700 }}>
            Edit Job Posting
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {jobToEdit && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Job Title *"
                  value={jobToEdit.title}
                  onChange={(e) => setJobToEdit({ ...jobToEdit, title: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Job Description *"
                  value={jobToEdit.description}
                  onChange={(e) => setJobToEdit({ ...jobToEdit, description: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Location *"
                  value={jobToEdit.location}
                  onChange={(e) => setJobToEdit({ ...jobToEdit, location: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Salary *"
                  value={jobToEdit.salary}
                  onChange={(e) => setJobToEdit({ ...jobToEdit, salary: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Job Type</InputLabel>
                  <Select
                    value={jobToEdit.jobType}
                    label="Job Type"
                    onChange={(e) => setJobToEdit({ ...jobToEdit, jobType: e.target.value })}
                  >
                    <MenuItem value="full-time">Full Time</MenuItem>
                    <MenuItem value="part-time">Part Time</MenuItem>
                    <MenuItem value="contract">Contract</MenuItem>
                    <MenuItem value="internship">Internship</MenuItem>
                    <MenuItem value="remote">Remote</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Experience Level</InputLabel>
                  <Select
                    value={jobToEdit.experienceLevel}
                    label="Experience Level"
                    onChange={(e) => setJobToEdit({ ...jobToEdit, experienceLevel: e.target.value })}
                  >
                    <MenuItem value="entry">Entry Level</MenuItem>
                    <MenuItem value="mid">Mid Level</MenuItem>
                    <MenuItem value="senior">Senior Level</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Requirements (comma separated)"
                  value={jobToEdit.requirements}
                  onChange={(e) => setJobToEdit({ ...jobToEdit, requirements: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Qualifications (comma separated)"
                  value={jobToEdit.qualifications}
                  onChange={(e) => setJobToEdit({ ...jobToEdit, qualifications: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Skills (comma separated)"
                  value={jobToEdit.skills}
                  onChange={(e) => setJobToEdit({ ...jobToEdit, skills: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="date"
                  label="Application Deadline *"
                  InputLabelProps={{ shrink: true }}
                  value={jobToEdit.deadline}
                  onChange={(e) => setJobToEdit({ ...jobToEdit, deadline: e.target.value })}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={handleCloseEditJob}
            sx={{ borderRadius: 1 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateJob} 
            variant="contained"
            sx={{ 
              minWidth: 120,
              borderRadius: 1,
              fontWeight: 600,
            }}
          >
            Update Job
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Application Dialog */}
      <Dialog 
        open={viewApplicationOpen} 
        onClose={handleCloseViewApplication} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '90vh',
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, borderBottom: 1, borderColor: 'divider' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h5" component="div" sx={{ fontWeight: 700 }}>
              Application Details
            </Typography>
            {selectedApplication && (
              <Chip 
                label={`Score: ${selectedApplication.score}%`}
                color={selectedApplication.score >= 70 ? 'success' : 'default'}
                sx={{ fontWeight: 700 }}
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedApplication && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
                  Applicant Information
                </Typography>
                <List dense sx={{ bgcolor: 'grey.50', borderRadius: 2, p: 2 }}>
                  <ListItem>
                    <ListItemText 
                      primary="Name" 
                      secondary={selectedApplication.student?.name || 'Not available'} 
                      primaryTypographyProps={{ fontWeight: 600 }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Email" 
                      secondary={selectedApplication.student?.email || 'Not available'} 
                      primaryTypographyProps={{ fontWeight: 600 }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Phone" 
                      secondary={selectedApplication.student?.phone || 'Not available'} 
                      primaryTypographyProps={{ fontWeight: 600 }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Education Level" 
                      secondary={selectedApplication.student?.educationLevel || 'Not available'} 
                      primaryTypographyProps={{ fontWeight: 600 }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Major" 
                      secondary={selectedApplication.student?.major || 'Not available'} 
                      primaryTypographyProps={{ fontWeight: 600 }}
                    />
                  </ListItem>
                </List>
              </Grid>

              <Grid item xs={12}>
                <Divider />
                <Typography variant="h6" gutterBottom sx={{ mt: 2, fontWeight: 700, color: 'primary.main' }}>
                  Application for: {selectedApplication.jobTitle}
                </Typography>
                
                {selectedApplication.transcripts && selectedApplication.transcripts.length > 0 && (
                  <Box mb={2}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                      Education History
                    </Typography>
                    <List dense>
                      {selectedApplication.transcripts.map((transcript, index) => (
                        <ListItem 
                          key={index} 
                          sx={{ 
                            border: 1, 
                            borderColor: 'grey.200', 
                            borderRadius: 2, 
                            mb: 1,
                            bgcolor: 'white'
                          }}
                        >
                          <ListItemText 
                            primary={transcript.institution}
                            secondary={`${transcript.educationLevel} - ${transcript.year} | GPA: ${transcript.gpa || 'N/A'}`}
                            primaryTypographyProps={{ fontWeight: 600 }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {selectedApplication.certificates && selectedApplication.certificates.length > 0 && (
                  <Box mb={2}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                      Certifications
                    </Typography>
                    <List dense>
                      {selectedApplication.certificates.map((certificate, index) => (
                        <ListItem 
                          key={index} 
                          sx={{ 
                            border: 1, 
                            borderColor: 'grey.200', 
                            borderRadius: 2, 
                            mb: 1,
                            bgcolor: 'white'
                          }}
                        >
                          <ListItemText 
                            primary={certificate.name}
                            secondary={`${certificate.issuingOrganization} | ${certificate.year}`}
                            primaryTypographyProps={{ fontWeight: 600 }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {(!selectedApplication.transcripts || selectedApplication.transcripts.length === 0) &&
                 (!selectedApplication.certificates || selectedApplication.certificates.length === 0) && (
                  <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                    No qualifications uploaded yet
                  </Typography>
                )}
              </Grid>

              <Grid item xs={12}>
                <Divider />
                <Typography variant="h6" gutterBottom sx={{ mt: 2, fontWeight: 700, color: 'primary.main' }}>
                  Application Status
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap" sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary" sx={{ width: '100%', mb: 1 }}>
                    Current status: <strong>{selectedApplication.status}</strong>
                  </Typography>
                  <Chip 
                    label="Pending" 
                    onClick={() => handleUpdateApplicationStatus(selectedApplication.id, 'pending')}
                    color={selectedApplication.status === 'pending' ? 'primary' : 'default'}
                    variant={selectedApplication.status === 'pending' ? 'filled' : 'outlined'}
                  />
                  <Chip 
                    label="Interview" 
                    onClick={() => handleUpdateApplicationStatus(selectedApplication.id, 'interview')}
                    color={selectedApplication.status === 'interview' ? 'warning' : 'default'}
                    variant={selectedApplication.status === 'interview' ? 'filled' : 'outlined'}
                  />
                  <Chip 
                    label="Approved" 
                    onClick={() => handleUpdateApplicationStatus(selectedApplication.id, 'approved')}
                    color={selectedApplication.status === 'approved' ? 'success' : 'default'}
                    variant={selectedApplication.status === 'approved' ? 'filled' : 'outlined'}
                  />
                  <Chip 
                    label="Rejected" 
                    onClick={() => handleUpdateApplicationStatus(selectedApplication.id, 'rejected')}
                    color={selectedApplication.status === 'rejected' ? 'error' : 'default'}
                    variant={selectedApplication.status === 'rejected' ? 'filled' : 'outlined'}
                  />
                  <Chip 
                    label="Hired" 
                    onClick={() => handleUpdateApplicationStatus(selectedApplication.id, 'hired')}
                    color={selectedApplication.status === 'hired' ? 'primary' : 'default'}
                    variant={selectedApplication.status === 'hired' ? 'filled' : 'outlined'}
                  />
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={handleCloseViewApplication}
            sx={{ borderRadius: 1 }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert 
          onClose={handleCloseSnackbar} 
          severity="error" 
          sx={{ 
            width: '100%',
            borderRadius: 2,
            fontWeight: 500,
          }}
        >
          {error}
        </Alert>
      </Snackbar>

      <Snackbar open={!!success} autoHideDuration={4000} onClose={handleCloseSnackbar}>
        <Alert 
          onClose={handleCloseSnackbar} 
          severity="success" 
          sx={{ 
            width: '100%',
            borderRadius: 2,
            fontWeight: 500,
          }}
        >
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CompanyDashboard;