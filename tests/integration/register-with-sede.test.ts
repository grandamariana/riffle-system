import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals"
import { sql } from "@/lib/database"

describe("Client Registration with Sede Integration", () => {
  let testSedeId: number
  let testCodigoId: number

  beforeAll(async () => {
    // Crear sede de prueba
    const [sede] = await sql`
      INSERT INTO sedes (nombre, ciudad, estado)
      VALUES ('Sede Test', 'Ciudad Test', 'activa')
      RETURNING id
    `
    testSedeId = sede.id

    // Crear código de prueba
    const [codigo] = await sql`
      INSERT INTO codigos (codigo, estado)
      VALUES ('TEST001', 'activo')
      RETURNING id
    `
    testCodigoId = codigo.id
  })

  afterAll(async () => {
    // Limpiar datos de prueba
    await sql`DELETE FROM participaciones WHERE cliente_id IN (SELECT id FROM clientes WHERE documento = '12345678')`
    await sql`DELETE FROM clientes WHERE documento = '12345678'`
    await sql`DELETE FROM codigos WHERE id = ${testCodigoId}`
    await sql`DELETE FROM sedes WHERE id = ${testSedeId}`
  })

  beforeEach(async () => {
    // Limpiar cliente de prueba antes de cada test
    await sql`DELETE FROM participaciones WHERE cliente_id IN (SELECT id FROM clientes WHERE documento = '12345678')`
    await sql`DELETE FROM clientes WHERE documento = '12345678'`

    // Resetear código a activo
    await sql`UPDATE codigos SET estado = 'activo' WHERE id = ${testCodigoId}`
  })

  it("should successfully register client with valid sede", async () => {
    const registrationData = {
      nombre: "Test",
      apellidos: "User",
      documento: "12345678",
      correo: "test@example.com",
      contraseña: "password123",
      codigo: "TEST001",
      sede_id: testSedeId,
    }

    const response = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(registrationData),
    })

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.token).toBeDefined()
    expect(data.cliente.sede.id).toBe(testSedeId)
    expect(data.numeroRifa).toBeDefined()

    // Verificar que el cliente fue creado con sede_id
    const [cliente] = await sql`
      SELECT sede_id FROM clientes WHERE documento = '12345678'
    `
    expect(cliente.sede_id).toBe(testSedeId)

    // Verificar que el código fue marcado como usado
    const [codigo] = await sql`
      SELECT estado FROM codigos WHERE id = ${testCodigoId}
    `
    expect(codigo.estado).toBe("usado")
  })

  it("should reject registration with inactive sede", async () => {
    // Desactivar sede temporalmente
    await sql`UPDATE sedes SET estado = 'inactiva' WHERE id = ${testSedeId}`

    const registrationData = {
      nombre: "Test",
      apellidos: "User",
      documento: "12345678",
      correo: "test@example.com",
      contraseña: "password123",
      codigo: "TEST001",
      sede_id: testSedeId,
    }

    const response = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(registrationData),
    })

    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.error).toBe("Sede inválida o inactiva")

    // Reactivar sede para otros tests
    await sql`UPDATE sedes SET estado = 'activa' WHERE id = ${testSedeId}`
  })

  it("should reject registration without sede_id", async () => {
    const registrationData = {
      nombre: "Test",
      apellidos: "User",
      documento: "12345678",
      correo: "test@example.com",
      contraseña: "password123",
      codigo: "TEST001",
      // sede_id omitido intencionalmente
    }

    const response = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(registrationData),
    })

    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.error).toBe("Todos los campos son obligatorios")
  })

  it("should export clients by sede in CSV format", async () => {
    // Primero registrar un cliente
    const registrationData = {
      nombre: "Test",
      apellidos: "User",
      documento: "12345678",
      correo: "test@example.com",
      contraseña: "password123",
      codigo: "TEST001",
      sede_id: testSedeId,
    }

    await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(registrationData),
    })

    // Ahora exportar clientes de la sede
    const exportResponse = await fetch(
      `http://localhost:3000/api/internal/admin/sedes/export?sede_id=${testSedeId}&type=csv&limit=100`,
      {
        method: "GET",
        headers: {
          Authorization: "Bearer admin-token",
        },
      },
    )

    expect(exportResponse.status).toBe(200)
    expect(exportResponse.headers.get("content-type")).toBe("text/csv; charset=utf-8")
    expect(exportResponse.headers.get("content-disposition")).toContain("attachment")

    const csvContent = await exportResponse.text()
    expect(csvContent).toContain("nombre,apellidos,documento,telefono,correo,fecha_registro")
    expect(csvContent).toContain("Test,User,12345678")
  })
})
