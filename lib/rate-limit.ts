import type { NextRequest } from "next/server"

interface RateLimitOptions {
  interval: number // Ventana de tiempo en milisegundos
  uniqueTokenPerInterval: number // Máximo de tokens únicos por intervalo
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

// Almacén en memoria para rate limiting (en producción usar Redis)
const tokenCache = new Map<string, { count: number; resetTime: number }>()

class RateLimit {
  private interval: number
  private uniqueTokenPerInterval: number

  constructor(options: RateLimitOptions) {
    this.interval = options.interval
    this.uniqueTokenPerInterval = options.uniqueTokenPerInterval
  }

  async check(identifier: string): Promise<RateLimitResult> {
    const now = Date.now()
    const key = identifier

    // Limpiar entradas expiradas
    this.cleanup(now)

    const record = tokenCache.get(key)

    if (!record || now > record.resetTime) {
      // Primera solicitud o ventana expirada
      const resetTime = now + this.interval
      tokenCache.set(key, { count: 1, resetTime })

      return {
        success: true,
        limit: this.uniqueTokenPerInterval,
        remaining: this.uniqueTokenPerInterval - 1,
        reset: resetTime,
      }
    }

    if (record.count >= this.uniqueTokenPerInterval) {
      // Límite excedido
      return {
        success: false,
        limit: this.uniqueTokenPerInterval,
        remaining: 0,
        reset: record.resetTime,
      }
    }

    // Incrementar contador
    record.count++

    return {
      success: true,
      limit: this.uniqueTokenPerInterval,
      remaining: this.uniqueTokenPerInterval - record.count,
      reset: record.resetTime,
    }
  }

  private cleanup(now: number) {
    // Limpiar entradas expiradas para evitar memory leaks
    for (const [key, record] of tokenCache.entries()) {
      if (now > record.resetTime) {
        tokenCache.delete(key)
      }
    }
  }
}

// Factory function para crear rate limiters
export default function rateLimit(options: RateLimitOptions): RateLimit {
  return new RateLimit(options)
}

// Función helper para obtener IP del request
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIP = request.headers.get("x-real-ip")

  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }

  if (realIP) {
    return realIP
  }

  return request.ip || "unknown"
}

// Rate limiter específico para autenticación
export const authRateLimit = rateLimit({
  interval: 15 * 60 * 1000, // 15 minutos
  uniqueTokenPerInterval: 5, // 5 intentos por IP cada 15 minutos
})

// Rate limiter para generación de códigos
export const codeGenerationRateLimit = rateLimit({
  interval: 60 * 1000, // 1 minuto
  uniqueTokenPerInterval: 10, // 10 códigos por minuto por empleado
})

// Rate limiter general para APIs
export const apiRateLimit = rateLimit({
  interval: 60 * 1000, // 1 minuto
  uniqueTokenPerInterval: 100, // 100 requests por minuto por IP
})

// Rate limiter específico para integraciones
export const integrationRateLimit = rateLimit({
  interval: 60 * 1000, // 1 minuto
  uniqueTokenPerInterval: Number.parseInt(process.env.INTEGRATION_RATE_LIMIT || "1000"), // Configurable por env
})

// Rate limiter por API Key específica
const apiKeyRateLimits = new Map<string, RateLimit>()

export function getApiKeyRateLimit(apiKey: string, limit = 1000): RateLimit {
  if (!apiKeyRateLimits.has(apiKey)) {
    apiKeyRateLimits.set(
      apiKey,
      rateLimit({
        interval: 60 * 1000,
        uniqueTokenPerInterval: limit,
      }),
    )
  }
  return apiKeyRateLimits.get(apiKey)!
}
