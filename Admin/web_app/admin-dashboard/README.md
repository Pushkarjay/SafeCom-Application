# SafeCom Admin Dashboard

A comprehensive web-based admin dashboard for managing the SafeCom CCTV platform. Built with React + TypeScript, Vite, and Zustand for state management.

## Features

- **Dashboard Overview**: Real-time metrics and system status
- **Customers Management**: View, edit, and manage customer accounts
- **Technicians Management**: Assign and monitor technician performance
- **Jobs Management**: Track and manage service jobs across the platform
- **Authentication**: Admin login with role-based access control
- **Responsive Design**: Works seamlessly on desktop and tablet devices

## Tech Stack

- **Frontend Framework**: React 18.2.0
- **Language**: TypeScript 5.2.2
- **Build Tool**: Vite 5.0.8
- **State Management**: Zustand 4.4.1
- **Routing**: React Router DOM 6.20.0
- **HTTP Client**: Axios 1.6.5
- **Charts**: Recharts 2.10.3
- **Date Handling**: Date-fns 2.30.0

## Project Structure

```
admin-dashboard/
├── src/
│   ├── core/               # Core services and utilities
│   │   ├── services/       # Service classes (auth, location, etc.)
│   │   └── theme/          # Theme configuration
│   ├── data/               # Data layer
│   │   ├── datasources/    # API datasources
│   │   ├── models/         # Data models
│   │   ├── repositories/   # Data repositories
│   │   └── auth.store.ts   # Zustand auth store
│   ├── features/           # Feature modules
│   │   ├── auth/           # Authentication screens
│   │   ├── dashboard/      # Dashboard screens
│   │   ├── customers/      # Customer management
│   │   ├── technicians/    # Technician management
│   │   └── jobs/           # Job management
│   ├── routes/             # Route configuration
│   ├── widgets/            # Reusable components
│   │   └── common/         # Common components
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # App entry point
│   └── index.css           # Global styles
├── public/                 # Static assets
├── index.html              # HTML template
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Project dependencies
```

## Getting Started

### Installation

```bash
# Navigate to the admin-dashboard directory
cd admin-dashboard

# Install dependencies
npm install
```

### Development

```bash
# Start development server (opens on http://localhost:3000)
npm run dev
```

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Linting

```bash
# Run ESLint
npm run lint
```

## Demo Credentials

Use these credentials to access the admin dashboard:

- **Email**: admin@safecom.com
- **Password**: admin123

## API Integration

The dashboard currently uses mock API responses from `src/data/datasources/admin_datasource.ts`. To integrate with a real backend:

1. Update the datasource endpoints in `admin_datasource.ts`
2. Replace mock data with real API calls using Axios
3. Update the models to match your backend schema
4. Implement proper error handling and loading states

## Features Overview

### Dashboard
- Real-time metrics showing:
  - Total customers
  - Active technicians
  - Pending jobs
  - Total revenue
  - Completion rate
  - Average response time
- Quick actions for common tasks
- System status indicators

### Customers Management
- List all customers with pagination
- View customer details
- Track customer orders and spending
- Filter by status (active/inactive)
- Edit customer information

### Technicians Management
- View all technicians with performance metrics
- Track technician ratings and job completion
- Manage technician availability status
- Assign new jobs to technicians
- View technician performance statistics

### Jobs Management
- Global job board with all service jobs
- Filter by status (pending, in-progress, completed, cancelled)
- View job details and assigned technician
- Reassign jobs to different technicians
- Track job completion rates

## Authentication Flow

1. User navigates to `/login`
2. Enters admin credentials
3. System validates credentials (mock authentication)
4. On success, stores auth token in localStorage
5. Redirects to dashboard
6. Protected routes check for authentication
7. Logout clears auth token and returns to login

## Styling

The dashboard uses a consistent design system with:

- **Primary Color**: `#0A84FF` (SafeCom Blue)
- **Secondary Color**: `#F5F5F5` (Light Gray)
- **Success Color**: `#34C759` (Green)
- **Warning Color**: `#FF9500` (Orange)
- **Error Color**: `#FF3B30` (Red)
- **Text Primary**: `#1C1C1E` (Dark)
- **Text Secondary**: `#8E8E93` (Gray)

CSS variables are defined in `src/index.css` and can be customized for theming.

## Performance Optimization

- Lazy loading for feature modules
- Memoization of components where needed
- Efficient state management with Zustand
- Image optimization for assets
- Code splitting via Vite

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Future Enhancements

- [ ] Real backend API integration
- [ ] Advanced reporting and analytics
- [ ] Payment tracking and invoicing
- [ ] Customer support ticketing system
- [ ] Performance metrics dashboard
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Mobile app for admin management
- [ ] Real-time notifications
- [ ] Export functionality (PDF, CSV)

## License

All rights reserved © SafeCom Platform
