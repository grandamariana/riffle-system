-- Crear base de datos y tablas para el sistema de rifa Papayoo

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    documento VARCHAR(20) UNIQUE NOT NULL,
    correo VARCHAR(255) UNIQUE NOT NULL,
    contraseña_hash VARCHAR(255) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de códigos únicos
CREATE TABLE IF NOT EXISTS codigos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'usado', 'expirado')),
    fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_uso TIMESTAMP NULL,
    fecha_expiracion TIMESTAMP NULL
);

-- Tabla de participaciones
CREATE TABLE IF NOT EXISTS participaciones (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
    codigo_id INTEGER REFERENCES codigos(id) ON DELETE CASCADE,
    numero_rifa VARCHAR(5) UNIQUE NOT NULL,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de usuarios internos (empleados y admin)
CREATE TABLE IF NOT EXISTS usuarios_internos (
    id SERIAL PRIMARY KEY,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('empleado', 'admin')),
    usuario VARCHAR(50) UNIQUE NOT NULL,
    contraseña_hash VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de configuración de la rifa
CREATE TABLE IF NOT EXISTS configuracion_rifa (
    id SERIAL PRIMARY KEY,
    estado VARCHAR(20) DEFAULT 'activa' CHECK (estado IN ('activa', 'pausada', 'cerrada')),
    numero_ganador VARCHAR(5) NULL,
    fecha_cierre TIMESTAMP NULL,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_clientes_documento ON clientes(documento);
CREATE INDEX IF NOT EXISTS idx_clientes_correo ON clientes(correo);
CREATE INDEX IF NOT EXISTS idx_codigos_codigo ON codigos(codigo);
CREATE INDEX IF NOT EXISTS idx_codigos_estado ON codigos(estado);
CREATE INDEX IF NOT EXISTS idx_participaciones_numero ON participaciones(numero_rifa);
CREATE INDEX IF NOT EXISTS idx_participaciones_cliente ON participaciones(cliente_id);
