from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from tables import BookTable, UserTable
from models import UserResponse
from crud import require_role

router = APIRouter()

# --- ADMIN DASHBOARD STATS ---
@router.get("/summary")
def admin_summary(current_user: dict = Depends(require_role("admin")), db: Session = Depends(get_db)):
    total_books = db.query(BookTable).count()
    pending_books = db.query(BookTable).filter(BookTable.status == "pending").count()
    total_users = db.query(UserTable).count()
    
    return {
        "stats": {
            "total_books": total_books, 
            "pending_books": pending_books, 
            "total_users": total_users
        }
    }

# --- MANAGE USERS ---
@router.get("/users", response_model=List[UserResponse])
def get_all_users(current_user: dict = Depends(require_role("admin")), db: Session = Depends(get_db)):
    users = db.query(UserTable).all()
    return users

# --- MANAGE BOOKS (ALL) ---
@router.get("/books")
def get_all_books_admin(current_user: dict = Depends(require_role("admin")), db: Session = Depends(get_db)):
    books = db.query(BookTable).all()
    return [
        
            {
                "id": b.id, "title": b.title, "author": b.author, 
                "price": b.price, "is_premium": b.is_premium, 
                "status": b.status, "content": b.content[:100] + "..." # Preview only
            } 
            for b in books
        
    ]

# --- ACTIONS ---
@router.post("/books/{book_id}/approve")
def approve_book(book_id: int, current_user: dict = Depends(require_role("admin")), db: Session = Depends(get_db)):
    book = db.query(BookTable).filter(BookTable.id == book_id).first()
    if not book: raise HTTPException(404, "Book not found")
    
    book.status = "approved"
    db.commit()
    return {"message": "Book approved successfully"}

@router.post("/books/{book_id}/reject")
def reject_book(book_id: int, current_user: dict = Depends(require_role("admin")), db: Session = Depends(get_db)):
    book = db.query(BookTable).filter(BookTable.id == book_id).first()
    if not book: raise HTTPException(404, "Book not found")
    
    book.status = "rejected"
    db.commit()
    return {"message": "Book rejected"}

@router.delete("/books/{book_id}")
def delete_book_admin(book_id: int, current_user: dict = Depends(require_role("admin")), db: Session = Depends(get_db)):
    book = db.query(BookTable).filter(BookTable.id == book_id).first()
    if not book: raise HTTPException(404, "Book not found")
    
    db.delete(book)
    db.commit()
    return {"message": "Book deleted permanently"}
