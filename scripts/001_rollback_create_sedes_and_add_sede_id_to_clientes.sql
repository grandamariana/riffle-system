-- Rollback: Revertir creación de tabla sedes y columna sede_id
-- Archivo: scripts/001_rollback_create_sedes_and_add_sede_id_to_clientes.sql
-- Fecha: 2024-01-20
-- Descripción: Revierte la migración 001 del sistema de sedes

BEGIN;

-- Verificar que podemos hacer rollback seguro
DO $$
DECLARE
    clientes_con_sede INTEGER;
BEGIN
    -- Contar clientes que tienen sede asignada
    SELECT COUNT(*) INTO clientes_con_sede 
    FROM clientes 
    WHERE sede_id IS NOT NULL;
    
    IF clientes_con_sede > 0 THEN
        RAISE WARNING 'ATENCIÓN: % clientes tienen sede asignada. Sus datos de sede se perderán.', clientes_con_sede;
        -- En producción, podrías querer abortar aquí:
        -- RAISE EXCEPTION 'Rollback abortado: hay clientes con sede asignada';
    END IF;
END $$;

-- Eliminar foreign key constraint
ALTER TABLE clientes 
DROP CONSTRAINT IF EXISTS fk_clientes_sede;

-- Eliminar índice
DROP INDEX IF EXISTS idx_clientes_sede_id;

-- Eliminar columna sede_id de clientes
ALTER TABLE clientes 
DROP COLUMN IF EXISTS sede_id;

-- Eliminar índices de sedes
DROP INDEX IF EXISTS idx_sedes_estado;

-- Eliminar tabla sedes (CASCADE para eliminar dependencias)
DROP TABLE IF EXISTS sedes CASCADE;

-- Eliminar tabla de auditoría si fue creada por esta migración
DROP TABLE IF EXISTS audit_logs CASCADE;

-- Verificar que el rollback fue exitoso
DO $$
BEGIN
    -- Verificar que tabla sedes fue eliminada
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sedes') THEN
        RAISE EXCEPTION 'Error: Tabla sedes no fue eliminada correctamente';
    END IF;
    
    -- Verificar que columna sede_id fue eliminada
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'clientes' AND column_name = 'sede_id') THEN
        RAISE EXCEPTION 'Error: Columna sede_id no fue eliminada de clientes';
    END IF;
    
    RAISE NOTICE 'Rollback 001 completado exitosamente';
END $$;

COMMIT;
