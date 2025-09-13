# Endpoint Obsoleto: Generate Coupon

## Estado: DEPRECATED (Eliminado)

### Descripción
El endpoint `/api/internal/generate-code` (anteriormente `/api/integration/generate-coupon`) ha sido **eliminado** del sistema Papayoo debido a cambios en la arquitectura de integración con EPICO.

### Razón de la Eliminación
- **EPICO ahora genera códigos externamente** en su propio sistema de facturación
- Los códigos se envían a Papayoo a través del endpoint `/api/integration/save-code`
- Ya no es necesario que Papayoo genere códigos internamente para integraciones externas

### Funcionalidad Anterior
\`\`\`typescript
// ENDPOINT ELIMINADO - NO USAR
POST /api/internal/generate-code
Authorization: Bearer <employee_or_admin_token>

// Respuesta anterior:
{
  "codigo": "ABC12345",
  "generado_por": "empleado-1",
  "fecha_generacion": "2024-01-20T10:00:00.000Z"
}
\`\`\`

### Migración
Si necesitas generar códigos:

1. **Para empleados/admins**: Usar la interfaz web del panel interno
2. **Para integraciones externas**: EPICO genera códigos y los envía via:
   \`\`\`bash
   POST /api/integration/save-code
   Authorization: Bearer <epico_api_key>
   Content-Type: application/json
   
   {
     "codigo": "ABC12345"
   }
   \`\`\`

### Cómo Revertir (Solo si es necesario)
Si por alguna razón necesitas restaurar la funcionalidad:

1. **Restaurar el archivo**: `app/api/internal/generate-code/route.ts`
2. **Código de referencia**:
\`\`\`typescript
import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { verifyToken, generateUniqueCode } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token de autorización requerido" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const payload = verifyToken(token)

    if (!payload || (payload.tipo !== "empleado" && payload.tipo !== "admin")) {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 403 })
    }

    // Generar código único
    const codigo = generateUniqueCode()
    
    // Insertar en base de datos
    await sql`
      INSERT INTO codigos (codigo, estado, generado_por, fecha_generacion)
      VALUES (${codigo}, 'activo', ${payload.usuario || `${payload.tipo}-${payload.id}`}, CURRENT_TIMESTAMP)
    `

    return NextResponse.json({
      codigo,
      generado_por: payload.usuario || `${payload.tipo}-${payload.id}`,
      fecha_generacion: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error generating code:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
\`\`\`

### Fecha de Eliminación
**20 de enero de 2024** - Commit: `feat: remove obsolete generate-coupon endpoint for EPICO integration`

### Contacto
Para preguntas sobre esta eliminación, contactar al equipo de desarrollo.
