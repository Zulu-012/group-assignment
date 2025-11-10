// src/components/AdminDashboard.js
import React, { useState, useEffect } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://group-assignment-2-ypxs.onrender.com/api';

const AdminDashboard = () => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [institutions, setInstitutions] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const apiCall = async (endpoint, options = {}) => {
    const token = localStorage.getItem('authToken');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
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
    if (activeModule === 'institutions') {
      loadInstitutions();
    } else if (activeModule === 'companies') {
      loadCompanies();
    } else if (activeModule === 'statistics') {
      loadStatistics();
    }
  }, [activeModule]);

  const loadInstitutions = async () => {
    try {
      setLoading(true);
      const result = await apiCall('/admin/institutions');
      setInstitutions(result.institutions);
    } catch (error) {
      setMessage(`Error loading institutions: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const result = await apiCall('/admin/companies');
      setCompanies(result.companies);
    } catch (error) {
      setMessage(`Error loading companies: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const result = await apiCall('/admin/statistics');
      setStatistics(result.statistics);
    } catch (error) {
      setMessage(`Error loading statistics: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id, role) => {
    try {
      setLoading(true);
      await apiCall(`/admin/approve/${id}`, {
        method: 'PUT',
        body: { role }
      });
      setMessage(`${role} approved successfully`);
      
      // Refresh data
      if (role === 'institution') {
        loadInstitutions();
      } else {
        loadCompanies();
      }
    } catch (error) {
      setMessage(`Error approving ${role}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (id, role) => {
    try {
      setLoading(true);
      await apiCall(`/admin/suspend/${id}`, {
        method: 'PUT',
        body: { role }
      });
      setMessage(`${role} suspended successfully`);
      
      // Refresh data
      if (role === 'institution') {
        loadInstitutions();
      } else {
        loadCompanies();
      }
    } catch (error) {
      setMessage(`Error suspending ${role}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderDashboard = () => (
    <div className="admin-module">
      <h2>System Overview</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Students</h3>
          <p className="stat-number">{statistics.totalStudents || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Institutions</h3>
          <p className="stat-number">{statistics.totalInstitutions || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Companies</h3>
          <p className="stat-number">{statistics.totalCompanies || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Applications</h3>
          <p className="stat-number">{statistics.totalApplications || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Job Postings</h3>
          <p className="stat-number">{statistics.totalJobPostings || 0}</p>
        </div>
      </div>
    </div>
  );

  const renderInstitutions = () => (
    <div className="admin-module">
      <div className="module-header">
        <h2>Manage Institutions</h2>
        <button 
          className="btn btn-primary"
          onClick={loadInstitutions}
          disabled={loading}
        >
          Refresh
        </button>
      </div>
      
      {loading ? (
        <div className="loading">Loading institutions...</div>
      ) : (
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {institutions.map(institution => (
                <tr key={institution.id}>
                  <td>{institution.name}</td>
                  <td>{institution.email}</td>
                  <td>
                    <span className={`status-badge status-${institution.status}`}>
                      {institution.status}
                    </span>
                  </td>
                  <td>{institution.createdAt ? new Date(institution.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</td>
                  <td className="actions">
                    {institution.status === 'pending' && (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleApprove(institution.id, 'institution')}
                        disabled={loading}
                      >
                        Approve
                      </button>
                    )}
                    {institution.status === 'active' && (
                      <button
                        className="btn btn-warning btn-sm"
                        onClick={() => handleSuspend(institution.id, 'institution')}
                        disabled={loading}
                      >
                        Suspend
                      </button>
                    )}
                    {institution.status === 'suspended' && (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleApprove(institution.id, 'institution')}
                        disabled={loading}
                      >
                        Reactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {institutions.length === 0 && (
            <div className="no-data">No institutions found</div>
          )}
        </div>
      )}
    </div>
  );

  const renderCompanies = () => (
    <div className="admin-module">
      <div className="module-header">
        <h2>Manage Companies</h2>
        <button 
          className="btn btn-primary"
          onClick={loadCompanies}
          disabled={loading}
        >
          Refresh
        </button>
      </div>
      
      {loading ? (
        <div className="loading">Loading companies...</div>
      ) : (
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map(company => (
                <tr key={company.id}>
                  <td>{company.name}</td>
                  <td>{company.email}</td>
                  <td>
                    <span className={`status-badge status-${company.status}`}>
                      {company.status}
                    </span>
                  </td>
                  <td>{company.createdAt ? new Date(company.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</td>
                  <td className="actions">
                    {company.status === 'pending' && (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleApprove(company.id, 'company')}
                        disabled={loading}
                      >
                        Approve
                      </button>
                    )}
                    {company.status === 'active' && (
                      <button
                        className="btn btn-warning btn-sm"
                        onClick={() => handleSuspend(company.id, 'company')}
                        disabled={loading}
                      >
                        Suspend
                      </button>
                    )}
                    {company.status === 'suspended' && (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleApprove(company.id, 'company')}
                        disabled={loading}
                      >
                        Reactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {companies.length === 0 && (
            <div className="no-data">No companies found</div>
          )}
        </div>
      )}
    </div>
  );

  const renderSystemReports = () => (
    <div className="admin-module">
      <h2>System Reports</h2>
      <div className="reports-grid">
        <div className="report-card">
          <h3>User Activity</h3>
          <p>Monitor user login activity and platform usage</p>
          <button className="btn btn-secondary">Generate Report</button>
        </div>
        <div className="report-card">
          <h3>Application Trends</h3>
          <p>Analyze course application patterns</p>
          <button className="btn btn-secondary">Generate Report</button>
        </div>
        <div className="report-card">
          <h3>Employment Statistics</h3>
          <p>Track job placement success rates</p>
          <button className="btn btn-secondary">Generate Report</button>
        </div>
        <div className="report-card">
          <h3>Institution Performance</h3>
          <p>Evaluate institution engagement metrics</p>
          <button className="btn btn-secondary">Generate Report</button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeModule) {
      case 'dashboard':
        return renderDashboard();
      case 'institutions':
        return renderInstitutions();
      case 'companies':
        return renderCompanies();
      case 'reports':
        return renderSystemReports();
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Admin Dashboard</h1>
        <p className="dashboard-subtitle">Manage the entire platform</p>
      </div>

      {message && (
        <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`}>
          {message}
        </div>
      )}

      <div className="admin-layout">
        <div className="admin-sidebar">
          <nav className="sidebar-nav">
            <button
              className={`nav-item ${activeModule === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveModule('dashboard')}
            >
              📊 Dashboard
            </button>
            <button
              className={`nav-item ${activeModule === 'institutions' ? 'active' : ''}`}
              onClick={() => setActiveModule('institutions')}
            >
              🏫 Institutions
            </button>
            <button
              className={`nav-item ${activeModule === 'companies' ? 'active' : ''}`}
              onClick={() => setActiveModule('companies')}
            >
              💼 Companies
            </button>
            <button
              className={`nav-item ${activeModule === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveModule('reports')}
            >
              📈 System Reports
            </button>
          </nav>
        </div>

        <div className="admin-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;