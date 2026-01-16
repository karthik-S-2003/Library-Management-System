from fastapi import Depends, HTTPException,status
from sqlalchemy.orm import Session
from tables import UserTable
from database import get_db
from routers.auth import oauth2_scheme
from routers.auth import default_users,active_tokens

def authenticate_user(username: str, password: str, db: Session):
    if username in default_users:
        if default_users[username]["password"] == password:
            return {"username": username, "role": default_users[username]["role"]}
        return None
    user = db.query(UserTable).filter(UserTable.user_id == username).first()
    if user and user.password == password:
        return {"username": user.user_id, "role": user.role}
    return None

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="please register/login to view",  
            headers={"WWW-Authenticate": "Bearer"},
        )

    # updating tokens
    username = active_tokens.get(token)
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please login again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if username in default_users:
        return {"username": username, "role": default_users[username]["role"]}
    
    user = db.query(UserTable).filter(UserTable.user_id == username).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return {"username": user.user_id, "role": user.role}

def require_role(required_role: str):
    def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] != required_role:
            raise HTTPException(status_code=403, detail=f"Only {required_role} can access")
        return current_user
    return role_checker
