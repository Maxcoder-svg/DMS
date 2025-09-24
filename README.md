# DMS - Discipline Management System

This is a discipline management system for tracking progress and managing tasks to ensure you stick to your plan.

## Features

- **Task Management**: Create, track, and complete tasks with different priority levels
- **Goal Setting**: Set discipline goals with progress tracking
- **SMS Notifications**: Receive reminders and progress updates via Twilio SMS
- **Data Security**: Encrypt sensitive task data using secure encryption
- **Firebase Integration**: Store data securely in Firebase Firestore
- **Progress Tracking**: Monitor your discipline journey with detailed analytics

## Integrated Services

### Firebase Configuration ✅
- **Project ID**: brits-academy
- **API Key**: Configured and verified
- **Auth Domain**: brits-academy.firebaseapp.com
- **Storage**: brits-academy.firebasestorage.app
- **Real-time database and authentication ready**

### Twilio SMS Integration ✅
- **Account SID**: AC9270ea76885608eb0de956d4fc0270ce
- **Phone Number**: +16197933314
- **Destination**: 0741261579
- **Automated reminders and progress notifications**

### Security Features ✅
- **Private Key Encryption**: Secure sensitive task data
- **Key Pair Authentication**: Data integrity verification
- **Hash-based verification**: Tamper-proof data storage

## Installation

```bash
npm install
```

## Usage

### Initialize and Test System
```bash
node index.js --init
```

### Run Full Demonstration
```bash
node index.js --demo
```

### Show Help and Configuration
```bash
node index.js
```

## Project Structure

```
DMS/
├── config/          # Configuration management
│   └── index.js     # Environment-based config loader
├── services/        # External service integrations
│   ├── firebase.js  # Firebase setup and initialization
│   ├── twilio.js    # SMS notification service
│   └── security.js  # Encryption and security utilities
├── models/          # Data models
│   └── index.js     # Task and Goal model definitions
├── controllers/     # Business logic
│   └── dmsController.js # Main DMS functionality
├── .env             # Environment variables (credentials)
├── .env.example     # Environment template
└── index.js         # Main application entry point
```

## Environment Variables

All credentials have been properly integrated into the system:

- `TWILIO_ACCOUNT_SID`: Your Twilio account identifier
- `TWILIO_AUTH_TOKEN`: Twilio authentication token
- `TWILIO_PHONE_NUMBER`: Your Twilio phone number
- `DESTINATION_PHONE_NUMBER`: Target phone for notifications
- `FIREBASE_*`: Complete Firebase configuration
- `PRIVATE_KEY`: Encryption private key
- `KEY_PAIR`: Authentication key pair

## Security

- Sensitive data is encrypted before storage
- All credentials are managed through environment variables
- Hash verification ensures data integrity
- Modern crypto algorithms with secure key derivation
