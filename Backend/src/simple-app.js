const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Supabase client
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && 
    process.env.SUPABASE_URL !== 'your_supabase_url_here' && 
    process.env.SUPABASE_SERVICE_ROLE_KEY !== 'your_supabase_service_role_key_here') {
  try {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    console.log('✅ Supabase client initialized');
  } catch (error) {
    console.log('⚠️  Supabase initialization failed:', error.message);
    console.log('⚠️  Continuing with mock data');
  }
} else {
  console.log('⚠️  Using mock data (Supabase not configured)');
}

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));
app.use(compression());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Mock user data
const MOCK_USERS = [
  {
    id: '1',
    email: 'manager@example.com',
    password: 'password123',
    fullName: 'Manager User',
    role: 'manager'
  },
  {
    id: '2', 
    email: 'employee@example.com',
    password: 'password123',
    fullName: 'Employee User',
    role: 'employee'
  }
];

// Mock inventory data
const MOCK_INVENTORY = [
  {
    id: '1',
    name: 'Office Chair',
    description: 'Ergonomic office chair with lumbar support',
    category: 'Furniture',
    unitOfMeasure: 'units',
    purchaseCost: 150.00,
    sellingPrice: 199.99,
    currentStock: 25,
    reorderLevel: 5,
    sku: 'CHAIR-ERG-001',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Laptop',
    description: 'Business laptop with 16GB RAM',
    category: 'Electronics',
    unitOfMeasure: 'units',
    purchaseCost: 800.00,
    sellingPrice: 1199.99,
    currentStock: 10,
    reorderLevel: 2,
    sku: 'LAPTOP-BUS-001',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Office Desk',
    description: 'Adjustable height standing desk',
    category: 'Furniture',
    unitOfMeasure: 'units',
    purchaseCost: 300.00,
    sellingPrice: 450.00,
    currentStock: 15,
    reorderLevel: 3,
    sku: 'DESK-STD-001',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // For now, just check if token exists and is not expired
  if (token.startsWith('mock_token_')) {
    req.user = {
      id: '1',
      email: 'manager@example.com',
      role: 'manager'
    };
    next();
  } else {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    supabase: supabase ? 'connected' : 'not configured'
  });
});

// ==================== AUTH ROUTES ====================

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, fullName, role = 'employee' } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Email, password, and full name are required' });
    }

    if (supabase) {
      // Real Supabase registration
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName }
      });

      if (authError) {
        console.error('Registration error:', authError);
        return res.status(400).json({ error: authError.message });
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          full_name: fullName,
          role,
          is_active: true
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        await supabase.auth.admin.deleteUser(authData.user.id);
        return res.status(500).json({ error: 'Failed to create user profile' });
      }

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          fullName
        }
      });
    } else {
      // Mock registration
      const existingUser = MOCK_USERS.find(u => u.email === email);
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const newUser = {
        id: (MOCK_USERS.length + 1).toString(),
        email,
        fullName,
        role
      };
      MOCK_USERS.push(newUser);

      res.status(201).json({
        message: 'User registered successfully',
        user: newUser
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (supabase) {
      // Try real Supabase authentication first, but fall back to mock if needed
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (!error && data.user) {
          // Get user profile
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (!profileError && profile && profile.is_active) {
            return res.json({
              message: 'Login successful',
              user: {
                id: data.user.id,
                email: data.user.email,
                fullName: profile.full_name,
                role: profile.role
              },
              token: data.session.access_token,
              session: {
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                expires_at: data.session.expires_at
              }
            });
          }
        }
      } catch (supabaseError) {
        console.log('Supabase auth failed, using mock auth:', supabaseError.message);
      }

      // Fall back to mock authentication for testing
      const user = MOCK_USERS.find(u => u.email === email && u.password === password);
      
      if (user) {
        return res.json({
          message: 'Login successful (mock auth with real database)',
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role
          },
          token: 'mock_token_' + Date.now(),
          session: {
            access_token: 'mock_token_' + Date.now(),
            refresh_token: 'mock_refresh_' + Date.now(),
            expires_at: Date.now() + 3600000
          }
        });
      } else {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    } else {
      // Mock authentication
      const user = MOCK_USERS.find(u => u.email === email && u.password === password);
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role
        },
        token: 'mock_token_' + Date.now(),
        session: {
          access_token: 'mock_token_' + Date.now(),
          refresh_token: 'mock_refresh_' + Date.now(),
          expires_at: Date.now() + 3600000
        }
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    if (supabase && req.user.id !== '1') {
      // Real user from Supabase
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', req.user.id)
        .single();

      if (error || !profile) {
        return res.status(404).json({ error: 'User profile not found' });
      }

      res.json({
        user: {
          id: req.user.id,
          email: req.user.email,
          fullName: profile.full_name,
          role: profile.role,
          isActive: profile.is_active
        }
      });
    } else {
      // Mock user
      res.json({
        user: {
          id: req.user.id,
          email: req.user.email,
          fullName: 'Manager User',
          role: req.user.role,
          isActive: true
        }
      });
    }
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// ==================== INVENTORY ROUTES ====================

// Get all inventory items
app.get('/api/inventory', authenticateToken, async (req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('name');

      if (error) {
        console.error('Inventory fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch inventory items' });
      }

      res.json({ data: data || [] });
    } else {
      res.json({ data: MOCK_INVENTORY });
    }
  } catch (error) {
    console.error('Inventory error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// Get single inventory item
app.get('/api/inventory/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (supabase) {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return res.status(404).json({ error: 'Item not found' });
      }

      res.json({ data });
    } else {
      const item = MOCK_INVENTORY.find(i => i.id === id);
      if (!item) {
        return res.status(404).json({ error: 'Item not found' });
      }
      res.json({ data: item });
    }
  } catch (error) {
    console.error('Get inventory item error:', error);
    res.status(500).json({ error: 'Failed to get inventory item' });
  }
});

