-- Insertar datos iniciales

-- Insertar configuración inicial de la rifa
INSERT INTO configuracion_rifa (estado) VALUES ('activa') ON CONFLICT DO NOTHING;

-- Insertar usuario administrador por defecto
-- Contraseña: admin123 (hasheada con bcrypt)
INSERT INTO usuarios_internos (rol, usuario, contraseña_hash) 
VALUES ('admin', 'admin', '$2a$12$fUD9CyMS1SvMB1FrpvNlSOmIdjZ9TmlORJtBoGTpzX4VmPullqBSe') 
ON CONFLICT (usuario) DO NOTHING;

-- Insertar usuario empleado por defecto
-- Contraseña: empleado123 (hasheada con bcrypt)
INSERT INTO usuarios_internos (rol, usuario, contraseña_hash) 
VALUES ('empleado', 'empleado', '$2a$12$WaIHzFdxrsdNlbt0gAY30ubdp1NWHU9mhebxnieJ73h0zq9JTjxP2') 
ON CONFLICT (usuario) DO NOTHING;

-- Actualizar hashes existentes si ya existen los usuarios
UPDATE usuarios_internos 
SET contraseña_hash = '$2a$12$fUD9CyMS1SvMB1FrpvNlSOmIdjZ9TmlORJtBoGTpzX4VmPullqBSe'
WHERE usuario = 'admin';

UPDATE usuarios_internos 
SET contraseña_hash = '$2a$12$WaIHzFdxrsdNlbt0gAY30ubdp1NWHU9mhebxnieJ73h0zq9JTjxP2'
WHERE usuario = 'empleado';
