const { collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc } = require('firebase/firestore');
const { db } = require('../services/firebase');
const twilioService = require('../services/twilio');
const securityService = require('../services/security');
const { Task, DisciplineGoal } = require('../models');

class DMSController {
  constructor() {
    this.tasksCollection = 'tasks';
    this.goalsCollection = 'goals';
  }

  // Task Management
  async createTask(taskData) {
    try {
      const task = new Task(
        null, // ID will be set by Firestore
        taskData.title,
        taskData.description,
        taskData.dueDate,
        taskData.completed || false,
        taskData.priority || 'medium'
      );

      // Encrypt sensitive task data if needed
      if (taskData.sensitive) {
        const encrypted = securityService.encrypt(task.description);
        task.description = encrypted.encrypted;
        task.encryptionIv = encrypted.iv;
      }

      const docRef = await addDoc(collection(db, this.tasksCollection), {
        ...task,
        id: null // Let Firestore generate the ID
      });

      console.log('Task created with ID:', docRef.id);
      
      // Send SMS notification for high priority tasks
      if (task.priority === 'high') {
        await twilioService.sendTaskReminder(task);
      }

      return { ...task, id: docRef.id };
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  async getTasks() {
    try {
      const querySnapshot = await getDocs(collection(db, this.tasksCollection));
      const tasks = [];

      querySnapshot.forEach((doc) => {
        const taskData = { id: doc.id, ...doc.data() };
        
        // Decrypt sensitive data if needed
        if (taskData.encryptionIv) {
          try {
            taskData.description = securityService.decrypt(taskData.description, taskData.encryptionIv);
          } catch (error) {
            console.error('Error decrypting task:', error);
          }
        }
        
        tasks.push(taskData);
      });

      return tasks;
    } catch (error) {
      console.error('Error getting tasks:', error);
      throw error;
    }
  }

  async completeTask(taskId) {
    try {
      const taskRef = doc(db, this.tasksCollection, taskId);
      await updateDoc(taskRef, {
        completed: true,
        updatedAt: new Date()
      });

      console.log('Task completed:', taskId);
      
      // Check overall progress and send update
      const allTasks = await this.getTasks();
      const completedTasks = allTasks.filter(task => task.completed).length;
      const progressPercentage = Math.round((completedTasks / allTasks.length) * 100);
      
      if (progressPercentage > 0 && progressPercentage % 25 === 0) {
        await twilioService.sendProgressUpdate(progressPercentage);
      }

      return { success: true, taskId, progressPercentage };
    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    }
  }

  // Goal Management
  async createGoal(goalData) {
    try {
      const goal = new DisciplineGoal(
        null,
        goalData.title,
        goalData.description,
        goalData.targetDate,
        goalData.progress || 0
      );

      const docRef = await addDoc(collection(db, this.goalsCollection), {
        ...goal,
        id: null
      });

      console.log('Goal created with ID:', docRef.id);
      
      // Send SMS notification for new goals
      const message = `New discipline goal set: ${goal.title}. Target date: ${goal.targetDate}. Stay focused!`;
      await twilioService.sendSMS(message);

      return { ...goal, id: docRef.id };
    } catch (error) {
      console.error('Error creating goal:', error);
      throw error;
    }
  }

  async getGoals() {
    try {
      const querySnapshot = await getDocs(collection(db, this.goalsCollection));
      const goals = [];

      querySnapshot.forEach((doc) => {
        goals.push({ id: doc.id, ...doc.data() });
      });

      return goals;
    } catch (error) {
      console.error('Error getting goals:', error);
      throw error;
    }
  }

  // Security and verification
  async verifyDataIntegrity(data) {
    try {
      const hash = securityService.generateHash(JSON.stringify(data));
      return { data, hash, verified: true };
    } catch (error) {
      console.error('Error verifying data integrity:', error);
      return { data, verified: false, error: error.message };
    }
  }
}

module.exports = new DMSController();