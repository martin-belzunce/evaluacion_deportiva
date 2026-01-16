# Sistema de Evaluación Deportiva

Un sistema integral de evaluación deportiva con un algoritmo de clasificación de decaimiento exponencial, desarrollado con un backend de Python tipado y una moderna interfaz de JavaScript.

## 📁 Estructura del proyecto

```
evaluación_deportiva/
├── backend/              # Backend de Python con sugerencias de tipos completas
│ ├── app.py              # Aplicación principal de Flask (con base de datos)
│ ├── test_server.py      # Servidor de pruebas (en memoria, sin base de datos)
│ ├── requirements.txt    # Dependencias de Python
│ ├── .env                # Variables de entorno
│ └── database.sql        # Esquema de la base de datos
├── frontend/             # Archivos estáticos del frontend
│ ├── index.html          # Archivo HTML principal
│ ├── app.js              # Aplicación JavaScript
│ ├── styles.css          # Estilos CSS
│ ├── server.py           # Servidor de desarrollo
│ └── lib/                # Bibliotecas externas
│ └── chart.min.js        # Chart.js para gráficos
└── README.md             # Este archivo
```

## 🚀 Primeros pasos

### Configuración del backend

1. **Ir al directorio del backend:**
```bash
cd backend
```

2. **Instalar las dependencias de Python:**
```bash
pip3 install -r requirements.txt
```

3. **Elige tu servidor:**

**Opción A: Servidor de pruebas (Recomendado para desarrollo)**
```bash
python3 test_server.py
```
- ✅ No se requiere base de datos
- ✅ Almacenamiento en memoria
- ✅ Sugerencias de tipo completas
- ✅ Desarrollo rápido

**Opción B: Aplicación completa (Requiere base de datos)**
```bash
python3 app.py
```
- 🔧 Requiere base de datos MySQL
- 🔧 Configurar archivo .env
- ✅ Sugerencias de tipo completas
- ✅ Almacenamiento persistente

### Configuración del frontend

1. **Ir al directorio del frontend:**
```bash
cd frontend
```

2. **Iniciar el servidor frontend:**
```bash
python3 server.py
```

3. **Abrir en el navegador:**
- Frontend: http://localhost:8000
- API del backend: http://localhost:3000/api

## 🏗️ Arquitectura

### Backend
- **Framework:** Flask con anotaciones de tipo completas
- **Base de datos:** SQLAlchemy + MySQL (opcional para el servidor de pruebas)
- **API:** API RESTful con sugerencias de tipo completas
- **Características:**
- Seguridad de tipos completa con tipado en Python
- Clases de datos para modelos de solicitud/respuesta
- Funciones y variables con anotaciones de tipo
- Tipos de unión para respuestas flexibles

### Frontend
- **Tecnología:** JavaScript estándar con async/await moderno
- **Estilo:** CSS personalizado con diseño adaptable
- **Gráficos:** Chart.js para visualización de datos
- **Arquitectura:** Aplicación de página única con integración de API

## 🔧 Endpoints de la API

Todos los endpoints incluyen sugerencias de tipo completas en el backend:

### Configuración
- `GET /api/config` - Obtener la configuración global de lambda
- `PUT /api/config` - Actualizar la configuración global de lambda Configuración

### Equipos
- `GET /api/teams` - Listar todos los equipos con estadísticas
- `POST /api/teams` - Crear un nuevo equipo
- `DELETE /api/teams/{id}` - Eliminar un equipo
- `GET /api/teams/{id}/tests` - Obtener el historial de pruebas del equipo

### Pruebas/Puntuaciones
- `POST /api/tests` - Añadir una nueva puntuación de prueba

### Clasificaciones
- `GET /api/rankings` - Obtener las clasificaciones actuales con puntuaciones ponderadas

## 🎯 Características

### Características del backend tipado
- **Sugerencias de tipo completas** en todo el código base
- **Clases de datos** para datos estructurados
- **Tipos de unión** para respuestas de API flexibles
- **Modelos de base de datos con seguridad de tipos**
- **Gestión integral de errores**

### Características principales
- **Algoritmo de decaimiento exponencial:** Parámetro lambda configurable para la puntuación Ponderación
- **Gestión de equipos:** Añadir, eliminar y hacer seguimiento de equipos
- **Seguimiento de puntuaciones:** Registrar las puntuaciones de las pruebas con fechas
- **Clasificaciones dinámicas:** Cálculos de clasificaciones en tiempo real
- **Visualización de datos:** Gráficos interactivos que muestran el progreso del equipo
- **Importación/Exportación:** Copia de seguridad y restauración de datos JSON

## 📊 Algoritmo de decaimiento exponencial

El sistema utiliza un algoritmo de puntuación ponderada donde el rendimiento reciente tiene mayor impacto:

```
Puntuación ponderada = (1 - λ) × Σ(λ^(n-i-1) × puntuación_i)
```

Donde:
- `λ` (lambda): Factor de decaimiento (0,1 a 1,0)
- `n`: Número total de pruebas
- `i`: Posición de la prueba (ordenada cronológicamente)

## 🛠️ Desarrollo

### Comprobación de tipos
El backend incluye una verificación de tipos completa Sugerencias:

```python
def calculate_weighted_score(team_id: int, global_lambda: float = 0.95) -> float:
"""Calcular la puntuación ponderada con decremento exponencial"""
pruebas: List[Test] = Test.query.filter_by(team_id=team_id).all()
# ... implementación
```

## 📝 Variables de entorno

Crear un archivo `.env` en el directorio del backend:

```env
# Base de datos Configuración
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=evaluacion_deportiva
DB_PORT=3306

# Configuración del servidor
PORT=3000
NODE_ENV=development

# Configuración de CORS
FRONTEND_URL=http://localhost:8000
```

## 🧪 Pruebas

- **Servidor de pruebas:** Ejecutar `python3 backend/test_server.py` para desarrollo
- **Frontend:** Abrir http://localhost:8000