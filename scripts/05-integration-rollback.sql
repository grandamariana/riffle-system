-- Script de rollback para la migración de integraciones
-- USAR SOLO SI ES NECESARIO REVERTIR LOS CAMBIOS

-- 1. Eliminar índices creados
DROP INDEX IF EXISTS idx_integrations_name;
DROP INDEX IF EXISTS idx_integrations_active;
DROP INDEX IF EXISTS idx_integration_logs_trace;
DROP INDEX IF EXISTS idx_integration_logs_endpoint;
DROP INDEX IF EXISTS idx_integration_logs_integration;
DROP INDEX IF EXISTS idx_codigos_generado_por;

-- 2. Eliminar columnas agregadas (CUIDADO: se pierden datos)
ALTER TABLE codigos DROP COLUMN IF EXISTS generado_por;
ALTER TABLE codigos DROP COLUMN IF EXISTS meta;
ALTER TABLE participaciones DROP COLUMN IF EXISTS meta;

-- 3. Eliminar tablas de integración (CUIDADO: se pierden todos los logs)
DROP TABLE IF EXISTS integration_logs;
DROP TABLE IF EXISTS integrations;

SELECT 'Rollback de integraciones completado - DATOS PERDIDOS' as resultado;
