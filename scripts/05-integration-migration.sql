-- Migración para soporte de integraciones externas
-- Ejecutar después de los scripts existentes

-- 1. Crear tabla de integraciones
CREATE TABLE IF NOT EXISTS integrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    api_key_hash VARCHAR(255) NOT NULL,
    allowed_ips JSONB DEFAULT '[]',
    rate_limit INTEGER DEFAULT 1000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP NULL
);

-- 2. Crear tabla de logs de integración
CREATE TABLE IF NOT EXISTS integration_logs (
    id SERIAL PRIMARY KEY,
    trace_id VARCHAR(32) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    ip INET NOT NULL,
    integration_name VARCHAR(100) NULL,
    status_code INTEGER NOT NULL,
    error_message TEXT NULL,
    metadata JSONB NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Modificar tabla codigos para soportar generación externa
ALTER TABLE codigos 
ADD COLUMN IF NOT EXISTS generado_por VARCHAR(100) DEFAULT 'interno',
ADD COLUMN IF NOT EXISTS meta JSONB NULL;

-- 4. Modificar tabla participaciones para trazabilidad
ALTER TABLE participaciones 
ADD COLUMN IF NOT EXISTS meta JSONB NULL;

-- 5. Crear índices para optimización
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_integrations_name ON integrations(name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_integrations_active ON integrations(name) WHERE revoked_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_integration_logs_trace ON integration_logs(trace_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_integration_logs_endpoint ON integration_logs(endpoint, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_integration_logs_integration ON integration_logs(integration_name, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_codigos_generado_por ON codigos(generado_por);

-- 6. Actualizar códigos existentes
UPDATE codigos SET generado_por = 'interno' WHERE generado_por IS NULL;

-- 7. Crear integración inicial para EPICO (se debe ejecutar manualmente con API key real)
-- INSERT INTO integrations (name, api_key_hash, allowed_ips, rate_limit) 
-- VALUES ('EPICO', '$2a$12$...', '["192.168.1.0/24"]', 2000);

SELECT 'Migración de integraciones completada exitosamente' as resultado;
