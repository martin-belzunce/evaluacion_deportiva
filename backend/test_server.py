#!/usr/bin/env python3
"""
Test server for Sports Evaluation System - Backend with Type Hints
Simplified version without database for testing
"""

from typing import Dict, List, Any, Optional, Union, Tuple
from dataclasses import dataclass
import json

from flask import Flask, request, jsonify, Response
from flask_cors import CORS

app = Flask(__name__)

# Configuration
CORS(app, origins=['http://localhost:8000', 'http://localhost:3001'])

# Type definitions
JSONResponse = Union[Response, Tuple[Dict[str, Any], int]]

@dataclass
class TeamData:
    """Team data structure"""
    id: int
    name: str
    tests: List[Dict[str, Any]]
    created_at: str

@dataclass
class TestData:
    """Test data structure"""
    id: int
    team_id: int
    score: float
    test_date: str
    lambda_value: float
    created_at: str

# In-memory storage with type hints
teams_data: Dict[int, TeamData] = {}
config_data: Dict[str, float] = {'global_lambda': 0.95}
next_team_id: int = 1
next_test_id: int = 1

@app.route('/api/health', methods=['GET'])
def health_check() -> JSONResponse:
    """Check server status"""
    return jsonify({'status': 'healthy', 'message': 'Typed test server running'})

@app.route('/api/config', methods=['GET'])
def get_config() -> JSONResponse:
    """Get global configuration"""
    return jsonify(config_data)

@app.route('/api/config', methods=['PUT'])
def update_config() -> JSONResponse:
    """Update global configuration"""
    data: Optional[Dict[str, Any]] = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    if 'global_lambda' in data:
        config_data['global_lambda'] = float(data['global_lambda'])
    
    return jsonify({'message': 'Configuration updated successfully'})

@app.route('/api/teams', methods=['GET'])
def get_teams() -> JSONResponse:
    """Get all teams"""
    teams_list: List[Dict[str, Any]] = []
    
    for team_id, team in teams_data.items():
        team_info: Dict[str, Any] = {
            'id': team.id,
            'name': team.name,
            'created_at': team.created_at,
            'test_count': len(team.tests),
            'weighted_score': calculate_weighted_score(team_id)
        }
        teams_list.append(team_info)
    
    # Sort by weighted score descending
    teams_list.sort(key=lambda x: x['weighted_score'], reverse=True)
    
    return jsonify(teams_list)

@app.route('/api/teams', methods=['POST'])
def create_team() -> JSONResponse:
    """Create new team"""
    global next_team_id
    
    data: Optional[Dict[str, Any]] = request.get_json()
    
    if not data or 'name' not in data:
        return jsonify({'error': 'Team name is required'}), 400
    
    team_name: str = data['name'].strip()
    if not team_name:
        return jsonify({'error': 'Team name cannot be empty'}), 400
    
    # Check if team already exists
    for team in teams_data.values():
        if team.name == team_name:
            return jsonify({'error': 'Team already exists'}), 409
    
    # Create new team
    team_id: int = next_team_id
    new_team: TeamData = TeamData(
        id=team_id,
        name=team_name,
        tests=[],
        created_at='2025-01-16T12:00:00'
    )
    
    teams_data[team_id] = new_team
    next_team_id += 1
    
    return jsonify({
        'id': new_team.id,
        'name': new_team.name,
        'created_at': new_team.created_at,
        'test_count': 0
    }), 201

@app.route('/api/teams/<int:team_id>', methods=['DELETE'])
def delete_team(team_id: int) -> JSONResponse:
    """Delete team"""
    if team_id not in teams_data:
        return jsonify({'error': 'Team not found'}), 404
    
    del teams_data[team_id]
    return jsonify({'message': 'Team deleted successfully'})

@app.route('/api/teams/<int:team_id>/tests', methods=['GET'])
def get_team_tests(team_id: int) -> JSONResponse:
    """Get tests for a specific team"""
    if team_id not in teams_data:
        return jsonify({'error': 'Team not found'}), 404
    
    team: TeamData = teams_data[team_id]
    return jsonify({
        'team': {
            'id': team.id,
            'name': team.name,
            'created_at': team.created_at
        },
        'tests': team.tests
    })

@app.route('/api/tests', methods=['POST'])
def create_test() -> JSONResponse:
    """Create new test/score"""
    global next_test_id
    
    data: Optional[Dict[str, Any]] = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    required_fields: List[str] = ['team_id', 'score', 'test_date']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400
    
    team_id: int = data['team_id']
    if team_id not in teams_data:
        return jsonify({'error': 'Team not found'}), 404
    
    try:
        # Always use global lambda value - no per-test lambda allowed
        global_lambda: float = config_data['global_lambda']
        
        # Create new test
        test: Dict[str, Any] = {
            'id': next_test_id,
            'team_id': team_id,
            'score': float(data['score']),
            'test_date': data['test_date'],
            'lambda_value': global_lambda,
            'created_at': '2025-01-16T12:00:00'
        }
        
        teams_data[team_id].tests.append(test)
        next_test_id += 1
        
        return jsonify(test), 201
    
    except ValueError as e:
        return jsonify({'error': f'Invalid data format: {str(e)}'}), 400

def calculate_weighted_score(team_id: int) -> float:
    """Calculate weighted score with time-based exponential decay"""
    if team_id not in teams_data:
        return 0.0
    
    from datetime import datetime
    
    team: TeamData = teams_data[team_id]
    tests: List[Dict[str, Any]] = team.tests
    
    if not tests:
        return 0.0
    
    weighted_sum: float = 0.0
    global_lambda: float = config_data['global_lambda']
    today = datetime.now()
    
    # Sort tests by date
    sorted_tests = sorted(tests, key=lambda x: x['test_date'])
    
    for test in sorted_tests:
        lambda_val: float = test.get('lambda_value', global_lambda)
        test_date = datetime.fromisoformat(test['test_date'])
        days_diff = (today - test_date).days
        
        # Weekly decay factor (adjust divisor for different time scales)
        decay_factor = days_diff / 7
        weight: float = lambda_val ** decay_factor
        weighted_sum += weight * test['score']
    
    normalizer: float = 1 - global_lambda
    return normalizer * weighted_sum

@app.route('/api/rankings', methods=['GET'])
def get_rankings() -> JSONResponse:
    """Get current rankings with weighted scores"""
    rankings: List[Dict[str, Any]] = []
    
    for team_id, team in teams_data.items():
        weighted_score: float = calculate_weighted_score(team_id)
        rankings.append({
            'id': team.id,
            'name': team.name,
            'weighted_score': weighted_score,
            'test_count': len(team.tests)
        })
    
    # Sort by weighted score descending
    rankings.sort(key=lambda x: x['weighted_score'], reverse=True)
    
    # Add positions
    for i, team_data in enumerate(rankings):
        team_data['position'] = i + 1
    
    return jsonify(rankings)

if __name__ == '__main__':
    print("🚀 Starting typed test server...")
    print("📊 Sports Evaluation System - Typed Backend")
    print("🌐 Backend API: http://localhost:3001/api")
    print("🔧 Full TypeScript-style type hints")
    
    app.run(
        host='0.0.0.0',
        port=3001,
        debug=True
    )
