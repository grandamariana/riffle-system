# API de Gestión de Sedes - Papayoo

## Descripción General

La API de gestión de sedes permite a los administradores crear, leer, actualizar y desactivar sedes de Papayoo. Todas las operaciones requieren autenticación con rol de administrador.

## Autenticación

Todas las rutas requieren un token JWT válido con rol `admin`:

\`\`\`
Authorization: Bearer <jwt_token>
\`\`\`

## Endpoints

### 1. Listar Sedes

**GET** `/api/internal/admin/sedes`

Lista todas las sedes o solo las activas.

#### Parámetros de Consulta

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `onlyActive` | boolean | Si es `true`, solo devuelve sedes activas |

#### Respuesta Exitosa (200)

\`\`\`json
{
  "sedes": [
    {
      "id": 1,
      "nombre": "Sede Principal",
      "ciudad": "Medellín",
      "direccion": "Carrera 50 #45-30, Centro",
      "estado": "activa",
      "fecha_creacion": "2024-01-20T10:00:00.000Z"
    }
  ]
}
\`\`\`

#### Códigos de Error

- **401**: Token requerido
- **403**: Acceso denegado (no es admin)
- **500**: Error interno del servidor

### 2. Crear Sede

**POST** `/api/internal/admin/sedes`

Crea una nueva sede.

#### Cuerpo de la Petición

\`\`\`json
{
  "nombre": "Nueva Sede",
  "ciudad": "Bogotá",
  "direccion": "Calle 100 #15-20",
  "estado": "activa"
}
\`\`\`

#### Validaciones

- `nombre`: Obligatorio, máximo 100 caracteres
- `ciudad`: Obligatorio, máximo 100 caracteres  
- `direccion`: Opcional, máximo 150 caracteres
- `estado`: Opcional, debe ser "activa" o "inactiva" (default: "activa")
- Combinación `nombre + ciudad` debe ser única

#### Respuesta Exitosa (201)

\`\`\`json
{
  "sede": {
    "id": 4,
    "nombre": "Nueva Sede",
    "ciudad": "Bogotá",
    "direccion": "Calle 100 #15-20",
    "estado": "activa",
    "fecha_creacion": "2024-01-20T15:30:00.000Z"
  }
}
\`\`\`

#### Códigos de Error

- **400**: Datos inválidos o faltantes
- **401**: Token requerido
- **403**: Acceso denegado
- **409**: Ya existe una sede con ese nombre en esa ciudad
- **500**: Error interno del servidor

### 3. Actualizar Sede

**PUT** `/api/internal/admin/sedes/{id}`

Actualiza una sede existente.

#### Parámetros de Ruta

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | integer | ID de la sede a actualizar |

#### Cuerpo de la Petición

\`\`\`json
{
  "nombre": "Sede Actualizada",
  "ciudad": "Medellín",
  "direccion": "Nueva dirección",
  "estado": "activa"
}
\`\`\`

#### Respuesta Exitosa (200)

\`\`\`json
{
  "sede": {
    "id": 1,
    "nombre": "Sede Actualizada",
    "ciudad": "Medellín",
    "direccion": "Nueva dirección",
    "estado": "activa",
    "fecha_creacion": "2024-01-20T10:00:00.000Z"
  }
}
\`\`\`

#### Códigos de Error

- **400**: ID inválido o datos incorrectos
- **401**: Token requerido
- **403**: Acceso denegado
- **404**: Sede no encontrada
- **409**: Conflicto con otra sede (nombre + ciudad duplicado)
- **500**: Error interno del servidor

### 4. Desactivar Sede

**DELETE** `/api/internal/admin/sedes/{id}`

Desactiva una sede (soft delete). Los clientes asociados mantienen su referencia.

#### Parámetros de Ruta

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | integer | ID de la sede a desactivar |

#### Respuesta Exitosa (200)

\`\`\`json
{
  "sede": {
    "id": 1,
    "nombre": "Sede Principal",
    "ciudad": "Medellín",
    "direccion": "Carrera 50 #45-30, Centro",
    "estado": "inactiva",
    "fecha_creacion": "2024-01-20T10:00:00.000Z"
  },
  "mensaje": "Sede desactivada. 15 clientes asociados mantendrán su referencia."
}
\`\`\`

#### Códigos de Error

- **400**: ID inválido
- **401**: Token requerido
- **403**: Acceso denegado
- **404**: Sede no encontrada
- **500**: Error interno del servidor

### 5. Exportar Clientes por Sede

**GET** `/api/internal/admin/sedes/export`

Exporta los clientes de una sede específica en formato CSV.

#### Parámetros de Consulta

| Parámetro | Tipo | Descripción | Requerido |
|-----------|------|-------------|-----------|
| `sede_id` | integer | ID de la sede | Sí |
| `type` | string | Formato de exportación (solo "csv") | No (default: "csv") |
| `limit` | integer | Límite de registros (1-50000) | No (default: 10000) |

#### Respuesta Exitosa (200)

**Headers:**
\`\`\`
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="clientes_sede_1_Sede_Principal.csv"
\`\`\`

**Contenido CSV:**
\`\`\`csv
nombre,apellidos,documento,telefono,correo,fecha_registro
Juan,Pérez,12345678,,juan.perez@email.com,2024-01-20
María,González,87654321,,maria.gonzalez@email.com,2024-01-21
\`\`\`

#### Códigos de Error

- **400**: Parámetros inválidos
- **401**: Token requerido
- **403**: Acceso denegado
- **404**: Sede no encontrada
- **500**: Error interno del servidor

## Ejemplos de Uso

### Crear una nueva sede

\`\`\`bash
curl -X POST http://localhost:3000/api/internal/admin/sedes \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Sede Norte",
    "ciudad": "Barranquilla",
    "direccion": "Calle 84 #45-23",
    "estado": "activa"
  }'
\`\`\`

### Listar solo sedes activas

\`\`\`bash
curl -X GET "http://localhost:3000/api/internal/admin/sedes?onlyActive=true" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
\`\`\`

### Exportar clientes de una sede

\`\`\`bash
curl -X GET "http://localhost:3000/api/internal/admin/sedes/export?sede_id=1&type=csv&limit=5000" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -o clientes_sede_1.csv
\`\`\`

### Actualizar una sede

\`\`\`bash
curl -X PUT http://localhost:3000/api/internal/admin/sedes/1 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Sede Principal Actualizada",
    "ciudad": "Medellín",
    "direccion": "Nueva dirección actualizada",
    "estado": "activa"
  }'
\`\`\`

### Desactivar una sede

\`\`\`bash
curl -X DELETE http://localhost:3000/api/internal/admin/sedes/1 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
\`\`\`

## Auditoría

Todas las operaciones de sedes se registran en la tabla `audit_logs` con la siguiente información:

- ID del administrador que realizó la operación
- Tipo de operación (CREATE, UPDATE, DELETE, EXPORT)
- Datos anteriores y nuevos (para UPDATE y DELETE)
- Dirección IP del cliente
- Timestamp de la operación

## Rate Limiting

Las operaciones de sedes están sujetas al rate limiting general de la API:
- 100 requests por minuto por IP para operaciones de lectura
- 20 requests por minuto por IP para operaciones de escritura

## Consideraciones de Seguridad

1. **Autenticación obligatoria**: Todas las rutas requieren token JWT válido
2. **Autorización por rol**: Solo usuarios con rol `admin` pueden acceder
3. **Validación de entrada**: Todos los inputs son sanitizados y validados
4. **Soft delete**: Las sedes se desactivan, no se eliminan físicamente
5. **Auditoría completa**: Todas las operaciones quedan registradas
6. **Límites de exportación**: Máximo 50,000 registros por exportación
