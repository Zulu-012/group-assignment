const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' }));

const JWT_SECRET = process.env.JWT_SECRET || functions.config().jwt.secret || 'fallback-secret';

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Career Guidance API is LIVE on group-eff37! 🚀',
    timestamp: new Date().toISOString(),
    project: 'group-eff37'
  });
});

// Register user
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name, role, studentType } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({ 
        success: false, 
        error: 'All fields are required' 
      });
    }

    // Check if user exists
    const usersSnapshot = await db.collection('users')
      .where('email', '==', email.toLowerCase())
      .get();

    if (!usersSnapshot.empty) {
      return res.status(400).json({ 
        success: false, 
        error: 'User already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userRef = db.collection('users').doc();
    const userData = {
      id: userRef.id,
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      role,
      studentType: studentType || 'highschool',
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await userRef.set(userData);

    // Generate token
    const token = jwt.sign(
      { userId: userRef.id, email: userData.email, role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: userRef.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        studentType: userData.studentType
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Login user
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password required' 
      });
    }

    // Find user
    const usersSnapshot = await db.collection('users')
      .where('email', '==', email.toLowerCase())
      .get();

    if (usersSnapshot.empty) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();

    // Check password
    const validPassword = await bcrypt.compare(password, userData.password);
    if (!validPassword) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }

    // Generate token
    const token = jwt.sign(
      { userId: userDoc.id, email: userData.email, role: userData.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: userDoc.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        studentType: userData.studentType
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Initialize sample data
app.post('/api/init-data', async (req, res) => {
  try {
    // Create sample institution
    const instRef = db.collection('institution').doc();
    await instRef.set({
      name: 'National University of Lesotho',
      email: 'admissions@nul.ls',
      phone: '+266 22340601',
      address: 'Roma, Maseru District, Lesotho',
      description: 'The premier institution of higher learning in Lesotho',
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Create sample courses
    const courses = [
      {
        name: 'Bachelor of Science in Computer Science',
        description: 'Comprehensive computer science degree program',
        requirements: 'LGCSE with credit in Mathematics and English',
        duration: '4 years',
        availableSeats: 50,
        totalSeats: 50,
        status: 'active',
        institutionId: instRef.id
      },
      {
        name: 'Bachelor of Business Administration',
        description: 'Business management and administration degree',
        requirements: 'LGCSE with credit in Mathematics and English',
        duration: '3 years',
        availableSeats: 40,
        totalSeats: 40,
        status: 'active',
        institutionId: instRef.id
      }
    ];

    for (const courseData of courses) {
      const courseRef = db.collection('courses').doc();
      await courseRef.set({
        ...courseData,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    res.json({ 
      success: true, 
      message: 'Sample data created successfully' 
    });
  } catch (error) {
    console.error('Error creating sample data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export the API
exports.api = functions.https.onRequest(app);