import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required")
}

export const sql = neon(process.env.DATABASE_URL)

// Tipos de datos
export interface Cliente {
  id: number
  nombre: string
  apellidos: string
  documento: string
  correo: string
  contraseña_hash: string
  fecha_registro: string
}

export interface Codigo {
  id: number
  codigo: string
  estado: "activo" | "usado" | "expirado"
  fecha_generacion: string
  fecha_uso?: string
  fecha_expiracion?: string
}

export interface Participacion {
  id: number
  cliente_id: number
  codigo_id: number
  numero_rifa: string
  fecha_asignacion: string
}

export interface UsuarioInterno {
  id: number
  rol: "empleado" | "admin"
  usuario: string
  contraseña_hash: string
  fecha_creacion: string
}

export interface ConfiguracionRifa {
  id: number
  estado: "activa" | "pausada" | "cerrada"
  numero_ganador?: string
  fecha_cierre?: string
  fecha_actualizacion: string
}