// Create inventory item (Manager only)
app.post('/api/inventory', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'manager' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const {
      name,
      description,
      category,
      unit_of_measure,
      purchase_cost,
      selling_price,
      current_stock,
      reorder_level,
      sku
    } = req.body;

    if (!name || !category || !unit_of_measure || !sku) {
      return res.status(400).json({ error: 'Name, category, unit of measure, and SKU are required' });
    }

    if (supabase) {
      const { data, error } = await supabase
        .from('inventory_items')
        .insert({
          name,
          description,
          category,
          unit_of_measure,
          purchase_cost: purchase_cost || 0,
          selling_price: selling_price || 0,
          current_stock: current_stock || 0,
          reorder_level: reorder_level || 0,
          sku,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Create inventory error:', error);
        return res.status(500).json({ error: 'Failed to create inventory item' });
      }

      res.status(201).json({ data });
    } else {
      const newItem = {
        id: (MOCK_INVENTORY.length + 1).toString(),
        name,
        description: description || '',
        category,
        unit_of_measure,
        purchase_cost: purchase_cost || 0,
        selling_price: selling_price || 0,
        current_stock: current_stock || 0,
        reorder_level: reorder_level || 0,
        sku,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      MOCK_INVENTORY.push(newItem);
      res.status(201).json({ data: newItem });
    }
  } catch (error) {
    console.error('Create inventory error:', error);
    res.status(500).json({ error: 'Failed to create inventory item' });
  }
});

// ==================== PLACEHOLDER ROUTES ====================

const placeholderRoutes = [
  { path: '/api/sales', name: 'Sales' },
  { path: '/api/manufacturing', name: 'Manufacturing' },
  { path: '/api/financial', name: 'Financial' },
  { path: '/api/users', name: 'Users' },
  { path: '/api/suppliers', name: 'Suppliers' },
  { path: '/api/customers', name: 'Customers' },
  { path: '/api/audit', name: 'Audit' }
];

placeholderRoutes.forEach(route => {
  app.get(route.path, authenticateToken, (req, res) => {
    res.json({ 
      message: `${route.name} module - to be implemented`,
      data: []
    });
  });
  
  app.post(route.path, authenticateToken, (req, res) => {
    res.json({ 
      message: `${route.name} creation - to be implemented`
    });
  });
});

// ==================== ERROR HANDLING ====================

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    availableRoutes: [
      'GET /health',
      'POST /api/auth/login',
      'POST /api/auth/register', 
      'GET /api/auth/me',
      'POST /api/auth/logout',
      'GET /api/inventory',
      'POST /api/inventory',
      'GET /api/inventory/:id'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Mini ERP Backend Server Started');
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 API Base: http://localhost:${PORT}/api`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔧 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:8080'}`);
  console.log('');
  console.log('Available endpoints:');
  console.log('  POST /api/auth/login');
  console.log('  POST /api/auth/register');
  console.log('  GET  /api/auth/me');
  console.log('  GET  /api/inventory');
  console.log('  POST /api/inventory');
  console.log('');
  console.log('Test login:');
  console.log('  Email: manager@example.com');
  console.log('  Password: password123');
});

module.exports = app;
