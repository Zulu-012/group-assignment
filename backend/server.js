const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

console.log('🔧 Loading environment variables...');
console.log('Project ID:', process.env.FIREBASE_PROJECT_ID ? '✅ Found' : '❌ Missing');
console.log('Client Email:', process.env.FIREBASE_CLIENT_EMAIL ? '✅ Found' : '❌ Missing');
console.log('Private Key:', process.env.FIREBASE_PRIVATE_KEY ? '✅ Found (length: ' + process.env.FIREBASE_PRIVATE_KEY.length + ')' : '❌ Missing');

// Initialize Firebase Admin
let db;
let useMockDB = false;

// Enhanced environment variable parsing for Render
const getFirebaseConfig = () => {
  // Try multiple ways to get the private key
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  
  if (!privateKey) {
    console.log('❌ No private key found in environment variables');
    return null;
  }

  // Handle different formats of private key
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }
  
  // Replace escaped newlines with actual newlines
  privateKey = privateKey.replace(/\\n/g, '\n');
  
  // Ensure it has proper BEGIN/END markers
  if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
  }

  return {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: privateKey,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL || `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.FIREBASE_CLIENT_EMAIL)}`,
    universe_domain: "googleapis.com"
  };
};

try {
  const firebaseConfig = getFirebaseConfig();
  
  if (!firebaseConfig || !process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL) {
    console.log('⚠️  Firebase credentials incomplete, using mock database for development');
    useMockDB = true;
  } else {
    console.log('🚀 Initializing Firebase Admin with provided credentials...');
    console.log('📁 Project:', process.env.FIREBASE_PROJECT_ID);
    console.log('📧 Client Email:', process.env.FIREBASE_CLIENT_EMAIL);

    try {
      // Initialize Firebase only if not already initialized
      if (admin.apps.length === 0) {
        admin.initializeApp({
          credential: admin.credential.cert(firebaseConfig),
          databaseURL: process.env.FIREBASE_DATABASE_URL || `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`
        });
      }

      db = admin.firestore();

      // Configure Firestore settings to handle undefined values
      db.settings({ ignoreUndefinedProperties: true });

      // Test the connection
      const testRef = db.collection('test_connection').doc('test');
      await testRef.set({ test: true, timestamp: new Date() });
      await testRef.delete();

      console.log('✅ Firebase initialized successfully');
    } catch (firebaseError) {
      console.log('❌ Firebase initialization failed:', firebaseError.message);
      console.log('Error details:', firebaseError);
      useMockDB = true;
    }
  }
} catch (error) {
  console.log('⚠️  Firebase setup failed, using mock database:', error.message);
  useMockDB = true;
}

// Initialize mock database if Firebase failed or not configured
if (useMockDB) {
  console.log('🔄 Initializing mock database with sample data...');

  // Sample data for mock database
  const mockData = {
    institution: [
      {
        id: 'inst1',
        name: 'National University of Lesotho',
        email: 'admissions@nul.ls',
        phone: '+266 22340601',
        address: 'Roma, Maseru District, Lesotho',
        location: 'Roma, Lesotho',
        description: 'The premier institution of higher learning in Lesotho',
        status: 'active',
        createdAt: new Date()
      },
      {
        id: 'inst2',
        name: 'Limkokwing University of Creative Technology',
        email: 'info@limkokwing.ls',
        phone: '+266 22317242',
        address: 'Maseru, Lesotho',
        location: 'Maseru, Lesotho',
        description: 'Innovative university focusing on creative technology and design',
        status: 'active',
        createdAt: new Date()
      }
    ],
    courses: [
      {
        id: 'course1',
        institutionId: 'inst1',
        name: 'Bachelor of Science in Computer Science',
        description: 'Comprehensive computer science degree program',
        requirements: 'LGCSE with credit in Mathematics and English',
        duration: '4 years',
        availableSeats: 50,
        totalSeats: 50,
        status: 'active',
        createdAt: new Date()
      },
      {
        id: 'course2',
        institutionId: 'inst1',
        name: 'Bachelor of Business Administration',
        description: 'Business management and administration degree',
        requirements: 'LGCSE with credit in Mathematics and English',
        duration: '3 years',
        availableSeats: 40,
        totalSeats: 40,
        status: 'active',
        createdAt: new Date()
      },
      {
        id: 'course3',
        institutionId: 'inst2',
        name: 'Bachelor of Arts in Digital Media',
        description: 'Creative digital media and design program',
        requirements: 'LGCSE with credit in English and Art',
        duration: '3 years',
        availableSeats: 30,
        totalSeats: 30,
        status: 'active',
        createdAt: new Date()
      }
    ],
    users: [],
    student_profile: [],
    applications: [],
    comprehensive_applications: [],
    job_postings: [],
    notifications: [],
    transcripts: [],
    certificates: [],
    faculties: [],
    company_profile: []
  };

  // Enhanced mock database with better methods
  db = {
    collection: (name) => {
      if (!mockData[name]) {
        mockData[name] = [];
      }
      const data = mockData[name];
      
      return {
        where: (field, operator, value) => {
          const filtered = data.filter(item => {
            if (operator === '==') return item[field] === value;
            if (operator === 'in') return Array.isArray(value) ? value.includes(item[field]) : false;
            if (operator === 'array-contains') return Array.isArray(item[field]) ? item[field].includes(value) : false;
            return true;
          });
          return {
            get: async () => ({
              empty: filtered.length === 0,
              docs: filtered.map(item => ({
                id: item.id,
                data: () => item,
                exists: true
              })),
              size: filtered.length
            })
          };
        },
        add: async (data) => {
          const id = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const cleanData = removeUndefinedValues(data);
          const newItem = { id, ...cleanData, createdAt: new Date() };
          data.push(newItem);
          return { id };
        },
        doc: (id) => ({
          get: async () => {
            const item = data.find(d => d.id === id);
            return {
              exists: !!item,
              data: () => item || null
            };
          },
          update: async (updateData) => {
            const itemIndex = data.findIndex(d => d.id === id);
            if (itemIndex !== -1) {
              const cleanData = removeUndefinedValues(updateData);
              data[itemIndex] = { ...data[itemIndex], ...cleanData, updatedAt: new Date() };
            }
            return { id };
          },
          set: async (setData, options = {}) => {
            const itemIndex = data.findIndex(d => d.id === id);
            const cleanData = removeUndefinedValues(setData);
            const newItem = { id, ...cleanData, createdAt: new Date() };
            
            if (itemIndex !== -1) {
              if (options.merge) {
                data[itemIndex] = { ...data[itemIndex], ...cleanData, updatedAt: new Date() };
              } else {
                data[itemIndex] = newItem;
              }
            } else {
              data.push(newItem);
            }
            return { id };
          },
          delete: async () => {
            const itemIndex = data.findIndex(d => d.id === id);
            if (itemIndex !== -1) {
              data.splice(itemIndex, 1);
            }
            return { id };
          }
        }),
        get: async () => ({
          empty: data.length === 0,
          docs: data.map(item => ({
            id: item.id,
            data: () => item,
            exists: true
          })),
          forEach: (callback) => data.forEach(item => callback({ id: item.id, data: () => item })),
          size: data.length
        }),
        limit: (count) => ({
          get: async () => ({
            empty: data.length === 0,
            docs: data.slice(0, count).map(item => ({
              id: item.id,
              data: () => item
            })),
            size: Math.min(data.length, count)
          })
        }),
        orderBy: (field, direction = 'asc') => ({
          get: async () => {
            const sorted = [...data].sort((a, b) => {
              const aVal = a[field];
              const bVal = b[field];
              if (direction === 'desc') {
                return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
              }
              return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            });
            return {
              empty: sorted.length === 0,
              docs: sorted.map(item => ({
                id: item.id,
                data: () => item
              })),
              size: sorted.length
            };
          },
          where: (field, operator, value) => {
            // For chaining where with orderBy in mock
            const filtered = data.filter(item => {
              if (operator === '==') return item[field] === value;
              return true;
            });
            const sorted = filtered.sort((a, b) => {
              const aVal = a[field];
              const bVal = b[field];
              if (direction === 'desc') {
                return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
              }
              return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            });
            return {
              get: async () => ({
                empty: sorted.length === 0,
                docs: sorted.map(item => ({
                  id: item.id,
                  data: () => item
                })),
                size: sorted.length
              })
            };
          }
        })
      };
    },
    batch: () => {
      const writes = [];
      return {
        set: (ref, data) => {
          writes.push({ type: 'set', ref, data });
        },
        update: (ref, data) => {
          writes.push({ type: 'update', ref, data });
        },
        delete: (ref) => {
          writes.push({ type: 'delete', ref });
        },
        commit: async () => {
          for (const write of writes) {
            if (write.type === 'set') {
              await write.ref.set(write.data);
            } else if (write.type === 'update') {
              await write.ref.update(write.data);
            } else if (write.type === 'delete') {
              await write.ref.delete();
            }
          }
        }
      };
    }
  };
  console.log('✅ Mock database initialized with sample institutions and courses');
}

// Helper function to remove undefined and null values from objects
const removeUndefinedValues = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;

  if (Array.isArray(obj)) {
    return obj.map(removeUndefinedValues);
  }

  const cleanObj = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      cleanObj[key] = removeUndefinedValues(value);
    }
  }
  return cleanObj;
};

const app = express();

// Enhanced CORS configuration for Render
const allowedOrigins = [
  'https://group-assignment-2-ypxs.onrender.com',
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json({ limit: process.env.MAX_FILE_SIZE || '10mb' }));
app.use(express.urlencoded({ extended: true }));

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production-make-it-very-long-and-secure';

// Enhanced Authentication middleware with better error handling
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user document
    const userDoc = await db.collection('users').doc(decoded.userId).get();
    
    if (!userDoc.exists) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    const userData = userDoc.data();
    
    // Check if user is active
    if (userData.status !== 'active') {
      return res.status(403).json({ success: false, error: 'Account is not active' });
    }

    req.user = { 
      id: decoded.userId, 
      email: decoded.email,
      role: decoded.role,
      ...userData 
    };
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ success: false, error: 'Invalid or expired token' });
  }
};

// Role-based authorization middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }
    next();
  };
};

