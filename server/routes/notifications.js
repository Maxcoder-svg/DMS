const express = require('express');
const authMiddleware = require('../middleware/auth');

function createNotificationRoutes(notificationService) {
  const router = express.Router();

  // Apply auth middleware to all routes
  router.use(authMiddleware);

  // Test SMS notification
  router.post('/test/sms', async (req, res) => {
    try {
      const { phoneNumber, message } = req.body;

      if (!phoneNumber || !message) {
        return res.status(400).json({
          error: 'Phone number and message are required'
        });
      }

      if (!notificationService.isAvailable().sms) {
        return res.status(503).json({
          error: 'SMS service is not available'
        });
      }

      const result = await notificationService.sendSMS(
        phoneNumber, 
        message,
        req.userId
      );

      res.json({
        message: 'SMS sent successfully',
        result
      });

    } catch (error) {
      console.error('SMS test error:', error);
      res.status(500).json({ 
        error: 'Failed to send SMS',
        details: error.message
      });
    }
  });

  // Test push notification
  router.post('/test/push', async (req, res) => {
    try {
      const { firebaseToken, title, body, data = {} } = req.body;

      if (!firebaseToken || !title || !body) {
        return res.status(400).json({
          error: 'Firebase token, title, and body are required'
        });
      }

      if (!notificationService.isAvailable().push) {
        return res.status(503).json({
          error: 'Push notification service is not available'
        });
      }

      const result = await notificationService.sendPushNotification(
        firebaseToken,
        title,
        body,
        data,
        req.userId
      );

      res.json({
        message: 'Push notification sent successfully',
        result
      });

    } catch (error) {
      console.error('Push notification test error:', error);
      res.status(500).json({ 
        error: 'Failed to send push notification',
        details: error.message
      });
    }
  });

  // Get notification service status
  router.get('/status', (req, res) => {
    const availability = notificationService.isAvailable();
    
    res.json({
      services: {
        sms: {
          available: availability.sms,
          provider: 'Twilio'
        },
        push: {
          available: availability.push,
          provider: 'Firebase Cloud Messaging'
        }
      },
      configured: availability.sms || availability.push
    });
  });

  return router;
}

module.exports = createNotificationRoutes;