# app.py - Update your CORS and OPTIONS handling
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from datetime import datetime
import crud, models, schemas, auth
from database import SessionLocal, engine
from fastapi.security import HTTPBearer
import os
import shutil
from pathlib import Path
from dotenv import load_dotenv

# Load .env file - try both current directory and backend directory
env_path = Path(__file__).parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()  # Fallback to default location

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="SmartPantry API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/register", response_model=schemas.User)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    try:
        db_user = crud.get_user_by_email(db, email=user.email)
        if db_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Check if admin secret key is provided and correct
        is_admin = False
        admin_secret = os.getenv("ADMIN_SECRET_KEY", "admin123")  # Default secret, change in production
        
        # Debug: Check if .env is loaded (only show if key is provided)
        if user.admin_secret_key:
            env_loaded = os.getenv("ADMIN_SECRET_KEY") is not None
            print(f"DEBUG: Admin secret key provided. .env loaded: {env_loaded}")
            if not env_loaded:
                print("WARNING: ADMIN_SECRET_KEY not found in environment. Using default.")
        
        if user.admin_secret_key:
            if user.admin_secret_key.strip() == admin_secret.strip():
                is_admin = True
                print(f"DEBUG: User will be created as admin")
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid admin secret key. Please check your .env file or contact administrator."
                )
        
        result = crud.create_user(db=db, user=user, is_admin=is_admin)
        print(f"DEBUG: User created successfully. Email: {result.email}, is_admin: {result.is_admin}")
        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR in register: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@app.post("/login")
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if not db_user or not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token = auth.create_access_token(data={"sub": db_user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": db_user.id,
            "email": db_user.email,
            "name": db_user.name,
            "is_admin": db_user.is_admin,
            "created_at": db_user.created_at.isoformat()
        }
    }

def get_current_user(
    token: str = Depends(security),
    db: Session = Depends(get_db)
):
    email = auth.verify_token(token.credentials)
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    user = crud.get_user_by_email(db, email=email)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

def get_admin_user(current_user: models.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

@app.get("/users/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.get("/")
def read_root():
    return {"message": "SmartPantry API is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

def normalize_filename(name: str) -> str:
    """
    Convert name to filename convention:
    - Single word: all lowercase
    - Multiple words: words separated by underscores, all lowercase
    """
    # Remove extra spaces and split by spaces
    words = name.strip().split()
    # Join with underscores and convert to lowercase
    normalized = '_'.join(words).lower()
    return normalized

# File upload endpoint for admin
@app.post("/admin/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    folder: str = Form("ingredients"),  # "ingredients" or "food"
    name: str = Form(...),  # Name of ingredient/recipe for filename
    admin_user: models.User = Depends(get_admin_user)
):
    """
    Upload an image file to the frontend assets folder.
    folder: "ingredients" or "food"
    name: Name of the ingredient/recipe (used for filename)
    """
    # Validate folder
    if folder not in ["ingredients", "food"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Folder must be 'ingredients' or 'food'"
        )
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image"
        )
    
    # Validate name
    if not name or not name.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Name is required"
        )
    
    # Get the file extension
    file_ext = Path(file.filename).suffix if file.filename else '.jpg'
    
    # Normalize the name according to convention
    normalized_name = normalize_filename(name)
    filename = f"{normalized_name}{file_ext}"
    
    # Path to frontend assets folder (relative to backend)
    assets_path = Path(__file__).parent.parent / "frontend" / "public" / "assets" / folder
    assets_path.mkdir(parents=True, exist_ok=True)
    
    file_path = assets_path / filename
    
    # Check if file already exists and handle overwrite
    if file_path.exists():
        # If file exists, we'll overwrite it (same name = same ingredient/recipe)
        pass
    
    # Save the file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )
    
    # Return the relative path for Firestore
    relative_path = f"assets/{folder}/{filename}"
    
    return {
        "filename": filename,
        "path": relative_path,
        "url": f"/{relative_path}"
    }

# from database import SessionLocal
# from auth import get_password_hash

# @app.on_event("startup")
# def create_default_admin():
#     db = SessionLocal()

#     admin_email = "nkmadhukrishaa@gmail.com"
#     admin_password = "Admin@123"  # You can change this
#     admin_name = "System Admin"

#     from models import User
#     from crud import get_user_by_email

#     existing_admin = get_user_by_email(db, admin_email)

#     if not existing_admin:
#         print("Creating default admin...")

#         hashed_pw = get_password_hash(admin_password)

#         admin_user = User(
#             name=admin_name,
#             email=admin_email,
#             hashed_password=hashed_pw,
#             is_admin=True
#         )

#         db.add(admin_user)
#         db.commit()
#         db.refresh(admin_user)

#         print("Admin created successfully:", admin_email)

#     db.close()
