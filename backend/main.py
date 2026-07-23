from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
import os
import models
from database import engine
from routers import users, chat, documents

# Create the database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="MediBot API", description="Backend & Unified Web App for MediBot")

# Performance Optimization: Compress large API responses
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Configure CORS for cross-origin flexibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(chat.router)
app.include_router(documents.router)

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "MediBot Unified API"}

# Unified Single-Platform Deployment: Serve React Frontend static assets if built
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/dist"))
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")
else:
    @app.get("/")
    def read_root():
        return {"message": "Welcome to MediBot API"}
