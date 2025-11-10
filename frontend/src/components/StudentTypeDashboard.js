// src/components/StudentTypeDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const StudentTypeDashboard = ({ user, onStudentTypeSelect }) => {
  const [selectedType, setSelectedType] = useState('');
  const [loading, setLoading] = useState(false);

  const studentTypes = [
    {
      value: 'highschool',
      title: 'High School Student',
      description: 'I am currently in high school and looking for higher education opportunities in Lesotho.',
      icon: '🏫',
      features: [
        'Discover higher learning institutions in Lesotho',
        'Browse courses and programs offered',
        'Apply online to institutions',
        'Track application status',
        'View admission results'
      ]
    },
    {
      value: 'college',
      title: 'College Graduate',
      description: 'I have completed my studies and am looking for career opportunities and employment.',
      icon: '🎓',
      features: [
        'Upload academic transcripts and certificates',
        'Connect with partner companies',
        'Browse and apply for job opportunities',
        'Receive job notifications matching your profile',
        'Manage career applications'
      ]
    }
  ];

  const handleTypeSelect = async (type) => {
    setLoading(true);
    try {
      // Update user profile with student type
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://group-assignment-2-ypxs.onrender.com/api';
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentType: type
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Update local storage with the response from server
        localStorage.setItem('userData', JSON.stringify(result.user));
        
        // Call parent function to update user context
        onStudentTypeSelect(type);
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating student type:', error);
      // Fallback: update locally even if API fails
      const updatedUser = { ...user, studentType: type };
      localStorage.setItem('userData', JSON.stringify(updatedUser));
      onStudentTypeSelect(type);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="student-type-dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Welcome to Your Student Portal</h1>
        <p className="dashboard-subtitle">Please tell us about your current status to personalize your experience</p>
      </div>

      <div className="student-type-selection">
        {studentTypes.map((type) => (
          <div
            key={type.value}
            className={`student-type-card ${selectedType === type.value ? 'selected' : ''}`}
            onClick={() => setSelectedType(type.value)}
          >
            <div className="type-icon">{type.icon}</div>
            <h3 className="type-title">{type.title}</h3>
            <p className="type-description">{type.description}</p>
            <div className="type-features">
              <h4>What you can do:</h4>
              <ul>
                {type.features.map((feature, index) => (
                  <li key={index}>✓ {feature}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="selection-actions">
        <button
          className="btn btn-primary"
          disabled={!selectedType || loading}
          onClick={() => handleTypeSelect(selectedType)}
        >
          {loading ? 'Setting up your dashboard...' : 'Continue to Dashboard'}
        </button>
      </div>

      <div className="selection-note">
        <p>You can change this selection later in your profile settings.</p>
      </div>
    </div>
  );
};

export default StudentTypeDashboard;


