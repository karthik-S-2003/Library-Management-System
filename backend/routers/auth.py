from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import secrets

from database import get_db
from dependencies import oauth2_scheme
from tables import UserTable

router = APIRouter()

default_users = {
    "admin": {"password": "admin", "role": "admin"},
    "creator": {"password": "creator", "role": "creator"},
    "user": {"password": "user", "role": "user"},
}
active_tokens: dict[str, str] = {} 

def authenticate_user(username: str, password: str, db: Session):
    if username in default_users and default_users[username]["password"] == password:
        return {"username": username, "role": default_users[username]["role"], "name": username} 

    user = db.query(UserTable).filter(
        (UserTable.user_id == username) | (UserTable.name == username) 
    ).first()

    if user and user.password == password:
        return {"username": user.user_id, "role": user.role, "name": user.name}

    return None

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(form_data.username, form_data.password, db)
    if not user:
        raise HTTPException(status_code=401, detail="Wrong credentials")
    
    token = secrets.token_urlsafe(32)
    active_tokens[token] = user["username"]
    
    return {
        "access_token": token, 
        "token_type": "bearer", 
        "username": user["username"], # Keep this as unique ID
        "role": user["role"],
        "name": user["name"]          # <--- SEND NAME TO FRONTEND
    }

def get_current_user(token: str | None = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="please register/login to view")
    username = active_tokens.get(token)
    if not username:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired. Please login again.")
    if username in default_users:
        return {"username": username, "role": default_users[username]["role"]}
    user = db.query(UserTable).filter(UserTable.user_id == username).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return {"username": user.user_id, "role": user.role}

def require_role(role: str):
    def checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] != role:
            raise HTTPException(status_code=403, detail=f"Only {role} can access")
        return current_user
    return checker


