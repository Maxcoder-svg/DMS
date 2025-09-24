const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const Database = require('./database');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const notificationRoutes = require('./routes/notifications');
const NotificationService = require('./services/NotificationService');
const TaskScheduler = require('./services/TaskScheduler');

class DMSServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3001;
    this.db = null;
    this.notificationService = null;
    this.taskScheduler = null;
  }

  async initialize() {
    // Initialize database
    this.db = new Database();
    await this.db.initialize();

    // Initialize services
    this.notificationService = new NotificationService();
    this.taskScheduler = new TaskScheduler(this.db, this.notificationService);

    // Setup middleware
    this.setupMiddleware();
    
    // Setup routes
    this.setupRoutes();

    // Start task scheduler
    this.taskScheduler.start();
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS middleware
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://yourdomain.com'] 
        : ['http://localhost:3000'],
      credentials: true
    }));

    // Logging middleware
    this.app.use(morgan('combined'));

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Serve static files
    this.app.use(express.static(path.join(__dirname, '../client/build')));
  }

  setupRoutes() {
    // API routes
    this.app.use('/api/auth', authRoutes(this.db));
    this.app.use('/api/tasks', taskRoutes(this.db, this.notificationService));
    this.app.use('/api/notifications', notificationRoutes(this.notificationService));

    // Health check
    this.app.get('/api/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // Serve React app for all other routes
    this.app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../client/build/index.html'));
    });

    // Error handling middleware
    this.app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
      });
    });
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`DMS Server running on port ${this.port}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  }
}

// Start the server
async function startServer() {
  try {
    const server = new DMSServer();
    await server.initialize();
    server.start();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();