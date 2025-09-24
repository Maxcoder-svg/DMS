const cron = require('node-cron');

class TaskScheduler {
  constructor(database, notificationService) {
    this.database = database;
    this.notificationService = notificationService;
    this.scheduledJobs = new Map();
  }

  start() {
    console.log('Starting task scheduler...');
    
    // Schedule task reminder checks every minute
    this.scheduleReminderCheck();
    
    // Schedule daily task status updates at midnight
    this.scheduleDailyStatusUpdate();
    
    // Schedule cleanup of old data weekly
    this.scheduleWeeklyCleanup();
  }

  scheduleReminderCheck() {
    // Run every minute to check for scheduled reminders
    const job = cron.schedule('* * * * *', async () => {
      try {
        await this.checkAndSendReminders();
      } catch (error) {
        console.error('Error in reminder check:', error);
      }
    }, {
      scheduled: false
    });

    job.start();
    this.scheduledJobs.set('reminder_check', job);
    console.log('Reminder check scheduled to run every minute');
  }

  scheduleDailyStatusUpdate() {
    // Run daily at midnight to update task statuses
    const job = cron.schedule('0 0 * * *', async () => {
      try {
        await this.updateTaskStatuses();
      } catch (error) {
        console.error('Error in daily status update:', error);
      }
    }, {
      scheduled: false
    });

    job.start();
    this.scheduledJobs.set('daily_status', job);
    console.log('Daily status update scheduled for midnight');
  }

  scheduleWeeklyCleanup() {
    // Run weekly on Sunday at 2 AM to clean up old data
    const job = cron.schedule('0 2 * * 0', async () => {
      try {
        await this.cleanupOldData();
      } catch (error) {
        console.error('Error in weekly cleanup:', error);
      }
    }, {
      scheduled: false
    });

    job.start();
    this.scheduledJobs.set('weekly_cleanup', job);
    console.log('Weekly cleanup scheduled for Sundays at 2 AM');
  }

  async checkAndSendReminders() {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    const currentDayOfWeek = now.getDay() === 0 ? 7 : now.getDay(); // Convert Sunday from 0 to 7

    try {
      // Get all active schedules that should trigger now
      const schedules = await this.database.all(`
        SELECT s.*, t.id as task_id, t.title, t.description, t.user_id, t.end_date,
               u.username, u.email, u.phone_number, u.firebase_token, u.timezone
        FROM daily_schedules s
        JOIN tasks t ON s.task_id = t.id
        JOIN users u ON t.user_id = u.id
        WHERE s.is_active = 1 
        AND t.status = 'active'
        AND s.time = ?
        AND (',' || s.days_of_week || ',') LIKE '%,' || ? || ',%'
        AND t.end_date >= ?
      `, [currentTime, currentDayOfWeek, now.toISOString().split('T')[0]]);

      for (const schedule of schedules) {
        await this.sendTaskReminder(schedule);
      }

      if (schedules.length > 0) {
        console.log(`Sent ${schedules.length} task reminders at ${currentTime}`);
      }

    } catch (error) {
      console.error('Error checking reminders:', error);
    }
  }

  async sendTaskReminder(schedule) {
    try {
      // Get checklist items for the task
      const checklistItems = await this.database.all(
        'SELECT * FROM checklist_items WHERE task_id = ? ORDER BY order_index',
        [schedule.task_id]
      );

      // Get incomplete items for today
      const today = new Date().toISOString().split('T')[0];
      const incompleteItems = [];

      for (const item of checklistItems) {
        const progress = await this.database.get(
          'SELECT is_completed FROM task_progress WHERE task_id = ? AND checklist_item_id = ? AND date = ?',
          [schedule.task_id, item.id, today]
        );

        if (!progress || !progress.is_completed) {
          incompleteItems.push(item);
        }
      }

      // Prepare user and task data
      const user = {
        id: schedule.user_id,
        username: schedule.username,
        email: schedule.email,
        phone_number: schedule.phone_number,
        firebase_token: schedule.firebase_token,
        timezone: schedule.timezone
      };

      const task = {
        id: schedule.task_id,
        title: schedule.title,
        description: schedule.description,
        end_date: schedule.end_date
      };

      // Send reminder
      const results = await this.notificationService.sendTaskReminder(
        user,
        task,
        incompleteItems
      );

      // Log notification results
      for (const result of results) {
        await this.logNotification(
          user.id,
          task.id,
          result.type,
          result.success,
          result.error
        );
      }

    } catch (error) {
      console.error('Error sending task reminder:', error);
    }
  }

