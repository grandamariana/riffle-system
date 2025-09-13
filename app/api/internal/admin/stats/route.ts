import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
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

    // Obtener estadísticas
    const [totalClientes] = await sql`
      SELECT COUNT(*) as count FROM clientes
    `

    const [totalParticipaciones] = await sql`
      SELECT COUNT(*) as count FROM participaciones
    `

    const [codigosUsados] = await sql`
      SELECT COUNT(*) as count FROM codigos WHERE estado = 'usado'
    `

    const [codigosDisponibles] = await sql`
      SELECT COUNT(*) as count FROM codigos WHERE estado = 'activo'
    `

    const [rifaConfig] = await sql`
      SELECT estado, numero_ganador FROM configuracion_rifa LIMIT 1
    `

    return NextResponse.json({
      total_clientes: Number.parseInt(totalClientes.count),
      total_participaciones: Number.parseInt(totalParticipaciones.count),
      codigos_usados: Number.parseInt(codigosUsados.count),
      codigos_disponibles: Number.parseInt(codigosDisponibles.count),
      estado_rifa: rifaConfig?.estado || "activa",
      numero_ganador: rifaConfig?.numero_ganador,
    })
  } catch (error) {
    console.error("Error getting stats:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
