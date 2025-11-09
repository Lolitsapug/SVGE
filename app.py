from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import json
import os
from datetime import datetime

app = Flask(__name__, static_folder='webroot', static_url_path='')
CORS(app)  # Enable CORS for all routes

# Path to store tournament data
DATA_FILE = 'tournaments_data.json'

def load_tournaments():
    """Load tournaments from JSON file"""
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, 'r') as f:
                return json.load(f)
        except json.JSONDecodeError:
            return []
    return []

def save_tournaments(tournaments):
    """Save tournaments to JSON file"""
    with open(DATA_FILE, 'w') as f:
        json.dump(tournaments, f, indent=2)

def get_tournament_by_id(tournament_id):
    """Get a specific tournament by ID"""
    tournaments = load_tournaments()
    for tournament in tournaments:
        if tournament.get('id') == tournament_id:
            return tournament
    return None

# Serve the main HTML files
@app.route('/')
def index():
    return send_from_directory('webroot', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('webroot', path)

# API Routes

@app.route('/api/tournaments', methods=['GET'])
def get_all_tournaments():
    """Get list of all tournaments (summary only)"""
    tournaments = load_tournaments()
    # Return simplified list for the tournaments hub
    tournament_list = []
    for t in tournaments:
        tournament_list.append({
            'id': t.get('id'),
            'title': t.get('title'),
            'date': t.get('date'),
            'status': t.get('status'),
            'image': t.get('image')
        })
    return jsonify(tournament_list)

@app.route('/api/tournaments/<tournament_id>', methods=['GET'])
def get_tournament(tournament_id):
    """Get full tournament data by ID"""
    tournament = get_tournament_by_id(tournament_id)
    if tournament:
        return jsonify(tournament)
    return jsonify({'error': 'Tournament not found'}), 404

@app.route('/api/tournaments', methods=['POST'])
def create_tournament():
    """Create a new tournament"""
    data = request.json
    tournament_id = data.get('id')
    
    if not tournament_id:
        return jsonify({'error': 'Tournament ID is required'}), 400
    
    # Check if tournament already exists
    if get_tournament_by_id(tournament_id):
        return jsonify({'error': 'Tournament with this ID already exists'}), 409
    
    # Create new tournament with default structure
    new_tournament = {
        'id': tournament_id,
        'numTeams': data.get('numTeams', 8),
        'teams': data.get('teams', []),
        'matches': data.get('matches', {}),
        'title': data.get('title', 'New Tournament'),
        'description': data.get('description', ''),
        'date': data.get('date', ''),
        'status': data.get('status', 'upcoming'),
        'image': data.get('image', 'assets/img/bracket.png')
    }
    
    tournaments = load_tournaments()
    tournaments.append(new_tournament)
    save_tournaments(tournaments)
    
    return jsonify(new_tournament), 201

@app.route('/api/tournaments/<tournament_id>', methods=['PUT'])
def update_tournament(tournament_id):
    """Update an existing tournament"""
    tournaments = load_tournaments()
    
    for i, tournament in enumerate(tournaments):
        if tournament.get('id') == tournament_id:
            # Update tournament data
            updated_data = request.json
            updated_data['id'] = tournament_id  
            tournaments[i] = updated_data
            save_tournaments(tournaments)
            return jsonify(updated_data)
    
    return jsonify({'error': 'Tournament not found'}), 404

@app.route('/api/tournaments/<tournament_id>', methods=['DELETE'])
def delete_tournament(tournament_id):
    """Delete a tournament"""
    tournaments = load_tournaments()
    
    for i, tournament in enumerate(tournaments):
        if tournament.get('id') == tournament_id:
            deleted = tournaments.pop(i)
            save_tournaments(tournaments)
            return jsonify({'message': 'Tournament deleted', 'tournament': deleted})
    
    return jsonify({'error': 'Tournament not found'}), 404

@app.route('/api/init-example', methods=['POST'])
def init_example_tournament():
    """Initialize the example tournament"""
    example_id = 'example-tournament'
    
    # Check if it already exists
    if get_tournament_by_id(example_id):
        return jsonify({'message': 'Example tournament already exists'}), 200
    
    example_tournament = {
        'id': example_id,
        'numTeams': 8,
        'teams': [
            {'id': 1, 'name': 'Team Alpha', 'captain': 'CaptainAlpha', 'gameId': 'Alpha#1234', 'eliminated': False},
            {'id': 2, 'name': 'Team Bravo', 'captain': 'CaptainBravo', 'gameId': 'Bravo#5678', 'eliminated': False},
            {'id': 3, 'name': 'Team Charlie', 'captain': 'CaptainCharlie', 'gameId': 'Charlie#9012', 'eliminated': False},
            {'id': 4, 'name': 'Team Delta', 'captain': 'CaptainDelta', 'gameId': 'Delta#3456', 'eliminated': False},
            {'id': 5, 'name': 'Team Echo', 'captain': 'CaptainEcho', 'gameId': 'Echo#7890', 'eliminated': False},
            {'id': 6, 'name': 'Team Foxtrot', 'captain': 'CaptainFoxtrot', 'gameId': 'Foxtrot#1111', 'eliminated': False},
            {'id': 7, 'name': 'Team Golf', 'captain': 'CaptainGolf', 'gameId': 'Golf#2222', 'eliminated': False},
            {'id': 8, 'name': 'Team Hotel', 'captain': 'CaptainHotel', 'gameId': 'Hotel#3333', 'eliminated': False}
        ],
        'matches': {
            '0-0': {'team1': 1, 'team2': 2, 'winner': None},
            '0-1': {'team1': 3, 'team2': 4, 'winner': None},
            '0-2': {'team1': 5, 'team2': 6, 'winner': None},
            '0-3': {'team1': 7, 'team2': 8, 'winner': None},
            '1-0': {'team1': None, 'team2': None, 'winner': None},
            '1-1': {'team1': None, 'team2': None, 'winner': None},
            'final-0': {'team1': None, 'team2': None, 'winner': None}
        },
        'title': 'Example Tournament',
        'description': 'This is an example tournament to demonstrate the bracket system. You can edit this tournament or create your own from the admin panel.',
        'date': 'Nov 9 - Nov 16, 2025',
        'status': 'ongoing',
        'image': 'assets/img/bracket.png'
    }
    
    tournaments = load_tournaments()
    tournaments.append(example_tournament)
    save_tournaments(tournaments)
    
    return jsonify({'message': 'Example tournament created', 'tournament': example_tournament}), 201

if __name__ == '__main__':
    # Initialize example tournament if data file doesn't exist
    if not os.path.exists(DATA_FILE):
        print("Initializing with example tournament...")
        save_tournaments([])  # Create empty file first
        # The example will be created on first API call
    
    print("=" * 50)
    print("SVGE Tournament System - Flask Backend")
    print("=" * 50)
    print("Server running on: http://localhost:5000")
    print("Admin Panel: http://localhost:5000/admin-login.html")
    print("Tournaments: http://localhost:5000/tournaments.html")
    print("=" * 50)
    
    # Use environment variables for production deployment
    port = int(os.environ.get('PORT', 5000))
    host = os.environ.get('HOST', '0.0.0.0')
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    
    app.run(debug=debug, host=host, port=port)
