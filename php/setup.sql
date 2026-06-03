SET time_zone = '+00:00';

-- -------------------------------------------------------------
--  TABLA: tipos_recurso
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tipos_recurso (
    id     INT         NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

-- -------------------------------------------------------------
--  TABLA: categorias_precio
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categorias_precio (
    id            INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nombre        VARCHAR(50)   NOT NULL UNIQUE,
    precio_min    DECIMAL(8,2)  NOT NULL,
    precio_max    DECIMAL(8,2)  NOT NULL,
    CONSTRAINT chk_rango CHECK (precio_max > precio_min)
);

-- -------------------------------------------------------------
--  TABLA: usuarios
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id        INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    dni       VARCHAR(9)   NOT NULL UNIQUE,
    nombre    VARCHAR(100) NOT NULL,
    apellidos VARCHAR(150) NOT NULL,
    email     VARCHAR(150) NOT NULL UNIQUE,
    password  VARCHAR(255) NOT NULL
);

-- -------------------------------------------------------------
--  TABLA: recursos
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recursos (
    id                 INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nombre             VARCHAR(150) NOT NULL,
    id_tipo            INT          NOT NULL,
    id_categoria_precio INT         NOT NULL,
    descripcion        TEXT         NOT NULL,
    plazas             INT          NOT NULL CHECK (plazas > 0),
    fecha_inicio       DATETIME     NOT NULL,
    fecha_fin          DATETIME     NOT NULL,
    precio             DECIMAL(8,2) NOT NULL CHECK (precio >= 0),

    CONSTRAINT chk_fechas    CHECK (fecha_fin > fecha_inicio),
    CONSTRAINT fk_rec_tipo   FOREIGN KEY (id_tipo)             REFERENCES tipos_recurso(id),
    CONSTRAINT fk_rec_cat    FOREIGN KEY (id_categoria_precio) REFERENCES categorias_precio(id)
);

-- -------------------------------------------------------------
--  TABLA: reservas
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reservas (
    id           INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_usuario   INT           NOT NULL,
    id_recurso   INT           NOT NULL,
    num_plazas   INT           NOT NULL DEFAULT 1 CHECK (num_plazas > 0),
    precio_total DECIMAL(10,2) NOT NULL,
    estado       ENUM('confirmada','anulada') NOT NULL DEFAULT 'confirmada',
    created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_res_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id)  ON DELETE CASCADE,
    CONSTRAINT fk_res_recurso FOREIGN KEY (id_recurso) REFERENCES recursos(id)  ON DELETE CASCADE
);
