import { describe, it, expect, beforeEach } from "@jest/globals"
import { NextRequest } from "next/server"
import { GET, POST } from "../../app/api/internal/admin/sedes/route"
import jest from "jest"

// Mock de dependencias
jest.mock("@/lib/database", () => ({
  sql: jest.fn(),
}))

jest.mock("@/lib/auth", () => ({
  verifyToken: jest.fn(),
}))

const mockSql = require("@/lib/database").sql
const mockVerifyToken = require("@/lib/auth").verifyToken

describe("Sedes API Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("POST /api/internal/admin/sedes", () => {
    it("should reject request without authorization header", async () => {
      const request = new NextRequest("http://localhost:3000/api/internal/admin/sedes", {
        method: "POST",
        body: JSON.stringify({
          nombre: "Test Sede",
          ciudad: "Test Ciudad",
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe("Token requerido")
    })

    it("should reject request from non-admin user", async () => {
      mockVerifyToken.mockReturnValue({ id: 1, tipo: "empleado" })

      const request = new NextRequest("http://localhost:3000/api/internal/admin/sedes", {
        method: "POST",
        headers: {
          Authorization: "Bearer fake-token",
        },
        body: JSON.stringify({
          nombre: "Test Sede",
          ciudad: "Test Ciudad",
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe("Acceso denegado - Solo administradores")
    })

    it("should reject request with empty nombre", async () => {
      mockVerifyToken.mockReturnValue({ id: 1, tipo: "admin" })

      const request = new NextRequest("http://localhost:3000/api/internal/admin/sedes", {
        method: "POST",
        headers: {
          Authorization: "Bearer admin-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: "",
          ciudad: "Test Ciudad",
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Nombre y ciudad son obligatorios")
    })

    it("should accept valid sede creation request", async () => {
      mockVerifyToken.mockReturnValue({ id: 1, tipo: "admin" })

      // Mock para verificar duplicados (no existe)
      mockSql.mockResolvedValueOnce([])

      // Mock para insertar sede
      mockSql.mockResolvedValueOnce([
        {
          id: 1,
          nombre: "Test Sede",
          ciudad: "Test Ciudad",
          direccion: null,
          estado: "activa",
          fecha_creacion: new Date().toISOString(),
        },
      ])

      // Mock para auditoría
      mockSql.mockResolvedValueOnce([])

      const request = new NextRequest("http://localhost:3000/api/internal/admin/sedes", {
        method: "POST",
        headers: {
          Authorization: "Bearer admin-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: "Test Sede",
          ciudad: "Test Ciudad",
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.sede.nombre).toBe("Test Sede")
      expect(data.sede.ciudad).toBe("Test Ciudad")
    })
  })

  describe("GET /api/internal/admin/sedes", () => {
    it("should return sedes for admin user", async () => {
      mockVerifyToken.mockReturnValue({ id: 1, tipo: "admin" })
      mockSql.mockResolvedValueOnce([
        {
          id: 1,
          nombre: "Sede Principal",
          ciudad: "Medellín",
          direccion: "Carrera 50 #45-30",
          estado: "activa",
          fecha_creacion: new Date().toISOString(),
        },
      ])

      const request = new NextRequest("http://localhost:3000/api/internal/admin/sedes", {
        method: "GET",
        headers: {
          Authorization: "Bearer admin-token",
        },
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.sedes).toHaveLength(1)
      expect(data.sedes[0].nombre).toBe("Sede Principal")
    })

    it("should filter active sedes when onlyActive=true", async () => {
      mockVerifyToken.mockReturnValue({ id: 1, tipo: "admin" })
      mockSql.mockResolvedValueOnce([
        {
          id: 1,
          nombre: "Sede Activa",
          ciudad: "Medellín",
          estado: "activa",
          fecha_creacion: new Date().toISOString(),
        },
      ])

      const request = new NextRequest("http://localhost:3000/api/internal/admin/sedes?onlyActive=true", {
        method: "GET",
        headers: {
          Authorization: "Bearer admin-token",
        },
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.sedes).toHaveLength(1)
      expect(data.sedes[0].estado).toBe("activa")
    })
  })
})
