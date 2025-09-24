#!/usr/bin/env node

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function demoScript() {
  console.log('🎯 DMS Demo Script');
  console.log('==================');

  try {
    // Test health endpoint
    console.log('\n1. Testing health endpoint...');
    const health = await axios.get(`${API_BASE}/health`);
    console.log('✅ Server healthy:', health.data.status);

    // Test registration
    console.log('\n2. Creating demo user...');
    const demoUser = {
      username: 'demo_user',
      email: 'demo@example.com',
      password: 'demo123456',
      phoneNumber: '+1234567890'
    };

    try {
      const registerResponse = await axios.post(`${API_BASE}/auth/register`, demoUser);
      console.log('✅ Demo user created successfully');
      const token = registerResponse.data.token;

      // Test task creation
      console.log('\n3. Creating demo task...');
      const demoTask = {
        title: 'Daily Exercise Routine',
        description: 'Complete daily exercise to build discipline and health',
        durationDays: 30,
        startDate: new Date().toISOString().split('T')[0],
        checklistItems: [
          { title: '30-minute cardio workout', description: 'Running, cycling, or swimming' },
          { title: '15-minute strength training', description: 'Push-ups, squats, planks' },
          { title: 'Drink 8 glasses of water', description: 'Stay hydrated throughout the day' }
        ],
        schedules: [
          { time: '07:00', days_of_week: '1,2,3,4,5,6,7' },
          { time: '18:00', days_of_week: '1,2,3,4,5,6,7' }
        ]
      };

      const taskResponse = await axios.post(`${API_BASE}/tasks`, demoTask, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Demo task created:', taskResponse.data.task.title);

      // Test task retrieval
      console.log('\n4. Retrieving tasks...');
      const tasksResponse = await axios.get(`${API_BASE}/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`✅ Found ${tasksResponse.data.tasks.length} task(s)`);

      console.log('\n🎉 Demo completed successfully!');
      console.log('\nYou can now:');
      console.log('- Visit http://localhost:3000 to see the frontend');
      console.log('- Login with: demo@example.com / demo123456');
      console.log('- Test the task management features');

    } catch (authError) {
      if (authError.response?.data?.error?.includes('already exists')) {
        console.log('ℹ️  Demo user already exists - you can login with demo@example.com / demo123456');
      } else {
        throw authError;
      }
    }

  } catch (error) {
    console.error('❌ Demo failed:', error.response?.data?.error || error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the server is running:');
      console.log('   npm run dev:server');
    }
  }
}

if (require.main === module) {
  demoScript();
}