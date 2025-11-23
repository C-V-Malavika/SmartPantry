"""
Test script to verify .env file loading
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Try to load .env from backend directory
env_path = Path(__file__).parent / ".env"
print(f"Looking for .env at: {env_path}")
print(f"File exists: {env_path.exists()}")

if env_path.exists():
    print(f"Loading .env from: {env_path}")
    load_dotenv(dotenv_path=env_path)
else:
    print("Loading .env from default location")
    load_dotenv()

# Check if ADMIN_SECRET_KEY is loaded
admin_secret = os.getenv("ADMIN_SECRET_KEY")
print(f"\nADMIN_SECRET_KEY value: {admin_secret}")
print(f"ADMIN_SECRET_KEY type: {type(admin_secret)}")
print(f"ADMIN_SECRET_KEY length: {len(admin_secret) if admin_secret else 0}")

if admin_secret:
    print(f"First 3 chars: {admin_secret[:3]}")
    print(f"Last 3 chars: {admin_secret[-3:]}")
else:
    print("WARNING: ADMIN_SECRET_KEY is None or empty!")

# Show all env vars starting with ADMIN
print("\nAll ADMIN_* environment variables:")
for key, value in os.environ.items():
    if key.startswith("ADMIN"):
        print(f"  {key} = {value}")

