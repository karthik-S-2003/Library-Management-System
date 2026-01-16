from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from tables import BookTable, ReadingSessionTable, UserProgressTable, UserTable
from crud import get_current_user
from models import BookCreate, StopReadingBody, Payment
from datetime import datetime,date

router = APIRouter()

@router.get("/summary")
def get_creator_summary(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] != "creator":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    books = db.query(BookTable).filter(BookTable.creator_id == current_user["username"]).all()
    
    total = len(books)
    approved = len([b for b in books if b.status == "approved"])
    pending = len([b for b in books if b.status == "pending"])
    rejected = len([b for b in books if b.status == "rejected"])
    
    return {
        "stats": {
            "total": total,
            "approved": approved,
            "pending": pending,
            "rejected": rejected
        },
        "books": books
    }

# --- CRITICAL FIX: Include Purchased Books in Dashboard ---
@router.get("/dashboard")
def get_user_dashboard(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(UserTable).filter(UserTable.user_id == current_user["username"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 1. Total Purchased
    purchases = db.query(UserProgressTable).filter(
        UserProgressTable.username == current_user["username"], 
        UserProgressTable.action_type == "buy"
    ).all()
    
    # 2. Purchased Book Details
    purchased_book_ids = [p.book_id for p in purchases]
    purchased_books_details = db.query(BookTable).filter(BookTable.id.in_(purchased_book_ids)).all()

    # 3. Reading Stats (ALL TIME)
    all_sessions = db.query(ReadingSessionTable).filter(
        ReadingSessionTable.username == current_user["username"]
    ).all()
    total_seconds_all_time = sum(s.duration_seconds for s in all_sessions if s.duration_seconds)
    
    # --- NEW: Reading Stats (TODAY ONLY) ---
    today_date = date.today() # Gets YYYY-MM-DD
    
    today_sessions = [
        s for s in all_sessions 
        if s.started_at and s.started_at.date() == today_date
    ]
    
    # Sum seconds for today's sessions
    today_seconds = sum(s.duration_seconds for s in today_sessions if s.duration_seconds)

    # 4. View Count
    viewed_count = db.query(UserProgressTable).filter(
        UserProgressTable.username == current_user["username"], 
        UserProgressTable.action_type == "read"
    ).count()

    # 5. Recent Activity
    recent_sessions = db.query(ReadingSessionTable)\
        .filter(ReadingSessionTable.username == current_user["username"])\
        .order_by(ReadingSessionTable.started_at.desc())\
        .limit(10)\
        .all()
        
    recent_data = []
    for s in recent_sessions:
        book = db.query(BookTable).filter(BookTable.id == s.book_id).first()
        if book:
            recent_data.append({
                "title": book.title,
                "author": book.author,
                "duration_seconds": s.duration_seconds,
                "ended_at": s.ended_at
            })

    return {
        "name": user.name,
        "total_purchased": len(purchases),
        "purchased_books": purchased_books_details,
        "total_viewed": viewed_count,
        "total_reading_seconds": total_seconds_all_time, # Keep for total stats
        "today_reading_seconds": today_seconds,          # <--- NEW FIELD FOR GOAL
        "recent_reading": recent_data
    }

@router.get("/books")
def get_all_approved_books(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(BookTable).filter(BookTable.status == "approved").all()

@router.get("/books/{book_id}")
def get_book_details(book_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    book = db.query(BookTable).filter(BookTable.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # If premium, check if user bought it
    if book.is_premium:
        has_bought = db.query(UserProgressTable).filter(
            UserProgressTable.username == current_user["username"],
            UserProgressTable.book_id == book_id,
            UserProgressTable.action_type == "buy"
        ).first()
        
        if not has_bought and current_user["role"] != "admin" and current_user["username"] != book.creator_id:
            raise HTTPException(status_code=402, detail="Payment required to read this book")
            
    return book

@router.post("/books/{book_id}/pay")
def pay_for_book(book_id: int, payment: Payment, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    book = db.query(BookTable).filter(BookTable.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
        
    # Check if already bought
    existing = db.query(UserProgressTable).filter(
        UserProgressTable.username == current_user["username"],
        UserProgressTable.book_id == book_id,
        UserProgressTable.action_type == "buy"
    ).first()
    
    if existing:
        return {"message": "Already purchased"}
        
    # Record purchase
    new_progress = UserProgressTable(
        username=current_user["username"],
        book_id=book_id,
        action_type="buy"
    )
    db.add(new_progress)
    db.commit()
    
    return {"message": "Payment successful"}

@router.post("/books/{book_id}/start")
def start_reading(book_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    # Log 'read' action if not exists
    existing = db.query(UserProgressTable).filter(
        UserProgressTable.username == current_user["username"],
        UserProgressTable.book_id == book_id,
        UserProgressTable.action_type == "read"
    ).first()
    
    if not existing:
        db.add(UserProgressTable(username=current_user["username"], book_id=book_id, action_type="read"))
    
    # Create session
    session = ReadingSessionTable(username=current_user["username"], book_id=book_id)
    db.add(session)
    db.commit()
    return {"message": "Session started"}

@router.post("/books/{book_id}/stop")
def stop_reading(book_id: int, body: StopReadingBody, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    # Find latest open session
    session = db.query(ReadingSessionTable).filter(
        ReadingSessionTable.username == current_user["username"],
        ReadingSessionTable.book_id == book_id,
        ReadingSessionTable.ended_at == None
    ).order_by(ReadingSessionTable.started_at.desc()).first()
    
    if session:
        from datetime import datetime
        session.ended_at = datetime.utcnow()
        session.duration_seconds = body.duration_seconds
        db.commit()
        return {"message": "Session saved"}
    
    return {"message": "No active session found"}

# --- Creator Book Management (Create/Update) ---
@router.post("/books/")
def create_book(book: BookCreate, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] != "creator":
        raise HTTPException(status_code=403, detail="Only creators can publish")
        
    new_book = BookTable(
        title=book.title,
        author=book.author,
        content=book.content,
        price=book.price,
        is_premium=book.is_premium,
        creator_id=current_user["username"],
        status="pending",
        theme=book.theme # Ensure theme is saved
    )
    db.add(new_book)
    db.commit()
    db.refresh(new_book)
    return new_book

from models import BookUpdate
@router.put("/books/{book_id}")
def update_book(book_id: int, book: BookUpdate, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    db_book = db.query(BookTable).filter(BookTable.id == book_id).first()
    if not db_book:
        raise HTTPException(status_code=404, detail="Book not found")
        
    if db_book.creator_id != current_user["username"]:
        raise HTTPException(status_code=403, detail="Not your book")
        
    db_book.title = book.title
    db_book.author = book.author
    db_book.content = book.content
    db_book.price = book.price
    db_book.is_premium = book.is_premium
    
    # Update theme if provided
    if book.theme is not None:
        db_book.theme = book.theme

    # Reset status to pending on update
    db_book.status = "pending"
    
    db.commit()
    return db_book
