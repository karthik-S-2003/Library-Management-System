from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models import CommentCreate, CommentResponse
from database import get_db
from tables import CommentTable, UserTable
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from crud import get_current_user

router = APIRouter()

@router.get("/{book_id}", response_model=List[CommentResponse])
def get_comments(book_id: int, db: Session = Depends(get_db)):
    comments = db.query(CommentTable).filter(
        CommentTable.book_id == book_id, 
        CommentTable.parent_id == None
    ).order_by(CommentTable.created_at.desc()).all()
    
    def map_comment(c):
        return {
            "id": c.id,
            "user_name": c.user.name if c.user else "Unknown",
            "content": c.content,
            "created_at": c.created_at,
            "replies": [map_comment(r) for r in c.replies]
        }
    
    return [map_comment(c) for c in comments]

# @router.post("")
@router.post("/")
def add_comment(comment: CommentCreate, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        # Debug print
        print(f"DEBUG: Adding comment for user: {current_user}")

        if isinstance(current_user, dict):
            user_id = current_user.get("username") or current_user.get("user_id")
        else:
            user_id = getattr(current_user, "username", getattr(current_user, "user_id", None))

        if not user_id:
            print("ERROR: User ID is missing in token payload")
            raise HTTPException(400, "Invalid User Token")

        new_comment = CommentTable(
            content=comment.content,
            book_id=comment.book_id,
            user_id=user_id, 
            parent_id=comment.parent_id
        )
        db.add(new_comment)
        db.commit()
        return {"message": "Comment added"}

    except Exception as e:
        print(f"CRITICAL ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Server Error: {str(e)}")
