# DMS - Discipline Management System

This is a comprehensive discipline management system for tracking progress and managing tasks to ensure you stick to your plan. The system features dual notification support with **Twilio SMS** and **Firebase Push Notifications** to help maintain discipline and track progress.

## 🌟 Features

### Core Functionality
- **Task Management**: Create tasks with custom duration (default 98 days for habit formation)
- **Checklist System**: Add multiple checklist items to track daily progress
- **Flexible Scheduling**: Schedule reminders at specific times throughout the day
- **Progress Tracking**: Visual progress charts and completion statistics
- **Task Status Management**: Active, Completed, Failed, and Paused statuses

### Notification System
- **Twilio SMS**: Send SMS reminders and updates to user's phone
- **Firebase Push**: Send push notifications to web/mobile devices
- **Smart Scheduling**: Automatic reminder system based on user-defined schedules
- **Status Notifications**: Completion celebrations and deadline alerts

### User Experience
- **Modern React Frontend**: Clean, responsive UI built with TypeScript
- **Real-time Updates**: Live progress tracking and status updates
- **Mobile-Friendly**: Responsive design that works on all devices
- **Timezone Support**: Proper timezone handling for international users

## 🏗️ Architecture

### Backend (Node.js/Express)
- **Authentication**: JWT-based user authentication
- **Database**: SQLite with comprehensive schema for tasks, users, and progress
- **Scheduling**: Cron-based task reminder system
- **Notifications**: Integrated Twilio SMS and Firebase Cloud Messaging
- **API**: RESTful API with comprehensive error handling

### Frontend (React/TypeScript)
- **Modern Stack**: React 19, TypeScript, React Router
- **State Management**: Context API for authentication
- **UI Components**: Custom components with Lucide icons
- **Responsive Design**: Mobile-first design approach

### Database Schema
- **Users**: Authentication and profile management
- **Tasks**: Task details with duration and status tracking
- **Checklist Items**: Individual task components with completion tracking
- **Daily Schedules**: Flexible reminder scheduling system
- **Task Progress**: Historical progress tracking
- **Notification Logs**: Audit trail for all notifications

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Twilio account (for SMS notifications)
- Firebase project (for push notifications)

### Installation

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd DMS
   npm run install:all
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your credentials:
   ```env
   # Server Configuration
   PORT=3001
   NODE_ENV=development
   JWT_SECRET=your-secure-jwt-secret
   
   # Twilio Configuration
   TWILIO_ACCOUNT_SID=your-twilio-account-sid
   TWILIO_AUTH_TOKEN=your-twilio-auth-token
   TWILIO_PHONE_NUMBER=your-twilio-phone-number
   
   # Firebase Configuration
   FIREBASE_PROJECT_ID=your-firebase-project-id
   FIREBASE_CLIENT_EMAIL=your-firebase-client-email
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
   ```

3. **Start Development**
   ```bash
   # Terminal 1 - Start backend server
   npm run dev:server
   
   # Terminal 2 - Start frontend development server
   npm run dev:client
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

### Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

## 📱 Usage Guide

### Getting Started
1. **Register/Login**: Create an account or sign in
2. **Update Profile**: Add phone number for SMS notifications
3. **Create Your First Task**: Set title, description, and duration
4. **Add Checklist Items**: Break down your task into manageable items
5. **Schedule Reminders**: Set times for daily notifications
6. **Track Progress**: Mark items complete and monitor your discipline

### Task Management
- **Duration**: Default 98 days (research-backed habit formation period)
- **Checklist**: Add as many items as needed for daily tracking
- **Schedules**: Multiple reminder times per day with flexible day-of-week selection
- **Status**: Automatic status updates based on completion and deadlines

### Notifications
- **SMS**: Receive text messages with task reminders and progress updates
- **Push**: Web/mobile push notifications for immediate alerts
- **Testing**: Built-in notification testing interface
- **Logging**: Complete audit trail of all notifications sent

## 🛠️ API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Tasks
- `GET /api/tasks` - List user tasks
- `POST /api/tasks` - Create new task
- `GET /api/tasks/:id` - Get task details
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `PUT /api/tasks/:id/checklist/:itemId` - Update checklist item
- `GET /api/tasks/:id/progress` - Get task progress

### Notifications
- `GET /api/notifications/status` - Check service availability
- `POST /api/notifications/test/sms` - Test SMS functionality
- `POST /api/notifications/test/push` - Test push notifications

## 🔧 Configuration

### Twilio Setup
1. Sign up for Twilio account
2. Get Account SID and Auth Token from console
3. Purchase phone number for sending SMS
4. Add credentials to `.env` file

### Firebase Setup
1. Create Firebase project
2. Enable Firebase Cloud Messaging
3. Generate service account key
4. Add credentials to `.env` file

### Scheduling
- **Reminder Checks**: Run every minute to check for scheduled notifications
- **Daily Updates**: Midnight task status updates and deadline checks
- **Cleanup**: Weekly cleanup of old logs and completed task data

## 🎯 Discipline System

The DMS follows proven principles of habit formation and discipline building:

1. **98-Day Default**: Based on research showing habit formation takes 2-254 days (average 98)
2. **Daily Tracking**: Break large goals into daily, manageable actions
3. **Consistent Reminders**: Multiple touchpoints throughout the day
4. **Progress Visualization**: Clear progress indicators and completion tracking
5. **Failure Recovery**: Support for pausing and restarting tasks without penalty

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For issues and questions:
1. Check the notification testing interface at `/notifications/test`
2. Review server logs for configuration issues
3. Ensure all environment variables are properly set
4. Verify Twilio and Firebase credentials are correct

---

**Start your discipline journey today with DMS!** 💪
