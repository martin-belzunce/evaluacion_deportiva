-- Crear base de datos para Sistema de Evaluación Deportiva
CREATE DATABASE IF NOT EXISTS evaluacion_deportiva CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE evaluacion_deportiva;

-- Tabla de configuración global
CREATE TABLE IF NOT EXISTS config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_key TEXT NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Trigger to update updated_at timestamp
CREATE TRIGGER update_config_timestamp
AFTER UPDATE ON config
BEGIN
    UPDATE config
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.id;
END;
-- Insertar configuración inicial
INSERT OR IGNORE INTO config (config_key, config_value) VALUES ('global_lambda', '0.75');
UPDATE config
SET config_value = '0.95'
WHERE config_key = 'global_lambda';


-- Tabla de equipos
CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Trigger to update updated_at timestamp
CREATE TRIGGER update_team_timestamp
AFTER UPDATE ON teams
BEGIN
    UPDATE teams
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.id;
END;

-- Tabla de disciplinas
CREATE TABLE IF NOT EXISTS disciplines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar disciplinas iniciales
INSERT OR IGNORE INTO disciplines (name) VALUES 
('Maza'),
('Aro'),
('Pelota'),
('All Around');

-- Tabla de pruebas/puntajes
CREATE TABLE IF NOT EXISTS tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    test_date DATE NOT NULL,
    discipline_id INTEGER NOT NULL,
    score REAL NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (discipline_id) REFERENCES disciplines(id) ON DELETE CASCADE,
    UNIQUE(team_id, discipline_id, test_date)
);
-- Trigger to update updated_at timestamp
CREATE TRIGGER update_test_timestamp
AFTER UPDATE ON tests
BEGIN
    UPDATE tests
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.id;
END;

-- Vista para obtener equipos con estadísticas por disciplina
CREATE VIEW IF NOT EXISTS team_discipline_stats AS
SELECT 
    t.id as team_id,
    d.id as discipline_id,
    t.name as team_name,
    d.name as discipline_name,
    COUNT(ts.id) as test_count,
    COALESCE(MAX(ts.test_date), t.created_at) as last_test_date,
    AVG(ts.score) as average_score
FROM teams t
CROSS JOIN disciplines d
LEFT JOIN tests ts ON t.id = ts.team_id AND d.id = ts.discipline_id
GROUP BY t.id, d.id, t.name, d.name;
