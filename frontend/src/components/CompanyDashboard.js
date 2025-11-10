// CompanyDashboard.js - UPDATED VERSION
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
  IconButton
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Work as WorkIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  Business as BusinessIcon
} from '@mui/icons-material';

// API base URL - FIX: Use absolute URL with port 5000
const API_BASE_URL = 'https://group-assignment-2-ypxs.onrender.com';

const CompanyDashboard = () => {
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
    hiredApplicants: 0
  });

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Enhanced fetch function with error handling
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
          throw new Error('Server returned HTML instead of JSON. Check if backend is running on port 5000.');
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

      // Calculate statistics
      setStats({
        totalJobs: jobsData.jobs?.length || 0,
        totalApplications: applicationsData.applications?.length || 0,
        qualifiedApplicants: qualifiedData.applications?.length || 0,
        hiredApplicants: applicationsData.applications?.filter(app => app.status === 'hired').length || 0
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
    
    fetchCompanyData();
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
        setViewApplicationOpen(false);
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

  // Check if user has company role
  if (user.role !== 'company') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Alert severity="error">
          Access Denied. This dashboard is only available for company accounts.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px" flexDirection="column">
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading company dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" color="primary" elevation={1}>
        <Toolbar>
          <BusinessIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Company Dashboard - {user.companyName || user.name}
          </Typography>
          <Button 
            color="inherit" 
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/login';
            }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Statistics Cards */}
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <WorkIcon color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      Total Jobs
                    </Typography>
                    <Typography variant="h4">{stats.totalJobs}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <PeopleIcon color="secondary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      Applications
                    </Typography>
                    <Typography variant="h4">{stats.totalApplications}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <TrendingUpIcon color="success" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      Qualified
                    </Typography>
                    <Typography variant="h4">{stats.qualifiedApplicants}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <BusinessIcon color="warning" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      Hired
                    </Typography>
                    <Typography variant="h4">{stats.hiredApplicants}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Card sx={{ mt: 4 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab label="Job Postings" />
            <Tab label="All Applications" />
            <Tab label="Qualified Applicants" />
          </Tabs>

          {/* Job Postings Tab */}
          <TabPanel value={activeTab} index={0}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h5">Job Postings</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateJobOpen(true)}
              >
                Create Job Posting
              </Button>
            </Box>

            <Grid container spacing={3}>
              {jobs.map((job) => (
                <Grid item xs={12} md={6} key={job.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {job.title}
                      </Typography>
                      <Typography color="textSecondary" gutterBottom>
                        {job.location} • {job.jobType} • {job.salary}
                      </Typography>
                      <Typography variant="body2" paragraph>
                        {job.description && job.description.length > 150 
                          ? `${job.description.substring(0, 150)}...` 
                          : job.description || 'No description provided'}
                      </Typography>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Chip 
                          label={job.status || 'active'} 
                          color={job.status === 'active' ? 'success' : 'default'} 
                          size="small" 
                        />
                        <Typography variant="caption" color="textSecondary">
                          Deadline: {job.deadline ? new Date(job.deadline).toLocaleDateString() : 'Not set'}
                        </Typography>
                      </Box>
                      <Box mt={2}>
                        <Button 
                          size="small" 
                          startIcon={<ViewIcon />}
                          onClick={() => {
                            setSelectedJob(job);
                            setActiveTab(1); // Switch to applications tab
                          }}
                        >
                          View Applications
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {jobs.length === 0 && (
              <Box textAlign="center" py={6}>
                <Typography variant="h6" color="textSecondary">
                  No job postings yet
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  Create your first job posting to start receiving applications
                </Typography>
              </Box>
            )}
          </TabPanel>

          {/* All Applications Tab */}
          <TabPanel value={activeTab} index={1}>
            <Typography variant="h5" gutterBottom>
              Job Applications
              {selectedJob && (
                <Chip 
                  label={`Filtering: ${selectedJob.title}`} 
                  onDelete={() => setSelectedJob(null)}
                  sx={{ ml: 2 }}
                />
              )}
            </Typography>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Applicant</TableCell>
                    <TableCell>Job Title</TableCell>
                    <TableCell>Score</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Applied Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {applications
                    .filter(app => !selectedJob || app.jobId === selectedJob.id)
                    .map((application) => (
                    <TableRow key={application.id}>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {application.student?.name || 'Unknown'}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {application.student?.email || 'No email'}
                        </Typography>
                      </TableCell>
                      <TableCell>{application.jobTitle}</TableCell>
                      <TableCell>
                        <Chip 
                          label={`${application.score || 0}%`}
                          color={application.score >= 70 ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={application.status}
                          color={
                            application.status === 'approved' ? 'success' :
                            application.status === 'rejected' ? 'error' :
                            application.status === 'interview' ? 'warning' :
                            application.status === 'hired' ? 'primary' : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {application.appliedAt ? new Date(application.appliedAt).toLocaleDateString() : 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleViewApplication(application)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {applications.filter(app => !selectedJob || app.jobId === selectedJob.id).length === 0 && (
              <Box textAlign="center" py={6}>
                <Typography variant="h6" color="textSecondary">
                  No applications found
                </Typography>
              </Box>
            )}
          </TabPanel>

          {/* Qualified Applicants Tab */}
          <TabPanel value={activeTab} index={2}>
            <Typography variant="h5" gutterBottom>
              Qualified Applicants (Score ≥ 70%)
            </Typography>

            <Grid container spacing={3}>
              {qualifiedApplicants.map((applicant) => (
                <Grid item xs={12} md={6} key={applicant.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {applicant.student?.name || 'Unknown Applicant'}
                      </Typography>
                      <Typography color="textSecondary" gutterBottom>
                        {applicant.student?.email || 'No email'}
                      </Typography>
                      
                      <Box display="flex" alignItems="center" mb={2}>
                        <Chip 
                          label={`Score: ${applicant.score}%`}
                          color="success"
                          size="small"
                        />
                        <Chip 
                          label={applicant.jobTitle}
                          variant="outlined"
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </Box>

                      {/* Qualifications Summary */}
                      <Typography variant="body2" gutterBottom>
                        <strong>Education:</strong> {applicant.student?.educationLevel || 'Not specified'}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>Major:</strong> {applicant.student?.major || 'Not specified'}
                      </Typography>

                      <Box mt={2}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleViewApplication(applicant)}
                          sx={{ mr: 1 }}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleUpdateApplicationStatus(applicant.id, 'interview')}
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
              <Box textAlign="center" py={6}>
                <Typography variant="h6" color="textSecondary">
                  No qualified applicants yet
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  Qualified applicants will appear here automatically when they meet the criteria
                </Typography>
              </Box>
            )}
          </TabPanel>
        </Card>
      </Container>

      {/* Create Job Dialog */}
      <Dialog open={createJobOpen} onClose={handleCloseCreateJob} maxWidth="md" fullWidth>
        <DialogTitle>Create New Job Posting</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
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
                value={newJob.requirements}
                onChange={(e) => setNewJob({ ...newJob, requirements: e.target.value })}
                placeholder="Bachelor's degree, 2 years experience, ..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Qualifications (comma separated)"
                value={newJob.qualifications}
                onChange={(e) => setNewJob({ ...newJob, qualifications: e.target.value })}
                placeholder="JavaScript, React, Node.js, ..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Skills (comma separated)"
                value={newJob.skills}
                onChange={(e) => setNewJob({ ...newJob, skills: e.target.value })}
                placeholder="Communication, Teamwork, Problem-solving, ..."
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
                helperText={!newJob.deadline ? "Deadline is required" : ""}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateJob}>Cancel</Button>
          <Button 
            onClick={handleCreateJob} 
            variant="contained"
            disabled={!newJob.title || !newJob.description || !newJob.location || !newJob.salary || !newJob.deadline}
          >
            Create Job
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Application Dialog */}
      <Dialog open={viewApplicationOpen} onClose={handleCloseViewApplication} maxWidth="md" fullWidth>
        <DialogTitle>
          Application Details
          {selectedApplication && (
            <Chip 
              label={`Score: ${selectedApplication.score}%`}
              color={selectedApplication.score >= 70 ? 'success' : 'default'}
              sx={{ ml: 2 }}
            />
          )}
        </DialogTitle>
        <DialogContent>
          {selectedApplication && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Applicant Information</Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Name" 
                      secondary={selectedApplication.student?.name || 'Not available'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Email" 
                      secondary={selectedApplication.student?.email || 'Not available'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Phone" 
                      secondary={selectedApplication.student?.phone || 'Not available'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Education Level" 
                      secondary={selectedApplication.student?.educationLevel || 'Not available'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Major" 
                      secondary={selectedApplication.student?.major || 'Not available'} 
                    />
                  </ListItem>
                </List>
              </Grid>

              <Grid item xs={12}>
                <Divider />
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Qualifications</Typography>
                
                {selectedApplication.transcripts && selectedApplication.transcripts.length > 0 && (
                  <Box mb={2}>
                    <Typography variant="subtitle2" gutterBottom>Transcripts</Typography>
                    <List dense>
                      {selectedApplication.transcripts.map((transcript, index) => (
                        <ListItem key={index}>
                          <ListItemText 
                            primary={transcript.institution}
                            secondary={`${transcript.educationLevel} - ${transcript.year}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {selectedApplication.certificates && selectedApplication.certificates.length > 0 && (
                  <Box mb={2}>
                    <Typography variant="subtitle2" gutterBottom>Certificates</Typography>
                    <List dense>
                      {selectedApplication.certificates.map((certificate, index) => (
                        <ListItem key={index}>
                          <ListItemText 
                            primary={certificate.name}
                            secondary={certificate.issuingOrganization}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {(!selectedApplication.transcripts || selectedApplication.transcripts.length === 0) &&
                 (!selectedApplication.certificates || selectedApplication.certificates.length === 0) && (
                  <Typography variant="body2" color="textSecondary">
                    No qualifications uploaded yet
                  </Typography>
                )}
              </Grid>

              <Grid item xs={12}>
                <Divider />
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Application Status</Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
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
        <DialogActions>
          <Button onClick={handleCloseViewApplication}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar open={!!success} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CompanyDashboard;