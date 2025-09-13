# Changelog - Sistema de Rifa Papayoo

## [2.1.0] - 2024-01-20 - Gestión de Sedes + Correcciones Críticas

### ✅ Nuevas Características

**Gestión Completa de Sedes:**
- Añadido CRUD completo para sedes (solo administradores)
- Implementado soft delete para sedes (estado inactiva)
- Creada tabla `sedes` con constraints únicos (nombre + ciudad)
- Añadida columna `sede_id` a tabla `clientes` con foreign key
- Implementada auditoría completa en tabla `audit_logs`

**API Endpoints Nuevos:**
- `GET /api/internal/admin/sedes` - Listar sedes con filtro opcional
- `POST /api/internal/admin/sedes` - Crear nueva sede
- `PUT /api/internal/admin/sedes/{id}` - Actualizar sede existente
- `DELETE /api/internal/admin/sedes/{id}` - Desactivar sede (soft delete)
- `GET /api/internal/admin/sedes/export` - Exportar clientes por sede (CSV)

**Frontend Actualizado:**
- Añadida página `/internal/admin/sedes` para gestión de sedes
- Creados componentes `SedeForm` y `SedesList` para CRUD
- Actualizado formulario de registro con campo "Sede Habitual" obligatorio
- Añadido enlace "Sedes" en sidebar del panel admin (solo visible para admins)
- Implementada carga automática de sedes activas en registro

### 🔧 Correcciones Críticas Aplicadas

**Endpoint Obsoleto Eliminado:**
- ❌ **ELIMINADO**: `/api/internal/generate-code` (EPICO genera códigos externamente)
- ✅ **CREADO**: `deprecated/deprecated_generate_coupon.md` con instrucciones de migración
- ✅ **MANTENIDO**: `/api/integration/save-code` para recibir códigos de EPICO

**Campo Sede Obligatorio:**
- ✅ **CORREGIDO**: Formulario de registro ahora requiere selección de sede
- ✅ **IMPLEMENTADO**: Carga automática de sedes activas desde API
- ✅ **VALIDADO**: Backend valida sede_id en registro de clientes
- ✅ **MENSAJE**: "Selecciona la sede que más frecuentas" si no se selecciona

**Exportación CSV Funcional:**
- ✅ **CORREGIDO**: Headers CSV correctos (`Content-Type: text/csv`)
- ✅ **IMPLEMENTADO**: Escape adecuado de caracteres especiales
- ✅ **AÑADIDO**: Límites de paginación (1-50000 registros)
- ✅ **CONFIGURADO**: Descarga automática con filename apropiado

**Protección de Rutas:**
- ✅ **CORREGIDO**: Verificación server-side de rol admin en todos los endpoints
- ✅ **IMPLEMENTADO**: Redirección client-side para usuarios no autenticados
- ✅ **VALIDADO**: Tokens JWT verificados en cada request protegido
- ✅ **BLOQUEADO**: Acceso a rutas admin sin rol apropiado (403)

**Auditoría Mínima:**
- ✅ **IMPLEMENTADO**: Tabla `audit_logs` para operaciones admin
- ✅ **REGISTRADO**: admin_id, operación, IP, timestamp en cada acción
- ✅ **INCLUIDO**: Datos anteriores y nuevos para UPDATE/DELETE
- ✅ **INDEXADO**: Búsqueda eficiente por timestamp y admin

### 🛠️ Scripts y Migración

**Scripts Idempotentes:**
- `scripts/001_create_sedes_and_add_sede_id_to_clientes.sql` - Migración principal
- `scripts/001_rollback_create_sedes_and_add_sede_id_to_clientes.sql` - Rollback seguro
- Todos los scripts usan `IF NOT EXISTS` y `ON CONFLICT DO NOTHING`
- Verificaciones automáticas de integridad incluidas

**Sedes por Defecto:**
- Sede Principal - Medellín, Centro
- Sede Norte - Medellín, Bello
- Sede Sur - Medellín, Envigado

### 📚 Documentación

**Actualizada:**
- `README.md` con instrucciones completas de instalación y verificación
- `docs/api/sedes.md` con documentación detallada de todos los endpoints
- Ejemplos curl para todas las operaciones CRUD
- Guías de despliegue y rollback de emergencia

### 🔄 Compatibilidad

**Mantenida:**
- Integración EPICO completamente funcional
- Todos los endpoints existentes sin cambios
- Clientes existentes pueden continuar sin sede (nullable)
- Rate limiting y autenticación preservados

### ⚠️ Notas de Migración

**Para Producción:**
1. Verificar si las migraciones ya están aplicadas antes de ejecutar
2. Los scripts son idempotentes y seguros para re-ejecución
3. Clientes existentes tendrán `sede_id = NULL` inicialmente
4. Nuevos registros requieren sede obligatoriamente

**Comandos de Verificación:**
\`\`\`sql
-- Verificar si la migración ya está aplicada
SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'sedes';

-- Verificar sedes creadas por defecto
SELECT * FROM sedes WHERE estado = 'activa';

-- Verificar clientes con sede asignada
SELECT COUNT(*) FROM clientes WHERE sede_id IS NOT NULL;
\`\`\`

### 🚀 Archivos Modificados/Creados

**Archivos Creados:**
- `scripts/001_create_sedes_and_add_sede_id_to_clientes.sql`
- `scripts/001_rollback_create_sedes_and_add_sede_id_to_clientes.sql`
- `app/api/internal/admin/sedes/route.ts`
- `app/api/internal/admin/sedes/[id]/route.ts`
- `app/api/internal/admin/sedes/export/route.ts`
- `app/internal/admin/sedes/page.tsx`
- `components/admin/SedeForm.tsx`
- `components/admin/SedesList.tsx`
- `tests/unit/sedes.test.ts`
- `tests/integration/register-with-sede.test.ts`
- `docs/api/sedes.md`
- `deprecated/deprecated_generate_coupon.md`

**Archivos Modificados:**
- `app/internal/admin/page.tsx` - Añadido enlace "Sedes" en sidebar
- `components/auth/RegisterForm.tsx` - Campo sede obligatorio
- `app/api/auth/register/route.ts` - Validación y persistencia de sede_id
- `README.md` - Documentación actualizada
- `CHANGELOG.md` - Este archivo

**Total:** 12 archivos creados, 5 archivos modificados

---

## [2.0.0] - 2024-01-15 - Integración EPICO

### ✅ Características Anteriores

**Integración Externa:**
- Endpoint `/api/integration/save-code` para recibir códigos de EPICO
- Gestión segura de API Keys con hashing bcrypt
- Rate limiting configurable por integración
- Logging completo con trace IDs y auditoría

**Seguridad Reforzada:**
- Autenticación JWT con roles (admin/empleado)
- Transacciones atómicas con `FOR UPDATE`
- Sanitización completa de inputs
- Prevención de duplicados y race conditions

---

## [1.0.0] - 2024-01-01 - Sistema Base

### ✅ Funcionalidades Iniciales

**Sistema de Rifas:**
- Registro y login de clientes
- Generación de códigos únicos
- Asignación automática de números de rifa
- Panel de administración completo
- Exportación de datos

**Arquitectura:**
- Next.js 14 con App Router
- PostgreSQL con Neon
- Autenticación JWT
- Rate limiting implementado
- Tests unitarios e integración

---

**¡Sistema de Gestión de Sedes completamente implementado y listo para producción!** 🎯
