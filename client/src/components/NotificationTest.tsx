import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { NotificationService } from '../types';
import { Send, MessageSquare, Bell, Settings } from 'lucide-react';

function NotificationTest() {
  const { user, updateProfile } = useAuth();
  const [notificationService, setNotificationService] = useState<NotificationService | null>(null);
  const [testData, setTestData] = useState({
    sms: {
      phoneNumber: user?.phoneNumber || '',
      message: 'Test SMS from DMS - Your discipline management system is working! 💪'
    },
    push: {
      firebaseToken: '',
      title: 'DMS Test Notification',
      body: 'Your push notifications are working correctly!'
    }
  });
  const [profileData, setProfileData] = useState({
    phoneNumber: user?.phoneNumber || '',
    timezone: user?.timezone || 'UTC',
    firebaseToken: ''
  });
  const [loading, setLoading] = useState({
    status: false,
    sms: false,
    push: false,
    profile: false
  });
  const [results, setResults] = useState({
    sms: '',
    push: '',
    profile: ''
  });

  useEffect(() => {
    fetchNotificationStatus();
  }, []);

  const fetchNotificationStatus = async () => {
    setLoading(prev => ({ ...prev, status: true }));
    try {
      const response = await api.get('/notifications/status');
      setNotificationService(response.data);
    } catch (err: any) {
      console.error('Failed to fetch notification status:', err);
    } finally {
      setLoading(prev => ({ ...prev, status: false }));
    }
  };

  const handleInputChange = (section: 'sms' | 'push' | 'profile', field: string, value: string) => {
    if (section === 'profile') {
      setProfileData(prev => ({ ...prev, [field]: value }));
    } else {
      setTestData(prev => ({
        ...prev,
        [section]: { ...prev[section], [field]: value }
      }));
    }
  };

  const testSMS = async () => {
    if (!testData.sms.phoneNumber || !testData.sms.message) {
      setResults(prev => ({ ...prev, sms: 'Please fill in phone number and message' }));
      return;
    }

    setLoading(prev => ({ ...prev, sms: true }));
    setResults(prev => ({ ...prev, sms: '' }));

    try {
      const response = await api.post('/notifications/test/sms', {
        phoneNumber: testData.sms.phoneNumber,
        message: testData.sms.message
      });

      setResults(prev => ({
        ...prev,
        sms: `SMS sent successfully! Message ID: ${response.data.result.messageId}`
      }));
    } catch (err: any) {
      setResults(prev => ({
        ...prev,
        sms: `SMS failed: ${err.response?.data?.error || err.message}`
      }));
    } finally {
      setLoading(prev => ({ ...prev, sms: false }));
    }
  };

  const testPush = async () => {
    if (!testData.push.firebaseToken || !testData.push.title || !testData.push.body) {
      setResults(prev => ({ ...prev, push: 'Please fill in all push notification fields' }));
      return;
    }

    setLoading(prev => ({ ...prev, push: true }));
    setResults(prev => ({ ...prev, push: '' }));

    try {
      const response = await api.post('/notifications/test/push', {
        firebaseToken: testData.push.firebaseToken,
        title: testData.push.title,
        body: testData.push.body,
        data: { test: 'true' }
      });

      setResults(prev => ({
        ...prev,
        push: `Push notification sent successfully! Message ID: ${response.data.result.messageId}`
      }));
    } catch (err: any) {
      setResults(prev => ({
        ...prev,
        push: `Push notification failed: ${err.response?.data?.error || err.message}`
      }));
    } finally {
      setLoading(prev => ({ ...prev, push: false }));
    }
  };

  const updateUserProfile = async () => {
    setLoading(prev => ({ ...prev, profile: true }));
    setResults(prev => ({ ...prev, profile: '' }));

    try {
      await updateProfile(
        profileData.phoneNumber,
        profileData.timezone,
        profileData.firebaseToken
      );

      setResults(prev => ({
        ...prev,
        profile: 'Profile updated successfully!'
      }));
    } catch (err: any) {
      setResults(prev => ({
        ...prev,
        profile: `Profile update failed: ${err.message}`
      }));
    } finally {
      setLoading(prev => ({ ...prev, profile: false }));
    }
  };

  return (
    <div className="notification-test">
      <div className="page-header">
        <h1>
          <Bell size={24} />
          Notification Testing & Setup
        </h1>
        <p>Test your SMS and push notification configuration</p>
      </div>

      {/* Service Status */}
      <div className="status-section">
        <h2>Service Status</h2>
        {loading.status ? (
          <div className="loading">Checking service status...</div>
        ) : notificationService ? (
          <div className="status-grid">
            <div className={`status-card ${notificationService.services.sms.available ? 'available' : 'unavailable'}`}>
              <MessageSquare size={32} />
              <h3>SMS Notifications</h3>
              <p className="provider">{notificationService.services.sms.provider}</p>
              <p className="status">
                {notificationService.services.sms.available ? 'Available' : 'Not Configured'}
              </p>
            </div>
            <div className={`status-card ${notificationService.services.push.available ? 'available' : 'unavailable'}`}>
              <Bell size={32} />
              <h3>Push Notifications</h3>
              <p className="provider">{notificationService.services.push.provider}</p>
              <p className="status">
                {notificationService.services.push.available ? 'Available' : 'Not Configured'}
              </p>
            </div>
          </div>
        ) : (
          <div className="error-message">Failed to load service status</div>
        )}
      </div>

      {/* Profile Update */}
      <div className="test-section">
        <h2>
          <Settings size={20} />
          Update Profile
        </h2>
        <p>Update your profile to receive notifications</p>

        <div className="form-grid">
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              value={profileData.phoneNumber}
              onChange={(e) => handleInputChange('profile', 'phoneNumber', e.target.value)}
              placeholder="+1234567890"
            />
            <small>For SMS notifications</small>
          </div>

          <div className="form-group">
            <label>Timezone</label>
            <select
              value={profileData.timezone}
              onChange={(e) => handleInputChange('profile', 'timezone', e.target.value)}
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Paris">Paris</option>
              <option value="Asia/Tokyo">Tokyo</option>
            </select>
          </div>

          <div className="form-group">
            <label>Firebase Token</label>
            <input
              type="text"
              value={profileData.firebaseToken}
              onChange={(e) => handleInputChange('profile', 'firebaseToken', e.target.value)}
              placeholder="Firebase device token"
            />
            <small>For push notifications</small>
          </div>
        </div>

        <button
          onClick={updateUserProfile}
          disabled={loading.profile}
          className="btn btn-primary"
        >
          {loading.profile ? 'Updating...' : 'Update Profile'}
        </button>

        {results.profile && (
          <div className={`result-message ${results.profile.includes('failed') ? 'error' : 'success'}`}>
            {results.profile}
          </div>
        )}
      </div>

      {/* SMS Testing */}
      <div className="test-section">
        <h2>
          <MessageSquare size={20} />
          Test SMS Notifications
        </h2>
        
        {notificationService?.services.sms.available ? (
          <div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                value={testData.sms.phoneNumber}
                onChange={(e) => handleInputChange('sms', 'phoneNumber', e.target.value)}
                placeholder="+1234567890"
              />
            </div>

            <div className="form-group">
              <label>Message</label>
              <textarea
                value={testData.sms.message}
                onChange={(e) => handleInputChange('sms', 'message', e.target.value)}
                rows={3}
              />
            </div>

            <button
              onClick={testSMS}
              disabled={loading.sms}
              className="btn btn-primary"
            >
              <Send size={16} />
              {loading.sms ? 'Sending...' : 'Send Test SMS'}
            </button>

            {results.sms && (
              <div className={`result-message ${results.sms.includes('failed') ? 'error' : 'success'}`}>
                {results.sms}
              </div>
            )}
          </div>
        ) : (
          <div className="service-unavailable">
            <p>SMS service is not configured. Please set up Twilio credentials on the server.</p>
            <div className="config-info">
              <h4>Required Environment Variables:</h4>
              <ul>
                <li><code>TWILIO_ACCOUNT_SID</code></li>
                <li><code>TWILIO_AUTH_TOKEN</code></li>
                <li><code>TWILIO_PHONE_NUMBER</code></li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Push Testing */}
      <div className="test-section">
        <h2>
          <Bell size={20} />
          Test Push Notifications
        </h2>
        
        {notificationService?.services.push.available ? (
          <div>
            <div className="form-group">
              <label>Firebase Token</label>
              <input
                type="text"
                value={testData.push.firebaseToken}
                onChange={(e) => handleInputChange('push', 'firebaseToken', e.target.value)}
                placeholder="Device Firebase token"
              />
              <small>Get this from your mobile app or browser developer tools</small>
            </div>

            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={testData.push.title}
                onChange={(e) => handleInputChange('push', 'title', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Body</label>
              <textarea
                value={testData.push.body}
                onChange={(e) => handleInputChange('push', 'body', e.target.value)}
                rows={2}
              />
            </div>

            <button
              onClick={testPush}
              disabled={loading.push}
              className="btn btn-primary"
            >
              <Send size={16} />
              {loading.push ? 'Sending...' : 'Send Test Push'}
            </button>

            {results.push && (
              <div className={`result-message ${results.push.includes('failed') ? 'error' : 'success'}`}>
                {results.push}
              </div>
            )}
          </div>
        ) : (
          <div className="service-unavailable">
            <p>Push notification service is not configured. Please set up Firebase credentials on the server.</p>
            <div className="config-info">
              <h4>Required Environment Variables:</h4>
              <ul>
                <li><code>FIREBASE_PROJECT_ID</code></li>
                <li><code>FIREBASE_CLIENT_EMAIL</code></li>
                <li><code>FIREBASE_PRIVATE_KEY</code></li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationTest;