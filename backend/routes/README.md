# API Routes Structure

This document describes the organized route structure for the Poker Planning API.

## Route Organization

### Authentication Routes (`/api/auth`)
- **POST** `/api/auth/login` - User login
- **POST** `/api/auth/register` - User registration
- **GET** `/api/auth/me` - Get current user
- **POST** `/api/auth/refresh` - Refresh JWT token
- **POST** `/api/auth/logout` - User logout

### User Management Routes (`/api/users`)
- **GET** `/api/users` - Get all users (with pagination, search, filters)
- **GET** `/api/users/:id` - Get user by ID
- **POST** `/api/users` - Create new user (Admin only)
- **PUT** `/api/users/:id` - Update user (Admin only)
- **DELETE** `/api/users/:id` - Delete user (Admin only)

### User Profile Routes (`/api/users/profile`)
- **GET** `/api/users/profile` - Get current user profile
- **PUT** `/api/users/profile` - Update current user profile
- **POST** `/api/users/profile/picture` - Upload profile picture

### User Settings Routes (`/api/users/settings`)
- **GET** `/api/users/settings` - Get user settings
- **PUT** `/api/users/settings` - Update user settings

### Project Routes (`/api/projects`)
- **GET** `/api/projects` - Get all projects (with pagination, search)
- **GET** `/api/projects/:id` - Get project by ID with members
- **POST** `/api/projects` - Create new project
- **PUT** `/api/projects/:id` - Update project
- **DELETE** `/api/projects/:id` - Delete project
- **POST** `/api/projects/:id/members` - Add member to project
- **DELETE** `/api/projects/:id/members/:userId` - Remove member from project

### Poker Planning Routes (`/api/poker-planning`)
- **GET** `/api/poker-planning` - Get all poker planning sessions
- **GET** `/api/poker-planning/my-sessions` - Get user's poker planning sessions
- **GET** `/api/poker-planning/:id` - Get poker planning session by ID
- **POST** `/api/poker-planning` - Create new poker planning session
- **PUT** `/api/poker-planning/:id` - Update poker planning session
- **POST** `/api/poker-planning/:id/start` - Start poker planning session
- **POST** `/api/poker-planning/:id/end` - End poker planning session
- **POST** `/api/poker-planning/join/:roomCode` - Join poker planning session
- **GET** `/api/poker-planning/:id/topics/:topicId/votes` - Get voting results

## File Structure

```
routes/
├── auth/
│   ├── index.js          # Combines all auth routes
│   ├── login.js          # Login endpoint
│   ├── register.js       # Registration endpoint
│   ├── me.js            # Get current user
│   ├── refresh.js       # Token refresh
│   └── logout.js        # Logout endpoint
├── users/
│   ├── index.js          # Combines all user routes
│   ├── crud.js           # User CRUD operations (admin only)
│   ├── profile.js        # Profile management
│   └── settings.js       # User settings
├── projects/
│   └── index.js          # All project routes (CRUD + members)
├── poker-planning/
│   └── index.js          # All poker planning routes (CRUD + sessions + voting)
└── README.md            # This file
```

## Benefits of This Structure

1. **Modularity**: Each route type is in its own directory
2. **Maintainability**: Easy to find and modify specific functionality
3. **Scalability**: Easy to add new route categories
4. **Organization**: Clear separation of concerns
5. **Testing**: Easier to test individual route modules

## Usage

The routes are automatically mounted in `server.js`:

```javascript
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/projects', authenticateToken, projectRoutes);
app.use('/api/poker-planning', authenticateToken, pokerPlanningRoutes);
```

## Adding New Routes

To add new route categories:

1. Create a new directory in `routes/`
2. Create individual route files for each endpoint
3. Create an `index.js` file to combine the routes
4. Import and mount in `server.js` 