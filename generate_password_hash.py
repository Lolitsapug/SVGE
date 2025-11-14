#!/usr/bin/env python3
"""
Generate a secure password hash for the admin panel.
Usage: python generate_password_hash.py
"""

from werkzeug.security import generate_password_hash
import sys

def main():
    print("=" * 60)
    print("SVGE Admin Password Hash Generator")
    print("=" * 60)
    print()
    
    # Get password from user
    password = input("Enter new admin password: ")
    
    if len(password) < 8:
        print("⚠️  Warning: Password should be at least 8 characters long!")
        confirm = input("Continue anyway? (y/N): ")
        if confirm.lower() != 'y':
            print("Aborted.")
            return
    
    # Generate hash
    hashed = generate_password_hash(password)
    
    print()
    print("✅ Password hash generated successfully!")
    print()
    print("=" * 60)
    print("Add this to your environment variables:")
    print("=" * 60)
    print()
    print(f"ADMIN_PASSWORD_HASH={hashed}")
    print()
    print("=" * 60)
    print("For Windows PowerShell:")
    print(f'$env:ADMIN_PASSWORD_HASH = "{hashed}"')
    print()
    print("For Linux/Mac bash:")
    print(f'export ADMIN_PASSWORD_HASH="{hashed}"')
    print("=" * 60)
    print()
    print("🔒 Keep this hash secret and secure!")
    print()

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nAborted.")
        sys.exit(0)
