import { beforeAll, afterAll } from "@jest/globals"

// Setup global para tests
beforeAll(async () => {
  // Configurar base de datos de test si es necesario
  process.env.NODE_ENV = "test"
})

afterAll(async () => {
  // Limpiar conexiones
  // await sql.end() // Si es necesario cerrar conexiones
})
