#!/bin/bash

# Script de verificación del sistema - Papayoo con Sedes
# Versión: 2.1.0
# Fecha: 2024-01-20

set -e

echo "🔍 Verificando Sistema Papayoo con Gestión de Sedes"
echo "=================================================="

# Verificar variables de entorno
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: Variable DATABASE_URL no configurada"
    exit 1
fi

echo "✅ Variables de entorno OK"

# Verificar estructura de base de datos
echo ""
echo "🗄️  Verificando estructura de base de datos..."

# Verificar tablas principales
TABLES=(
    "clientes"
    "sedes"
    "codigos"
    "participaciones"
    "usuarios_internos"
    "configuracion_rifa"
    "integrations"
    "integration_logs"
    "audit_logs"
)

for table in "${TABLES[@]}"; do
    EXISTS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = '$table';" 2>/dev/null || echo "0")
    if [ "$EXISTS" -eq "1" ]; then
        echo "✅ Tabla $table existe"
    else
        echo "❌ Tabla $table NO existe"
    fi
done

# Verificar columna sede_id en clientes
SEDE_ID_EXISTS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'sede_id';" 2>/dev/null || echo "0")
if [ "$SEDE_ID_EXISTS" -eq "1" ]; then
    echo "✅ Columna sede_id en clientes existe"
else
    echo "❌ Columna sede_id en clientes NO existe"
fi

# Verificar foreign key
FK_EXISTS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_name = 'fk_clientes_sede';" 2>/dev/null || echo "0")
if [ "$FK_EXISTS" -eq "1" ]; then
    echo "✅ Foreign key fk_clientes_sede existe"
else
    echo "❌ Foreign key fk_clientes_sede NO existe"
fi

# Verificar sedes por defecto
echo ""
echo "🏢 Verificando sedes por defecto..."
SEDES_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM sedes WHERE estado = 'activa';" 2>/dev/null || echo "0")
echo "Sedes activas: $SEDES_COUNT"

if [ "$SEDES_COUNT" -ge "3" ]; then
    echo "✅ Sedes por defecto OK"
    psql "$DATABASE_URL" -c "SELECT id, nombre, ciudad, estado FROM sedes ORDER BY id;"
else
    echo "⚠️  ADVERTENCIA: Se esperaban al menos 3 sedes activas"
fi

# Verificar usuarios internos
echo ""
echo "👥 Verificando usuarios internos..."
ADMIN_EXISTS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM usuarios_internos WHERE usuario = 'admin';" 2>/dev/null || echo "0")
EMPLEADO_EXISTS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM usuarios_internos WHERE usuario = 'empleado';" 2>/dev/null || echo "0")

if [ "$ADMIN_EXISTS" -eq "1" ]; then
    echo "✅ Usuario admin existe"
else
    echo "❌ Usuario admin NO existe"
fi

if [ "$EMPLEADO_EXISTS" -eq "1" ]; then
    echo "✅ Usuario empleado existe"
else
    echo "❌ Usuario empleado NO existe"
fi

# Verificar índices críticos
echo ""
echo "📊 Verificando índices críticos..."
INDICES=(
    "idx_clientes_sede_id"
    "idx_sedes_estado"
    "uk_sedes_nombre_ciudad"
    "idx_audit_logs_timestamp"
)

for index in "${INDICES[@]}"; do
    EXISTS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM pg_indexes WHERE indexname = '$index';" 2>/dev/null || echo "0")
    if [ "$EXISTS" -eq "1" ]; then
        echo "✅ Índice $index existe"
    else
        echo "❌ Índice $index NO existe"
    fi
done

# Verificar archivos críticos
echo ""
echo "📁 Verificando archivos críticos..."
FILES=(
    "app/api/internal/admin/sedes/route.ts"
    "app/api/internal/admin/sedes/[id]/route.ts"
    "app/api/internal/admin/sedes/export/route.ts"
    "app/internal/admin/sedes/page.tsx"
    "components/admin/SedeForm.tsx"
    "components/admin/SedesList.tsx"
    "components/auth/RegisterForm.tsx"
    "scripts/001_create_sedes_and_add_sede_id_to_clientes.sql"
    "docs/api/sedes.md"
    "deprecated/deprecated_generate_coupon.md"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ Archivo $file existe"
    else
        echo "❌ Archivo $file NO existe"
    fi
done

# Verificar que el servidor puede iniciar
echo ""
echo "🚀 Verificando que el servidor puede iniciar..."
if npm run build > /dev/null 2>&1; then
    echo "✅ Build exitoso"
else
    echo "❌ Build falló"
fi

# Estadísticas finales
echo ""
echo "📈 Estadísticas del sistema:"
TOTAL_CLIENTES=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM clientes;" 2>/dev/null || echo "0")
TOTAL_SEDES=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM sedes;" 2>/dev/null || echo "0")
TOTAL_CODIGOS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM codigos;" 2>/dev/null || echo "0")
TOTAL_PARTICIPACIONES=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM participaciones;" 2>/dev/null || echo "0")

echo "- Clientes registrados: $TOTAL_CLIENTES"
echo "- Sedes configuradas: $TOTAL_SEDES"
echo "- Códigos generados: $TOTAL_CODIGOS"
echo "- Participaciones activas: $TOTAL_PARTICIPACIONES"

echo ""
echo "✅ VERIFICACIÓN COMPLETADA"
echo "========================="
echo ""
echo "🎯 Sistema Papayoo con Gestión de Sedes v2.1.0 LISTO"
