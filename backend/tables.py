from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Boolean, Float, Text
from database import Base
from sqlalchemy.orm import relationship, backref


class BookTable(Base):
    __tablename__ = "books"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    author = Column(String)
    theme = Column(String, nullable=True) 
    content = Column(String)
    price = Column(Float, default=0.0)
    is_premium = Column(Boolean, default=False)
    status = Column(String, default="pending")
    creator_id = Column(String)

class UserTable(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    phone_number = Column(String)
    password = Column(String)
    role = Column(String, default="user")

class UserProgressTable(Base):
    __tablename__ = "user_progress"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, index=True)
    book_id = Column(Integer)
    action_type = Column(String)

class ReadingSessionTable(Base):
    __tablename__ = "reading_sessions"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, index=True)
    book_id = Column(Integer, index=True)
    started_at = Column(DateTime, default=datetime.utcnow)  # pass function [web:380]
    ended_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, default=0)


class CommentTable(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user_id = Column(String, ForeignKey("users.user_id"))
    book_id = Column(Integer, ForeignKey("books.id"))
    parent_id = Column(Integer, ForeignKey("comments.id"), nullable=True) # For replies

    # taking username
    user = relationship("UserTable")
    
    # keeping prev comments
    replies = relationship("CommentTable", backref=backref('parent', remote_side=[id]))


