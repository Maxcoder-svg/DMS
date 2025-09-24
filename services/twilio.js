const twilio = require('twilio');
const { twilioConfig } = require('../config');

// Initialize Twilio client
const client = twilio(twilioConfig.accountSid, twilioConfig.authToken);

class TwilioService {
  async sendSMS(message, to = twilioConfig.destinationPhoneNumber) {
    try {
      const messageResponse = await client.messages.create({
        body: message,
        from: twilioConfig.phoneNumber,
        to: to
      });
      
      console.log(`SMS sent successfully. SID: ${messageResponse.sid}`);
      return messageResponse;
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  }

  async sendTaskReminder(task) {
    const message = `DMS Reminder: Don't forget to complete your task - ${task.title}. Stay disciplined!`;
    return this.sendSMS(message);
  }

  async sendProgressUpdate(progress) {
    const message = `DMS Update: Great job! You've completed ${progress}% of your goals today. Keep it up!`;
    return this.sendSMS(message);
  }
}

module.exports = new TwilioService();