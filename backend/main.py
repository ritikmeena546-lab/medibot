from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import models
from database import engine
from routers import users, chat, documents

# Create the database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="MediBot API", description="Backend for MediBot application")

# Performance Optimization: Compress large API responses
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(chat.router)
app.include_router(documents.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to MediBot API"}
