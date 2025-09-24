const crypto = require('crypto');
const { securityConfig } = require('../config');

class SecurityService {
  constructor() {
    this.privateKey = securityConfig.privateKey;
    this.keyPair = securityConfig.keyPair;
  }

  // Encrypt data using private key
  encrypt(text) {
    try {
      const algorithm = 'aes-256-cbc';
      const key = crypto.createHash('sha256').update(this.privateKey).digest();
      const iv = crypto.randomBytes(16);
      
      const cipher = crypto.createCipheriv(algorithm, key, iv);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return {
        encrypted: encrypted,
        iv: iv.toString('hex')
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw error;
    }
  }

  // Decrypt data using private key
  decrypt(encryptedData, ivHex) {
    try {
      const algorithm = 'aes-256-cbc';
      const key = crypto.createHash('sha256').update(this.privateKey).digest();
      const iv = Buffer.from(ivHex, 'hex');
      
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw error;
    }
  }

  // Generate hash for data verification
  generateHash(data) {
    return crypto.createHmac('sha256', this.keyPair)
                 .update(data)
                 .digest('hex');
  }

  // Verify hash
  verifyHash(data, hash) {
    const expectedHash = this.generateHash(data);
    return crypto.timingSafeEqual(
      Buffer.from(hash, 'hex'),
      Buffer.from(expectedHash, 'hex')
    );
  }
}

module.exports = new SecurityService();