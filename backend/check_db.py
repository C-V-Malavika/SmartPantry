"""
Script to check and fix database schema for is_admin column
"""
import sqlite3
from pathlib import Path

db_path = Path(__file__).parent / "smartpantry.db"

if not db_path.exists():
    print("Database file not found. It will be created on first run.")
    exit(0)

conn = sqlite3.connect(str(db_path))
cursor = conn.cursor()

# Check if is_admin column exists
cursor.execute("PRAGMA table_info(users)")
columns = [column[1] for column in cursor.fetchall()]

if 'is_admin' not in columns:
    print("is_admin column not found. Adding it...")
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0")
        conn.commit()
        print("[SUCCESS] is_admin column added successfully!")
    except Exception as e:
        print(f"Error adding column: {e}")
        conn.rollback()
else:
    print("[OK] is_admin column already exists")

# Show current users
cursor.execute("SELECT id, email, name, is_admin FROM users")
users = cursor.fetchall()
if users:
    print("\nCurrent users:")
    for user in users:
        print(f"  ID: {user[0]}, Email: {user[1]}, Name: {user[2]}, Admin: {user[3]}")
else:
    print("\nNo users in database yet.")

conn.close()

