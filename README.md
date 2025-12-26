Website built with Html, Javascript and Python Flask

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
