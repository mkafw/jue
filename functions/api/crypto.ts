const ENCODER = new TextEncoder();
const DECODER = new TextDecoder();
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const ITERATIONS = 100000;

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey('raw', ENCODER.encode(password), 'PBKDF2', false, ['deriveBits', 'deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

export async function encrypt(text: string, password: string): Promise<string> {
  if (!text || !password) return text;
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const key = await deriveKey(password, salt);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, ENCODER.encode(text));
  return `${btoa(String.fromCharCode(...salt))}:${btoa(String.fromCharCode(...iv))}:${btoa(String.fromCharCode(...new Uint8Array(encrypted)))}`;
}

export async function decrypt(encryptedData: string, password: string): Promise<string> {
  if (!encryptedData || !password) return encryptedData;
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) return encryptedData;
    const [saltB64, ivB64, cipherB64] = parts;
    const key = await deriveKey(password, Uint8Array.from(atob(saltB64), c => c.charCodeAt(0)));
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: Uint8Array.from(atob(ivB64), c => c.charCodeAt(0)) }, key, Uint8Array.from(atob(cipherB64), c => c.charCodeAt(0)));
    return DECODER.decode(decrypted);
  } catch { return encryptedData; }
}
