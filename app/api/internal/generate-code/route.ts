import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { verifyToken, generateUniqueCode } from "@/lib/auth"
import { codeGenerationRateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token de autorización requerido" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const payload = verifyToken(token)

    if (!payload || (payload.tipo !== "empleado" && payload.tipo !== "admin")) {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 403 })
    }

    // Rate limiting por usuario
    const userIdentifier = `${payload.tipo}-${payload.id}`
    const rateLimitResult = await codeGenerationRateLimit.check(userIdentifier)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Límite de generación de códigos excedido. Intenta en un minuto.",
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        },
        { status: 429 },
      )
    }

    // Verificar estado de la rifa
    const [rifaConfig] = await sql`
      SELECT estado FROM configuracion_rifa LIMIT 1
    `

    if (!rifaConfig || rifaConfig.estado !== "activa") {
      return NextResponse.json({ error: "La rifa no está activa" }, { status: 400 })
    }

    // Generar código único con optimización y transacción
    await sql`BEGIN`

    try {
      let codigo: string
      let attempts = 0
      const maxAttempts = 50

      do {
        codigo = generateUniqueCode()

        // Verificar unicidad con bloqueo
        const existingCodes = await sql`
          SELECT 1 FROM codigos WHERE codigo = ${codigo} FOR UPDATE
        `

        attempts++

        if (existingCodes.length === 0) {
          // Código único encontrado, insertarlo inmediatamente
          await sql`
            INSERT INTO codigos (codigo, estado, fecha_generacion)
            VALUES (${codigo}, 'activo', CURRENT_TIMESTAMP)
          `
          break
        }

        if (attempts >= maxAttempts) {
          throw new Error("No se pudo generar un código único después de múltiples intentos")
        }
      } while (attempts < maxAttempts)

      await sql`COMMIT`

      return NextResponse.json({
        codigo,
        generado_por: payload.usuario || `${payload.tipo}-${payload.id}`,
        fecha_generacion: new Date().toISOString(),
      })
    } catch (error) {
      await sql`ROLLBACK`
      throw error
    }
  } catch (error) {
    console.error("Error generating code:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        detalle: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
