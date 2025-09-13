import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token de autorización requerido" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const payload = verifyToken(token)

    if (!payload || (payload.tipo !== "empleado" && payload.tipo !== "admin")) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    return NextResponse.json({
      valid: true,
      rol: payload.tipo,
      usuario: payload.usuario,
    })
  } catch (error) {
    console.error("Error verifying token:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
