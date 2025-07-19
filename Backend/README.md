# Mini ERP System - Backend API

Express.js backend API for the Mini ERP System with Supabase authentication and database.

## Setup Instructions

### 1. Environment Configuration
1. Copy `.env.example` to `.env`
2. Fill in your Supabase configuration:
   ```
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   SUPABASE_JWT_SECRET=your_jwt_secret
   ```

### 2. Database Setup
1. Create a new Supabase project
2. Run the SQL script in `database-schema.sql` in your Supabase SQL editor
3. This will create all tables with proper Row Level Security (RLS) policies

### 3. Install Dependencies
```bash
npm install
```

### 4. Development
```bash
npm run dev
```

### 5. Production Build
```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user profile

### Inventory Management
- `GET /api/inventory` - Get all inventory items
- `GET /api/inventory/:id` - Get single inventory item
- `POST /api/inventory` - Create new inventory item (Manager only)
- `PUT /api/inventory/:id` - Update inventory item (Manager only)
- `DELETE /api/inventory/:id` - Delete inventory item (Manager only)
- `PATCH /api/inventory/:id/stock` - Update stock level (Manager only)
- `GET /api/inventory/alerts/low-stock` - Get low stock alerts

### Other Modules
- `/api/sales` - Sales management (to be implemented)
- `/api/manufacturing` - Manufacturing management (to be implemented)
- `/api/financial` - Financial transactions (to be implemented)
- `/api/users` - User management (to be implemented)
- `/api/suppliers` - Supplier management (to be implemented)
- `/api/customers` - Customer management (to be implemented)
- `/api/audit` - Audit logs (to be implemented)

## Security Features

### Authentication & Authorization
- JWT-based authentication with Supabase
- Role-based access control (RBAC)
- Row Level Security (RLS) policies in database
- Token validation on all protected routes

### API Security
- CORS protection
- Rate limiting (100 requests/15 minutes)
- Helmet.js security headers
- Input validation with Joi
- SQL injection prevention

### User Roles
- **Admin**: Full access to all modules
- **Manager**: Full access except user management
- **Employee**: Limited access based on role permissions

## Architecture

```
src/
├── app.ts              # Express app setup
├── config/
│   └── supabase.ts     # Supabase configuration
├── middleware/
│   ├── auth.ts         # Authentication middleware
│   └── errorHandler.ts # Error handling middleware
├── routes/             # API route definitions
│   ├── auth.ts        # Authentication routes
│   ├── inventory.ts   # Inventory management
│   └── ...           # Other module routes
├── services/          # Business logic (to be implemented)
├── utils/
│   └── logger.ts     # Winston logging configuration
└── types/            # TypeScript type definitions
```

## Database Schema

The database uses PostgreSQL with Supabase and includes:
- User profiles with role-based access
- Inventory management
- Sales and purchase orders
- Manufacturing orders
- Financial transactions
- Audit logging
- Row Level Security (RLS) policies

## Error Handling

- Centralized error handling middleware
- Structured logging with Winston
- Development vs production error responses
- Automatic error logging for debugging

## Logging

- Winston-based structured logging
- Separate log files for errors and general logs
- Console logging in development
- Request/response logging with Morgan

## Rate Limiting

- 100 requests per 15-minute window per IP
- Configurable via environment variables
- Applied to all `/api` routes

## Development Notes

1. The TypeScript compilation errors are expected until dependencies are properly installed
2. All routes require proper authentication except `/api/auth/*`
3. RLS policies ensure data isolation based on user roles
4. Use the provided database schema for consistent data structure
5. Error responses include stack traces in development mode only

## Next Steps

1. Complete implementation of remaining route modules
2. Add comprehensive input validation schemas
3. Implement audit logging triggers
4. Add comprehensive test coverage
5. Set up CI/CD pipeline
6. Add API documentation with Swagger/OpenAPI
