import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { comparePassword, generateToken } from "@/lib/auth"
import { authRateLimit, getClientIP } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request)
    const rateLimitResult = await authRateLimit.check(clientIP)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Demasiados intentos de login. Intenta nuevamente en 15 minutos.",
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.reset.toString(),
          },
        },
      )
    }

    const { usuario, contraseña } = await request.json()

    if (!usuario?.trim() || !contraseña?.trim()) {
      return NextResponse.json({ error: "Usuario y contraseña requeridos" }, { status: 400 })
    }

    // Sanitizar entrada
    const usuarioSanitized = usuario.trim().toLowerCase().substring(0, 50)

    // Validar formato básico
    if (!/^[a-z0-9_]{3,50}$/.test(usuarioSanitized)) {
      return NextResponse.json({ error: "Formato de usuario inválido" }, { status: 400 })
    }

    // Buscar usuario interno
    const [usuarioInterno] = await sql`
      SELECT id, rol, usuario, contraseña_hash
      FROM usuarios_internos 
      WHERE usuario = ${usuarioSanitized}
    `

    if (!usuarioInterno) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
    }

    // Verificar contraseña
    const validPassword = await comparePassword(contraseña, usuarioInterno.contraseña_hash)
    if (!validPassword) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
    }

    // Generar token con expiración más larga para usuarios internos
    const token = generateToken({
      id: usuarioInterno.id,
      tipo: usuarioInterno.rol,
      usuario: usuarioInterno.usuario,
    })

    return NextResponse.json({
      token,
      rol: usuarioInterno.rol,
      usuario: usuarioInterno.usuario,
    })
  } catch (error) {
    console.error("Error in internal login:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