  async updateTaskStatuses() {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Find tasks that have passed their end date
      const expiredTasks = await this.database.all(`
        SELECT t.*, u.username, u.email, u.phone_number, u.firebase_token, u.timezone
        FROM tasks t
        JOIN users u ON t.user_id = u.id
        WHERE t.status = 'active' 
        AND t.end_date < ?
      `, [today]);

      for (const task of expiredTasks) {
        // Check if all checklist items are completed
        const totalItems = await this.database.get(
          'SELECT COUNT(*) as count FROM checklist_items WHERE task_id = ?',
          [task.id]
        );

        const completedItems = await this.database.get(
          'SELECT COUNT(*) as count FROM checklist_items WHERE task_id = ? AND is_completed = 1',
          [task.id]
        );

        const isFullyCompleted = totalItems.count > 0 && totalItems.count === completedItems.count;
        const newStatus = isFullyCompleted ? 'completed' : 'failed';

        // Update task status
        await this.database.run(
          'UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [newStatus, task.id]
        );

        // Send appropriate notification
        const user = {
          id: task.user_id,
          username: task.username,
          email: task.email,
          phone_number: task.phone_number,
          firebase_token: task.firebase_token,
          timezone: task.timezone
        };

        const taskData = {
          id: task.id,
          title: task.title,
          description: task.description,
          end_date: task.end_date
        };

        let results;
        if (isFullyCompleted) {
          results = await this.notificationService.sendTaskCompletion(user, taskData);
        } else {
          results = await this.notificationService.sendTaskFailure(user, taskData);
        }

        // Log notifications
        for (const result of results) {
          await this.logNotification(
            user.id,
            task.id,
            result.type,
            result.success,
            result.error
          );
        }
      }

      if (expiredTasks.length > 0) {
        console.log(`Updated status for ${expiredTasks.length} expired tasks`);
      }

    } catch (error) {
      console.error('Error updating task statuses:', error);
    }
  }

  async cleanupOldData() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0];

      // Clean up old notification logs
      const notificationCleanup = await this.database.run(
        'DELETE FROM notification_logs WHERE sent_at < ?',
        [cutoffDate]
      );

      // Clean up old task progress entries for completed/failed tasks
      const progressCleanup = await this.database.run(`
        DELETE FROM task_progress 
        WHERE date < ? 
        AND task_id IN (
          SELECT id FROM tasks WHERE status IN ('completed', 'failed')
        )
      `, [cutoffDate]);

      console.log(`Cleanup completed: ${notificationCleanup.changes} notification logs, ${progressCleanup.changes} progress entries removed`);

    } catch (error) {
      console.error('Error in cleanup:', error);
    }
  }

  async logNotification(userId, taskId, type, success, errorMessage = null) {
    try {
      await this.database.run(`
        INSERT INTO notification_logs (user_id, task_id, type, message, status, error_message)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        userId,
        taskId,
        type,
        success ? 'Notification sent' : 'Notification failed',
        success ? 'sent' : 'failed',
        errorMessage
      ]);
    } catch (error) {
      console.error('Error logging notification:', error);
    }
  }

  stop() {
    console.log('Stopping task scheduler...');
    for (const [name, job] of this.scheduledJobs) {
      job.destroy();
      console.log(`Stopped ${name} job`);
    }
    this.scheduledJobs.clear();
  }
}

module.exports = TaskScheduler;