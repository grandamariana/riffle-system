-- Optimizaciones de base de datos para el sistema de rifa Papayoo

-- Índices adicionales para mejorar rendimiento
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_participaciones_cliente_codigo ON participaciones(cliente_id, codigo_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_participaciones_fecha ON participaciones(fecha_asignacion DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_codigos_estado_fecha ON codigos(estado, fecha_generacion DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clientes_fecha_registro ON clientes(fecha_registro DESC);

-- Índice único compuesto para prevenir participaciones duplicadas
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_participaciones_unique_cliente_codigo 
ON participaciones(cliente_id, codigo_id);

-- Constraints adicionales para integridad de datos
ALTER TABLE participaciones 
ADD CONSTRAINT IF NOT EXISTS chk_numero_rifa_format 
CHECK (numero_rifa ~ '^[0-9]{5}$');

ALTER TABLE codigos 
ADD CONSTRAINT IF NOT EXISTS chk_codigo_format 
CHECK (codigo ~ '^[A-Z0-9]{6,8}$');

-- Función para limpiar códigos expirados (opcional)
CREATE OR REPLACE FUNCTION limpiar_codigos_expirados()
RETURNS INTEGER AS $$
DECLARE
    codigos_eliminados INTEGER;
BEGIN
    -- Marcar como expirados los códigos activos de más de 30 días
    UPDATE codigos 
    SET estado = 'expirado', fecha_expiracion = CURRENT_TIMESTAMP
    WHERE estado = 'activo' 
    AND fecha_generacion < CURRENT_TIMESTAMP - INTERVAL '30 days';
    
    GET DIAGNOSTICS codigos_eliminados = ROW_COUNT;
    RETURN codigos_eliminados;
END;
$$ LANGUAGE plpgsql;

-- Función para estadísticas rápidas
CREATE OR REPLACE FUNCTION obtener_estadisticas_rifa()
RETURNS JSON AS $$
DECLARE
    resultado JSON;
BEGIN
    SELECT json_build_object(
        'total_clientes', (SELECT COUNT(*) FROM clientes),
        'total_participaciones', (SELECT COUNT(*) FROM participaciones),
        'codigos_activos', (SELECT COUNT(*) FROM codigos WHERE estado = 'activo'),
        'codigos_usados', (SELECT COUNT(*) FROM codigos WHERE estado = 'usado'),
        'ultima_participacion', (SELECT MAX(fecha_asignacion) FROM participaciones)
    ) INTO resultado;
    
    RETURN resultado;
END;
$$ LANGUAGE plpgsql;
