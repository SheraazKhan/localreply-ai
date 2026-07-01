import crypto from "crypto"
import { env } from "@/lib/env"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12

function getKey(): Buffer {
  return Buffer.from(env.TOKEN_ENCRYPTION_KEY, "hex")
}

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const authTag = cipher.getAuthTag()

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${ciphertext.toString("hex")}`
}

export function decrypt(payload: string): string {
  const parts = payload.split(":")
  if (parts.length !== 3) {
    throw new Error("Malformed ciphertext payload")
  }

  const [ivHex, authTagHex, ciphertextHex] = parts as [string, string, string]
  const iv = Buffer.from(ivHex, "hex")
  const authTag = Buffer.from(authTagHex, "hex")
  const ciphertext = Buffer.from(ciphertextHex, "hex")

  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv)
  decipher.setAuthTag(authTag)

  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return plaintext.toString("utf8")
}
