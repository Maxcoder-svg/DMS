# Firebase Admin SDK Setup Guide

To complete the Firebase Push notification setup, you need to generate a Firebase Admin SDK service account key:

## Steps to get Firebase Admin SDK credentials:

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `brits-academy`
3. Click the gear icon ⚙️ → "Project settings"
4. Go to the "Service accounts" tab
5. Click "Generate new private key"
6. Download the JSON file

## Extract the required values from the downloaded JSON:

```json
{
  "type": "service_account",
  "project_id": "brits-academy",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@brits-academy.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  ...
}
```

## Update the .env file:

```env
FIREBASE_PROJECT_ID=brits-academy
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@brits-academy.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"
```

## Current Status:

✅ **Twilio SMS**: Fully configured and working
⚠️ **Firebase Push**: Needs service account private key to complete setup

The client-side Firebase config you provided is used for web apps, but the server needs Admin SDK credentials for sending push notifications.