const crypto = require('crypto');

// Configuration
// In production, this should come from process.env.ENCRYPTION_KEY
// Fallback to a hardcoded key for development/demo only if env is missing
const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012'; // Must be 32 chars
const IV_LENGTH = 16; // For AES, this is always 16

function encrypt(text) {
    if (!text) return text;
    // Don't double encrypt
    if (String(text).startsWith('enc_')) return text;

    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return 'enc_' + iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (error) {
        console.error('[Crypto] Encryption failed:', error);
        return text; // Return original if fail (fail open for dev, strictly fail closed for prod)
    }
}

function decrypt(text) {
    if (!text) return text;
    // Only decrypt if it looks encrypted
    if (!String(text).startsWith('enc_')) return text;

    try {
        const textParts = text.substring(4).split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        console.error('[Crypto] Decryption failed:', error);
        return text; // Return original if fail
    }
}

module.exports = { encrypt, decrypt };
