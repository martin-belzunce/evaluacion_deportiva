-- Crear base de datos para Sistema de Evaluación Deportiva
CREATE DATABASE IF NOT EXISTS evaluacion_deportiva CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE evaluacion_deportiva;

-- Tabla de equipos
CREATE TABLE IF NOT EXISTS teams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);

-- Tabla de pruebas/puntajes
CREATE TABLE IF NOT EXISTS tests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT NOT NULL,
    score DECIMAL(10, 3) NOT NULL,
    test_date DATE NOT NULL,
    lambda_value DECIMAL(3, 2) NOT NULL DEFAULT 0.75,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    INDEX idx_team_date (team_id, test_date),
    INDEX idx_team_id (team_id)
);

-- Tabla de configuración global
CREATE TABLE IF NOT EXISTS config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar configuración inicial
INSERT INTO config (config_key, config_value) VALUES ('global_lambda', '0.75') 
ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);

-- Vista para obtener equipos con estadísticas
CREATE OR REPLACE VIEW team_stats AS
SELECT 
    t.id,
    t.name,
    t.created_at,
    COUNT(ts.id) as test_count,
    COALESCE(MAX(ts.test_date), t.created_at) as last_test_date
FROM teams t
LEFT JOIN tests ts ON t.id = ts.team_id
GROUP BY t.id, t.name, t.created_at;
