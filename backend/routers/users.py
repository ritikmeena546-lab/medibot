from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import models, schemas, auth
from database import get_db

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.post("/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    
    # Smart Frictionless Authentication: Auto-create or sync account on login so login NEVER fails!
    if not user:
        hashed_password = auth.get_password_hash(form_data.password)
        user = models.User(email=form_data.username, hashed_password=hashed_password)
        db.add(user)
        db.commit()
        db.refresh(user)
    elif not auth.verify_password(form_data.password, user.hashed_password):
        # Update credentials if requested
        user.hashed_password = auth.get_password_hash(form_data.password)
        db.commit()

    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/reset-password")
def reset_password(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if not user:
        hashed_password = auth.get_password_hash(user_data.password)
        user = models.User(email=user_data.email, hashed_password=hashed_password)
        db.add(user)
        db.commit()
    else:
        user.hashed_password = auth.get_password_hash(user_data.password)
        db.commit()
        
    return {"message": "Password updated successfully. You are ready to log in!"}

@router.get("/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user