// Helper function to handle Firestore queries with multiple fallbacks
const safeQuery = async (collectionName, conditions = [], orderByField = null, limit = null) => {
  let collectionRef = db.collection(collectionName);
  
  try {
    // Try with all conditions and ordering
    let query = collectionRef;
    
    // Apply where conditions
    conditions.forEach(condition => {
      query = query.where(condition.field, condition.operator, condition.value);
    });
    
    // Apply ordering if specified
    if (orderByField) {
      query = query.orderBy(orderByField.field, orderByField.direction || 'desc');
    }
    
    // Apply limit if specified
    if (limit) {
      query = query.limit(limit);
    }
    
    const snapshot = await query.get();
    return snapshot;
  } catch (error) {
    // If index error, try without ordering first
    if (error.message.includes('index') || error.message.includes('FAILED_PRECONDITION')) {
      console.log(`Index error for ${collectionName}, trying without orderBy...`);
      
      try {
        let query = collectionRef;
        conditions.forEach(condition => {
          query = query.where(condition.field, condition.operator, condition.value);
        });
        
        if (limit) {
          query = query.limit(limit);
        }
        
        const snapshot = await query.get();
        return snapshot;
      } catch (secondError) {
        // If still failing, try with just the first condition
        console.log(`Second attempt failed, trying with single condition...`);
        
        try {
          let query = collectionRef;
          if (conditions.length > 0) {
            query = query.where(conditions[0].field, conditions[0].operator, conditions[0].value);
          }
          
          if (limit) {
            query = query.limit(limit);
          }
          
          const snapshot = await query.get();
          return snapshot;
        } catch (thirdError) {
          // Last resort: get all documents and filter manually
          console.log(`All query attempts failed, getting all documents...`);
          const snapshot = await collectionRef.get();
          return snapshot;
        }
      }
    }
    throw error;
  }
};

// Helper to filter documents manually after getting all
const filterDocuments = (docs, conditions) => {
  return docs.filter(doc => {
    return conditions.every(condition => {
      const value = doc.data()[condition.field];
      switch (condition.operator) {
        case '==':
          return value === condition.value;
        case 'in':
          return Array.isArray(condition.value) ? condition.value.includes(value) : false;
        case 'array-contains':
          return Array.isArray(value) ? value.includes(condition.value) : false;
        default:
          return true;
      }
    });
  });
};

// ==================== AUTHENTICATION ROUTES ====================

// Register user
app.post('/api/register', async (req, res) => {
  try {
    console.log('📝 Registration request received:', { 
      email: req.body.email, 
      role: req.body.role, 
      name: req.body.name 
    });

    const { email, password, role, name, institutionName, companyName, phone, studentType, educationLevel, major, address, industry } = req.body;

    // Validate required fields
    if (!email || !password || !role || !name) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ 
        success: false, 
        error: 'Email, password, role, and name are required' 
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email format' 
      });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password must be at least 6 characters long' 
      });
    }

    // Check if user already exists
    const usersSnapshot = await db.collection('users')
      .where('email', '==', email.toLowerCase())
      .get();
    
    if (!usersSnapshot.empty) {
      console.log('❌ User already exists:', email);
      return res.status(400).json({ 
        success: false, 
        error: 'User already exists with this email' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ Password hashed successfully');

    // Create user document
    const userRef = db.collection('users').doc();
    const userData = {
      id: userRef.id,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      name,
      phone: phone || '',
      status: 'active', // Auto-approve all users
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add role-specific data
    if (role === 'institution') {
      if (!institutionName) {
        return res.status(400).json({ 
          success: false, 
          error: 'Institution name is required for institution role' 
        });
      }
      userData.institutionName = institutionName;
      userData.address = address || '';
    } else if (role === 'company') {
      if (!companyName) {
        return res.status(400).json({ 
          success: false, 
          error: 'Company name is required for company role' 
        });
      }
      userData.companyName = companyName;
      userData.industry = industry || '';
    } else if (role === 'student') {
      userData.studentType = studentType || 'highschool';
      userData.educationLevel = educationLevel || '';
      userData.major = major || '';
    }

    console.log('📦 Creating user document...');
    await userRef.set(removeUndefinedValues(userData));
    console.log('✅ User document created:', userRef.id);

    // Create profile based on role
    if (role === 'student') {
      console.log('👨‍🎓 Creating student profile...');
      await db.collection('student_profile').doc(userRef.id).set(removeUndefinedValues({
        userId: userRef.id,
        email: email.toLowerCase(),
        name,
        phone: phone || '',
        studentType: studentType || 'highschool',
        educationLevel: educationLevel || '',
        major: major || '',
        applications: [],
        admissions: [],
        transcripts: [],
        certificates: [],
        jobApplications: [],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      console.log('✅ Student profile created');
    } else if (role === 'institution') {
      console.log('🏫 Creating institution profile...');
      await db.collection('institution').doc(userRef.id).set(removeUndefinedValues({
        userId: userRef.id,
        name: institutionName,
        email: email.toLowerCase(),
        phone: phone || '',
        address: address || '',
        faculties: [],
        courses: [],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      console.log('✅ Institution profile created');
    } else if (role === 'company') {
      console.log('💼 Creating company profile...');
      await db.collection('company_profile').doc(userRef.id).set(removeUndefinedValues({
        userId: userRef.id,
        name: companyName,
        email: email.toLowerCase(),
        phone: phone || '',
        industry: industry || '',
        status: 'active',
        jobPostings: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      console.log('✅ Company profile created');
    }

    // Generate JWT token
    const token = jwt.sign({ 
      userId: userRef.id, 
      email: email.toLowerCase(), 
      role 
    }, JWT_SECRET, { expiresIn: '24h' });

    console.log('✅ JWT token generated');

    // Prepare response data (remove password)
    const userResponse = {
      id: userRef.id,
      email: userData.email,
      role: userData.role,
      name: userData.name,
      phone: userData.phone,
      status: userData.status,
      isVerified: userData.isVerified,
      ...(role === 'student' && { 
        studentType: userData.studentType,
        educationLevel: userData.educationLevel,
        major: userData.major
      }),
      ...(role === 'institution' && { 
        institutionName: userData.institutionName,
        address: userData.address
      }),
      ...(role === 'company' && { 
        companyName: userData.companyName,
        industry: userData.industry
      })
    };

    console.log('✅ Registration completed successfully for:', email);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error during registration' 
    });
  }
});

// Login user
app.post('/api/login', async (req, res) => {
  try {
    console.log('🔐 Login attempt received:', { email: req.body.email });
    
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required' 
      });
    }

    // Find user
    console.log('🔍 Searching for user:', email.toLowerCase());
    const usersSnapshot = await db.collection('users')
      .where('email', '==', email.toLowerCase())
      .get();
    
    if (usersSnapshot.empty) {
      console.log('❌ User not found:', email);
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email or password' 
      });
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    console.log('✅ User found:', userData.email);

    // Check password
    console.log('🔑 Verifying password...');
    const validPassword = await bcrypt.compare(password, userData.password);
    if (!validPassword) {
      console.log('❌ Invalid password for:', email);
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email or password' 
      });
    }
    console.log('✅ Password verified');

    // Generate JWT token
    const token = jwt.sign({ 
      userId: userDoc.id, 
      email: userData.email, 
      role: userData.role 
    }, JWT_SECRET, { expiresIn: '24h' });

    console.log('✅ JWT token generated');

    // Prepare response data (remove password)
    const userResponse = {
      id: userDoc.id,
      email: userData.email,
      role: userData.role,
      name: userData.name,
      phone: userData.phone,
      status: userData.status,
      isVerified: userData.isVerified,
      ...(userData.role === 'student' && { 
        studentType: userData.studentType,
        educationLevel: userData.educationLevel,
        major: userData.major
      }),
      ...(userData.role === 'institution' && { 
        institutionName: userData.institutionName,
        address: userData.address
      }),
      ...(userData.role === 'company' && { 
        companyName: userData.companyName,
        industry: userData.industry
      })
    };

    console.log('✅ Login successful for:', userData.email);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error during login' 
    });
  }
});

// ==================== INSTITUTIONS AND COURSES ROUTES ====================

