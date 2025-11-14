# SVGE Tournament System

A comprehensive tournament management system built with Flask and vanilla JavaScript, supporting both single and double elimination brackets.

## Features

- 🏆 **Single & Double Elimination Brackets** - Support for 4, 8, 16, and 32 teams
- ⚡ **Real-time Updates** - Score tracking with automatic winner advancement
- 🔒 **Secure Admin Panel** - Server-side authentication with session management
- 📊 **Validation Tools** - Built-in bracket routing validation for debugging
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🎨 **Clean UI** - Bootstrap-based interface with intuitive controls

## Quick Start

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd SVGE
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the server:
```bash
python app.py
```

4. Open your browser to:
- Public view: http://localhost:80
- Admin panel: http://localhost:80/admin-login.html

### Default Admin Credentials

- **Username**: (none required)
- **Password**: `svgeadmin2025`

**⚠️ IMPORTANT: Change the default password before deploying to production!**

See [SECURITY.md](SECURITY.md) for instructions on changing the password.

## Admin Features

### Tournament Management
- Create, edit, and delete tournaments
- Randomize team assignments
- Manual team assignment with drag-and-drop feel
- Score-based automatic winner advancement

### Bracket Features
- Visual bracket editor
- "Validates to" labels showing next-match routing
- Compact admin view for easier visualization
- **Validate Bracket** button for debugging routing issues
- Real-time console logging for losers bracket advancement

### Supported Bracket Types

#### Single Elimination
- Standard tournament format
- Loser is immediately eliminated
- Supports 4, 8, 16, and 32 teams

#### Double Elimination
- Teams get a second chance
- Winners bracket and losers bracket
- Losers from winners drop to losers bracket
- Grand finals between winners champion and losers champion
- Correct routing for 16-team losers bracket (L0→L1, L1→L2 identity mapping)

## Project Structure

```
SVGE/
├── app.py                          # Flask backend with authentication
├── requirements.txt                # Python dependencies
├── generate_password_hash.py       # Password hash generator utility
├── SECURITY.md                     # Security documentation
├── tournaments_data.json           # Tournament data storage
└── webroot/                        # Frontend files
    ├── index.html                  # Landing page
    ├── tournaments.html            # Public tournament list
    ├── admin-login.html            # Admin authentication
    ├── tournament-admin.html       # Tournament editor
    ├── manage-tournaments.html     # Tournament management
    └── assets/
        ├── css/
        │   └── tournament.css      # Tournament styling
        └── js/
            ├── api-helper.js       # API client with auth
            ├── tournament-admin.js # Admin bracket logic
            └── tournament-view.js  # Public bracket viewer
```

## API Endpoints

### Public Endpoints
- `GET /api/tournaments` - List all tournaments
- `GET /api/tournaments/<id>` - Get tournament details

### Protected Endpoints (Require Authentication)
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Admin logout
- `GET /api/auth/check` - Check authentication status
- `POST /api/tournaments` - Create tournament
- `PUT /api/tournaments/<id>` - Update tournament
- `DELETE /api/tournaments/<id>` - Delete tournament

## Security

### Authentication
- Server-side session management with secure cookies
- Password hashing using werkzeug's PBKDF2
- 2-hour session expiration
- Protected admin endpoints

### Changing the Password

Use the included utility:
```bash
python generate_password_hash.py
```

Or set via environment variable:
```bash
export ADMIN_PASSWORD_HASH="your-generated-hash"
```

See [SECURITY.md](SECURITY.md) for complete security documentation.

## Development

### Running in Debug Mode
```bash
export DEBUG=true
python app.py
```

### Configuration via Environment Variables
- `HOST` - Server host (default: 0.0.0.0)
- `PORT` - Server port (default: 80)
- `DEBUG` - Enable debug mode (default: False)
- `SECRET_KEY` - Flask session secret key (auto-generated if not set)
- `ADMIN_PASSWORD_HASH` - Admin password hash (default: svgeadmin2025)

## Validation & Debugging

The admin panel includes a **Validate Bracket** button that:
- ✅ Checks all winners bracket routing
- ✅ Verifies losers bracket assignments
- ✅ Confirms losers-to-losers advancement logic
- ✅ Shows expected vs actual placements
- ✅ Highlights any routing errors or warnings

Console logging is enabled for real-time debugging:
```javascript
// Example console output:
📍 Losers advancement: l0-2 (Team 5) | Round 0 Match 2
   Matches: This round=4, Next round=4
   Target: l1-2 team1
   ✓ Placed in preferred: l1-2 team1
```

## Known Issues & Solutions

### 16-Team Double Elimination Losers Bracket
The system correctly implements identity mapping for L0→L1 and L1→L2 (match 0→0, 1→1, etc.) since both rounds have the same number of matches (4). Use the Validate Bracket button to confirm routing.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly (use Validate Bracket!)
5. Submit a pull request

## License

Designed by Rudra Mutalik and David Deng

## Support

For issues or questions, please open a GitHub issue or contact the maintainers.
