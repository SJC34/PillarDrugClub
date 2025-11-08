import crypto from 'crypto';

const IV_LENGTH = 16;
const ALGORITHM = 'aes-256-cbc';

// CRITICAL: ENCRYPTION_KEY is REQUIRED for HIPAA compliance
// Fail fast if not set - do NOT allow startup without encryption key
if (!process.env.ENCRYPTION_KEY) {
  console.error('❌ CRITICAL: ENCRYPTION_KEY environment variable is not set!');
  console.error('❌ This is required for HIPAA compliance - encrypted PHI data will be unrecoverable.');
  console.error('❌ Generate a key with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  console.error('❌ Then set ENCRYPTION_KEY=<generated-key> in your environment');
  
  // Fail fast - don't allow server to start without encryption key
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  } else {
    console.warn('⚠️ DEVELOPMENT MODE: Using temporary encryption key. ALL ENCRYPTED DATA WILL BE LOST ON RESTART!');
    console.warn('⚠️ Set ENCRYPTION_KEY environment variable immediately.');
  }
}

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const keyBuffer = Buffer.from(ENCRYPTION_KEY.substring(0, 64), 'hex');

export function encryptField(text: string | null | undefined): string | null {
  if (!text) return null;
  
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (error) {
    console.error('❌ Encryption failed:', error);
    throw new Error('Failed to encrypt sensitive data');
  }
}

export function decryptField(encryptedText: string | null | undefined): string | null {
  if (!encryptedText) return null;
  
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      return encryptedText;
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedData = Buffer.from(parts[1], 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);
    const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('❌ Decryption failed:', error);
    return null;
  }
}

export function encryptPhiFields<T extends Record<string, any>>(
  data: T, 
  fields: (keyof T)[]
): T {
  const encrypted = { ...data };
  
  for (const field of fields) {
    if (typeof encrypted[field] === 'string') {
      encrypted[field] = encryptField(encrypted[field] as string) as T[keyof T];
    }
  }
  
  return encrypted;
}

export function decryptPhiFields<T extends Record<string, any>>(
  data: T, 
  fields: (keyof T)[]
): T {
  const decrypted = { ...data };
  
  for (const field of fields) {
    if (typeof decrypted[field] === 'string') {
      decrypted[field] = decryptField(decrypted[field] as string) as T[keyof T];
    }
  }
  
  return decrypted;
}

export function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(salt + ':' + derivedKey.toString('hex'));
    });
  });
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(':');
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(key === derivedKey.toString('hex'));
    });
  });
}
