import { sql } from "@/lib/database"

export interface IntegrationLogEntry {
  traceId: string
  endpoint: string
  method: string
  ip: string
  integration?: string
  status: number
  error?: string
  metadata?: Record<string, any>
}

export async function logIntegrationRequest(entry: IntegrationLogEntry): Promise<void> {
  try {
    // Sanitizar metadata para no loggear datos sensibles
    const sanitizedMetadata = entry.metadata ? sanitizeLogMetadata(entry.metadata) : null

    await sql`
      INSERT INTO integration_logs (
        trace_id, 
        endpoint, 
        method, 
        ip, 
        integration_name, 
        status_code, 
        error_message, 
        metadata, 
        created_at
      )
      VALUES (
        ${entry.traceId},
        ${entry.endpoint},
        ${entry.method},
        ${entry.ip},
        ${entry.integration || null},
        ${entry.status},
        ${entry.error || null},
        ${sanitizedMetadata ? JSON.stringify(sanitizedMetadata) : null},
        CURRENT_TIMESTAMP
      )
    `
  } catch (error) {
    // No fallar la request principal si el logging falla
    console.error("Error logging integration request:", error)
  }
}

function sanitizeLogMetadata(metadata: Record<string, any>): Record<string, any> {
  const sanitized = { ...metadata }

  // Remover campos sensibles
  const sensitiveFields = ["password", "token", "api_key", "secret", "authorization"]

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = "[REDACTED]"
    }
  }

  // Truncar strings muy largos
  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === "string" && value.length > 1000) {
      sanitized[key] = value.substring(0, 1000) + "...[TRUNCATED]"
    }
  }

  return sanitized
}

export async function getIntegrationLogs(
  integrationName?: string,
  startDate?: Date,
  endDate?: Date,
  limit = 100,
): Promise<any[]> {
  let query = sql`
    SELECT trace_id, endpoint, method, ip, integration_name, status_code, error_message, created_at
    FROM integration_logs
    WHERE 1=1
  `

  if (integrationName) {
    query = sql`${query} AND integration_name = ${integrationName}`
  }

  if (startDate) {
    query = sql`${query} AND created_at >= ${startDate.toISOString()}`
  }

  if (endDate) {
    query = sql`${query} AND created_at <= ${endDate.toISOString()}`
  }

  query = sql`${query} ORDER BY created_at DESC LIMIT ${limit}`

  return await query
}
