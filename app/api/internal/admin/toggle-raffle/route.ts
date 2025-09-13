import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { verifyToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token de autorización requerido" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const payload = verifyToken(token)

    if (!payload || payload.tipo !== "admin") {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 403 })
    }

    const { estado } = await request.json()

    if (!estado || !["activa", "pausada", "cerrada"].includes(estado)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 })
    }

    // Actualizar estado de la rifa
    await sql`
      UPDATE configuracion_rifa 
      SET estado = ${estado}, fecha_actualizacion = CURRENT_TIMESTAMP
    `

    return NextResponse.json({ success: true, estado })
  } catch (error) {
    console.error("Error toggling raffle:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
