import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals"
import request from "supertest"
import { createIntegration } from "@/lib/integration-auth"
import { sql } from "@/lib/database"
import app from "@/app" // Declare the app variable

describe("POST /api/integration/save-code", () => {
  let apiKey: string
  let integrationId: number

  beforeAll(async () => {
    // Crear integración de prueba
    const { integration, apiKey: testApiKey } = await createIntegration("TEST_INTEGRATION", [], 100)
    apiKey = testApiKey
    integrationId = integration.id
  })

  afterAll(async () => {
    // Limpiar datos de prueba
    await sql`DELETE FROM integration_logs WHERE integration_name = 'TEST_INTEGRATION'`
    await sql`DELETE FROM codigos WHERE generado_por = 'TEST_INTEGRATION'`
    await sql`DELETE FROM integrations WHERE id = ${integrationId}`
  })

  beforeEach(async () => {
    // Limpiar códigos de prueba antes de cada test
    await sql`DELETE FROM codigos WHERE generado_por = 'TEST_INTEGRATION'`
  })

  it("should save a valid code successfully", async () => {
    const response = await request(app)
      .post("/api/integration/save-code")
      .set("Authorization", `Bearer ${apiKey}`)
      .set("Content-Type", "application/json")
      .send({ codigo: "TEST123" })

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.codigo).toBe("TEST123")
    expect(response.body.trace_id).toBeDefined()
    expect(response.headers["x-trace-id"]).toBeDefined()
  })

  it("should reject duplicate codes", async () => {
    // Insertar código primero
    await sql`
      INSERT INTO codigos (codigo, estado, generado_por) 
      VALUES ('DUPLICATE123', 'activo', 'TEST_INTEGRATION')
    `

    const response = await request(app)
      .post("/api/integration/save-code")
      .set("Authorization", `Bearer ${apiKey}`)
      .set("Content-Type", "application/json")
      .send({ codigo: "DUPLICATE123" })

    expect(response.status).toBe(409)
    expect(response.body.success).toBe(false)
    expect(response.body.error).toBe("Code already exists")
  })

  it("should reject invalid API key", async () => {
    const response = await request(app)
      .post("/api/integration/save-code")
      .set("Authorization", "Bearer invalid_key")
      .set("Content-Type", "application/json")
      .send({ codigo: "TEST123" })

    expect(response.status).toBe(403)
    expect(response.body.success).toBe(false)
    expect(response.body.error).toBe("Invalid API key or unauthorized access")
  })

  it("should reject invalid code format", async () => {
    const response = await request(app)
      .post("/api/integration/save-code")
      .set("Authorization", `Bearer ${apiKey}`)
      .set("Content-Type", "application/json")
      .send({ codigo: "invalid-code!" })

    expect(response.status).toBe(400)
    expect(response.body.success).toBe(false)
    expect(response.body.error).toBe("Code must be 6-12 alphanumeric characters")
  })

  it("should handle rate limiting", async () => {
    // Hacer múltiples requests rápidamente para activar rate limiting
    const promises = Array.from({ length: 105 }, (_, i) =>
      request(app)
        .post("/api/integration/save-code")
        .set("Authorization", `Bearer ${apiKey}`)
        .set("Content-Type", "application/json")
        .send({ codigo: `TEST${i.toString().padStart(3, "0")}` }),
    )

    const responses = await Promise.all(promises)
    const rateLimitedResponses = responses.filter((r) => r.status === 429)

    expect(rateLimitedResponses.length).toBeGreaterThan(0)
  })
})
