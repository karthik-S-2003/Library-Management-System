from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    phone_number: str
    password: str

class UserResponse(BaseModel):
    user_id: str
    name: str
    email: str
    phone_number: str
    role: str
    class Config:
        from_attributes = True

class BookCreate(BaseModel):
    title: str
    author: str
    content: str
    theme: Optional[str] = None
    price: float
    is_premium: bool

class BookUpdate(BaseModel):
    title: str
    author: str
    content: str
    price: float
    is_premium: bool
    theme: Optional[str] = None

class Payment(BaseModel):
    amount: float

class LoginResponse(BaseModel):
    message: str
    username: str
    role: str
    token: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str

class StopReadingBody(BaseModel):
    duration_seconds: int

class CommentCreate(BaseModel):
    book_id: int
    content: str
    parent_id: Optional[int] = None 

class CommentResponse(BaseModel):
    id: int
    user_name: str
    content: str
    created_at: datetime
    replies: List['CommentResponse'] = [] 
    
    class Config:
        from_attributes = True
        #pydantic excepts the data to be in dict but sqlalchemy gives object format so we are using this 
        


