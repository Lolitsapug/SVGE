# SVGE Tournament System - Flask Backend

This is the SVGE Tournament Management System with a Python Flask backend for persistent data storage.

## Features

- **Multi-tournament support**: Create and manage multiple separate tournaments
- **Admin panel**: Password-protected tournament administration
- **Real-time bracket management**: Update teams, matches, and winners
- **Persistent storage**: All tournament data stored on the server
- **Public viewing**: Anyone can view tournament brackets

## Requirements

- Python 3.7 or higher
- Flask
- Flask-CORS

## Installation

1. **Install Python dependencies**:
   ```powershell
   pip install -r requirements.txt
   ```

## Running the Server

1. **Start the Flask server**:
   ```powershell
   python app.py
   ```

2. **Access the application**:
   - Main site: http://localhost:5000/
   - Tournaments hub: http://localhost:5000/tournaments.html
   - Admin login: http://localhost:5000/admin-login.html

3. **Admin credentials**:
   - Password: `svgeadmin2025`

## How It Works

### Backend (Flask)

The Flask server (`app.py`) provides:
- RESTful API endpoints for tournament management
- File-based storage using `tournaments_data.json`
- Static file serving for the frontend
- CORS support for API calls

### API Endpoints

- `GET /api/tournaments` - Get all tournaments (summary list)
- `GET /api/tournaments/<id>` - Get specific tournament data
- `POST /api/tournaments` - Create new tournament
- `PUT /api/tournaments/<id>` - Update tournament
- `DELETE /api/tournaments/<id>` - Delete tournament
- `POST /api/init-example` - Initialize example tournament

### Frontend

The JavaScript frontend uses the `TournamentAPI` class (in `api-helper.js`) to:
- Load tournament data from the server
- Save changes made by admins
- Display tournaments on the public page

## File Structure

```
SVGE/
├── app.py                          # Flask backend server
├── requirements.txt                 # Python dependencies
├── tournaments_data.json           # Tournament data storage (created automatically)
└── webroot/                        # Frontend files
    ├── tournaments.html            # Public tournaments hub
    ├── tournament.html             # Individual tournament view
    ├── tournament-admin.html       # Admin editor
    ├── manage-tournaments.html     # Tournament management
    ├── admin-login.html            # Admin login
    └── assets/
        └── js/
            ├── api-helper.js       # API communication layer
            ├── tournament-view.js  # Public viewing logic
            └── tournament-admin.js # Admin editing logic
```

## Data Storage

Tournament data is stored in `tournaments_data.json`. This file is:
- Automatically created on first run
- Contains all tournament data in JSON format
- Persists between server restarts
- Shared across all users

### Example Tournament

The system includes an example tournament with 8 teams to demonstrate functionality. You can:
- View it at: http://localhost:5000/tournament.html?id=example-tournament
- Edit it from the admin panel
- Delete it and create your own tournaments

## Creating a New Tournament

1. Log in to admin panel: http://localhost:5000/admin-login.html
2. Go to "Manage Tournaments"
3. Enter a Tournament ID (e.g., "valorant-spring-2025")
4. Enter a Tournament Title (e.g., "Valorant Spring Tournament")
5. Click "Create Tournament"
6. Configure teams, bracket, and details

## Deployment

For production deployment:

1. **Set debug=False** in `app.py`:
   ```python
   app.run(debug=False, host='0.0.0.0', port=5000)
   ```

2. **Use a production WSGI server** (e.g., Gunicorn):
   ```powershell
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:5000 app:app
   ```

3. **Update API_BASE_URL** in `webroot/assets/js/api-helper.js`:
   ```javascript
   const API_BASE_URL = 'https://your-domain.com/api';
   ```

4. **Secure your server**:
   - Use HTTPS
   - Implement proper authentication
   - Set up a reverse proxy (nginx/Apache)
   - Regular backups of `tournaments_data.json`

## Troubleshooting

### "Error loading tournaments"
- Make sure the Flask server is running
- Check console for error messages
- Verify the API_BASE_URL in `api-helper.js` is correct

### Changes not saving
- Check server console for errors
- Verify file permissions on `tournaments_data.json`
- Check browser console for API errors

### Port already in use
- Change the port in `app.py`: `app.run(port=5001)`
- Update `API_BASE_URL` in `api-helper.js` to match

## Support

For issues or questions, please check the browser console and Flask server logs for error messages.
