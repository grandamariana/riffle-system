import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function validateDocument(documento: string): boolean {
  if (!documento || typeof documento !== "string") return false
  const cleaned = documento.trim().replace(/[^0-9]/g, "")
  return /^[0-9]{8,12}$/.test(cleaned)
}

export function validateEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false
  const cleaned = email.trim().toLowerCase()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned) && cleaned.length <= 255
}

export function validateName(name: string): boolean {
  if (!name || typeof name !== "string") return false
  const cleaned = name.trim()
  return cleaned.length >= 2 && cleaned.length <= 100 && /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(cleaned)
}

export function validateCode(code: string): boolean {
  if (!code || typeof code !== "string") return false
  const cleaned = code.trim().toUpperCase()
  return /^[A-Z0-9]{6,12}$/.test(cleaned) // Cambiado de {6,8} a {6,12}
}

export function validateRaffleNumber(number: string): boolean {
  if (!number || typeof number !== "string") return false
  const cleaned = number.trim()
  return /^[0-9]{5}$/.test(cleaned)
}

export function sanitizeInput(input: string, maxLength = 255): string {
  if (!input || typeof input !== "string") return ""
  return input.trim().substring(0, maxLength)
}

export function sanitizeDocument(documento: string): string {
  if (!documento || typeof documento !== "string") return ""
  return documento
    .trim()
    .replace(/[^0-9]/g, "")
    .substring(0, 12)
}

export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== "string") return ""
  return email.trim().toLowerCase().substring(0, 255)
}

export function sanitizeCode(code: string): string {
  if (!code || typeof code !== "string") return ""
  return code
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .substring(0, 8)
}

export function sanitizeName(name: string): string {
  if (!name || typeof name !== "string") return ""
  return name
    .trim()
    .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "")
    .substring(0, 100)
}

// Función para prevenir XSS
export function escapeHtml(text: string): string {
  if (!text || typeof text !== "string") return ""
  const map: { [key: string]: string } = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

// Rate limiting simple para el cliente
const requestCounts = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(identifier: string, maxRequests = 5, windowMs = 60000): boolean {
  const now = Date.now()
  const record = requestCounts.get(identifier)

  if (!record || now > record.resetTime) {
    requestCounts.set(identifier, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= maxRequests) {
    return false
  }

  record.count++
  return true
}

// Función para sanitizar códigos externos
export function sanitizeExternalCode(code: string): string {
  if (!code || typeof code !== "string") return ""
  return code
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .substring(0, 12) // Máximo 12 caracteres
}
