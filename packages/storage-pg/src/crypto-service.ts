import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

export class CryptoService {
  private key: Buffer;

  constructor() {
    const hex = process.env.ENCRYPTION_KEY;
    if (!hex) {
      throw new Error(
        "ENCRYPTION_KEY is not set. Add a 64-char hex string to your .env file.\n" +
          "Generate one with: openssl rand -hex 32",
      );
    }
    if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
      throw new Error("ENCRYPTION_KEY must be a 64-character hexadecimal string (32 bytes).");
    }
    this.key = Buffer.from(hex, "hex");
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv, { authTagLength: AUTH_TAG_LENGTH });
    const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
  }

  decrypt(ciphertext: string): string {
    const parts = ciphertext.split(":");
    if (parts.length !== 3) {
      throw new Error(
        "Invalid encrypted value format: expected base64(iv):base64(authTag):base64(ciphertext)",
      );
    }
    const [ivB64, authTagB64, dataB64] = parts;
    const iv = Buffer.from(ivB64, "base64");
    const authTag = Buffer.from(authTagB64, "base64");
    const data = Buffer.from(dataB64, "base64");
    const decipher = createDecipheriv(ALGORITHM, this.key, iv, { authTagLength: AUTH_TAG_LENGTH });
    decipher.setAuthTag(authTag);
    return decipher.update(data) + decipher.final("utf8");
  }
}
