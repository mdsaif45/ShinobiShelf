import crypto from 'crypto';

export class CryptoUtils {
  /**
   * Generates a cryptographically secure random salt (32 bytes hex)
   */
  public static generateSalt(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hashes a password using PBKDF2 with SHA-512, 100,000 iterations, and a 64-byte key
   */
  public static hashPassword(password: string, salt: string): string {
    return crypto
      .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
      .toString('hex');
  }

  /**
   * Verifies a password against a stored salt and hash using constant-time comparison
   */
  public static verifyPassword(password: string, salt: string, storedHash: string): boolean {
    const computedHash = this.hashPassword(password, salt);
    const hashBuffer = Buffer.from(computedHash, 'hex');
    const storedBuffer = Buffer.from(storedHash, 'hex');

    if (hashBuffer.length !== storedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(hashBuffer, storedBuffer);
  }

  /**
   * Generates a random alphanumeric token (e.g. for session IDs or handshake codes)
   */
  public static generateRandomToken(bytes: number = 32): string {
    return crypto.randomBytes(bytes).toString('hex');
  }
}
