#!/bin/bash

# Script de instalación y verificación - Sistema Papayoo con Sedes
# Versión: 2.1.0
# Fecha: 2024-01-20

set -e  # Salir en caso de error

echo "🎯 Instalando Sistema Papayoo con Gestión de Sedes v2.1.0"
echo "============================================================"

# Verificar variables de entorno
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: Variable DATABASE_URL no está configurada"
    echo "Configura: export DATABASE_URL='postgresql://user:pass@host:port/db'"
    exit 1
fi

if [ -z "$JWT_SECRET" ]; then
    echo "❌ ERROR: Variable JWT_SECRET no está configurada"
    echo "Configura: export JWT_SECRET='tu-clave-secreta-muy-segura'"
    exit 1
fi

echo "✅ Variables de entorno configuradas"

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Verificar si las migraciones ya están aplicadas
echo "🔍 Verificando estado de la base de datos..."

SEDES_EXISTS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'sedes';" 2>/dev/null || echo "0")
SEDE_ID_EXISTS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'sede_id';" 2>/dev/null || echo "0")

echo "Tabla sedes existe: $SEDES_EXISTS"
echo "Columna sede_id existe: $SEDE_ID_EXISTS"

# Aplicar migraciones si es necesario
if [ "$SEDES_EXISTS" -eq "0" ]; then
    echo "🔧 Aplicando migración de sedes..."
    psql "$DATABASE_URL" -f scripts/001_create_sedes_and_add_sede_id_to_clientes.sql
    echo "✅ Migración de sedes aplicada"
else
    echo "ℹ️  Migración de sedes ya aplicada, omitiendo..."
fi

# Verificar sedes por defecto
SEDES_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM sedes WHERE estado = 'activa';" 2>/dev/null || echo "0")
echo "Sedes activas encontradas: $SEDES_COUNT"

if [ "$SEDES_COUNT" -lt "3" ]; then
    echo "⚠️  ADVERTENCIA: Se esperaban al menos 3 sedes activas"
fi

# Verificar estructura de auditoría
AUDIT_EXISTS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'audit_logs';" 2>/dev/null || echo "0")
echo "Tabla audit_logs existe: $AUDIT_EXISTS"

# Verificar integración EPICO
INTEGRATIONS_EXISTS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'integrations';" 2>/dev/null || echo "0")
echo "Tabla integrations existe: $INTEGRATIONS_EXISTS"

# Construir aplicación
echo "🏗️  Construyendo aplicación..."
npm run build

echo ""
echo "✅ INSTALACIÓN COMPLETADA"
echo "========================="
echo ""
echo "🚀 Para iniciar el servidor:"
echo "   npm run dev"
echo ""
echo "🧪 Para ejecutar tests:"
echo "   npm test"
echo ""
echo "🔐 Credenciales por defecto:"
echo "   Admin: admin / admin123"
echo "   Empleado: empleado / empleado123"
echo ""
echo "📊 URLs importantes:"
echo "   Panel Admin: http://localhost:3000/internal/admin"
echo "   Gestión Sedes: http://localhost:3000/internal/admin/sedes"
echo "   Registro: http://localhost:3000/auth"
echo ""
echo "🔍 Verificar instalación:"
echo "   ./verify_system.sh"
echo ""
echo "📚 Documentación:"
echo "   README.md - Guía completa"
echo "   docs/api/sedes.md - API de sedes"
echo "   VERIFICATION_REPORT.md - Reporte de verificación"
