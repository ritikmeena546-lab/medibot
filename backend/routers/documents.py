from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import models, schemas, auth
from database import get_db

router = APIRouter(prefix="/api/documents", tags=["Documents"])

@router.post("/upload", response_model=schemas.DocumentResponse)
async def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    # Placeholder for PDF text extraction (Phase 4)
    extracted_text = f"Extracted text placeholder for {file.filename}"
    
    doc = models.Document(user_id=current_user.id, filename=file.filename, text_content=extracted_text)
    db.add(doc)
    db.commit()
    db.refresh(doc)
    
    return doc

@router.get("/", response_model=List[schemas.DocumentResponse])
def get_documents(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Document).filter(models.Document.user_id == current_user.id).all()
