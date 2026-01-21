# 📚 Manual de Usuario - Sistema de Evaluación Deportiva

## 🧾 Descripción General
El Sistema de Evaluación Deportiva es una aplicación web diseñada para registrar y analizar el rendimiento físico de deportistas. Combina una interfaz frontend interactiva con un backend que procesa y almacena datos de evaluaciones técnicas y físicas.

## 🛠️ Arquitectura del Sistema
### Frontend
- **Tecnologías**: HTML5, CSS3, JavaScript (Chart.js para visualizaciones)
- **Archivos principales**:
  - `index.html`: Estructura principal de la aplicación
  - `app.js`: Lógica de cliente y validación de formularios
  - `styles.css`: Estilos responsivos
  - `server.py`: Servidor de desarrollo frontend

### Backend
- **Tecnologías**: Python (Flask), SQLite3
- **Archivos principales**:
  - `app.py`: API REST para operaciones CRUD
  - `database.sql`: Esquema de base de datos
  - `requirements.txt`: Dependencias

## 📦 Instalación y Despliegue
1. **Requisitos**:
   - Docker (recomendado) o Python 3.8+
   - Node.js v14+ (para desarrollo frontend)

2. **Método Docker (recomendado)**:
   ```bash
   docker build -t evaluacion-deportiva .
   docker run -p 3000:3000 evaluacion-deportiva
   ```

## 📝 Funcionalidades Principales
1. **Registro de Evaluaciones**
   - Ingreso de datos técnicos (precisiones de tiro, pases, etc.)
   - Medición de parámetros físicos (velocidad, resistencia, fuerza)
   - Cálculo automático de índice de rendimiento

2. **Visualización de Datos**
   - Gráficos comparativos por jugador
   - Análisis histórico de progresos
   - Exportación de reportes PDF

3. **Gestión de Usuarios**
   - Registro de deportistas (nombre, edad, posición)
   - Asignación de evaluaciones a equipos
   - Control de acceso por roles

## 📺 Interfaz de Usuario
### Dashboard Principal
1. **Panel de Navegación** (izquierda):
   - Menú desplegable de evaluaciones
   - Filtros por equipo/fecha

2. **Área de Visualización** (derecha):
   - Gráficos radiales de rendimiento
   - Tablas de datos históricos
   - Botones de acción (editar, eliminar, exportar)

### Formulario de Evaluación
- Campos validados con indicadores de calidad
- Selector de fecha con calendario
- Botón de cálculo automático

## 💡 Consejos de Uso
- Para evaluaciones masivas, use el modo "Importar CSV"
- Configure alertas cuando el índice de rendimiento baje del 70%
- Use los filtros de tiempo para comparaciones interanuales
- Exporte reportes en formato PDF para presentaciones oficiales

## 🛠️ Solución de Problemas
| Problema | Solución |
|---------|----------|
| No carga la página | Verificar que ambos servidores (frontend y backend) estén corriendo |
| Gráficos no se muestran | Asegurar que Chart.js esté correctamente cargado |
| Errores de conexión a DB | Verificar permisos en el archivo `database.sql` |
| Datos no se guardan | Confirmar formato correcto en los campos del formulario |

## 💾 Configuración de Persistencia de Datos
Para garantizar la persistencia de datos entre reinicios del sistema:

1. **Configuración obligatoria de la base de datos**:
   - La variable de entorno `DATABASE_PATH` es **obligatoria**
   - El archivo de la base de datos se creará en la ubicación especificada por `DATABASE_PATH`
   - No es posible iniciar la aplicación sin configurar esta variable de entorno

2. **Variables de entorno recomendadas**:
   ```bash
   DATABASE_PATH=/ruta/persistente/sports_evaluation.db
   ```
   
3. **Configuración para Docker**:
   ```bash
   # Ejemplo con volumen persistente
   docker build -t evaluacion-deportiva .
   docker run -p 3000:3000 \
     -v /ruta/host/db:/app \
     -e DATABASE_PATH=/app/sports_evaluation.db \
     evaluacion-deportiva
   ```

3. **Permisos**:
   - Asegúrese de que el usuario que ejecuta la aplicación tenga permisos de lectura/escritura en la ubicación de la base de datos
   - Si hay problemas, pruebe ejecutar: `chmod 777 /ruta/de/la/base/de/datos`

## 📎 Recursos Adicionales
- [Documentación técnica](DEPLOY.md)
- [Guía de análisis deportivo](backend/README.md)
- [Contacto soporte]: deporte@evaluacion.com
