import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"

const JWT_SECRET = process.env.JWT_SECRET || "papayoo-secret-key-fallback"
const JWT_EXPIRES_IN = "2h" // Aumentado para mejor UX

export interface TokenPayload {
  id: number
  tipo: "cliente" | "empleado" | "admin"
  documento?: string
  usuario?: string
  iat?: number
  exp?: number
}

export function generateToken(payload: Omit<TokenPayload, "iat" | "exp">): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: "papayoo-raffle-system",
    audience: "papayoo-users",
  })
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: "papayoo-raffle-system",
      audience: "papayoo-users",
    }) as TokenPayload

    // Validar estructura del payload
    if (!decoded.id || !decoded.tipo || !["cliente", "empleado", "admin"].includes(decoded.tipo)) {
      return null
    }

    return decoded
  } catch (error) {
    console.error("Token verification failed:", error)
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  if (!password || typeof password !== "string" || password.length < 6) {
    throw new Error("Password must be at least 6 characters long")
  }
  return bcrypt.hash(password, 12) // Aumentado a 12 rounds para mayor seguridad
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash || typeof password !== "string" || typeof hash !== "string") {
    return false
  }
  try {
    return await bcrypt.compare(password, hash)
  } catch (error) {
    console.error("Password comparison failed:", error)
    return false
  }
}

export function generateUniqueCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""

  // Generar código de 8 caracteres para mayor unicidad
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  // Agregar timestamp parcial para mayor unicidad
  const timestamp = Date.now().toString(36).slice(-2).toUpperCase()
  return result.substring(0, 6) + timestamp
}

export function generateRaffleNumber(): string {
  // Generar número entre 10000 y 99999 para evitar números con ceros iniciales
  const min = 10000
  const max = 99999
  return (Math.floor(Math.random() * (max - min + 1)) + min).toString()
}

// Función para validar la fuerza de la contraseña
export function validatePasswordStrength(password: string): { isValid: boolean; message: string } {
  if (!password || typeof password !== "string") {
    return { isValid: false, message: "La contraseña es requerida" }
  }

  if (password.length < 6) {
    return { isValid: false, message: "La contraseña debe tener al menos 6 caracteres" }
  }

  if (password.length > 128) {
    return { isValid: false, message: "La contraseña es demasiado larga" }
  }

  // Verificar que no sea una contraseña común
  const commonPasswords = ["123456", "password", "123456789", "qwerty", "abc123", "password123"]
  if (commonPasswords.includes(password.toLowerCase())) {
    return { isValid: false, message: "La contraseña es demasiado común" }
  }

  return { isValid: true, message: "Contraseña válida" }
}