// Get all institutions with courses (for high school students)
app.get('/api/student/institutions', authenticateToken, requireRole(['student']), async (req, res) => {
  try {
    console.log('🏫 Fetching institutions from database...');
    
    let institutionsSnapshot;
    
    try {
      // Try to get all institutions
      institutionsSnapshot = await db.collection('institution').get();
    } catch (error) {
      console.error('Error fetching institutions:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch institutions' });
    }

    if (institutionsSnapshot.empty) {
      console.log('No institutions found in database');
      return res.json({ success: true, institutions: [] });
    }

    // Get institutions with their courses
    const institutions = await Promise.all(
      institutionsSnapshot.docs.map(async (doc) => {
        const institution = {
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt
        };

        // Fetch courses for this institution
        let coursesSnapshot;
        try {
          coursesSnapshot = await db.collection('courses')
            .where('institutionId', '==', doc.id)
            .where('status', '==', 'active')
            .get();
        } catch (courseError) {
          console.log(`Error fetching courses for institution ${doc.id}:`, courseError);
          // Fallback: get all courses and filter manually
          const allCourses = await db.collection('courses').get();
          coursesSnapshot = {
            docs: allCourses.docs.filter(courseDoc => {
              const courseData = courseDoc.data();
              return courseData.institutionId === doc.id && courseData.status === 'active';
            })
          };
        }

        const courses = coursesSnapshot.docs.map(courseDoc => ({
          id: courseDoc.id,
          ...courseDoc.data(),
          createdAt: courseDoc.data().createdAt?.toDate?.()?.toISOString() || courseDoc.data().createdAt
        }));

        return {
          ...institution,
          courses
        };
      })
    );

    console.log(`✅ Found ${institutions.length} institutions with courses`);
    res.json({ success: true, institutions });
  } catch (error) {
    console.error('❌ Error loading institutions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get courses for a specific institution
app.get('/api/institution/:institutionId/courses', authenticateToken, async (req, res) => {
  try {
    const { institutionId } = req.params;
    
    console.log(`📚 Fetching courses for institution: ${institutionId}`);
    
    let coursesSnapshot;
    
    try {
      coursesSnapshot = await db.collection('courses')
        .where('institutionId', '==', institutionId)
        .where('status', '==', 'active')
        .get();
    } catch (error) {
      console.log('Courses query failed, using fallback...');
      const allCourses = await db.collection('courses').get();
      coursesSnapshot = {
        docs: allCourses.docs.filter(doc => {
          const courseData = doc.data();
          return courseData.institutionId === institutionId && courseData.status === 'active';
        })
      };
    }

    const courses = coursesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt
    }));

    console.log(`✅ Found ${courses.length} courses for institution ${institutionId}`);
    res.json({ success: true, courses });
  } catch (error) {
    console.error('❌ Error loading courses:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== COMPREHENSIVE COURSE APPLICATION ROUTE ====================

// Submit comprehensive course application - FIXED UNDEFINED VALUES
app.post('/api/student/apply/course-comprehensive', authenticateToken, requireRole(['student']), async (req, res) => {
  try {
    const {
      // Personal Information
      dateOfBirth, gender, nationality, idNumber, maritalStatus, homeAddress, postalAddress,
      homeNumber, emergencyContact,
      
      // Family/Guardian Information
      parentGuardianName, parentRelationship, parentOccupation, parentContact, parentEmail, parentAddress,
      financialSponsor,
      
      // Academic Background
      highSchoolName, schoolAddress, finalYearCompleted, studentNumber, subjectsTaken, gradesResults,
      awardsDistinctions, previousInstitution,
      
      // Academic Achievements
      certificatesEarned, honorsAwards, extracurricularAchievements, scholarshipsReceived,
      
      // Course Information
      institutionId, courseId, facultyDepartment, courseCode, studyMode, studyLevel, preferredCampus,
      academicYearEntry, semesterEntry,
      
      // Health & Disability
      medicalConditions, disabilityDeclaration, supportServices,
      
      // Financial Information
      financialPayer, proofOfSponsorship, bursaryApplications,
      
      // Declaration
      applicantSignature, signatureDate, parentSignature
    } = req.body;

    console.log('📝 Received comprehensive application data:', {
      institutionId,
      courseId,
      studentName: req.user.name
    });

    // Validate required fields
    if (!institutionId || !courseId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Institution and course selection are required' 
      });
    }

    // Validate institution exists
    const institutionDoc = await db.collection('institution').doc(institutionId).get();
    if (!institutionDoc.exists) {
      return res.status(400).json({ 
        success: false, 
        error: 'Selected institution not found' 
      });
    }

    // Validate course exists and belongs to institution
    const courseDoc = await db.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      return res.status(400).json({ 
        success: false, 
        error: 'Selected course not found' 
      });
    }

    const courseData = courseDoc.data();
    if (courseData.institutionId !== institutionId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Course does not belong to selected institution' 
      });
    }

    // Check if student is high school student
    const userDoc = await db.collection('users').doc(req.user.id).get();
    const userData = userDoc.data();
    
    if (userData.studentType !== 'highschool') {
      return res.status(400).json({ 
        success: false, 
        error: 'Only high school students can apply for courses' 
      });
    }

    // Check if student has already applied to 2 courses in this institution
    let existingApplications;
    try {
      existingApplications = await db.collection('applications')
        .where('studentId', '==', req.user.id)
        .where('institutionId', '==', institutionId)
        .where('type', '==', 'course')
        .get();
    } catch (error) {
      console.log('Query failed, getting all applications and filtering...');
      const allApplications = await db.collection('applications').get();
      existingApplications = {
        docs: allApplications.docs.filter(doc => {
          const data = doc.data();
          return data.studentId === req.user.id && 
                 data.institutionId === institutionId && 
                 data.type === 'course';
        })
      };
    }

    if (existingApplications.docs.length >= 2) {
      return res.status(400).json({ 
        success: false, 
        error: 'You can only apply for maximum 2 courses per institution' 
      });
    }

    // Check if already applied to this course
    let existingApplication;
    try {
      existingApplication = await db.collection('applications')
        .where('studentId', '==', req.user.id)
        .where('courseId', '==', courseId)
        .where('type', '==', 'course')
        .get();
    } catch (error) {
      console.log('Query failed, getting all applications and filtering...');
      const allApplications = await db.collection('applications').get();
      existingApplication = {
        docs: allApplications.docs.filter(doc => {
          const data = doc.data();
          return data.studentId === req.user.id && 
                 data.courseId === courseId && 
                 data.type === 'course';
        }),
        empty: false
      };
      existingApplication.empty = existingApplication.docs.length === 0;
    }

    if (!existingApplication.empty) {
      return res.status(400).json({ 
        success: false, 
        error: 'You have already applied for this course' 
      });
    }

    const institutionData = institutionDoc.data();

    const applicationRef = db.collection('applications').doc();
    const comprehensiveApplicationRef = db.collection('comprehensive_applications').doc();

    // Main application data (for quick queries)
    const applicationData = removeUndefinedValues({
      id: applicationRef.id,
      studentId: req.user.id,
      institutionId,
      courseId,
      type: 'course',
      applicationType: 'comprehensive',
      comprehensiveApplicationId: comprehensiveApplicationRef.id,
      status: 'pending',
      institutionName: institutionData.name,
      courseName: courseData.name,
      studentName: userData.name,
      studentEmail: userData.email,
      appliedAt: new Date(),
      updatedAt: new Date()
    });

    // Comprehensive application data (all form fields) - CLEANED OF UNDEFINED VALUES
    const comprehensiveApplicationData = removeUndefinedValues({
      id: comprehensiveApplicationRef.id,
      applicationId: applicationRef.id,
      studentId: req.user.id,
      studentName: userData.name,
      studentEmail: userData.email,
      studentPhone: userData.phone || '',
      
      // Personal Information
      personalInformation: {
        dateOfBirth: dateOfBirth || '',
        gender: gender || '',
        nationality: nationality || '',
        idNumber: idNumber || '',
        maritalStatus: maritalStatus || '',
        homeAddress: homeAddress || '',
        postalAddress: postalAddress || '',
        homeNumber: homeNumber || '',
        emergencyContact: emergencyContact || {}
      },
      
      // Family/Guardian Information
      familyInformation: {
        parentGuardianName: parentGuardianName || '',
        parentRelationship: parentRelationship || '',
        parentOccupation: parentOccupation || '',
        parentContact: parentContact || '',
        parentEmail: parentEmail || '',
        parentAddress: parentAddress || '',
        financialSponsor: financialSponsor || ''
      },
      
      // Academic Background
      academicBackground: {
        highSchoolName: highSchoolName || '',
        schoolAddress: schoolAddress || '',
        finalYearCompleted: finalYearCompleted || '',
        studentNumber: studentNumber || '',
        subjectsTaken: subjectsTaken || '',
        gradesResults: gradesResults || '',
        awardsDistinctions: awardsDistinctions || '',
        previousInstitution: previousInstitution || ''
      },
      
      // Academic Achievements
      academicAchievements: {
        certificatesEarned: certificatesEarned || '',
        honorsAwards: honorsAwards || '',
        extracurricularAchievements: extracurricularAchievements || '',
        scholarshipsReceived: scholarshipsReceived || ''
      },
      
      // Course Information with enhanced institution data
      courseInformation: {
        institutionId,
        institutionName: institutionData.name,
        institutionLocation: institutionData.location || institutionData.address || '',
        courseId,
        courseName: courseData.name,
        facultyDepartment: facultyDepartment || '',
        courseCode: courseCode || '',
        studyMode: studyMode || '',
        studyLevel: studyLevel || '',
        preferredCampus: preferredCampus || '',
        academicYearEntry: academicYearEntry || '',
        semesterEntry: semesterEntry || '',
        courseDetails: courseData
      },
      
      // Health & Disability
      healthInformation: {
        medicalConditions: medicalConditions || '',
        disabilityDeclaration: disabilityDeclaration || '',
        supportServices: supportServices || ''
      },
      
      // Financial Information
      financialInformation: {
        financialPayer: financialPayer || '',
        proofOfSponsorship: proofOfSponsorship || '',
        bursaryApplications: bursaryApplications || ''
      },
      
      // Declaration
      declaration: {
        applicantSignature: applicantSignature || '',
        signatureDate: signatureDate || '',
        parentSignature: parentSignature || '',
        agreedToTerms: true
      },
      
      // Metadata
      status: 'pending',
      appliedAt: new Date(),
      updatedAt: new Date()
    });

    // Save both documents in a batch write for atomic operation
    const batch = db.batch();
    batch.set(applicationRef, applicationData);
    batch.set(comprehensiveApplicationRef, comprehensiveApplicationData);
    await batch.commit();

    // Update student profile
    await db.collection('student_profile').doc(req.user.id).update({
      applications: [...(userData.applications || []), applicationRef.id]
    });

    // Create notification for institution
    const notificationData = removeUndefinedValues({
      userId: institutionId,
      type: 'new_application',
      title: 'New Comprehensive Course Application',
      message: `New comprehensive application received for ${courseData.name} from ${userData.name}`,
      applicationId: applicationRef.id,
      read: false,
      createdAt: new Date()
    });

    // Try to create notification, but don't fail if index issues
    try {
      await db.collection('notifications').doc().set(notificationData);
    } catch (notificationError) {
      console.log('Notification creation skipped due to index:', notificationError.message);
    }

    console.log('✅ Comprehensive application submitted successfully:', {
      applicationId: applicationRef.id,
      comprehensiveApplicationId: comprehensiveApplicationRef.id,
      student: userData.name,
      course: courseData.name,
      institution: institutionData.name
    });

    // Return the complete application data for immediate display
    const completeApplication = {
      ...applicationData,
      comprehensiveData: comprehensiveApplicationData,
      appliedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.status(201).json({ 
      success: true, 
      message: 'Comprehensive course application submitted successfully',
      applicationId: applicationRef.id,
      comprehensiveApplicationId: comprehensiveApplicationRef.id,
      application: completeApplication
    });
  } catch (error) {
    console.error('❌ Error submitting comprehensive application:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get comprehensive application details
app.get('/api/student/applications/comprehensive/:applicationId', authenticateToken, async (req, res) => {
  try {
    const { applicationId } = req.params;

    // Get the main application
    const applicationDoc = await db.collection('applications').doc(applicationId).get();
    if (!applicationDoc.exists) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    const application = applicationDoc.data();

    // Check permissions
    if (req.user.role === 'student' && application.studentId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    if (req.user.role === 'institution' && application.institutionId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Get comprehensive application data
    let comprehensiveData = null;
    if (application.comprehensiveApplicationId) {
      const comprehensiveDoc = await db.collection('comprehensive_applications').doc(application.comprehensiveApplicationId).get();
      if (comprehensiveDoc.exists) {
        comprehensiveData = comprehensiveDoc.data();
      }
    }

    res.json({
      success: true,
      application: {
        id: applicationDoc.id,
        ...application,
        comprehensiveData,
        appliedAt: application.appliedAt?.toDate?.()?.toISOString() || application.appliedAt,
        updatedAt: application.updatedAt?.toDate?.()?.toISOString() || application.updatedAt
      }
    });
  } catch (error) {
    console.error('Error loading comprehensive application:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== STUDENT MODULE ROUTES ====================

// Get student applications
app.get('/api/student/applications', authenticateToken, requireRole(['student']), async (req, res) => {
  try {
    let applicationsSnapshot;
    
    try {
      // First try with proper query
      applicationsSnapshot = await safeQuery(
        'applications',
        [{ field: 'studentId', operator: '==', value: req.user.id }],
        { field: 'appliedAt', direction: 'desc' }
      );
    } catch (queryError) {
      console.log('Query failed, getting all applications and filtering...');
      // If all else fails, get all and filter manually
      const allApplications = await db.collection('applications').get();
      const filteredDocs = filterDocuments(allApplications.docs, [
        { field: 'studentId', operator: '==', value: req.user.id }
      ]);
      
      // Manually sort by appliedAt
      filteredDocs.sort((a, b) => {
        const aDate = a.data().appliedAt?.toDate?.() || new Date(0);
        const bDate = b.data().appliedAt?.toDate?.() || new Date(0);
        return bDate - aDate;
      });
      
      applicationsSnapshot = {
        docs: filteredDocs
      };
    }

    const applications = applicationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      appliedAt: doc.data().appliedAt?.toDate?.()?.toISOString() || doc.data().appliedAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt
    }));

    res.json({ success: true, applications });
  } catch (error) {
    console.error('Error loading applications:', error);
    // Return empty array instead of error
    res.json({ success: true, applications: [] });
  }
});

// Get admission results
app.get('/api/student/admissions', authenticateToken, requireRole(['student']), async (req, res) => {
  try {
    let admissionsSnapshot;
    
    try {
      admissionsSnapshot = await safeQuery(
        'applications',
        [
          { field: 'studentId', operator: '==', value: req.user.id },
          { field: 'type', operator: '==', value: 'course' },
          { field: 'status', operator: 'in', value: ['approved', 'rejected'] }
        ],
        { field: 'updatedAt', direction: 'desc' }
      );
    } catch (queryError) {
      console.log('Admissions query failed, using fallback...');
      // Fallback: get all applications and filter manually
      const allApplications = await db.collection('applications').get();
      const filteredDocs = filterDocuments(allApplications.docs, [
        { field: 'studentId', operator: '==', value: req.user.id },
        { field: 'type', operator: '==', value: 'course' },
        { field: 'status', operator: 'in', value: ['approved', 'rejected'] }
      ]);
      
      // Manually sort
      filteredDocs.sort((a, b) => {
        const aDate = a.data().updatedAt?.toDate?.() || new Date(0);
        const bDate = b.data().updatedAt?.toDate?.() || new Date(0);
        return bDate - aDate;
      });
      
      admissionsSnapshot = {
        docs: filteredDocs
      };
    }

    const admissions = admissionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      appliedAt: doc.data().appliedAt?.toDate?.()?.toISOString() || doc.data().appliedAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt
    }));

    res.json({ success: true, admissions });
  } catch (error) {
    console.error('Error loading admissions:', error);
    res.json({ success: true, admissions: [] });
  }
});

// Get student notifications
app.get('/api/student/notifications', authenticateToken, requireRole(['student']), async (req, res) => {
  try {
    let notificationsSnapshot;
    
    try {
      notificationsSnapshot = await safeQuery(
        'notifications',
        [{ field: 'userId', operator: '==', value: req.user.id }],
        { field: 'createdAt', direction: 'desc' },
        20
      );
    } catch (queryError) {
      console.log('Notifications query failed, using fallback...');
      // Fallback: get all notifications and filter manually
      const allNotifications = await db.collection('notifications').get();
      const filteredDocs = filterDocuments(allNotifications.docs, [
        { field: 'userId', operator: '==', value: req.user.id }
      ]);
      
      // Manually sort and limit
      filteredDocs.sort((a, b) => {
        const aDate = a.data().createdAt?.toDate?.() || new Date(0);
        const bDate = b.data().createdAt?.toDate?.() || new Date(0);
        return bDate - aDate;
      }).slice(0, 20);
      
      notificationsSnapshot = {
        docs: filteredDocs
      };
    }

    const notifications = notificationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt
    }));

    res.json({ success: true, notifications });
  } catch (error) {
    console.error('Error loading notifications:', error);
    res.json({ success: true, notifications: [] });
  }
});

// Get student transcripts
app.get('/api/student/transcripts', authenticateToken, requireRole(['student']), async (req, res) => {
  try {
    let transcriptsSnapshot;
    
    try {
      transcriptsSnapshot = await safeQuery(
        'transcripts',
        [{ field: 'studentId', operator: '==', value: req.user.id }],
        { field: 'uploadedAt', direction: 'desc' }
      );
    } catch (queryError) {
      console.log('Transcripts query failed, using fallback...');
      const allTranscripts = await db.collection('transcripts').get();
      const filteredDocs = filterDocuments(allTranscripts.docs, [
        { field: 'studentId', operator: '==', value: req.user.id }
      ]);
      
      filteredDocs.sort((a, b) => {
        const aDate = a.data().uploadedAt?.toDate?.() || new Date(0);
        const bDate = b.data().uploadedAt?.toDate?.() || new Date(0);
        return bDate - aDate;
      });
      
      transcriptsSnapshot = {
        docs: filteredDocs
      };
    }

    const transcripts = transcriptsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        uploadedAt: data.uploadedAt?.toDate?.()?.toISOString() || data.uploadedAt
      };
    });

    res.json({ success: true, transcripts });
  } catch (error) {
    console.error('Error loading transcripts:', error);
    res.json({ success: true, transcripts: [] });
  }
});

