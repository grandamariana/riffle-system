-- Script de verificación del sistema Papayoo
-- Ejecutar para verificar integridad y configuración

-- 1. Verificar estructura de tablas
SELECT 'Verificando tablas...' as status;

SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('clientes', 'codigos', 'participaciones', 'usuarios_internos', 'configuracion_rifa') 
    THEN '✅ OK' 
    ELSE '❌ FALTA' 
  END as estado
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('clientes', 'codigos', 'participaciones', 'usuarios_internos', 'configuracion_rifa');

-- 2. Verificar índices críticos
SELECT 'Verificando índices...' as status;

SELECT 
  indexname,
  CASE 
    WHEN indexname LIKE '%documento%' OR indexname LIKE '%codigo%' OR indexname LIKE '%numero%' 
    THEN '✅ OK' 
    ELSE '⚠️ REVISAR' 
  END as estado
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('clientes', 'codigos', 'participaciones');

-- 3. Verificar usuarios internos
SELECT 'Verificando usuarios internos...' as status;

SELECT 
  usuario,
  rol,
  CASE 
    WHEN LENGTH(contraseña_hash) > 50 THEN '✅ Hash OK'
    ELSE '❌ Hash inválido'
  END as estado_hash,
  fecha_creacion
FROM usuarios_internos;

-- 4. Verificar configuración de rifa
SELECT 'Verificando configuración de rifa...' as status;

SELECT 
  estado,
  numero_ganador,
  fecha_actualizacion,
  CASE 
    WHEN estado IN ('activa', 'pausada', 'cerrada') THEN '✅ Estado válido'
    ELSE '❌ Estado inválido'
  END as validacion
FROM configuracion_rifa;

-- 5. Verificar integridad de datos
SELECT 'Verificando integridad de datos...' as status;

-- Códigos duplicados
SELECT 
  'Códigos duplicados' as verificacion,
  COUNT(*) as cantidad,
  CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '❌ ERROR' END as estado
FROM (
  SELECT codigo FROM codigos GROUP BY codigo HAVING COUNT(*) > 1
) duplicados;

-- Números de rifa duplicados
SELECT 
  'Números de rifa duplicados' as verificacion,
  COUNT(*) as cantidad,
  CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '❌ ERROR' END as estado
FROM (
  SELECT numero_rifa FROM participaciones GROUP BY numero_rifa HAVING COUNT(*) > 1
) duplicados;

-- Participaciones huérfanas
SELECT 
  'Participaciones huérfanas' as verificacion,
  COUNT(*) as cantidad,
  CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '❌ ERROR' END as estado
FROM participaciones p
LEFT JOIN clientes c ON p.cliente_id = c.id
LEFT JOIN codigos co ON p.codigo_id = co.id
WHERE c.id IS NULL OR co.id IS NULL;

-- 6. Estadísticas generales
SELECT 'Estadísticas del sistema...' as status;

SELECT 
  (SELECT COUNT(*) FROM clientes) as total_clientes,
  (SELECT COUNT(*) FROM codigos) as total_codigos,
  (SELECT COUNT(*) FROM codigos WHERE estado = 'activo') as codigos_activos,
  (SELECT COUNT(*) FROM codigos WHERE estado = 'usado') as codigos_usados,
  (SELECT COUNT(*) FROM participaciones) as total_participaciones;

-- 7. Verificar constraints y validaciones
SELECT 'Verificando constraints...' as status;

-- Verificar formato de números de rifa
SELECT 
  'Formato números de rifa' as verificacion,
  COUNT(*) as numeros_invalidos,
  CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '❌ ERROR' END as estado
FROM participaciones 
WHERE numero_rifa !~ '^[0-9]{5}$';

-- Verificar formato de códigos
SELECT 
  'Formato códigos' as verificacion,
  COUNT(*) as codigos_invalidos,
  CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '❌ ERROR' END as estado
FROM codigos 
WHERE codigo !~ '^[A-Z0-9]{6,8}$';

SELECT '✅ Verificación completada' as resultado;
