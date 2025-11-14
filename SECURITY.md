# Security Configuration

## Admin Authentication

The admin password is now stored securely on the server side using password hashing. The password is **never** sent or stored in the client-side JavaScript.

### Default Password

The default admin password is: `svgeadmin2025`

**⚠️ IMPORTANT: Change this password before deploying to production!**

## Changing the Admin Password

### Method 1: Using Environment Variable (Recommended for Production)

Set the `ADMIN_PASSWORD_HASH` environment variable with a hashed password:

```bash
# On Windows (PowerShell)
$env:ADMIN_PASSWORD_HASH = "your-hashed-password-here"

# On Linux/Mac
export ADMIN_PASSWORD_HASH="your-hashed-password-here"
```

To generate a password hash, run this Python script:

```python
from werkzeug.security import generate_password_hash

# Replace 'your_new_password' with your desired password
password = 'your_new_password'
hashed = generate_password_hash(password)
print(f"ADMIN_PASSWORD_HASH={hashed}")
```

### Method 2: Quick Change (for Development)

Edit `app.py` and change the default password in the generate_password_hash() call:

```python
ADMIN_PASSWORD_HASH = os.environ.get(
    'ADMIN_PASSWORD_HASH',
    generate_password_hash('YOUR_NEW_PASSWORD_HERE')  # Change this line
)
```

## Session Security

- Sessions are stored server-side and expire after 2 hours of inactivity
- Session tokens use Flask's secure session cookies
- The `SECRET_KEY` is automatically generated but should be set via environment variable in production

### Setting a Custom Secret Key (Production)

```bash
# Generate a secure random key
python -c "import secrets; print(secrets.token_hex(32))"

# Set it as an environment variable
export SECRET_KEY="your-generated-key-here"
```

## Authentication Flow

1. User enters password on `/admin-login.html`
2. Password is sent to `/api/auth/login` via HTTPS (use HTTPS in production!)
3. Server verifies password using werkzeug's secure password hashing
4. On success, server creates a session and returns success
5. Client stores a flag in sessionStorage for quick checks
6. All admin API calls include session cookie (`credentials: 'include'`)
7. Server validates session on every protected endpoint

## Protected Endpoints

The following API endpoints now require authentication:

- `POST /api/tournaments` - Create tournament
- `PUT /api/tournaments/<id>` - Update tournament
- `DELETE /api/tournaments/<id>` - Delete tournament

Public endpoints (no authentication required):

- `GET /api/tournaments` - List tournaments
- `GET /api/tournaments/<id>` - View tournament details

## Security Best Practices

1. **Always use HTTPS in production** - Session cookies and passwords should never be sent over HTTP
2. **Change the default password immediately**
3. **Set a strong SECRET_KEY via environment variable**
4. **Regularly rotate passwords**
5. **Monitor server logs for failed authentication attempts**
6. **Consider adding rate limiting to prevent brute force attacks**

## Additional Security Enhancements (Future)

Consider implementing:
- Rate limiting on login endpoint
- Account lockout after failed attempts
- Two-factor authentication (2FA)
- Password complexity requirements
- Audit logging for admin actions