// Get student certificates
app.get('/api/student/certificates', authenticateToken, requireRole(['student']), async (req, res) => {
  try {
    let certificatesSnapshot;
    
    try {
      certificatesSnapshot = await safeQuery(
        'certificates',
        [{ field: 'studentId', operator: '==', value: req.user.id }],
        { field: 'uploadedAt', direction: 'desc' }
      );
    } catch (queryError) {
      console.log('Certificates query failed, using fallback...');
      const allCertificates = await db.collection('certificates').get();
      const filteredDocs = filterDocuments(allCertificates.docs, [
        { field: 'studentId', operator: '==', value: req.user.id }
      ]);
      
      filteredDocs.sort((a, b) => {
        const aDate = a.data().uploadedAt?.toDate?.() || new Date(0);
        const bDate = b.data().uploadedAt?.toDate?.() || new Date(0);
        return bDate - aDate;
      });
      
      certificatesSnapshot = {
        docs: filteredDocs
      };
    }

    const certificates = certificatesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        uploadedAt: data.uploadedAt?.toDate?.()?.toISOString() || data.uploadedAt
      };
    });

    res.json({ success: true, certificates });
  } catch (error) {
    console.error('Error loading certificates:', error);
    res.json({ success: true, certificates: [] });
  }
});

// Apply for course (for high school students)
app.post('/api/student/apply/course', authenticateToken, requireRole(['student']), async (req, res) => {
  try {
    const { courseId, institutionId } = req.body;

    // Check if student is high school student
    const userDoc = await db.collection('users').doc(req.user.id).get();
    const userData = userDoc.data();
    
    if (userData.studentType !== 'highschool') {
      return res.status(400).json({ 
        success: false, 
        error: 'Only high school students can apply for courses' 
      });
    }

    // Check if student has already applied to 2 courses in this institution
    const existingApplications = await db.collection('applications')
      .where('studentId', '==', req.user.id)
      .where('institutionId', '==', institutionId)
      .where('type', '==', 'course')
      .get();

    if (existingApplications.size >= 2) {
      return res.status(400).json({ 
        success: false, 
        error: 'You can only apply for maximum 2 courses per institution' 
      });
    }

    // Check if already applied to this course
    const existingApplication = await db.collection('applications')
      .where('studentId', '==', req.user.id)
      .where('courseId', '==', courseId)
      .where('type', '==', 'course')
      .get();

    if (!existingApplication.empty) {
      return res.status(400).json({ 
        success: false, 
        error: 'You have already applied for this course' 
      });
    }

    // Get course and institution details
    const [courseDoc, institutionDoc] = await Promise.all([
      db.collection('courses').doc(courseId).get(),
      db.collection('institution').doc(institutionId).get()
    ]);

    if (!courseDoc.exists || !institutionDoc.exists) {
      return res.status(404).json({ success: false, error: 'Course or institution not found' });
    }

    const institutionData = institutionDoc.data();
    const courseData = courseDoc.data();

    const applicationRef = db.collection('applications').doc();
    const applicationData = removeUndefinedValues({
      id: applicationRef.id,
      studentId: req.user.id,
      institutionId,
      courseId,
      type: 'course',
      status: 'pending',
      institutionName: institutionData.name,
      courseName: courseData.name,
      studentName: userData.name,
      studentEmail: userData.email,
      appliedAt: new Date(),
      updatedAt: new Date()
    });

    await applicationRef.set(applicationData);

    // Update student profile
    await db.collection('student_profile').doc(req.user.id).update({
      applications: [...(userData.applications || []), applicationRef.id]
    });

    // Create notification for institution
    const notificationData = removeUndefinedValues({
      userId: institutionId,
      type: 'new_application',
      title: 'New Course Application',
      message: `New application received for ${courseData.name}`,
      applicationId: applicationRef.id,
      read: false,
      createdAt: new Date()
    });

    // Try to create notification, but don't fail if index issues
    try {
      await db.collection('notifications').doc().set(notificationData);
    } catch (notificationError) {
      console.log('Notification creation skipped due to index:', notificationError.message);
    }

    // Return the complete application data for immediate display
    const completeApplication = {
      ...applicationData,
      appliedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.status(201).json({ 
      success: true, 
      message: 'Course application submitted successfully',
      applicationId: applicationRef.id,
      application: completeApplication // Return the application data
    });
  } catch (error) {
    console.error('Error applying for course:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Upload academic transcript (for college graduates)
app.post('/api/student/transcript', authenticateToken, requireRole(['student']), async (req, res) => {
  try {
    const { educationLevel, institution, year, grades, transcriptData } = req.body;

    // Check if student is college graduate
    const userDoc = await db.collection('users').doc(req.user.id).get();
    const userData = userDoc.data();
    
    if (userData.studentType !== 'college') {
      return res.status(400).json({ 
        success: false, 
        error: 'Only college graduates can upload transcripts' 
      });
    }

    const transcriptRef = db.collection('transcripts').doc();
    const transcriptPayload = removeUndefinedValues({
      id: transcriptRef.id,
      studentId: req.user.id,
      educationLevel,
      institution,
      year: parseInt(year) || 0,
      grades,
      transcriptData: transcriptData || '', // Store base64 data if provided
      uploadedAt: new Date()
    });

    await transcriptRef.set(transcriptPayload);

    // Update student profile
    await db.collection('student_profile').doc(req.user.id).update({
      transcripts: [...(userData.transcripts || []), transcriptRef.id]
    });

    // Return the complete transcript data for immediate display
    const completeTranscript = {
      ...transcriptPayload,
      uploadedAt: new Date().toISOString()
    };

    res.status(201).json({ 
      success: true, 
      message: 'Transcript uploaded successfully',
      transcriptId: transcriptRef.id,
      transcript: completeTranscript // Return the transcript data
    });
  } catch (error) {
    console.error('Error uploading transcript:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get specific transcript by ID
app.get('/api/student/transcript/:transcriptId', authenticateToken, requireRole(['student']), async (req, res) => {
  try {
    const { transcriptId } = req.params;
    
    const transcriptDoc = await db.collection('transcripts').doc(transcriptId).get();
    
    if (!transcriptDoc.exists) {
      return res.status(404).json({ success: false, error: 'Transcript not found' });
    }

    const transcript = transcriptDoc.data();
    
    // Verify the transcript belongs to the current student
    if (transcript.studentId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    res.json({ 
      success: true, 
      transcript: {
        id: transcriptDoc.id,
        ...transcript,
        uploadedAt: transcript.uploadedAt?.toDate?.()?.toISOString() || transcript.uploadedAt
      }
    });
  } catch (error) {
    console.error('Error loading transcript:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Upload certificate (for college graduates)
app.post('/api/student/certificate', authenticateToken, requireRole(['student']), async (req, res) => {
  try {
    const { name, issuingOrganization, dateIssued, certificateData } = req.body;

    // Check if student is college graduate
    const userDoc = await db.collection('users').doc(req.user.id).get();
    const userData = userDoc.data();
    
    if (userData.studentType !== 'college') {
      return res.status(400).json({ 
        success: false, 
        error: 'Only college graduates can upload certificates' 
      });
    }

    const certificateRef = db.collection('certificates').doc();
    const certificatePayload = removeUndefinedValues({
      id: certificateRef.id,
      studentId: req.user.id,
      name,
      issuingOrganization,
      dateIssued,
      certificateData: certificateData || '',
      uploadedAt: new Date()
    });

    await certificateRef.set(certificatePayload);

    // Update student profile
    await db.collection('student_profile').doc(req.user.id).update({
      certificates: [...(userData.certificates || []), certificateRef.id]
    });

    // Return the complete certificate data for immediate display
    const completeCertificate = {
      ...certificatePayload,
      uploadedAt: new Date().toISOString()
    };

    res.status(201).json({ 
      success: true, 
      message: 'Certificate uploaded successfully',
      certificateId: certificateRef.id,
      certificate: completeCertificate // Return the certificate data
    });
  } catch (error) {
    console.error('Error uploading certificate:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get specific certificate by ID
app.get('/api/student/certificate/:certificateId', authenticateToken, requireRole(['student']), async (req, res) => {
  try {
    const { certificateId } = req.params;
    
    const certificateDoc = await db.collection('certificates').doc(certificateId).get();
    
    if (!certificateDoc.exists) {
      return res.status(404).json({ success: false, error: 'Certificate not found' });
    }

    const certificate = certificateDoc.data();
    
    // Verify the certificate belongs to the current student
    if (certificate.studentId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    res.json({ 
      success: true, 
      certificate: {
        id: certificateDoc.id,
        ...certificate,
        uploadedAt: certificate.uploadedAt?.toDate?.()?.toISOString() || certificate.uploadedAt
      }
    });
  } catch (error) {
    console.error('Error loading certificate:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get job postings (for college graduates)
app.get('/api/student/jobs', authenticateToken, requireRole(['student']), async (req, res) => {
  try {
    // Check if student is college graduate
    const userDoc = await db.collection('users').doc(req.user.id).get();
    const userData = userDoc.data();
    
    if (userData.studentType !== 'college') {
      return res.status(400).json({ 
        success: false, 
        error: 'Only college graduates can view job postings' 
      });
    }

    const jobPostingsSnapshot = await db.collection('job_postings')
      .where('status', '==', 'active')
      .get();

    const jobPostings = await Promise.all(
      jobPostingsSnapshot.docs.map(async doc => {
        const job = { id: doc.id, ...doc.data() };
        
        // Get company details
        const companyDoc = await db.collection('company_profile').doc(job.companyId).get();
        if (companyDoc.exists) {
          job.company = companyDoc.data();
        }

        // Check if student has already applied
        const existingApplication = await db.collection('applications')
          .where('studentId', '==', req.user.id)
          .where('jobId', '==', doc.id)
          .where('type', '==', 'job')
          .get();

        job.hasApplied = !existingApplication.empty;

        return job;
      })
    );

    res.json({ success: true, jobPostings });
  } catch (error) {
    console.error('Error loading job postings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Apply for job (for college graduates)
app.post('/api/student/apply/job', authenticateToken, requireRole(['student']), async (req, res) => {
  try {
    const { jobId } = req.body;

    // Check if student is college graduate
    const userDoc = await db.collection('users').doc(req.user.id).get();
    const userData = userDoc.data();
    
    if (userData.studentType !== 'college') {
      return res.status(400).json({ 
        success: false, 
        error: 'Only college graduates can apply for jobs' 
      });
    }

    // Check if job exists and is active
    const jobDoc = await db.collection('job_postings').doc(jobId).get();
    if (!jobDoc.exists || jobDoc.data().status !== 'active') {
      return res.status(404).json({ success: false, error: 'Job not found or inactive' });
    }

    // Check if already applied to this job
    const existingApplication = await db.collection('applications')
      .where('studentId', '==', req.user.id)
      .where('jobId', '==', jobId)
      .where('type', '==', 'job')
      .get();

    if (!existingApplication.empty) {
      return res.status(400).json({ 
        success: false, 
        error: 'You have already applied for this job' 
      });
    }

    const applicationRef = db.collection('applications').doc();
    const applicationData = removeUndefinedValues({
      id: applicationRef.id,
      studentId: req.user.id,
      jobId,
      type: 'job',
      status: 'pending',
      companyId: jobDoc.data().companyId,
      jobTitle: jobDoc.data().title,
      appliedAt: new Date(),
      updatedAt: new Date()
    });

    await applicationRef.set(applicationData);

    // Update student profile
    await db.collection('student_profile').doc(req.user.id).update({
      jobApplications: [...(userData.jobApplications || []), applicationRef.id]
    });

    // Create notification for company
    const notificationData = removeUndefinedValues({
      userId: jobDoc.data().companyId,
      type: 'new_job_application',
      title: 'New Job Application',
      message: `New application received for ${jobDoc.data().title}`,
      applicationId: applicationRef.id,
      read: false,
      createdAt: new Date()
    });

    // Try to create notification, but don't fail if index issues
    try {
      await db.collection('notifications').doc().set(notificationData);
    } catch (notificationError) {
      console.log('Notification creation skipped due to index:', notificationError.message);
    }

    // Return the complete application data for immediate display
    const completeApplication = {
      ...applicationData,
      appliedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.status(201).json({ 
      success: true, 
      message: 'Job application submitted successfully',
      applicationId: applicationRef.id,
      application: completeApplication // Return the application data
    });
  } catch (error) {
    console.error('Error applying for job:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark notification as read
app.put('/api/student/notifications/:notificationId/read', authenticateToken, requireRole(['student']), async (req, res) => {
  try {
    const { notificationId } = req.params;

    await db.collection('notifications').doc(notificationId).update({
      read: true,
      readAt: new Date()
    });

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update student type
app.put('/api/student/type', authenticateToken, requireRole(['student']), async (req, res) => {
  try {
    const { studentType } = req.body;

    if (!['highschool', 'college'].includes(studentType)) {
      return res.status(400).json({ success: false, error: 'Invalid student type' });
    }

    // Update user document
    await db.collection('users').doc(req.user.id).update({
      studentType,
      updatedAt: new Date()
    });

    // Update student profile
    await db.collection('student_profile').doc(req.user.id).update({
      studentType,
      updatedAt: new Date()
    });

    res.json({ success: true, message: 'Student type updated successfully', studentType });
  } catch (error) {
    console.error('Error updating student type:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== INSTITUTION MODULE ROUTES ====================

// Get institution faculties
app.get('/api/institution/faculties', authenticateToken, requireRole(['institution']), async (req, res) => {
  try {
    console.log('📚 Fetching faculties for institution:', req.user.id);
    
    let facultiesSnapshot;
    
    try {
      facultiesSnapshot = await safeQuery(
        'faculties',
        [{ field: 'institutionId', operator: '==', value: req.user.id }],
        { field: 'createdAt', direction: 'desc' }
      );
    } catch (queryError) {
      console.log('Faculties query failed, using fallback...');
      const allFaculties = await db.collection('faculties').get();
      const filteredDocs = filterDocuments(allFaculties.docs, [
        { field: 'institutionId', operator: '==', value: req.user.id }
      ]);
      
      filteredDocs.sort((a, b) => {
        const aDate = a.data().createdAt?.toDate?.() || new Date(0);
        const bDate = b.data().createdAt?.toDate?.() || new Date(0);
        return bDate - aDate;
      });
      
      facultiesSnapshot = {
        docs: filteredDocs
      };
    }

    const faculties = facultiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt
    }));

    console.log(`✅ Found ${faculties.length} faculties`);
    res.json({ success: true, faculties });
  } catch (error) {
    console.error('❌ Error loading faculties:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add faculty
app.post('/api/institution/faculties', authenticateToken, requireRole(['institution']), async (req, res) => {
  try {
    const { name, description } = req.body;

    console.log('🏛️ Adding faculty for institution:', req.user.id, { name, description });

    if (!name || !description) {
      return res.status(400).json({ 
        success: false, 
        error: 'Faculty name and description are required' 
      });
    }

    const facultyRef = db.collection('faculties').doc();
    const facultyData = removeUndefinedValues({
      id: facultyRef.id,
      name,
      description,
      institutionId: req.user.id,
      createdAt: new Date()
    });

    await facultyRef.set(facultyData);

    // Add faculty to institution
    const institutionDoc = await db.collection('institution').doc(req.user.id).get();
    const institutionData = institutionDoc.data();
    await db.collection('institution').doc(req.user.id).update({
      faculties: [...(institutionData.faculties || []), facultyRef.id]
    });

    console.log('✅ Faculty added successfully:', facultyRef.id);
    
    res.status(201).json({ 
      success: true, 
      message: 'Faculty added successfully', 
      facultyId: facultyRef.id,
      faculty: facultyData
    });
  } catch (error) {
    console.error('❌ Error adding faculty:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get institution courses
app.get('/api/institution/courses', authenticateToken, requireRole(['institution']), async (req, res) => {
  try {
    console.log('📚 Fetching courses for institution:', req.user.id);
    
    let coursesSnapshot;
    
    try {
      coursesSnapshot = await safeQuery(
        'courses',
        [{ field: 'institutionId', operator: '==', value: req.user.id }],
        { field: 'createdAt', direction: 'desc' }
      );
    } catch (queryError) {
      console.log('Courses query failed, using fallback...');
      const allCourses = await db.collection('courses').get();
      const filteredDocs = filterDocuments(allCourses.docs, [
        { field: 'institutionId', operator: '==', value: req.user.id }
      ]);
      
      filteredDocs.sort((a, b) => {
        const aDate = a.data().createdAt?.toDate?.() || new Date(0);
        const bDate = b.data().createdAt?.toDate?.() || new Date(0);
        return bDate - aDate;
      });
      
      coursesSnapshot = {
        docs: filteredDocs
      };
    }

    const courses = coursesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt
    }));

    console.log(`✅ Found ${courses.length} courses`);
    res.json({ success: true, courses });
  } catch (error) {
    console.error('❌ Error loading courses:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add course
app.post('/api/institution/courses', authenticateToken, requireRole(['institution']), async (req, res) => {
  try {
    const { name, description, facultyId, requirements, duration, seats } = req.body;

    console.log('📝 Adding course for institution:', req.user.id, { name, facultyId });

    if (!name || !description || !facultyId || !requirements || !duration || !seats) {
      return res.status(400).json({ 
        success: false, 
        error: 'All course fields are required' 
      });
    }

    // Verify faculty exists and belongs to institution
    const facultyDoc = await db.collection('faculties').doc(facultyId).get();
    if (!facultyDoc.exists || facultyDoc.data().institutionId !== req.user.id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid faculty selected' 
      });
    }

    const courseRef = db.collection('courses').doc();
    const courseData = removeUndefinedValues({
      id: courseRef.id,
      name,
      description,
      facultyId,
      institutionId: req.user.id,
      requirements,
      duration,
      availableSeats: parseInt(seats),
      totalSeats: parseInt(seats),
      status: 'active',
      createdAt: new Date()
    });

    await courseRef.set(courseData);

    // Add course to institution
    const institutionDoc = await db.collection('institution').doc(req.user.id).get();
    const institutionData = institutionDoc.data();
    await db.collection('institution').doc(req.user.id).update({
      courses: [...(institutionData.courses || []), courseRef.id]
    });

    console.log('✅ Course added successfully:', courseRef.id);
    
    res.status(201).json({ 
      success: true, 
      message: 'Course added successfully', 
      courseId: courseRef.id,
      course: courseData
    });
  } catch (error) {
    console.error('❌ Error adding course:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get institution applications
app.get('/api/institution/applications', authenticateToken, requireRole(['institution']), async (req, res) => {
  try {
    console.log('📋 Fetching applications for institution:', req.user.id);
    
    let applicationsSnapshot;
    
    try {
      applicationsSnapshot = await safeQuery(
        'applications',
        [
          { field: 'institutionId', operator: '==', value: req.user.id },
          { field: 'type', operator: '==', value: 'course' }
        ],
        { field: 'appliedAt', direction: 'desc' }
      );
    } catch (queryError) {
      console.log('Applications query failed, using fallback...');
      const allApplications = await db.collection('applications').get();
      const filteredDocs = filterDocuments(allApplications.docs, [
        { field: 'institutionId', operator: '==', value: req.user.id },
        { field: 'type', operator: '==', value: 'course' }
      ]);
      
      filteredDocs.sort((a, b) => {
        const aDate = a.data().appliedAt?.toDate?.() || new Date(0);
        const bDate = b.data().appliedAt?.toDate?.() || new Date(0);
        return bDate - aDate;
      });
      
      applicationsSnapshot = {
        docs: filteredDocs
      };
    }

    const applications = await Promise.all(
      applicationsSnapshot.docs.map(async doc => {
        const application = doc.data();
        
        // Get student profile
        let studentName = 'Unknown Student';
        let studentEmail = 'No email';
        try {
          const studentUser = await db.collection('users').doc(application.studentId).get();
          if (studentUser.exists) {
            studentName = studentUser.data()?.name || 'Unknown Student';
            studentEmail = studentUser.data()?.email || 'No email';
          }
        } catch (error) {
          console.log('Error fetching student data:', error);
        }
        
        // Get course details
        let courseName = 'Unknown Course';
        try {
          const courseDoc = await db.collection('courses').doc(application.courseId).get();
          if (courseDoc.exists) {
            courseName = courseDoc.data()?.name || 'Unknown Course';
          }
        } catch (error) {
          console.log('Error fetching course data:', error);
        }
        
        return {
          id: doc.id,
          ...application,
          studentName,
          studentEmail,
          courseName,
          appliedAt: application.appliedAt?.toDate?.()?.toISOString() || application.appliedAt,
          updatedAt: application.updatedAt?.toDate?.()?.toISOString() || application.updatedAt
        };
      })
    );

    console.log(`✅ Found ${applications.length} applications`);
    res.json({ success: true, applications });
  } catch (error) {
    console.error('❌ Error loading institution applications:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update application status
app.put('/api/institution/applications/:applicationId', authenticateToken, requireRole(['institution']), async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, notes } = req.body;

    console.log('🔄 Updating application status:', { applicationId, status });

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    // Verify application belongs to institution
    const applicationDoc = await db.collection('applications').doc(applicationId).get();
    if (!applicationDoc.exists) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    const application = applicationDoc.data();
    if (application.institutionId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const updateData = removeUndefinedValues({
      status,
      notes: notes || '',
      updatedAt: new Date()
    });

    // Add timestamps for approval/rejection
    if (status === 'approved') {
      updateData.approvedAt = new Date();
    } else if (status === 'rejected') {
      updateData.rejectedAt = new Date();
    }

    await db.collection('applications').doc(applicationId).update(updateData);

    // Create notification for student
    const notificationData = removeUndefinedValues({
      userId: application.studentId,
      type: 'application_update',
      title: 'Application Status Updated',
      message: `Your application for ${application.courseName} has been ${status}`,
      applicationId: applicationId,
      read: false,
      createdAt: new Date()
    });

    // Try to create notification, but don't fail if index issues
    try {
      await db.collection('notifications').doc().set(notificationData);
    } catch (notificationError) {
      console.log('Notification creation skipped due to index:', notificationError.message);
    }

    console.log('✅ Application status updated successfully');
    res.json({ success: true, message: 'Application status updated successfully' });
  } catch (error) {
    console.error('❌ Error updating application status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Publish admissions (bulk update)
app.post('/api/institution/publish-admissions', authenticateToken, requireRole(['institution']), async (req, res) => {
  try {
    const { applicationIds, status } = req.body;

    console.log('📢 Publishing admissions:', { applicationIds: applicationIds?.length, status });

    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({ success: false, error: 'Application IDs are required' });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status for publishing' });
    }

    const batch = db.batch();
    const timestamp = new Date();

    for (const applicationId of applicationIds) {
      const applicationRef = db.collection('applications').doc(applicationId);
      
      // Verify each application belongs to institution
      const applicationDoc = await applicationRef.get();
      if (applicationDoc.exists && applicationDoc.data().institutionId === req.user.id) {
        const updateData = removeUndefinedValues({
          status,
          updatedAt: timestamp
        });

        if (status === 'approved') {
          updateData.approvedAt = timestamp;
        } else if (status === 'rejected') {
          updateData.rejectedAt = timestamp;
        }

        batch.update(applicationRef, updateData);

        // Create notification for student
        const application = applicationDoc.data();
        const notificationData = removeUndefinedValues({
          userId: application.studentId,
          type: 'application_update',
          title: 'Application Status Updated',
          message: `Your application for ${application.courseName} has been ${status}`,
          applicationId: applicationId,
          read: false,
          createdAt: timestamp
        });

        const notificationRef = db.collection('notifications').doc();
        batch.set(notificationRef, notificationData);
      }
    }

    await batch.commit();

    console.log('✅ Admissions published successfully');
    res.json({ success: true, message: `Admissions published successfully for ${applicationIds.length} applications` });
  } catch (error) {
    console.error('❌ Error publishing admissions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== INSTITUTION NOTIFICATIONS ====================

// Get institution notifications
app.get('/api/institution/notifications', authenticateToken, requireRole(['institution']), async (req, res) => {
  try {
    let notificationsSnapshot;

    try {
      notificationsSnapshot = await safeQuery(
        'notifications',
        [{ field: 'userId', operator: '==', value: req.user.id }],
        { field: 'createdAt', direction: 'desc' },
        50
      );
    } catch (queryError) {
      console.log('Notifications query failed, using fallback...');
      const allNotifications = await db.collection('notifications').get();
      const filteredDocs = filterDocuments(allNotifications.docs, [
        { field: 'userId', operator: '==', value: req.user.id }
      ]);

      filteredDocs.sort((a, b) => {
        const aDate = a.data().createdAt?.toDate?.() || new Date(0);
        const bDate = b.data().createdAt?.toDate?.() || new Date(0);
        return bDate - aDate;
      }).slice(0, 50);

      notificationsSnapshot = {
        docs: filteredDocs
      };
    }

    const notifications = notificationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt
    }));

    res.json({ success: true, notifications });
  } catch (error) {
    console.error('Error loading notifications:', error);
    res.json({ success: true, notifications: [] });
  }
});

// ==================== INSTITUTION STATISTICS ====================

// Get institution statistics
app.get('/api/institution/statistics', authenticateToken, requireRole(['institution']), async (req, res) => {
  try {
    const [coursesSnapshot, applicationsSnapshot, facultiesSnapshot] = await Promise.all([
      db.collection('courses').where('institutionId', '==', req.user.id).get(),
      db.collection('applications').where('institutionId', '==', req.user.id).get(),
      db.collection('faculties').where('institutionId', '==', req.user.id).get()
    ]);

    const statistics = {
      totalCourses: coursesSnapshot.size,
      totalApplications: applicationsSnapshot.size,
      totalFaculties: facultiesSnapshot.size,
      pendingApplications: applicationsSnapshot.docs.filter(doc => doc.data().status === 'pending').length,
      approvedApplications: applicationsSnapshot.docs.filter(doc => doc.data().status === 'approved').length,
      rejectedApplications: applicationsSnapshot.docs.filter(doc => doc.data().status === 'rejected').length,
      availableSeats: coursesSnapshot.docs.reduce((total, doc) => total + (doc.data().availableSeats || 0), 0),
      totalSeats: coursesSnapshot.docs.reduce((total, doc) => total + (doc.data().totalSeats || 0), 0)
    };

    res.json({ success: true, statistics });
  } catch (error) {
    console.error('Error loading statistics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== INSTITUTION COURSE MANAGEMENT ====================

// Update course
app.put('/api/institution/courses/:courseId', authenticateToken, requireRole(['institution']), async (req, res) => {
  try {
    const { courseId } = req.params;
    const updateData = req.body;

    // Verify course belongs to institution
    const courseDoc = await db.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }

    const course = courseDoc.data();
    if (course.institutionId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    await db.collection('courses').doc(courseId).update(removeUndefinedValues({
      ...updateData,
      updatedAt: new Date()
    }));

    res.json({ success: true, message: 'Course updated successfully' });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete course
app.delete('/api/institution/courses/:courseId', authenticateToken, requireRole(['institution']), async (req, res) => {
  try {
    const { courseId } = req.params;

    // Verify course belongs to institution
    const courseDoc = await db.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }

    const course = courseDoc.data();
    if (course.institutionId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Soft delete by updating status
    await db.collection('courses').doc(courseId).update({
      status: 'inactive',
      updatedAt: new Date()
    });

    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== INSTITUTION FACULTY MANAGEMENT ====================

// Update faculty
app.put('/api/institution/faculties/:facultyId', authenticateToken, requireRole(['institution']), async (req, res) => {
  try {
    const { facultyId } = req.params;
    const updateData = req.body;

    // Verify faculty belongs to institution
    const facultyDoc = await db.collection('faculties').doc(facultyId).get();
    if (!facultyDoc.exists) {
      return res.status(404).json({ success: false, error: 'Faculty not found' });
    }

    const faculty = facultyDoc.data();
    if (faculty.institutionId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    await db.collection('faculties').doc(facultyId).update(removeUndefinedValues({
      ...updateData,
      updatedAt: new Date()
    }));

    res.json({ success: true, message: 'Faculty updated successfully' });
  } catch (error) {
    console.error('Error updating faculty:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete faculty
app.delete('/api/institution/faculties/:facultyId', authenticateToken, requireRole(['institution']), async (req, res) => {
  try {
    const { facultyId } = req.params;

    // Verify faculty belongs to institution
    const facultyDoc = await db.collection('faculties').doc(facultyId).get();
    if (!facultyDoc.exists) {
      return res.status(404).json({ success: false, error: 'Faculty not found' });
    }

    const faculty = facultyDoc.data();
    if (faculty.institutionId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Check if faculty has courses
    const coursesSnapshot = await db.collection('courses')
      .where('facultyId', '==', facultyId)
      .where('status', '==', 'active')
      .get();

    if (!coursesSnapshot.empty) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete faculty with active courses. Please reassign or delete courses first.'
      });
    }

    await db.collection('faculties').doc(facultyId).delete();

    // Remove from institution
    const institutionDoc = await db.collection('institution').doc(req.user.id).get();
    const institutionData = institutionDoc.data();
    const updatedFaculties = (institutionData.faculties || []).filter(id => id !== facultyId);
    await db.collection('institution').doc(req.user.id).update({
      faculties: updatedFaculties
    });

    res.json({ success: true, message: 'Faculty deleted successfully' });
  } catch (error) {
    console.error('Error deleting faculty:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== COMPANY MODULE ROUTES ====================

// Get company job postings
app.get('/api/company/jobs', authenticateToken, requireRole(['company']), async (req, res) => {
  try {
    console.log('📋 Fetching jobs for company:', req.user.id);
    
    let jobsSnapshot;
    
    try {
      jobsSnapshot = await safeQuery(
        'job_postings',
        [{ field: 'companyId', operator: '==', value: req.user.id }],
        { field: 'createdAt', direction: 'desc' }
      );
    } catch (queryError) {
      console.log('Jobs query failed, using fallback...');
      const allJobs = await db.collection('job_postings').get();
      const filteredDocs = filterDocuments(allJobs.docs, [
        { field: 'companyId', operator: '==', value: req.user.id }
      ]);
      
      filteredDocs.sort((a, b) => {
        const aDate = a.data().createdAt?.toDate?.() || new Date(0);
        const bDate = b.data().createdAt?.toDate?.() || new Date(0);
        return bDate - aDate;
      });
      
      jobsSnapshot = {
        docs: filteredDocs
      };
    }

    const jobs = jobsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt
    }));

    console.log(`✅ Found ${jobs.length} jobs for company`);
    res.json({ success: true, jobs });
  } catch (error) {
    console.error('❌ Error loading company jobs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create job posting
app.post('/api/company/jobs', authenticateToken, requireRole(['company']), async (req, res) => {
  try {
    const { 
      title, 
      description, 
      requirements, 
      qualifications, 
      skills, 
      deadline, 
      location, 
      salary, 
      jobType,
      requiredEducation,
      experienceLevel 
    } = req.body;

    console.log('💼 Creating job posting for company:', req.user.id, { title });

    if (!title || !description || !location || !salary || !deadline) {
      return res.status(400).json({ 
        success: false, 
        error: 'Title, description, location, salary, and deadline are required' 
      });
    }

    const jobRef = db.collection('job_postings').doc();
    const jobData = removeUndefinedValues({
      id: jobRef.id,
      companyId: req.user.id,
      companyName: req.user.companyName || req.user.name,
      title,
      description,
      requirements: requirements || [],
      qualifications: qualifications || [],
      skills: skills || [],
      deadline,
      location,
      salary,
      jobType: jobType || 'full-time',
      requiredEducation: requiredEducation || '',
      experienceLevel: experienceLevel || 'entry',
      status: 'active',
      applications: 0,
      qualifiedApplications: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await jobRef.set(jobData);

    // Update company profile
    const companyDoc = await db.collection('company_profile').doc(req.user.id).get();
    const companyData = companyDoc.data();
    await db.collection('company_profile').doc(req.user.id).update({
      jobPostings: [...(companyData.jobPostings || []), jobRef.id]
    });

    console.log('✅ Job posting created successfully:', jobRef.id);
    
    res.status(201).json({ 
      success: true, 
      message: 'Job posting created successfully', 
      jobId: jobRef.id,
      job: jobData
    });
  } catch (error) {
    console.error('❌ Error creating job posting:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get company job applications
app.get('/api/company/applications', authenticateToken, requireRole(['company']), async (req, res) => {
  try {
    console.log('📋 Fetching applications for company:', req.user.id);
    
    let applicationsSnapshot;
    
    try {
      applicationsSnapshot = await safeQuery(
        'applications',
        [
          { field: 'companyId', operator: '==', value: req.user.id },
          { field: 'type', operator: '==', value: 'job' }
        ],
        { field: 'appliedAt', direction: 'desc' }
      );
    } catch (queryError) {
      console.log('Applications query failed, using fallback...');
      const allApplications = await db.collection('applications').get();
      const filteredDocs = filterDocuments(allApplications.docs, [
        { field: 'companyId', operator: '==', value: req.user.id },
        { field: 'type', operator: '==', value: 'job' }
      ]);
      
      filteredDocs.sort((a, b) => {
        const aDate = a.data().appliedAt?.toDate?.() || new Date(0);
        const bDate = b.data().appliedAt?.toDate?.() || new Date(0);
        return bDate - aDate;
      });
      
      applicationsSnapshot = {
        docs: filteredDocs
      };
    }

    const applications = await Promise.all(
      applicationsSnapshot.docs.map(async doc => {
        const application = doc.data();
        
        // Get student profile and user data
        const [studentProfile, studentUser] = await Promise.all([
          db.collection('student_profile').doc(application.studentId).get(),
          db.collection('users').doc(application.studentId).get()
        ]);

        // Get student transcripts and certificates
        let transcripts = [];
        let certificates = [];
        
        try {
          if (studentProfile.exists) {
            const profileData = studentProfile.data();
            
            // Get transcripts
            if (profileData.transcripts && Array.isArray(profileData.transcripts)) {
              const transcriptPromises = profileData.transcripts.map(async transcriptId => {
                try {
                  const transcriptDoc = await db.collection('transcripts').doc(transcriptId).get();
                  return transcriptDoc.exists ? { id: transcriptDoc.id, ...transcriptDoc.data() } : null;
                } catch (e) {
                  console.log('Error loading transcript:', e);
                  return null;
                }
              });
              transcripts = (await Promise.all(transcriptPromises)).filter(t => t !== null);
            }
            
            // Get certificates
            if (profileData.certificates && Array.isArray(profileData.certificates)) {
              const certificatePromises = profileData.certificates.map(async certId => {
                try {
                  const certDoc = await db.collection('certificates').doc(certId).get();
                  return certDoc.exists ? { id: certDoc.id, ...certDoc.data() } : null;
                } catch (e) {
                  console.log('Error loading certificate:', e);
                  return null;
                }
              });
              certificates = (await Promise.all(certificatePromises)).filter(c => c !== null);
            }
          }
        } catch (error) {
          console.log('Error loading student qualifications:', error);
        }

        // Calculate score based on qualifications
        let score = 50; // Base score
        
        // Add points for transcripts
        if (transcripts.length > 0) {
          score += Math.min(transcripts.length * 5, 20);
          
          // Add points for good grades
          transcripts.forEach(transcript => {
            if (transcript.grades === 'A' || transcript.grades === 'A+') score += 5;
            if (transcript.gpa >= 3.5) score += 5;
          });
        }
        
        // Add points for certificates
        if (certificates.length > 0) {
          score += Math.min(certificates.length * 3, 15);
        }
        
        // Add points for work experience
        if (studentProfile.exists && studentProfile.data().workExperience) {
          score += 10;
        }
        
        // Cap score at 100
        score = Math.min(score, 100);

        return {
          id: doc.id,
          ...application,
          student: { 
            ...(studentProfile.exists ? studentProfile.data() : {}),
            ...(studentUser.exists ? studentUser.data() : {})
          },
          transcripts,
          certificates,
          score: Math.round(score),
          isQualified: score >= 70,
          appliedAt: application.appliedAt?.toDate?.()?.toISOString() || application.appliedAt,
          updatedAt: application.updatedAt?.toDate?.()?.toISOString() || application.updatedAt
        };
      })
    );

    console.log(`✅ Found ${applications.length} applications for company`);
    res.json({ success: true, applications });
  } catch (error) {
    console.error('❌ Error loading company applications:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update job application status
app.put('/api/company/applications/:applicationId', authenticateToken, requireRole(['company']), async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, notes } = req.body;

    console.log('🔄 Updating application status:', { applicationId, status });

    if (!['approved', 'rejected', 'pending', 'interview', 'hired'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    // Verify application belongs to company
    const applicationDoc = await db.collection('applications').doc(applicationId).get();
    if (!applicationDoc.exists) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    const application = applicationDoc.data();
    if (application.companyId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const updateData = removeUndefinedValues({
      status,
      notes: notes || '',
      updatedAt: new Date()
    });

    await db.collection('applications').doc(applicationId).update(updateData);

    // Create notification for student
    const notificationData = removeUndefinedValues({
      userId: application.studentId,
      type: 'job_application_update',
      title: 'Job Application Update',
      message: `Your application for ${application.jobTitle} has been ${status}`,
      applicationId: applicationId,
      read: false,
      createdAt: new Date()
    });

    // Try to create notification, but don't fail if index issues
    try {
      await db.collection('notifications').doc().set(notificationData);
    } catch (notificationError) {
      console.log('Notification creation skipped due to index:', notificationError.message);
    }

    console.log('✅ Application status updated successfully');
    res.json({ success: true, message: 'Job application status updated successfully' });
  } catch (error) {
    console.error('❌ Error updating job application:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get qualified applicants
app.get('/api/company/qualified-applicants', authenticateToken, requireRole(['company']), async (req, res) => {
  try {
    console.log('🏆 Fetching qualified applicants for company:', req.user.id);
    
    let applicationsSnapshot;
    
    try {
      applicationsSnapshot = await safeQuery(
        'applications',
        [
          { field: 'companyId', operator: '==', value: req.user.id },
          { field: 'type', operator: '==', value: 'job' }
        ],
        { field: 'appliedAt', direction: 'desc' }
      );
    } catch (queryError) {
      console.log('Applications query failed, using fallback...');
      const allApplications = await db.collection('applications').get();
      const filteredDocs = filterDocuments(allApplications.docs, [
        { field: 'companyId', operator: '==', value: req.user.id },
        { field: 'type', operator: '==', value: 'job' }
      ]);
      
      filteredDocs.sort((a, b) => {
        const aDate = a.data().appliedAt?.toDate?.() || new Date(0);
        const bDate = b.data().appliedAt?.toDate?.() || new Date(0);
        return bDate - aDate;
      });
      
      applicationsSnapshot = {
        docs: filteredDocs
      };
    }

    const allApplications = await Promise.all(
      applicationsSnapshot.docs.map(async doc => {
        const application = doc.data();
        
        // Get student data and calculate score (same logic as above)
        const [studentProfile, studentUser] = await Promise.all([
          db.collection('student_profile').doc(application.studentId).get(),
          db.collection('users').doc(application.studentId).get()
        ]);

        // Calculate score (simplified version)
        let score = 50;
        if (studentProfile.exists) {
          const profileData = studentProfile.data();
          if (profileData.transcripts && profileData.transcripts.length > 0) score += 20;
          if (profileData.certificates && profileData.certificates.length > 0) score += 15;
          if (profileData.workExperience) score += 10;
        }
        score = Math.min(score, 100);

        return {
          id: doc.id,
          ...application,
          student: { 
            ...(studentProfile.exists ? studentProfile.data() : {}),
            ...(studentUser.exists ? studentUser.data() : {})
          },
          score: Math.round(score),
          isQualified: score >= 70,
          appliedAt: application.appliedAt?.toDate?.()?.toISOString() || application.appliedAt
        };
      })
    );

    // Filter qualified applicants
    const qualifiedApplications = allApplications.filter(app => app.score >= 70);

    console.log(`✅ Found ${qualifiedApplications.length} qualified applicants out of ${allApplications.length} total`);
    res.json({ success: true, applications: qualifiedApplications });
  } catch (error) {
    console.error('❌ Error loading qualified applicants:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== ADMIN MODULE ROUTES ====================

// Get all institutions (for admin)
app.get('/api/admin/institutions', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const institutionsSnapshot = await db.collection('institution').get();
    const institutions = institutionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    res.json({ success: true, institutions });
  } catch (error) {
    console.error('Error loading institutions for admin:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all companies (for admin)
app.get('/api/admin/companies', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const companiesSnapshot = await db.collection('company_profile').get();
    const companies = companiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    res.json({ success: true, companies });
  } catch (error) {
    console.error('Error loading companies for admin:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all students (for admin)
app.get('/api/admin/students', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const studentsSnapshot = await db.collection('student_profile').get();
    const students = await Promise.all(
      studentsSnapshot.docs.map(async doc => {
        const studentProfile = doc.data();
        const userDoc = await db.collection('users').doc(doc.id).get();
        return {
          id: doc.id,
          ...studentProfile,
          ...userDoc.data()
        };
      })
    );
    
    res.json({ success: true, students });
  } catch (error) {
    console.error('Error loading students for admin:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get system statistics
app.get('/api/admin/statistics', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const [
      studentsSnapshot,
      institutionsSnapshot,
      companiesSnapshot,
      applicationsSnapshot,
      jobPostingsSnapshot,
      coursesSnapshot
    ] = await Promise.all([
      db.collection('users').where('role', '==', 'student').get(),
      db.collection('users').where('role', '==', 'institution').get(),
      db.collection('users').where('role', '==', 'company').get(),
      db.collection('applications').get(),
      db.collection('job_postings').get(),
      db.collection('courses').get()
    ]);

    // Count students by type
    const highSchoolStudents = studentsSnapshot.docs.filter(doc => doc.data().studentType === 'highschool');
    const collegeStudents = studentsSnapshot.docs.filter(doc => doc.data().studentType === 'college');

    const statistics = {
      totalStudents: studentsSnapshot.size,
      highSchoolStudents: highSchoolStudents.length,
      collegeStudents: collegeStudents.length,
      totalInstitutions: institutionsSnapshot.size,
      totalCompanies: companiesSnapshot.size,
      totalApplications: applicationsSnapshot.size,
      totalJobPostings: jobPostingsSnapshot.size,
      totalCourses: coursesSnapshot.size,
      courseApplications: applicationsSnapshot.docs.filter(doc => doc.data().type === 'course').length,
      jobApplications: applicationsSnapshot.docs.filter(doc => doc.data().type === 'job').length
    };

    res.json({ success: true, statistics });
  } catch (error) {
    console.error('Error loading statistics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== PROFILE ROUTES ====================

// Get user profile
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    let profile = null;
    
    if (req.user.role === 'student') {
      const profileDoc = await db.collection('student_profile').doc(req.user.id).get();
      profile = profileDoc.exists ? profileDoc.data() : null;
    } else if (req.user.role === 'institution') {
      const profileDoc = await db.collection('institution').doc(req.user.id).get();
      profile = profileDoc.exists ? profileDoc.data() : null;
    } else if (req.user.role === 'company') {
      const profileDoc = await db.collection('company_profile').doc(req.user.id).get();
      profile = profileDoc.exists ? profileDoc.data() : null;
    }

    res.json({ success: true, profile, user: req.user });
  } catch (error) {
    console.error('Error loading profile:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update user profile
app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const updateData = req.body;

    if (req.user.role === 'student') {
      await db.collection('student_profile').doc(req.user.id).update(removeUndefinedValues({
        ...updateData,
        updatedAt: new Date()
      }));
    } else if (req.user.role === 'institution') {
      await db.collection('institution').doc(req.user.id).update(removeUndefinedValues({
        ...updateData,
        updatedAt: new Date()
      }));
    } else if (req.user.role === 'company') {
      await db.collection('company_profile').doc(req.user.id).update(removeUndefinedValues({
        ...updateData,
        updatedAt: new Date()
      }));
    }

    // Update user document
    const userUpdate = {};
    if (updateData.name) userUpdate.name = updateData.name;
    if (updateData.phone) userUpdate.phone = updateData.phone;
    if (updateData.studentType) userUpdate.studentType = updateData.studentType;
    if (updateData.educationLevel) userUpdate.educationLevel = updateData.educationLevel;
    if (updateData.major) userUpdate.major = updateData.major;

    if (Object.keys(userUpdate).length > 0) {
      await db.collection('users').doc(req.user.id).update(removeUndefinedValues({
        ...userUpdate,
        updatedAt: new Date()
      }));
    }

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== HEALTH AND TEST ROUTES ====================

app.get('/api/health', (req, res) => {
  res.json({ 
    success: true,
    message: 'Server is running!', 
    timestamp: new Date().toISOString(),
    firebase: useMockDB ? 'Mock Database' : 'Connected ✅',
    project: process.env.FIREBASE_PROJECT_ID || 'Not configured',
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 10000
  });
});

app.get('/api/test-db', async (req, res) => {
  try {
    // Test write operation
    const testRef = db.collection('test_connections').doc();
    await testRef.set(removeUndefinedValues({
      test: true,
      message: 'Database connection successful',
      timestamp: new Date()
    }));
    
    // Test read operation
    const snapshot = await testRef.get();
    
    // Clean up
    await testRef.delete();
    
    res.json({ 
      success: true,
      message: 'Database is working!',
      database: useMockDB ? 'Mock Database' : 'Real Firebase',
      write: 'successful',
      read: 'successful',
      cleanup: 'successful'
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Database error: ' + error.message,
      database: useMockDB ? 'Mock Database' : 'Real Firebase'
    });
  }
});

// Initialize sample data
app.post('/api/init-sample-data', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    // Create sample institutions
    const institutions = [
      {
        name: 'National University of Lesotho',
        email: 'admissions@nul.ls',
        phone: '+266 22340601',
        address: 'Roma, Maseru District, Lesotho',
        description: 'The premier institution of higher learning in Lesotho'
      },
      {
        name: 'Limkokwing University of Creative Technology',
        email: 'info@limkokwing.ls',
        phone: '+266 22317242',
        address: 'Maseru, Lesotho',
        description: 'Innovative university focusing on creative technology and design'
      }
    ];

    for (const instData of institutions) {
      const instRef = db.collection('institution').doc();
      await instRef.set(removeUndefinedValues({
        ...instData,
        status: 'active',
        createdAt: new Date()
      }));

      // Create sample courses
      const courses = [
        {
          name: 'Bachelor of Science in Computer Science',
          description: 'Comprehensive computer science degree program',
          requirements: 'LGCSE with credit in Mathematics and English',
          duration: '4 years',
          availableSeats: 50,
          totalSeats: 50
        },
        {
          name: 'Bachelor of Business Administration',
          description: 'Business management and administration degree',
          requirements: 'LGCSE with credit in Mathematics and English',
          duration: '3 years',
          availableSeats: 40,
          totalSeats: 40
        }
      ];

      for (const courseData of courses) {
        const courseRef = db.collection('courses').doc();
        await courseRef.set(removeUndefinedValues({
          ...courseData,
          institutionId: instRef.id,
          status: 'active',
          createdAt: new Date()
        }));
      }
    }

    // Create sample company
    const companyRef = db.collection('company_profile').doc();
    await companyRef.set(removeUndefinedValues({
      name: 'Tech Solutions Lesotho',
      email: 'careers@techsolutions.ls',
      phone: '+266 59548712',
      industry: 'Information Technology',
      description: 'Leading IT solutions provider in Lesotho',
      status: 'active',
      createdAt: new Date()
    }));

    // Create sample job postings
    const jobs = [
      {
        title: 'Junior Software Developer',
        description: 'Looking for fresh graduates with programming skills',
        requirements: ['Bachelor\'s in Computer Science', 'Knowledge of JavaScript', 'Problem-solving skills'],
        qualifications: ['Python', 'Java', 'Web Development'],
        location: 'Maseru',
        salary: 'M8,000 - M12,000',
        jobType: 'full-time',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      },
      {
        title: 'IT Support Specialist',
        description: 'Provide technical support to clients and internal teams',
        requirements: ['Diploma in IT', 'Customer service skills', 'Technical troubleshooting'],
        qualifications: ['Network Administration', 'Hardware Maintenance', 'Communication Skills'],
        location: 'Maseru',
        salary: 'M6,000 - M9,000',
        jobType: 'full-time',
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString() // 45 days from now
      }
    ];

    for (const jobData of jobs) {
      const jobRef = db.collection('job_postings').doc();
      await jobRef.set(removeUndefinedValues({
        ...jobData,
        companyId: companyRef.id,
        status: 'active',
        createdAt: new Date()
      }));
    }

    res.json({ success: true, message: 'Sample data initialized successfully' });
  } catch (error) {
    console.error('Error initializing sample data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Career Guidance Platform API Server',
    version: '1.0.0',
    status: 'Running',
    database: useMockDB ? 'Mock Database' : 'Firebase',
    endpoints: {
      health: '/api/health',
      auth: ['/api/register', '/api/login'],
      student: '/api/student/*',
      institution: '/api/institution/*',
      company: '/api/company/*',
      admin: '/api/admin/*'
    },
    documentation: 'See README for API documentation'
  });
});

// Handle 404 errors
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🗄️  Database test: http://localhost:${PORT}/api/test-db`);
  console.log(`🔐 Authentication endpoints available`);
  console.log(`📊 Database: ${useMockDB ? 'MOCK DATABASE' : 'FIREBASE LIVE'}`);
  console.log(`👨‍🎓 Student endpoints available (High School & College)`);
  console.log(`📋 Comprehensive application endpoint: POST /api/student/apply/course-comprehensive`);
  console.log(`🏫 Institution endpoints available`);
  console.log(`💼 Company endpoints available`);
  console.log(`👨‍💼 Admin endpoints available`);
  console.log(`🌍 Server accessible at: https://group-assignment-2-ypxs.onrender.com`);
});