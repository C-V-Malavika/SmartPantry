"""
Script to set a user as admin.
Usage: python set_admin.py <email>
"""
import sys
from database import SessionLocal
import crud

def set_admin(email: str):
    db = SessionLocal()
    try:
        user = crud.get_user_by_email(db, email=email)
        if not user:
            print(f"User with email {email} not found.")
            return False
        
        user.is_admin = True
        db.commit()
        print(f"User {email} has been set as admin.")
        return True
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python set_admin.py <email>")
        sys.exit(1)
    
    email = sys.argv[1]
    set_admin(email)

