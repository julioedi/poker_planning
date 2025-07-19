# Poker Planning WebApp

A comprehensive real-time poker planning application built with Next.js, Express, WebSocket, and SQLite3.

## Features

### Admin Panel
- **Poker Planning List**: View all planning sessions with details
- **Project Management**: Manage projects, POs, PMs, and members
- **User Management**: Manage users, roles, and status
- **Create Planning**: Schedule new poker planning sessions

### Planning Room
- **Real-time Voting**: Live voting with WebSocket updates
- **Topic Management**: Organize topics and subtopics
- **Member Preview**: See all participants and their votes
- **Score Comparison**: Compare results when voting completes
- **Chat System**: Optional chat with emoticons
- **Vote History**: Track all voting rounds

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Express.js, Socket.IO
- **Database**: SQLite3
- **Authentication**: JWT
- **Real-time**: WebSocket with Socket.IO

## Quick Start

1. **Install dependencies**:
   ```bash
   npm run install:all
   ```

2. **Setup database**:
   ```bash
   npm run setup
   ```

3. **Start development servers**:
   ```bash
   npm run dev
   ```

4. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

## Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=5000
JWT_SECRET=your-secret-key
DEFAULT_USER_ID=0
DEFAULT_USER_EMAIL=admin@pokerplanning.com
DEFAULT_USER_NAME=Admin User
DEFAULT_USER_PASSWORD=admin123
```

## Project Structure

```
pokerplanning/
├── frontend/          # Next.js application
├── backend/           # Express.js API server
├── package.json       # Root package.json
└── README.md         # This file
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Poker Planning
- `GET /api/poker-planning` - List all planning sessions
- `POST /api/poker-planning` - Create new planning session
- `GET /api/poker-planning/:id` - Get planning details
- `PUT /api/poker-planning/:id` - Update planning session

### Users
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user

## WebSocket Events

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

## Database Schema

The application uses SQLite3 with the following main tables:
- `users` - User accounts and roles
- `projects` - Project information
- `project_members` - Project membership
- `poker_planning` - Planning sessions
- `topics` - Planning topics
- `votes` - Voting records
- `chat_messages` - Chat history 