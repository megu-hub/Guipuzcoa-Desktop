SET time_zone = '+00:00';

-- -------------------------------------------------------------
--  TABLA: usuarios
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id         INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    dni        VARCHAR(9)   NOT NULL UNIQUE,
    nombre     VARCHAR(100) NOT NULL,
    apellidos  VARCHAR(150) NOT NULL,
    email      VARCHAR(150) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,          -- hash bcrypt
);

-- -------------------------------------------------------------
--  TABLA: recursos
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recursos (
    id           INT            NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nombre       VARCHAR(150)   NOT NULL,
    tipo         ENUM(
                     'museo',
                     'ruta',
                     'restaurante',
                     'hotel',
                     'monumento',
                     'actividad'
                 )              NOT NULL,
    descripcion  TEXT           NOT NULL,
    plazas       INT            NOT NULL CHECK (plazas > 0),
    fecha_inicio DATETIME       NOT NULL,
    fecha_fin    DATETIME       NOT NULL,
    precio       DECIMAL(8,2)   NOT NULL CHECK (precio >= 0),

    CONSTRAINT chk_fechas CHECK (fecha_fin > fecha_inicio)
);

-- -------------------------------------------------------------
--  TABLA: reservas
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reservas (
    id           INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_usuario   INT          NOT NULL,
    id_recurso   INT          NOT NULL,
    num_plazas   INT          NOT NULL DEFAULT 1 CHECK (num_plazas > 0),
    precio_total DECIMAL(10,2) NOT NULL,
    estado       ENUM('confirmada', 'anulada') NOT NULL DEFAULT 'confirmada',
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_reserva_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_reserva_recurso FOREIGN KEY (id_recurso) REFERENCES recursos(id) ON DELETE CASCADE
);
