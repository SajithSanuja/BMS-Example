# Mini ERP System - Complete Project Setup

This project has been restructured according to the recommended architecture with a React frontend and Express.js backend using Supabase as the database.

## Project Structure

```
BMS/
├── Backend/                    # Express.js API Server
│   ├── src/
│   │   ├── app.ts             # Main application file
│   │   ├── config/            # Configuration files
│   │   ├── middleware/        # Auth, error handling
│   │   ├── routes/            # API route definitions
│   │   ├── services/          # Business logic
│   │   └── utils/             # Utility functions
│   ├── database-schema.sql    # Database schema with RLS
│   ├── package.json
│   └── README.md
│
└── Frontend/              # React Frontend (Vite)
    ├── src/
    │   ├── components/        # UI Components (preserved)
    │   ├── pages/            # Route components (preserved)
    │   ├── store/            # Redux Toolkit store
    │   │   ├── api/          # RTK Query API slices
    │   │   └── slices/       # Redux slices
    │   ├── contexts/         # React contexts
    │   ├── hooks/            # Custom hooks (preserved)
    │   ├── types/            # TypeScript types (preserved)
    │   └── utils/            # Utility functions (preserved)
    ├── package.json
    └── README.md
```

## Architecture Overview

### Frontend (React + TypeScript + Vite)
- **State Management**: Redux Toolkit with RTK Query
- **Authentication**: Supabase Auth via backend API
- **UI Components**: shadcn/ui (preserved)
- **Styling**: Tailwind CSS (preserved)
- **Form Handling**: React Hook Form + Zod (preserved)
- **HTTP Client**: RTK Query with axios fallback
- **Real-time**: Supabase real-time subscriptions

### Backend (Node.js + Express.js)
- **Authentication**: Supabase JWT validation
- **Authorization**: Role-based access control (RBAC)
- **Input Validation**: Joi schemas
- **Security**: Helmet, CORS, Rate limiting
- **Logging**: Winston structured logging
- **Error Handling**: Centralized middleware
- **Database**: Supabase with Row Level Security (RLS)

### Database (Supabase PostgreSQL)
- **Authentication**: Built-in user management
- **Row Level Security**: Enforced on all tables
- **Real-time**: WebSocket connections
- **Backup**: Automated daily backups

## Setup Instructions

### 1. Database Setup (Supabase)

1. **Create a new Supabase project**:
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note down your project URL and keys

2. **Run the database schema**:
   - Open your Supabase SQL editor
   - Copy and run the contents of `Backend/database-schema.sql`
   - This creates all tables with proper RLS policies

3. **Configure environment variables**:
   - Backend: Copy `Backend/.env.example` to `Backend/.env`
   - Frontend: Copy `Frontend/.env.example` to `Frontend/.env`
   - Fill in your Supabase credentials

### 2. Backend Setup

```bash
cd Backend
npm install
cp .env.example .env
# Edit .env with your Supabase credentials
npm run dev
```

The backend will start on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd Frontend
npm install
cp .env.example .env
# Edit .env if needed (API proxy is already configured)
npm run dev
```

The frontend will start on `http://localhost:8080`

### 4. Create Initial User

Since the authentication now goes through the backend, you'll need to create users via the API:

**Option A: Use API directly**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@example.com",
    "password": "password123",
    "fullName": "Manager User",
    "role": "manager"
  }'
```

**Option B: Create via Supabase Auth Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to Authentication > Users
3. Create a new user
4. The user profile will be created automatically via database triggers

## Key Changes Made

### Frontend Changes
1. **Added Redux Toolkit**: State management with RTK Query for API calls
2. **Updated Authentication**: Now uses backend API instead of mock data
3. **API Integration**: All data fetching goes through RTK Query
4. **Environment Config**: Added proper environment variable handling
5. **Preserved UI**: All existing components and styling maintained

### Backend Created
1. **Express.js API**: Complete REST API with proper authentication
2. **Supabase Integration**: JWT validation and database operations
3. **Security Features**: Rate limiting, CORS, helmet, input validation
4. **Role-based Access**: Manager, Employee, Admin roles with proper permissions
5. **Error Handling**: Centralized error management with logging

### Database Schema
1. **Row Level Security**: All tables have proper RLS policies
2. **User Roles**: Manager, Employee, Admin with different access levels
3. **Audit Logging**: System for tracking all data changes
4. **Performance**: Proper indexes and optimized queries

## Default Test Users

After setting up, you can create test users with these roles:

**Manager** (Full access):
- Email: manager@example.com
- Password: password123
- Role: manager

**Employee** (Limited access):
- Email: employee@example.com  
- Password: password123
- Role: employee

## Development Workflow

1. **Start Backend**: `cd Backend && npm run dev`
2. **Start Frontend**: `cd Frontend && npm run dev`
3. **Access Application**: `http://localhost:8080`
4. **API Documentation**: `http://localhost:5000/health` (health check)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user  
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Inventory (Implemented)
- `GET /api/inventory` - Get all inventory items
- `POST /api/inventory` - Create inventory item (Manager only)
- `PUT /api/inventory/:id` - Update inventory item (Manager only)
- `DELETE /api/inventory/:id` - Delete inventory item (Manager only)
- `PATCH /api/inventory/:id/stock` - Update stock levels (Manager only)

### Other Modules (To be implemented)
- `/api/sales` - Sales management
- `/api/manufacturing` - Manufacturing management
- `/api/financial` - Financial transactions
- `/api/users` - User management
- `/api/suppliers` - Supplier management
- `/api/customers` - Customer management

## Security Features

1. **JWT Authentication**: Secure token-based authentication
2. **Role-based Access**: Different permissions for different user roles
3. **Row Level Security**: Database-level security policies
4. **Rate Limiting**: 100 requests per 15 minutes
5. **Input Validation**: All inputs validated and sanitized
6. **CORS Protection**: Configured for frontend domain
7. **Security Headers**: Helmet.js for additional security

## Next Steps

1. **Complete API Implementation**: Implement remaining module APIs
2. **Add Comprehensive Tests**: Unit and integration tests
3. **Implement Audit Logging**: Complete audit trail system
4. **Add File Upload**: Document and image upload functionality
5. **Real-time Features**: Live updates for inventory and orders
6. **Performance Optimization**: Caching and query optimization
7. **Deployment**: Docker containerization and CI/CD pipeline

## Troubleshooting

### Common Issues

1. **TypeScript Errors**: Run `npm install` in both frontend and backend
2. **API Connection**: Ensure backend is running on port 5000
3. **Database Errors**: Check Supabase credentials in `.env` files
4. **Authentication Issues**: Verify JWT tokens and user permissions

### Logs
- Backend logs: Check console output or `Backend/logs/` directory
- Frontend logs: Check browser console
- Database logs: Check Supabase dashboard

## Migration from Old System

The old mock authentication system has been replaced with real Supabase authentication. All UI components and functionality have been preserved, but now work with the new backend architecture.

Key differences:
1. Login now requires real email/password from Supabase
2. All data comes from PostgreSQL database instead of local storage
3. Real-time updates available through Supabase subscriptions
4. Proper role-based access control enforced at database level
