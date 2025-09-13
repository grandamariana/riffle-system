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

    if (!payload || payload.tipo !== "cliente") {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    // Obtener datos del cliente
    const [cliente] = await sql`
      SELECT id, nombre, apellidos, documento, correo
      FROM clientes 
      WHERE id = ${payload.id}
    `

    if (!cliente) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    // Obtener todas las participaciones del cliente
    const participaciones = await sql`
      SELECT numero_rifa, fecha_asignacion
      FROM participaciones 
      WHERE cliente_id = ${cliente.id}
      ORDER BY fecha_asignacion DESC
    `

    // Obtener la participación más reciente para marcarla como nueva
    const [ultimaParticipacion] = participaciones
    const esNueva = ultimaParticipacion && new Date(ultimaParticipacion.fecha_asignacion).getTime() > Date.now() - 60000 // Últimos 60 segundos

    return NextResponse.json({
      cliente: {
        nombre: cliente.nombre,
        apellidos: cliente.apellidos,
        documento: cliente.documento,
      },
      participaciones,
      nuevo_numero: esNueva ? ultimaParticipacion.numero_rifa : null,
    })
  } catch (error) {
    console.error("Error in participation:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
