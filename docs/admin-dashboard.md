# Admin of the school
The Admin Service provides comprehensive system administration capabilities for managing users, schools, analytics, security, billing, and platform-wide settings.

## Features

### 📊 Dashboard
- Real-time platform metrics
- User growth statistics
- School distribution analytics
- System health monitoring
- Recent activities feed

### 👥 User Management
- Complete user directory
- Role-based user management
- User status tracking (active, inactive, suspended)
- Bulk user operations
- User activity monitoring

### 🏫 School Management
- School directory and listing
- Multi-type school support (public, private, charter)
- School performance metrics
- Student and teacher statistics
- School configuration management

### 📈 Analytics
- Platform usage statistics
- User engagement metrics
- Top pages and features
- Session analytics
- Performance monitoring

### 🔒 Security & Compliance
- Security score dashboard
- Failed login attempt monitoring
- 2FA adoption tracking
- Security alerts and notifications
- Access control management
- API key management
- Audit logs

### 💳 Billing & Accounts
- Revenue tracking and analytics
- Invoice management
- Payment status monitoring
- Revenue trends
- Payment method statistics
- Outstanding payments tracking

### 💬 Communication Center
- Message management
- Platform-wide announcements
- Email system management
- Notification center
- Communication statistics

### ⚙️ Settings
- User management settings
- Security configuration
- school account management
- Billing and subscription, and platform-wide settings
- Notification preferences
- Email/SMTP configuration
- System preferences

## Vision
settings
- Notification preferences
- Email/SMTP configuration
- System preferences

## Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/UI (shared package)
- **State Management**: Zustand
- **Charts**: Recharts
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm 8+

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Run development server
pnpm dev
```

The service will be available at `http://localhost:3003`

### Environment Variables

```env
# Database
DATABASE_URL="libsql://localhost:8080"
DATABASE_AUTH_TOKEN=""

# API Gateway
NEXT_PUBLIC_API_GATEWAY_URL="http://localhost:3000"

# Auth Service
NEXT_PUBLIC_AUTH_SERVICE_URL="http://localhost:3002"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Redis Cache
REDIS_URL="redis://localhost:6379"

# Email Service
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
```

## API Routes

### Users API
- `GET /api/users` - List all users (with filtering by role, status, school)
- `POST /api/users` - Create new user
- `GET /api/users/[id]` - Get user details
- `PATCH /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user

### Schools API
- `GET /api/schools` - List all schools (with filtering by type, status, plan)
- `POST /api/schools` - Create new school
- `GET /api/schools/[id]` - Get school details
- `PATCH /api/schools/[id]` - Update school
- `DELETE /api/schools/[id]` - Delete school

## Docker

### Build Image
```bash
docker build -t growyourneed/admin-service:latest .
```

### Run Container
```bash
docker run -p 3003:3003 \
  -e DATABASE_URL="your-db-url" \
  -e JWT_SECRET="your-secret" \
  growyourneed/admin-service:latest
```

## Development

### Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── dashboard/         # Dashboard pages
│   │   ├── users/         # User management
│   │   ├── schools/       # School management
│   │   ├── analytics/     # Analytics dashboard
│   │   ├── security/      # Security center
│   │   ├── billing/       # Billing management
│   │   ├── communication/ # Communication center
│   │   └── settings/      # Settings
│   └── api/               # API routes
│       ├── users/
│       └── schools/
├── components/            # React components
│   ├── navigation/       # Navigation components
│   └── dashboard/        # Dashboard components
└── lib/                  # Utilities and helpers
```

### Key Components

- **AdminSidebar**: Main navigation sidebar
- **DashboardHeader**: Top header with search and actions
- **UserGrowthChart**: User growth visualization
- **SchoolStatsChart**: School distribution chart
- **RecentActivities**: Activity feed
- **SystemAlerts**: System notifications

## Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage
```

## Building

```bash
# Production build
pnpm build

# Start production server
pnpm start
```

## License

Proprietary - GrowYourNeed Platform
