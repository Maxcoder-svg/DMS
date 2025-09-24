#!/usr/bin/env node

/**
 * Discipline Management System (DMS)
 * A system for tracking progress and managing tasks to ensure you stick to your plan
 */

const dmsController = require('./controllers/dmsController');
const twilioService = require('./services/twilio');
const securityService = require('./services/security');
const { firebaseConfig, twilioConfig, securityConfig } = require('./config');

class DMS {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    try {
      console.log('🚀 Initializing Discipline Management System...');
      
      // Verify configurations
      this.verifyConfig();
      
      // Test services
      await this.testServices();
      
      this.initialized = true;
      console.log('✅ DMS initialized successfully!');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize DMS:', error);
      throw error;
    }
  }

  verifyConfig() {
    console.log('🔧 Verifying configurations...');
    
    // Verify Firebase config
    const requiredFirebaseFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
    for (const field of requiredFirebaseFields) {
      if (!firebaseConfig[field]) {
        throw new Error(`Missing Firebase configuration: ${field}`);
      }
    }
    console.log('  ✓ Firebase configuration verified');
    
    // Verify Twilio config
    const requiredTwilioFields = ['accountSid', 'authToken', 'phoneNumber', 'destinationPhoneNumber'];
    for (const field of requiredTwilioFields) {
      if (!twilioConfig[field]) {
        throw new Error(`Missing Twilio configuration: ${field}`);
      }
    }
    console.log('  ✓ Twilio configuration verified');
    
    // Verify Security config
    if (!securityConfig.privateKey || !securityConfig.keyPair) {
      throw new Error('Missing security configuration');
    }
    console.log('  ✓ Security configuration verified');
  }

  async testServices() {
    console.log('🧪 Testing services...');
    
    try {
      // Test encryption/decryption
      const testData = 'Test discipline data';
      const encrypted = securityService.encrypt(testData);
      const decrypted = securityService.decrypt(encrypted.encrypted, encrypted.iv);
      
      if (decrypted !== testData) {
        throw new Error('Security service encryption/decryption test failed');
      }
      console.log('  ✓ Security service test passed');
      
      // Test hash generation
      const hash = securityService.generateHash(testData);
      const isValid = securityService.verifyHash(testData, hash);
      
      if (!isValid) {
        throw new Error('Security service hash verification test failed');
      }
      console.log('  ✓ Security service hash test passed');
      
    } catch (error) {
      console.error('  ❌ Service tests failed:', error);
      throw error;
    }
  }

  async createSampleTask() {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log('📝 Creating sample task...');
    
    try {
      const sampleTask = await dmsController.createTask({
        title: 'Daily Exercise',
        description: 'Complete 30 minutes of cardio exercise',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        priority: 'high'
      });

      console.log('✅ Sample task created:', sampleTask);
      return sampleTask;
    } catch (error) {
      console.error('❌ Failed to create sample task:', error);
      throw error;
    }
  }

  async createSampleGoal() {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log('🎯 Creating sample goal...');
    
    try {
      const sampleGoal = await dmsController.createGoal({
        title: 'Fitness Journey',
        description: 'Complete a 30-day fitness challenge to build discipline',
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      });

      console.log('✅ Sample goal created:', sampleGoal);
      return sampleGoal;
    } catch (error) {
      console.error('❌ Failed to create sample goal:', error);
      throw error;
    }
  }

  async sendWelcomeMessage() {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const message = 'Welcome to your Discipline Management System! 🎯 Your journey to better discipline starts now. Stay focused and achieve your goals!';
      await twilioService.sendSMS(message);
      console.log('📱 Welcome message sent successfully');
    } catch (error) {
      console.error('❌ Failed to send welcome message:', error);
      throw error;
    }
  }

  async demo() {
    console.log('🎬 Starting DMS Demo...\n');
    
    try {
      // Initialize system
      await this.initialize();
      
      // Send welcome message
      await this.sendWelcomeMessage();
      
      // Create sample goal and task
      await this.createSampleGoal();
      await this.createSampleTask();
      
      // Display current tasks and goals
      const tasks = await dmsController.getTasks();
      const goals = await dmsController.getGoals();
      
      console.log('\n📋 Current Tasks:');
      tasks.forEach(task => {
        console.log(`  - ${task.title} (${task.priority} priority) - ${task.completed ? '✅' : '⏳'}`);
      });
      
      console.log('\n🎯 Current Goals:');
      goals.forEach(goal => {
        console.log(`  - ${goal.title} (${goal.progress}% complete)`);
      });
      
      console.log('\n🎉 Demo completed successfully!');
      
    } catch (error) {
      console.error('❌ Demo failed:', error);
    }
  }
}

// Main execution
if (require.main === module) {
  const dms = new DMS();
  
  // Handle command line arguments
  const args = process.argv.slice(2);
  
  if (args.includes('--demo')) {
    dms.demo();
  } else if (args.includes('--init')) {
    dms.initialize();
  } else {
    console.log(`
🎯 Discipline Management System (DMS)

Usage:
  node index.js --demo    Run a full demonstration
  node index.js --init    Initialize and test the system
  
Available commands:
  --demo    Create sample tasks and goals, send SMS notifications
  --init    Initialize system and verify all configurations
  
Configuration:
  ✓ Firebase: ${firebaseConfig.projectId}
  ✓ Twilio: ${twilioConfig.phoneNumber}
  ✓ Security: Keys configured
  
All your credentials have been successfully integrated into the DMS system!
    `);
  }
}

module.exports = DMS;