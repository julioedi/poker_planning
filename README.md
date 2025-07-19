# Poker Planning WebApp

A comprehensive real-time poker planning application built with Next.js, Express, WebSocket, and SQLite3.

## 🚀 Features

### 🔐 Authentication & Security
- **JWT Authentication**: Secure token-based authentication
- **Protected Routes**: All dashboard routes require authentication
- **Role-based Access**: Admin, Product Owner, Product Manager, and User roles
- **Super Admin Protection**: User ID 0 is permanently protected as the only super admin
- **Auto-redirect**: Non-authenticated users are redirected to login

### 👤 User Management
- **Profile Pictures**: Upload JPG/WebP images (256x256 minimum, 5MB max)
- **Profile Management**: Edit name, email, and password
- **User Roles**: Admin, Product Owner, Product Manager, User
- **User Status**: Active/Inactive status management
- **Super Admin**: User ID 0 cannot be modified or deleted by other admins

### 📊 Admin Panel
- **Poker Planning List**: View all planning sessions with details
- **Project Management**: Manage projects, POs, PMs, and members
- **User Management**: Manage users, roles, and status
- **Create Planning**: Schedule new poker planning sessions
- **Session Management**: Start, end, and edit planning sessions

### 🎯 Planning Room
- **Real-time Voting**: Live voting with WebSocket updates
- **Topic Management**: Organize topics and subtopics
- **Member Preview**: See all participants and their votes
- **Score Comparison**: Compare results when voting completes
- **Chat System**: Optional chat with emoticons
- **Vote History**: Track all voting rounds
- **Room Codes**: Unique 6-character room codes for easy access

## 🛠 Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Express.js, Socket.IO, Multer (file uploads)
- **Database**: SQLite3
- **Authentication**: JWT with bcrypt password hashing
- **Real-time**: WebSocket with Socket.IO
- **File Upload**: Multer with image validation

## ⚡ Quick Start

1. **Install dependencies**:
   ```bash
   npm run install:all
   ```

2. **Setup database**:
   ```bash
   npm run setup
   ```

3. **Create environment file**:
   Create a `.env` file in the `backend` directory:
   ```env
   PORT=5000
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   DEFAULT_USER_ID=0
   DEFAULT_USER_EMAIL=admin@pokerplanning.com
   DEFAULT_USER_NAME=Admin User
   DEFAULT_USER_PASSWORD=admin123
   NODE_ENV=development
   ```

4. **Start development servers**:
   ```bash
   npm run dev
   ```

5. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

6. **Login with default admin**:
   - Email: `admin@pokerplanning.com`
   - Password: `admin123`

## 🔧 Environment Variables

### Backend (.env)
```env
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
DEFAULT_USER_ID=0
DEFAULT_USER_EMAIL=admin@pokerplanning.com
DEFAULT_USER_NAME=Admin User
DEFAULT_USER_PASSWORD=admin123
NODE_ENV=development
```

## 📁 Project Structure

```
pokerplanning/
├── frontend/                    # Next.js application
│   ├── app/                    # App router pages
│   │   ├── dashboard/          # Protected dashboard routes
│   │   │   ├── profile/        # User profile management
│   │   │   ├── sessions/       # Planning sessions
│   │   │   └── users/          # User management
│   │   └── room/               # Planning room
│   ├── components/             # React components
│   │   ├── auth/               # Authentication components
│   │   └── dashboard/          # Dashboard components
│   └── hooks/                  # Custom React hooks
├── backend/                    # Express.js API server
│   ├── database/               # Database setup and utilities
│   ├── middleware/             # Express middleware
│   ├── routes/                 # API routes
│   ├── socket/                 # WebSocket handlers
│   ├── uploads/                # Profile picture storage
│   └── scripts/                # Database migration scripts
├── package.json                # Root package.json
└── README.md                   # This file
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users` - List all users (Admin only)
- `POST /api/users` - Create new user (Admin only)
- `PUT /api/users/:id` - Update user (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)
- `PUT /api/users/profile` - Update current user profile
- `POST /api/users/profile/picture` - Upload profile picture

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Poker Planning
- `GET /api/poker-planning` - List all planning sessions
- `GET /api/poker-planning/my-sessions` - List user's sessions
- `POST /api/poker-planning` - Create new planning session
- `GET /api/poker-planning/:id` - Get planning details
- `PUT /api/poker-planning/:id` - Update planning session
- `DELETE /api/poker-planning/:id` - Delete planning session
- `POST /api/poker-planning/:id/start` - Start planning session
- `POST /api/poker-planning/:id/end` - End planning session

### Static Files
- `GET /uploads/:filename` - Serve uploaded profile pictures

## 🔒 Security Features

### User ID 0 Protection
- **Super Admin**: User ID 0 is the only super admin
- **Role Protection**: User ID 0 role cannot be changed from 'admin'
- **Modification Protection**: Only user ID 0 can modify user ID 0
- **Deletion Protection**: User ID 0 cannot be deleted

### Authentication Middleware
- **Protected Routes**: All `/dashboard/*` routes require authentication
- **Auto-redirect**: Non-authenticated users redirected to login
- **Token Validation**: JWT tokens validated on each request
- **Role-based Access**: Different permissions based on user roles

### File Upload Security
- **File Type Validation**: Only JPG and WebP images allowed
- **File Size Limits**: Maximum 5MB per file
- **Image Resolution**: Minimum 256x256 pixels required
- **Secure Filenames**: Unique filenames with timestamps
- **Upload Directory**: Files stored in secure uploads directory

## 📡 WebSocket Events

### Client to Server
- `join-room` - Join planning room
- `leave-room` - Leave planning room
- `submit-vote` - Submit vote for topic
- `send-message` - Send chat message
- `start-voting` - Start new voting round
- `accept-votes` - Accept current votes

### Server to Client
- `user-joined` - User joined room
- `user-left` - User left room
- `vote-submitted` - Vote was submitted
- `voting-started` - New voting round started
- `voting-completed` - All votes received
- `votes-accepted` - Votes were accepted
- `new-message` - New chat message

## 🗄 Database Schema

The application uses SQLite3 with the following main tables:

### Core Tables
- `users` - User accounts, roles, and profile pictures
- `projects` - Project information
- `project_members` - Project membership and roles

### Planning Tables
- `poker_planning` - Planning sessions
- `planning_participants` - Session participants
- `topics` - Planning topics and subtopics
- `voting_rounds` - Voting round management
- `votes` - Individual vote records
- `chat_messages` - Chat history

### Profile Pictures
- Profile pictures are stored as files in `/backend/uploads/`
- Database stores filename reference in `users.profile_picture`
- Images served via static file middleware

## 🎨 UI/UX Features

### Profile Management
- **Profile Picture Upload**: Drag & drop or click to upload
- **Image Preview**: Real-time image validation and preview
- **Fallback Avatars**: User initials when no profile picture
- **Responsive Design**: Works on all screen sizes

### Dashboard Protection
- **Loading States**: Smooth loading animations
- **Error Handling**: User-friendly error messages
- **Toast Notifications**: Success and error feedback
- **Auto-redirect**: Seamless authentication flow

## 🚀 Deployment

### Prerequisites
- Node.js 18+ 
- npm or yarn
- SQLite3 (included)

### Production Setup
1. Set `NODE_ENV=production` in environment
2. Use a strong JWT_SECRET
3. Configure proper CORS settings
4. Set up file upload directory permissions
5. Configure reverse proxy for static files

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License. 