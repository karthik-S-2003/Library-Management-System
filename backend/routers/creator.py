from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from tables import BookTable
from models import BookCreate, BookUpdate
from crud import require_role

router = APIRouter()

# --- DASHBOARD / SUMMARY ---
@router.get("/summary")
def creator_summary(current_user: dict = Depends(require_role("creator")), db: Session = Depends(get_db)):
    my_books = db.query(BookTable).filter(BookTable.creator_id == current_user["username"]).all()
    
    total_books = len(my_books)
    pending = sum(1 for b in my_books if b.status == "pending")
    approved = sum(1 for b in my_books if b.status == "approved")
    rejected = sum(1 for b in my_books if b.status == "rejected")

    # Return stats + list of books for the dashboard
    return {
        "page": "creator",
        "current_user": current_user,
        "stats": {
            "total": total_books,
            "pending": pending,
            "approved": approved,
            "rejected": rejected
        },
        # We include the books list here so dashboard can show them immediately
        "books": [
            {
                "id": b.id, "title": b.title, "author": b.author, 
                "price": b.price, "is_premium": b.is_premium, 
                "status": b.status, "content": b.content  # Send content so they can edit
            } 
            for b in my_books
        ]
    }

# --- CREATE BOOK ---
@router.post("/books/")
def create_book(book: BookCreate, current_user: dict = Depends(require_role("creator")), db: Session = Depends(get_db)):
    db_book = BookTable(
        title=book.title,
        author=book.author,
        content=book.content,
        price=book.price,
        is_premium=book.is_premium,
        status="pending",
        theme=book.theme,
        creator_id=current_user["username"]
    )
    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    return {"message": "Book created successfully! Sent to Admin for approval.", "book_id": db_book.id}

# --- UPDATE BOOK ---
@router.put("/books/{book_id}")
def update_book(book_id: int, book: BookUpdate, current_user: dict = Depends(require_role("creator")), db: Session = Depends(get_db)):
    db_book = db.query(BookTable).filter(
        BookTable.id == book_id, 
        BookTable.creator_id == current_user["username"]
    ).first()
    
    if not db_book:
        raise HTTPException(404, "Book not found or access denied")
    
    # Update fields
    db_book.title = book.title
    db_book.author = book.author
    db_book.content = book.content
    db_book.price = book.price
    db_book.is_premium = book.is_premium
    
    # If edited, status goes back to pending? Or keeps current?
    # Usually editing resets approval to ensure content is safe.
    if book.theme is not None: 
        db_book.theme = book.theme 
    db_book.status = "pending" 
    
    db.commit()
    return {"message": "Book updated! Status reset to Pending for review."}
