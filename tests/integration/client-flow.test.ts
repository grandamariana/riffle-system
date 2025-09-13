import { describe, it, expect, beforeAll, afterAll } from "@jest/globals"
import request from "supertest"
import { createIntegration } from "@/lib/integration-auth"
import { sql } from "@/lib/database"
import app from "@/app" // Declare the app variable

describe("Client Registration Flow with External Codes", () => {
  let apiKey: string
  let integrationId: number
  let testCode: string

  beforeAll(async () => {
    const { integration, apiKey: testApiKey } = await createIntegration("TEST_CLIENT_FLOW", [], 100)
    apiKey = testApiKey
    integrationId = integration.id
    testCode = "CLIENTTEST123"
  })

  afterAll(async () => {
    // Limpiar datos de prueba
    await sql`DELETE FROM participaciones WHERE codigo_id IN (
      SELECT id FROM codigos WHERE generado_por = 'TEST_CLIENT_FLOW'
    )`
    await sql`DELETE FROM clientes WHERE documento = '99999999'`
    await sql`DELETE FROM codigos WHERE generado_por = 'TEST_CLIENT_FLOW'`
    await sql`DELETE FROM integrations WHERE id = ${integrationId}`
  })

  it("should complete full flow: save code -> validate -> register -> participate", async () => {
    // 1. EPICO guarda código
    const saveResponse = await request(app)
      .post("/api/integration/save-code")
      .set("Authorization", `Bearer ${apiKey}`)
      .send({ codigo: testCode })

    expect(saveResponse.status).toBe(200)

    // 2. Cliente valida código
    const validateResponse = await request(app).post("/api/auth/validate-code").send({ codigo: testCode })

    expect(validateResponse.status).toBe(200)
    expect(validateResponse.body.valid).toBe(true)

    // 3. Cliente se registra
    const registerResponse = await request(app).post("/api/auth/register").send({
      nombre: "Test",
      apellidos: "Cliente",
      documento: "99999999",
      correo: "test@cliente.com",
      contraseña: "password123",
      codigo: testCode,
    })

    expect(registerResponse.status).toBe(200)
    expect(registerResponse.body.token).toBeDefined()

    // 4. Verificar que el código se marcó como usado
    const [usedCode] = await sql`
      SELECT estado FROM codigos WHERE codigo = ${testCode}
    `
    expect(usedCode.estado).toBe("usado")

    // 5. Cliente ve sus participaciones
    const participateResponse = await request(app)
      .post("/api/raffle/participate")
      .set("Authorization", `Bearer ${registerResponse.body.token}`)
      .send({})

    expect(participateResponse.status).toBe(200)
    expect(participateResponse.body.participaciones).toHaveLength(1)
    expect(participateResponse.body.nuevo_numero).toBeDefined()
  })
})
