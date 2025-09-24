const express = require('express');
const authMiddleware = require('../middleware/auth');

function createTaskRoutes(database, notificationService) {
  const router = express.Router();

  // Apply auth middleware to all routes
  router.use(authMiddleware);

  // Create a new task
  router.post('/', async (req, res) => {
    try {
      const {
        title,
        description,
        durationDays = 98,
        startDate,
        checklistItems = [],
        schedules = []
      } = req.body;

      if (!title || !startDate) {
        return res.status(400).json({
          error: 'Title and start date are required'
        });
      }

      // Validate duration
      const maxDuration = process.env.MAX_TASK_DURATION_DAYS || 365;
      if (durationDays > maxDuration) {
        return res.status(400).json({
          error: `Task duration cannot exceed ${maxDuration} days`
        });
      }

      // Calculate end date
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(start.getDate() + durationDays);

      // Create the task
      const taskResult = await database.run(
        `INSERT INTO tasks (user_id, title, description, duration_days, start_date, end_date)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [req.userId, title, description, durationDays, startDate, end.toISOString().split('T')[0]]
      );

      const taskId = taskResult.id;

      // Create checklist items
      for (let i = 0; i < checklistItems.length; i++) {
        const item = checklistItems[i];
        await database.run(
          `INSERT INTO checklist_items (task_id, title, description, order_index)
           VALUES (?, ?, ?, ?)`,
          [taskId, item.title, item.description || null, i]
        );
      }

      // Create schedules
      for (const schedule of schedules) {
        await database.run(
          `INSERT INTO daily_schedules (task_id, time, days_of_week)
           VALUES (?, ?, ?)`,
          [taskId, schedule.time, schedule.daysOfWeek || '1,2,3,4,5,6,7']
        );
      }

      // Get complete task data
      const task = await getTaskWithDetails(database, taskId);

      res.status(201).json({
        message: 'Task created successfully',
        task
      });

    } catch (error) {
      console.error('Task creation error:', error);
      res.status(500).json({ error: 'Failed to create task' });
    }
  });

  // Get all user tasks
  router.get('/', async (req, res) => {
    try {
      const { status, page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      let query = 'SELECT * FROM tasks WHERE user_id = ?';
      const params = [req.userId];

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);

      const tasks = await database.all(query, params);

      // Get detailed information for each task
      const tasksWithDetails = await Promise.all(
        tasks.map(task => getTaskWithDetails(database, task.id))
      );

      res.json({
        tasks: tasksWithDetails,
        page: parseInt(page),
        limit: parseInt(limit)
      });

    } catch (error) {
      console.error('Tasks fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  });

  // Get specific task
  router.get('/:taskId', async (req, res) => {
    try {
      const taskId = req.params.taskId;
      const task = await getTaskWithDetails(database, taskId);

      if (!task || task.user_id !== req.userId) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json({ task });

    } catch (error) {
      console.error('Task fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch task' });
    }
  });

  // Update task
  router.put('/:taskId', async (req, res) => {
    try {
      const taskId = req.params.taskId;
      const {
        title,
        description,
        status,
        durationDays,
        startDate
      } = req.body;

      // Verify task ownership
      const existingTask = await database.get(
        'SELECT user_id FROM tasks WHERE id = ?',
        [taskId]
      );

      if (!existingTask || existingTask.user_id !== req.userId) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Build update query dynamically
      const updates = [];
      const params = [];

      if (title !== undefined) {
        updates.push('title = ?');
        params.push(title);
      }
      if (description !== undefined) {
        updates.push('description = ?');
        params.push(description);
      }
      if (status !== undefined) {
        updates.push('status = ?');
        params.push(status);
      }
      if (durationDays !== undefined) {
        updates.push('duration_days = ?');
        params.push(durationDays);
      }
      if (startDate !== undefined) {
        updates.push('start_date = ?');
        params.push(startDate);
        
        // Recalculate end date if start date or duration changes
        const duration = durationDays || existingTask.duration_days;
        const start = new Date(startDate);
        const end = new Date(start);
        end.setDate(start.getDate() + duration);
        updates.push('end_date = ?');
        params.push(end.toISOString().split('T')[0]);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(taskId);

      await database.run(
        `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      const updatedTask = await getTaskWithDetails(database, taskId);
      res.json({
        message: 'Task updated successfully',
        task: updatedTask
      });

    } catch (error) {
      console.error('Task update error:', error);
      res.status(500).json({ error: 'Failed to update task' });
    }
  });

  // Delete task
  router.delete('/:taskId', async (req, res) => {
    try {
      const taskId = req.params.taskId;

      // Verify task ownership
      const existingTask = await database.get(
        'SELECT user_id FROM tasks WHERE id = ?',
        [taskId]
      );

      if (!existingTask || existingTask.user_id !== req.userId) {
        return res.status(404).json({ error: 'Task not found' });
      }

      await database.run('DELETE FROM tasks WHERE id = ?', [taskId]);

      res.json({ message: 'Task deleted successfully' });

    } catch (error) {
      console.error('Task deletion error:', error);
      res.status(500).json({ error: 'Failed to delete task' });
    }
  });

  // Update checklist item completion
  router.put('/:taskId/checklist/:itemId', async (req, res) => {
    try {
      const { taskId, itemId } = req.params;
      const { isCompleted } = req.body;

      // Verify task ownership
      const task = await database.get(
        'SELECT user_id FROM tasks WHERE id = ?',
        [taskId]
      );

      if (!task || task.user_id !== req.userId) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Update checklist item
      await database.run(
        `UPDATE checklist_items 
         SET is_completed = ?, completed_at = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND task_id = ?`,
        [isCompleted, isCompleted ? new Date().toISOString() : null, itemId, taskId]
      );

      // Log progress
      await database.run(
        `INSERT OR REPLACE INTO task_progress 
         (task_id, checklist_item_id, date, is_completed, completed_at)
         VALUES (?, ?, ?, ?, ?)`,
        [
          taskId,
          itemId,
          new Date().toISOString().split('T')[0],
          isCompleted,
          isCompleted ? new Date().toISOString() : null
        ]
      );

      const updatedTask = await getTaskWithDetails(database, taskId);
      res.json({
        message: 'Checklist item updated successfully',
        task: updatedTask
      });

    } catch (error) {
      console.error('Checklist update error:', error);
      res.status(500).json({ error: 'Failed to update checklist item' });
    }
  });

  // Get task progress statistics
  router.get('/:taskId/progress', async (req, res) => {
    try {
      const taskId = req.params.taskId;

      // Verify task ownership
      const task = await database.get(
        'SELECT user_id, start_date, end_date, duration_days FROM tasks WHERE id = ?',
        [taskId]
      );

      if (!task || task.user_id !== req.userId) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Get progress data
      const progressData = await database.all(
        `SELECT date, COUNT(*) as total, 
                SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed
         FROM task_progress 
         WHERE task_id = ?
         GROUP BY date
         ORDER BY date`,
        [taskId]
      );

      // Calculate overall statistics
      const totalDays = task.duration_days;
      const daysPassed = Math.ceil((new Date() - new Date(task.start_date)) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.max(0, totalDays - daysPassed);
      
      const totalTasks = await database.get(
        'SELECT COUNT(*) as count FROM checklist_items WHERE task_id = ?',
        [taskId]
      );

      const completedTasks = await database.get(
        'SELECT COUNT(*) as count FROM checklist_items WHERE task_id = ? AND is_completed = 1',
        [taskId]
      );

      res.json({
        taskId,
        totalDays,
        daysPassed,
        daysRemaining,
        totalTasks: totalTasks.count,
        completedTasks: completedTasks.count,
        completionPercentage: totalTasks.count > 0 
          ? Math.round((completedTasks.count / totalTasks.count) * 100) 
          : 0,
        dailyProgress: progressData
      });

    } catch (error) {
      console.error('Progress fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch progress' });
    }
  });

  return router;
}

// Helper function to get task with all details
async function getTaskWithDetails(database, taskId) {
  const task = await database.get('SELECT * FROM tasks WHERE id = ?', [taskId]);
  
  if (!task) return null;

  const checklistItems = await database.all(
    'SELECT * FROM checklist_items WHERE task_id = ? ORDER BY order_index',
    [taskId]
  );

  const schedules = await database.all(
    'SELECT * FROM daily_schedules WHERE task_id = ? AND is_active = 1',
    [taskId]
  );

  return {
    ...task,
    checklistItems,
    schedules
  };
}

module.exports = createTaskRoutes;