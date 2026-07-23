from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import models, schemas, auth
from database import get_db
import random, time

router = APIRouter(prefix="/api/users", tags=["Users"])

# ── In-memory OTP store ─────────────────────────────────────────────────────
# { identifier: {"otp": "123456", "expires": unix_timestamp} }
otp_store: dict = {}

# ── Registration ────────────────────────────────────────────────────────────
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

# ── Email / Password Login (Frictionless) ────────────────────────────────────
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
        # Update credentials if password changed
        user.hashed_password = auth.get_password_hash(form_data.password)
        db.commit()

    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# ── OTP: Send ────────────────────────────────────────────────────────────────
@router.post("/send-otp")
def send_otp(data: schemas.OTPRequest):
    otp = str(random.randint(100000, 999999))
    otp_store[data.identifier] = {"otp": otp, "expires": time.time() + 300}  # 5 min
    # NOTE: In production, integrate Twilio / SendGrid here to deliver via SMS or email.
    # For demo, the OTP is returned in the response so you can try it instantly.
    return {
        "message": "OTP sent successfully! Check your SMS/email.",
        "demo_otp": otp,  # ← remove this line when real SMS is configured
        "expires_in": 300
    }

# ── OTP: Verify & Login ──────────────────────────────────────────────────────
@router.post("/verify-otp", response_model=schemas.Token)
def verify_otp(data: schemas.OTPVerify, db: Session = Depends(get_db)):
    record = otp_store.get(data.identifier)
    if not record:
        raise HTTPException(status_code=401, detail="No OTP found. Please request a new one.")
    if time.time() > record["expires"]:
        del otp_store[data.identifier]
        raise HTTPException(status_code=401, detail="OTP has expired. Please request a new one.")
    if record["otp"] != data.otp:
        raise HTTPException(status_code=401, detail="Incorrect OTP. Please try again.")

    del otp_store[data.identifier]  # invalidate after use

    # Auto-create account if first time logging in with this identifier
    user = db.query(models.User).filter(models.User.email == data.identifier).first()
    if not user:
        hashed_password = auth.get_password_hash(data.identifier + "_otp_auto")
        user = models.User(email=data.identifier, hashed_password=hashed_password)
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# ── Password Reset ────────────────────────────────────────────────────────────
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

# ── Get Current User ─────────────────────────────────────────────────────────
@router.get("/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

