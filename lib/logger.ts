type LogFields = Record<string, unknown>

const REDACTED = "[REDACTED]"

const SENSITIVE_KEYS = new Set([
  "password",
  "passwordhash",
  "token",
  "accesstoken",
  "refreshtoken",
  "encryptedaccesstoken",
  "encryptedrefreshtoken",
  "secret",
  "authorization",
  "cookie",
  "stripesecretkey",
  "stripewebhooksecret",
  "geminiapikey",
  "turnstilesecretkey",
  "upstashredisresttoken",
  "tokenencryptionkey",
  "clientsecret",
  "id_token",
  "access_token",
  "refresh_token",
])

function redact(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redact)
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).map(([key, val]) => {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        return [key, REDACTED]
      }
      return [key, redact(val)]
    })
    return Object.fromEntries(entries)
  }

  return value
}

function format(level: string, message: string, fields?: LogFields): string {
  const safeFields = fields ? redact(fields) : undefined
  const timestamp = new Date().toISOString()
  return JSON.stringify({ timestamp, level, message, ...(safeFields ? { fields: safeFields } : {}) })
}

export const logger = {
  info(message: string, fields?: LogFields): void {
    console.log(format("info", message, fields))
  },
  warn(message: string, fields?: LogFields): void {
    console.warn(format("warn", message, fields))
  },
  error(message: string, error?: unknown, fields?: LogFields): void {
    const errorInfo =
      error instanceof Error
        ? { errorMessage: error.message, stack: error.stack }
        : { errorMessage: String(error) }
    console.error(format("error", message, { ...errorInfo, ...fields }))
  },
}
