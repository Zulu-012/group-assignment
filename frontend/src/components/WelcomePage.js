// src/components/WelcomePage.js
import React from 'react';
import { Link } from 'react-router-dom';

const WelcomePage = () => {
  return (
    <div className="welcome-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Career <span className="neon-text">Guidance</span> & Employment Integration
            </h1>
            <p className="hero-subtitle">
              Your gateway to higher education and career opportunities in Lesotho. 
              Discover institutions, apply for courses, and connect with top employers.
            </p>
            <div className="hero-buttons">
              <Link to="/register" className="welcome-btn welcome-btn-primary">
                Get Started
              </Link>
              <Link to="/login" className="welcome-btn welcome-btn-secondary">
                Sign In
              </Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="floating-card card-1">
              <div className="card-icon">🎓</div>
              <h4>Find Your Course</h4>
              <p>Discover programs that match your interests</p>
            </div>
            <div className="floating-card card-2">
              <div className="card-icon">💼</div>
              <h4>Career Opportunities</h4>
              <p>Connect with leading companies</p>
            </div>
            <div className="floating-card card-3">
              <div className="card-icon">📊</div>
              <h4>Track Applications</h4>
              <p>Monitor your progress in real-time</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>Explore Institutions</h3>
              <p>Browse through higher learning institutions in Lesotho and their course offerings</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📝</div>
              <h3>Apply Online</h3>
              <p>Submit applications to your preferred courses with just a few clicks</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📚</div>
              <h3>Upload Documents</h3>
              <p>Share your academic transcripts and certificates securely</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💼</div>
              <h3>Find Jobs</h3>
              <p>Get matched with employment opportunities based on your qualifications</p>
            </div>
          </div>
        </div>
      </section>

      {/* User Roles Section */}
      <section className="roles-section">
        <div className="container">
          <h2 className="section-title">Designed For Everyone</h2>
          <div className="roles-grid">
            <div className="role-card">
              <h3>🎓 Students</h3>
              <ul>
                <li>Discover courses and institutions</li>
                <li>Apply for admissions online</li>
                <li>Upload academic records</li>
                <li>Find job opportunities</li>
              </ul>
            </div>
            <div className="role-card">
              <h3>🏫 Institutions</h3>
              <ul>
                <li>Manage courses and faculties</li>
                <li>Review student applications</li>
                <li>Publish admissions</li>
                <li>Track enrollment</li>
              </ul>
            </div>
            <div className="role-card">
              <h3>🏢 Companies</h3>
              <ul>
                <li>Post job opportunities</li>
                <li>Find qualified candidates</li>
                <li>Filter by qualifications</li>
                <li>Manage applications</li>
              </ul>
            </div>
            <div className="role-card">
              <h3>👨‍💼 Administrators</h3>
              <ul>
                <li>Manage system users</li>
                <li>Approve institutions</li>
                <li>Monitor system activity</li>
                <li>Generate reports</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <h2>Ready to Start Your Journey?</h2>
          <p>Join thousands of students and professionals using our platform</p>
          <div className="cta-buttons">
            <Link to="/register" className="welcome-btn welcome-btn-primary welcome-btn-large">
              Create Account
            </Link>
            <Link to="/login" className="welcome-btn welcome-btn-secondary welcome-btn-large">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="welcome-footer">
        <div className="container">
          <p>&copy; 2024 Career Guidance & Employment Integration Platform. BIWD2110 Web Design Assignment.</p>
        </div>
      </footer>
    </div>
  );
};

export default WelcomePage;