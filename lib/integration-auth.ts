import bcrypt from "bcryptjs"
import { sql } from "@/lib/database"
import { randomBytes } from "crypto"

export interface Integration {
  id: number
  name: string
  api_key_hash: string
  allowed_ips: string[]
  rate_limit: number
  created_at: string
  revoked_at?: string
}

export function generateTraceId(): string {
  return randomBytes(16).toString("hex")
}

export function generateApiKey(): string {
  return randomBytes(32).toString("hex")
}

export async function hashApiKey(apiKey: string): Promise<string> {
  return bcrypt.hash(apiKey, 12)
}

export async function compareApiKey(apiKey: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(apiKey, hash)
  } catch (error) {
    console.error("Error comparing API key:", error)
    return false
  }
}

export async function validateApiKey(apiKey: string, clientIP: string): Promise<Integration | null> {
  try {
    if (!apiKey || typeof apiKey !== "string") {
      return null
    }

    // Obtener todas las integraciones activas
    const integrations = await sql`
      SELECT id, name, api_key_hash, allowed_ips, rate_limit, created_at, revoked_at
      FROM integrations 
      WHERE revoked_at IS NULL
    `

    for (const integration of integrations) {
      // Verificar API key con constant-time comparison
      const isValidKey = await compareApiKey(apiKey, integration.api_key_hash)

      if (isValidKey) {
        // Verificar IP si está configurada la whitelist
        if (integration.allowed_ips && integration.allowed_ips.length > 0) {
          const isAllowedIP = integration.allowed_ips.some((allowedIP: string) => {
            if (allowedIP.includes("/")) {
              // CIDR notation support (básico)
              return clientIP.startsWith(allowedIP.split("/")[0])
            }
            return clientIP === allowedIP
          })

          if (!isAllowedIP) {
            console.warn(`IP ${clientIP} not allowed for integration ${integration.name}`)
            return null
          }
        }

        return integration
      }
    }

    return null
  } catch (error) {
    console.error("Error validating API key:", error)
    return null
  }
}

export async function createIntegration(
  name: string,
  allowedIPs: string[] = [],
  rateLimit = 1000,
): Promise<{ integration: Integration; apiKey: string }> {
  const apiKey = generateApiKey()
  const apiKeyHash = await hashApiKey(apiKey)

  const [integration] = await sql`
    INSERT INTO integrations (name, api_key_hash, allowed_ips, rate_limit, created_at)
    VALUES (${name}, ${apiKeyHash}, ${JSON.stringify(allowedIPs)}, ${rateLimit}, CURRENT_TIMESTAMP)
    RETURNING id, name, api_key_hash, allowed_ips, rate_limit, created_at
  `

  return {
    integration,
    apiKey, // Solo se devuelve una vez, nunca se almacena en texto plano
  }
}

export async function revokeIntegration(integrationId: number): Promise<boolean> {
  try {
    const result = await sql`
      UPDATE integrations 
      SET revoked_at = CURRENT_TIMESTAMP
      WHERE id = ${integrationId} AND revoked_at IS NULL
    `

    return result.length > 0
  } catch (error) {
    console.error("Error revoking integration:", error)
    return false
  }
}
