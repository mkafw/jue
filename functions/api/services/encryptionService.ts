import { encrypt, decrypt } from '../crypto';

export class EncryptionService {
  private key: string;

  constructor(key: string = '') {
    this.key = key;
  }

  async encryptData(data: object | string): Promise<string> {
    const str = typeof data === 'string' ? data : JSON.stringify(data);
    return encrypt(str, this.key);
  }

  async decryptData<T>(encryptedData: string): Promise<T> {
    const decrypted = await decrypt(encryptedData, this.key);
    try {
      return JSON.parse(decrypted) as T;
    } catch {
      return decrypted as T;
    }
  }

  setKey(key: string): void {
    this.key = key;
  }
}

export const encryptionService = new EncryptionService();
