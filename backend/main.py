from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
import models, auth
from database import engine, SessionLocal
from routers import users, chat, documents

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Auto-seed default demo account on startup so login always works out-of-the-box
def seed_demo_user():
    db = SessionLocal()
    try:
        demo_user = db.query(models.User).filter(models.User.email == "demo@medibot.com").first()
        if not demo_user:
            hashed_pwd = auth.get_password_hash("password123")
            demo_user = models.User(email="demo@medibot.com", hashed_password=hashed_pwd)
            db.add(demo_user)
            db.commit()
            print("Successfully seeded demo user: demo@medibot.com / password123")
    except Exception as e:
        print("Demo user seeding notice:", e)
    finally:
        db.close()

seed_demo_user()

app = FastAPI(title="MediBot API", description="Backend & Unified Web App for MediBot")

# Performance Optimization
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Configure CORS
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

# Unified SPA Deployment Configuration
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/dist"))
assets_dir = os.path.join(frontend_dist, "assets")

if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

@app.get("/{full_path:path}")
async def serve_spa(request: Request, full_path: str):
    # Pass through to API endpoints or 404s for missing API paths
    if full_path.startswith("api/"):
        return {"detail": "API endpoint not found"}
        
    index_file = os.path.join(frontend_dist, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "MediBot Backend is active. (Build frontend to render UI on /)"}
