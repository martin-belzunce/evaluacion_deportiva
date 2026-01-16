# Sistema de Evaluación Deportiva

A comprehensive sports evaluation system with exponential decay ranking algorithm, built with a typed Python backend and modern JavaScript frontend.

## 📁 Project Structure

```
evaluación_deportiva/
├── backend/                    # Python backend with full type hints
│   ├── app.py                 # Main Flask application (with database)
│   ├── test_server.py         # Test server (in-memory, no database)
│   ├── requirements.txt       # Python dependencies
│   ├── .env                   # Environment variables
│   └── database.sql          # Database schema
├── frontend/                   # Frontend static files
│   ├── index.html            # Main HTML file
│   ├── app.js                # JavaScript application
│   ├── styles.css            # CSS styles
│   ├── server.py             # Development server
│   └── lib/                  # External libraries
│       └── chart.min.js      # Chart.js for graphs
└── README.md                 # This file
```

## 🚀 Getting Started

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install Python dependencies:**
   ```bash
   pip3 install -r requirements.txt
   ```

3. **Choose your server:**

   **Option A: Test Server (Recommended for development)**
   ```bash
   python3 test_server.py
   ```
   - ✅ No database required
   - ✅ In-memory storage
   - ✅ Full type hints
   - ✅ Fast development

   **Option B: Full Application (Requires database)**
   ```bash
   python3 app.py
   ```
   - 🔧 Requires MySQL database
   - 🔧 Configure .env file
   - ✅ Full type hints
   - ✅ Persistent storage

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Start the frontend server:**
   ```bash
   python3 server.py
   ```

3. **Open in browser:**
   - Frontend: http://localhost:8000
   - Backend API: http://localhost:3000/api

## 🏗️ Architecture

### Backend (Python with Type Hints)
- **Framework:** Flask with full type annotations
- **Database:** SQLAlchemy + MySQL (optional for test server)
- **API:** RESTful API with comprehensive type hints
- **Features:**
  - Complete type safety with Python typing
  - Dataclasses for request/response models
  - Type-annotated functions and variables
  - Union types for flexible responses

### Frontend (JavaScript)
- **Technology:** Vanilla JavaScript with modern async/await
- **Styling:** Custom CSS with responsive design
- **Charts:** Chart.js for data visualization
- **Architecture:** Single-page application with API integration

## 🔧 API Endpoints

All endpoints include full type hints in the backend:

### Configuration
- `GET /api/config` - Get global lambda configuration
- `PUT /api/config` - Update global lambda configuration

### Teams
- `GET /api/teams` - List all teams with statistics
- `POST /api/teams` - Create new team
- `DELETE /api/teams/{id}` - Delete team
- `GET /api/teams/{id}/tests` - Get team's test history

### Tests/Scores
- `POST /api/tests` - Add new test score

### Rankings
- `GET /api/rankings` - Get current rankings with weighted scores

## 🎯 Features

### Typed Backend Features
- **Full type hints** throughout the codebase
- **Dataclasses** for structured data
- **Union types** for flexible API responses
- **Type-safe database models**
- **Comprehensive error handling**

### Core Features
- **Exponential Decay Algorithm:** Configurable lambda parameter for score weighting
- **Team Management:** Add, delete, and track teams
- **Score Tracking:** Record test scores with dates and custom lambda values
- **Dynamic Rankings:** Real-time ranking calculations
- **Data Visualization:** Interactive charts showing team progress
- **Import/Export:** JSON data backup and restore

## 📊 Exponential Decay Algorithm

The system uses a weighted scoring algorithm where recent performance has more impact:

```
Weighted Score = (1 - λ) × Σ(λ^(n-i-1) × score_i)
```

Where:
- `λ` (lambda): Decay factor (0.1 to 1.0)
- `n`: Total number of tests
- `i`: Test position (chronologically ordered)

## 🛠️ Development

### Type Checking
The backend includes comprehensive type hints:

```python
def calculate_weighted_score(team_id: int, global_lambda: float = 0.75) -> float:
    """Calculate weighted score with exponential decay"""
    tests: List[Test] = Test.query.filter_by(team_id=team_id).all()
    # ... implementation
```

### Adding New Features
1. **Backend:** Add type hints to all new functions and classes
2. **Frontend:** Update API calls in `app.js`
3. **Testing:** Use the test server for rapid development

## 📝 Environment Variables

Create a `.env` file in the backend directory:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=evaluacion_deportiva
DB_PORT=3306

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:8000
```

## 🧪 Testing

- **Test Server:** Run `python3 backend/test_server.py` for development
- **Frontend:** Open http://localhost:8000 after starting both servers
- **API Testing:** Use tools like Postman or curl with http://localhost:3000/api

## 🔄 Migration from Previous Version

The previous single-file structure has been reorganized:
- ✅ Backend moved to `backend/` with full typing
- ✅ Frontend moved to `frontend/` 
- ✅ Separation of concerns
- ✅ Better development workflow
- ✅ Type safety throughout

## 📈 Performance

- **Backend:** Type hints enable better IDE support and runtime optimization
- **Frontend:** Efficient API calls with proper async/await patterns
- **Database:** Optimized queries with SQLAlchemy (when using full app)
- **Memory:** Test server provides fast in-memory operations for development

## 🤝 Contributing

1. Use type hints for all Python code
2. Follow the established project structure
3. Test with both servers (test and full)
4. Maintain API compatibility

## 📄 License

[Add your license information here]
