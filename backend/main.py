from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware 
from database import Base, engine
from routers import auth, admin, user, comments,creator 

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(admin.router, prefix="/admin", tags=["admin"])
app.include_router(user.router, prefix="/user", tags=["user"])
app.include_router(creator.router, prefix="/user", tags=["creator"])
app.include_router(comments.router, prefix="/comments", tags=["comments"])


