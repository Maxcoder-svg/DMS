const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');

function createAuthRoutes(database) {
  const router = express.Router();

  // Register new user
  router.post('/register', async (req, res) => {
    try {
      const { username, email, password, phoneNumber, timezone } = req.body;

      // Validate input
      if (!username || !email || !password) {
        return res.status(400).json({
          error: 'Username, email, and password are required'
        });
      }

      // Check if user already exists
      const existingUser = await database.get(
        'SELECT id FROM users WHERE username = ? OR email = ?',
        [username, email]
      );

      if (existingUser) {
        return res.status(409).json({
          error: 'User with this username or email already exists'
        });
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const result = await database.run(
        `INSERT INTO users (username, email, password_hash, phone_number, timezone)
         VALUES (?, ?, ?, ?, ?)`,
        [username, email, passwordHash, phoneNumber || null, timezone || 'UTC']
      );

      // Generate JWT token
      const token = jwt.sign(
        { userId: result.id, username },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.status(201).json({
        message: 'User created successfully',
        token,
        user: {
          id: result.id,
          username,
          email,
          phoneNumber: phoneNumber || null,
          timezone: timezone || 'UTC'
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Failed to register user' });
    }
  });

  // Login user
  router.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          error: 'Username and password are required'
        });
      }

      // Find user by username or email
      const user = await database.get(
        'SELECT * FROM users WHERE username = ? OR email = ?',
        [username, username]
      );

      if (!user) {
        return res.status(401).json({
          error: 'Invalid credentials'
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Invalid credentials'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phoneNumber: user.phone_number,
          timezone: user.timezone
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Failed to login' });
    }
  });

  // Get current user profile
  router.get('/profile', authMiddleware, async (req, res) => {
    try {
      const user = await database.get(
        'SELECT id, username, email, phone_number, timezone, created_at FROM users WHERE id = ?',
        [req.userId]
      );

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phoneNumber: user.phone_number,
          timezone: user.timezone,
          createdAt: user.created_at
        }
      });

    } catch (error) {
      console.error('Profile fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });

  // Update user profile
  router.put('/profile', authMiddleware, async (req, res) => {
    try {
      const { phoneNumber, timezone, firebaseToken } = req.body;
      
      await database.run(
        `UPDATE users 
         SET phone_number = ?, timezone = ?, firebase_token = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [phoneNumber || null, timezone || 'UTC', firebaseToken || null, req.userId]
      );

      res.json({ message: 'Profile updated successfully' });

    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  // Verify token endpoint
  router.get('/verify', authMiddleware, (req, res) => {
    res.json({ 
      valid: true, 
      userId: req.userId,
      username: req.username 
    });
  });

  return router;
}

module.exports = createAuthRoutes;