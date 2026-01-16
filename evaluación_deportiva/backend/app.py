"""
Sports Evaluation System - Production Backend
Deployment-ready Flask API for Vercel
"""

from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
import json
import os
from datetime import datetime
import sqlite3
from typing import Dict, List, Any, Optional

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app, origins=["*"])  # Allow all origins for deployment

# Database setup for production
DATABASE_FILE = os.environ.get('DATABASE_PATH', 
    '/tmp/sports_evaluation.db' if os.environ.get('VERCEL') 
    else 'sports_evaluation.db')

def init_database():
    """Initialize SQLite database with required tables."""
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    
    # Configuration table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS config (
            id INTEGER PRIMARY KEY,
            global_lambda REAL NOT NULL DEFAULT 0.95,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Teams table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS teams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Tests table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_id INTEGER NOT NULL,
            score REAL NOT NULL,
            test_date DATE NOT NULL,
            lambda_value REAL NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE
        )
    ''')
    
    # Insert default configuration if not exists
    cursor.execute('SELECT COUNT(*) FROM config')
    if cursor.fetchone()[0] == 0:
        cursor.execute('INSERT INTO config (global_lambda) VALUES (0.95)')
    
    conn.commit()
    conn.close()

# Initialize database on startup
init_database()

@app.route('/api/config', methods=['GET'])
def get_config():
    """Get global configuration."""
    try:
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()
        cursor.execute('SELECT global_lambda FROM config ORDER BY id DESC LIMIT 1')
        result = cursor.fetchone()
        conn.close()
        
        lambda_value = result[0] if result else 0.95
        return jsonify({"global_lambda": lambda_value})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/config', methods=['PUT'])
def update_config():
    """Update global configuration."""
    try:
        data = request.get_json()
        global_lambda = float(data.get('global_lambda', 0.95))
        
        if not 0.1 <= global_lambda <= 1.0:
            return jsonify({"error": "Lambda must be between 0.1 and 1.0"}), 400
        
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT OR REPLACE INTO config (id, global_lambda, updated_at) 
            VALUES (1, ?, CURRENT_TIMESTAMP)
        ''', (global_lambda,))
        conn.commit()
        conn.close()
        
        return jsonify({"message": "Configuration updated", "global_lambda": global_lambda})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/teams', methods=['GET'])
def get_teams():
    """Get all teams."""
    try:
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()
        cursor.execute('SELECT id, name, created_at FROM teams ORDER BY name')
        teams = []
        for row in cursor.fetchall():
            teams.append({
                "id": row[0],
                "name": row[1],
                "created_at": row[2]
            })
        conn.close()
        return jsonify(teams)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/teams', methods=['POST'])
def create_team():
    """Create a new team."""
    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        
        if not name:
            return jsonify({"error": "Team name is required"}), 400
        
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()
        try:
            cursor.execute('INSERT INTO teams (name) VALUES (?)', (name,))
            team_id = cursor.lastrowid
            conn.commit()
            
            return jsonify({
                "id": team_id,
                "name": name,
                "created_at": datetime.now().isoformat()
            }), 201
        except sqlite3.IntegrityError:
            return jsonify({"error": "Team name already exists"}), 400
        finally:
            conn.close()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/teams/<int:team_id>', methods=['DELETE'])
def delete_team(team_id: int):
    """Delete a team and all its tests."""
    try:
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()
        
        # Check if team exists
        cursor.execute('SELECT name FROM teams WHERE id = ?', (team_id,))
        team = cursor.fetchone()
        if not team:
            conn.close()
            return jsonify({"error": "Team not found"}), 404
        
        # Delete team (CASCADE will delete tests)
        cursor.execute('DELETE FROM teams WHERE id = ?', (team_id,))
        conn.commit()
        conn.close()
        
        return jsonify({"message": f"Team '{team[0]}' deleted successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/teams/<int:team_id>/tests', methods=['GET'])
def get_team_tests(team_id: int):
    """Get all tests for a specific team."""
    try:
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()
        
        # Get team info
        cursor.execute('SELECT name FROM teams WHERE id = ?', (team_id,))
        team = cursor.fetchone()
        if not team:
            conn.close()
            return jsonify({"error": "Team not found"}), 404
        
        # Get tests
        cursor.execute('''
            SELECT id, score, test_date, lambda_value, created_at 
            FROM tests 
            WHERE team_id = ? 
            ORDER BY test_date ASC
        ''', (team_id,))
        
        tests = []
        for row in cursor.fetchall():
            tests.append({
                "id": row[0],
                "score": row[1],
                "test_date": row[2],
                "lambda_value": row[3],
                "created_at": row[4]
            })
        
        conn.close()
        return jsonify({
            "team_name": team[0],
            "tests": tests
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/tests', methods=['POST'])
def create_test():
    """Create a new test record."""
    try:
        data = request.get_json()
        team_id = data.get('team_id')
        score = float(data.get('score', 0))
        test_date = data.get('test_date')
        
        if not team_id or score < 0 or not test_date:
            return jsonify({"error": "Invalid test data"}), 400
        
        # Get current lambda value
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()
        cursor.execute('SELECT global_lambda FROM config ORDER BY id DESC LIMIT 1')
        lambda_result = cursor.fetchone()
        lambda_value = lambda_result[0] if lambda_result else 0.95
        
        # Verify team exists
        cursor.execute('SELECT name FROM teams WHERE id = ?', (team_id,))
        team = cursor.fetchone()
        if not team:
            conn.close()
            return jsonify({"error": "Team not found"}), 404
        
        # Insert test
        cursor.execute('''
            INSERT INTO tests (team_id, score, test_date, lambda_value)
            VALUES (?, ?, ?, ?)
        ''', (team_id, score, test_date, lambda_value))
        
        test_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            "id": test_id,
            "team_id": team_id,
            "score": score,
            "test_date": test_date,
            "lambda_value": lambda_value,
            "created_at": datetime.now().isoformat()
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    })

@app.route('/')
def serve_frontend():
    """Serve the main frontend page."""
    return send_file('../frontend/index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    """Serve static frontend files."""
    try:
        return send_from_directory('../frontend', filename)
    except FileNotFoundError:
        # If file not found, serve index.html for SPA routing
        return send_file('../frontend/index.html')

@app.errorhandler(404)
def not_found(error):
    # For API routes, return JSON error
    if request.path.startswith('/api/'):
        return jsonify({"error": "Endpoint not found"}), 404
    # For frontend routes, serve index.html
    return send_file('../frontend/index.html')

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

# For Vercel deployment
def handler(request):
    return app(request.environ, lambda status, headers: None)

if __name__ == '__main__':
    # Development server
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))
