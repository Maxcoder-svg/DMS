const twilio = require('twilio');
const admin = require('firebase-admin');

class NotificationService {
  constructor() {
    this.twilioClient = null;
    this.firebaseApp = null;
    this.initialize();
  }

  initialize() {
    // Initialize Twilio
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      try {
        this.twilioClient = twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );
        console.log('Twilio client initialized');
      } catch (error) {
        console.error('Failed to initialize Twilio:', error.message);
      }
    } else {
      console.warn('Twilio credentials not provided - SMS notifications disabled');
    }

    // Initialize Firebase
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      try {
        const serviceAccount = {
          type: "service_account",
          project_id: process.env.FIREBASE_PROJECT_ID,
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        };

        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID
        });

        console.log('Firebase client initialized');
      } catch (error) {
        console.error('Failed to initialize Firebase:', error.message);
      }
    } else {
      console.warn('Firebase credentials not provided - Push notifications disabled');
    }
  }

  async sendSMS(phoneNumber, message, userId = null, taskId = null) {
    if (!this.twilioClient) {
      throw new Error('Twilio not initialized');
    }

    try {
      const result = await this.twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });

      return {
        success: true,
        messageId: result.sid,
        status: result.status
      };

    } catch (error) {
      console.error('SMS sending failed:', error);
      throw new Error(`SMS sending failed: ${error.message}`);
    }
  }

  async sendPushNotification(firebaseToken, title, body, data = {}, userId = null, taskId = null) {
    if (!this.firebaseApp) {
      throw new Error('Firebase not initialized');
    }

    try {
      const message = {
        notification: {
          title,
          body
        },
        data: {
          ...data,
          timestamp: new Date().toISOString()
        },
        token: firebaseToken,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        }
      };

      const result = await admin.messaging().send(message);

      return {
        success: true,
        messageId: result
      };

    } catch (error) {
      console.error('Push notification sending failed:', error);
      throw new Error(`Push notification sending failed: ${error.message}`);
    }
  }

  async sendTaskReminder(user, task, checklistItems = []) {
    const messages = [];
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: user.timezone || 'UTC'
    });

    // Create reminder message
    let message = `⏰ Task Reminder (${timeStr})\n\n`;
    message += `📋 ${task.title}\n`;
    
    if (task.description) {
      message += `📝 ${task.description}\n\n`;
    }

    if (checklistItems.length > 0) {
      message += `Today's checklist:\n`;
      checklistItems.forEach((item, index) => {
        const status = item.is_completed ? '✅' : '☐';
        message += `${status} ${index + 1}. ${item.title}\n`;
      });
    }

    // Calculate days remaining
    const endDate = new Date(task.end_date);
    const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    message += `\n📅 ${daysRemaining} days remaining`;

    // Send SMS if phone number is available
    if (user.phone_number && this.twilioClient) {
      try {
        const smsResult = await this.sendSMS(
          user.phone_number,
          message,
          user.id,
          task.id
        );
        messages.push({
          type: 'sms',
          success: true,
          result: smsResult
        });
      } catch (error) {
        messages.push({
          type: 'sms',
          success: false,
          error: error.message
        });
      }
    }

    // Send push notification if Firebase token is available
    if (user.firebase_token && this.firebaseApp) {
      try {
        const pushResult = await this.sendPushNotification(
          user.firebase_token,
          `Task Reminder: ${task.title}`,
          checklistItems.length > 0 
            ? `${checklistItems.length} items to complete today`
            : 'Check your task progress',
          {
            taskId: task.id.toString(),
            type: 'reminder'
          },
          user.id,
          task.id
        );
        messages.push({
          type: 'push',
          success: true,
          result: pushResult
        });
      } catch (error) {
        messages.push({
          type: 'push',
          success: false,
          error: error.message
        });
      }
    }

    return messages;
  }

  async sendTaskCompletion(user, task) {
    const message = `🎉 Congratulations!\n\nYou've completed the task: "${task.title}"\n\nGreat job staying disciplined! 💪`;
    const messages = [];

    // Send SMS
    if (user.phone_number && this.twilioClient) {
      try {
        const smsResult = await this.sendSMS(
          user.phone_number,
          message,
          user.id,
          task.id
        );
        messages.push({
          type: 'sms',
          success: true,
          result: smsResult
        });
      } catch (error) {
        messages.push({
          type: 'sms',
          success: false,
          error: error.message
        });
      }
    }

    // Send push notification
    if (user.firebase_token && this.firebaseApp) {
      try {
        const pushResult = await this.sendPushNotification(
          user.firebase_token,
          'Task Completed! 🎉',
          `Congratulations on completing: ${task.title}`,
          {
            taskId: task.id.toString(),
            type: 'completion'
          },
          user.id,
          task.id
        );
        messages.push({
          type: 'push',
          success: true,
          result: pushResult
        });
      } catch (error) {
        messages.push({
          type: 'push',
          success: false,
          error: error.message
        });
      }
    }

    return messages;
  }

  async sendTaskFailure(user, task) {
    const message = `⚠️ Task Alert\n\nTask "${task.title}" has reached its deadline without completion.\n\nDon't give up! You can restart or create a new task to continue your discipline journey. 💪`;
    const messages = [];

    // Send SMS
    if (user.phone_number && this.twilioClient) {
      try {
        const smsResult = await this.sendSMS(
          user.phone_number,
          message,
          user.id,
          task.id
        );
        messages.push({
          type: 'sms',
          success: true,
          result: smsResult
        });
      } catch (error) {
        messages.push({
          type: 'sms',
          success: false,
          error: error.message
        });
      }
    }

    // Send push notification
    if (user.firebase_token && this.firebaseApp) {
      try {
        const pushResult = await this.sendPushNotification(
          user.firebase_token,
          'Task Deadline Reached ⚠️',
          `Task "${task.title}" needs attention`,
          {
            taskId: task.id.toString(),
            type: 'deadline'
          },
          user.id,
          task.id
        );
        messages.push({
          type: 'push',
          success: true,
          result: pushResult
        });
      } catch (error) {
        messages.push({
          type: 'push',
          success: false,
          error: error.message
        });
      }
    }

    return messages;
  }

  isAvailable() {
    return {
      sms: !!this.twilioClient,
      push: !!this.firebaseApp
    };
  }
}

module.exports = NotificationService;