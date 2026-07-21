from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from pymongo.database import Database
from app.database import get_db
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
import bcrypt
import os

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days

router = APIRouter(prefix="/api/auth", tags=["auth"])

def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password):
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Database = Depends(get_db)):
    db_user = db.users.find_one({"email": user.email})
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user_dict = {
        "name": user.name,
        "email": user.email,
        "hashed_password": hashed_password
    }
    
    result = db.users.insert_one(new_user_dict)
    
    # Return user data with stringified _id
    return UserResponse(
        id=str(result.inserted_id),
        name=user.name,
        email=user.email
    )

@router.post("/login", response_model=Token)
def login_user(user: UserLogin, db: Database = Depends(get_db)):
    admin_email = os.getenv("ADMIN_EMAIL", "admin@sitewatch.lk")
    admin_password = os.getenv("ADMIN_PASSWORD", "admin@123")
    
    if user.email == admin_email:
        if user.password == admin_password:
            access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = create_access_token(
                data={"sub": admin_email}, expires_delta=access_token_expires
            )
            return {"access_token": access_token, "token_type": "bearer"}
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    db_user = db.users.find_one({"email": user.email})
    if not db_user or "hashed_password" not in db_user or not verify_password(user.password, db_user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user["email"]}, expires_delta=access_token_expires
    )
    
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/users", response_model=List[UserResponse])
def get_users(db: Database = Depends(get_db)):
    users = []
    for db_user in db.users.find({"hashed_password": {"$exists": True}}):
        users.append(
            UserResponse(
                id=str(db_user["_id"]),
                name=db_user.get("name", "Unknown Worker"),
                email=db_user.get("email", "No Email")
            )
        )
    return users
