-- Migración: Crear tabla sedes y añadir sede_id a clientes
-- Archivo: scripts/001_create_sedes_and_add_sede_id_to_clientes.sql
-- Fecha: 2024-01-20
-- Descripción: Implementa sistema de gestión de sedes para Papayoo
-- IDEMPOTENTE: Puede ejecutarse múltiples veces sin errores

BEGIN;

-- Crear tabla sedes
CREATE TABLE IF NOT EXISTS sedes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    ciudad VARCHAR(100) NOT NULL,
    direccion VARCHAR(150),
    estado VARCHAR(10) NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'inactiva')),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint único para evitar sedes duplicadas
    CONSTRAINT uk_sedes_nombre_ciudad UNIQUE (nombre, ciudad)
);

-- Añadir columna sede_id a clientes (nullable inicialmente para clientes existentes)
ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS sede_id INTEGER;

-- Crear foreign key con ON DELETE SET NULL (solo si no existe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_clientes_sede'
    ) THEN
        ALTER TABLE clientes 
        ADD CONSTRAINT fk_clientes_sede 
        FOREIGN KEY (sede_id) REFERENCES sedes(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Crear índices para performance
CREATE INDEX IF NOT EXISTS idx_clientes_sede_id ON clientes(sede_id);
CREATE INDEX IF NOT EXISTS idx_sedes_estado ON sedes(estado);

-- Crear tabla de auditoría reutilizando integration_logs si existe, sino crear audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER,
    operacion VARCHAR(50) NOT NULL,
    tabla VARCHAR(50),
    registro_id INTEGER,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    ip_address INET,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para auditoría
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON audit_logs(admin_id);

-- Insertar sedes por defecto (IDEMPOTENTE)
INSERT INTO sedes (nombre, ciudad, direccion, estado) VALUES
('Sede Principal', 'Medellín', 'Carrera 50 #45-30, Centro', 'activa'),
('Sede Norte', 'Medellín', 'Calle 67 #52-20, Bello', 'activa'),
('Sede Sur', 'Medellín', 'Carrera 48 #28-15, Envigado', 'activa')
ON CONFLICT (nombre, ciudad) DO NOTHING;

-- Verificar que la migración fue exitosa
DO $$
BEGIN
    -- Verificar tabla sedes
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sedes') THEN
        RAISE EXCEPTION 'Error: Tabla sedes no fue creada correctamente';
    END IF;
    
    -- Verificar columna sede_id en clientes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'clientes' AND column_name = 'sede_id') THEN
        RAISE EXCEPTION 'Error: Columna sede_id no fue añadida a clientes';
    END IF;
    
    -- Verificar foreign key
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_clientes_sede') THEN
        RAISE EXCEPTION 'Error: Foreign key fk_clientes_sede no fue creada';
    END IF;
    
    RAISE NOTICE 'Migración 001 completada exitosamente';
END $$;

COMMIT;
