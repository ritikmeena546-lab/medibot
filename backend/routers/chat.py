from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import os
import models, schemas, auth
from database import get_db

from google import genai
from google.genai import types

router = APIRouter(prefix="/api/chat", tags=["Chat"])

SYSTEM_INSTRUCTION = """You are MediBot, a specialized AI medical assistant.

STRICT DOMAIN BOUNDARIES:
1. YOU MUST ONLY ANSWER MEDICAL, HEALTH, DIAGNOSTIC, AND WELLNESS-RELATED QUESTIONS.
2. Focus exclusively on providing medical symptom analysis, possible diagnostic considerations, health guidance, and wellness information.
3. If the user asks about ANY non-medical subject (programming, math, history, weather, etc.), you MUST politely refuse.
4. If the user asks to find a specialist or doctor nearby, use your Google Search tool to find relevant real-world medical professionals, clinics, or hospitals in their requested location. Provide their names, specialties, and general location/contact info if available.

MEDICAL SAFETY RULES:
- Clarify that your insights are for educational/informational guidance and recommend consulting a qualified physician for a formal diagnosis.
- Do not prescribe specific pharmaceutical drugs.
- If emergency symptoms are mentioned, you MUST begin your response with "[EMERGENCY]" and urgently advise seeking immediate emergency medical care."""

MODELS_TO_TRY = [
    'gemini-flash-latest',
    'gemini-2.0-flash',
    'gemini-2.5-flash',
    'gemini-3.6-flash',
]

def get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Gemini API key is not configured.")
    return genai.Client(api_key=api_key)

@router.post("/conversations", response_model=schemas.ConversationResponse)
def create_conversation(conversation: schemas.ConversationCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    new_conv = models.Conversation(title=conversation.title, user_id=current_user.id)
    db.add(new_conv)
    db.commit()
    db.refresh(new_conv)
    return new_conv

@router.get("/conversations", response_model=List[schemas.ConversationResponse])
def get_conversations(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Conversation).filter(models.Conversation.user_id == current_user.id).all()

@router.get("/conversations/{conversation_id}", response_model=schemas.ConversationResponse)
def get_conversation(conversation_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    conv = db.query(models.Conversation).filter(models.Conversation.id == conversation_id, models.Conversation.user_id == current_user.id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv

@router.post("/conversations/{conversation_id}/messages", response_model=schemas.MessageResponse)
def send_message(conversation_id: int, message: schemas.MessageCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    conv = db.query(models.Conversation).filter(models.Conversation.id == conversation_id, models.Conversation.user_id == current_user.id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    user_msg = models.Message(conversation_id=conversation_id, role="user", content=message.content)
    db.add(user_msg)
    db.commit()
    
    history = db.query(models.Message).filter(models.Message.conversation_id == conversation_id).order_by(models.Message.id.desc()).limit(10).all()
    history.reverse()
    
    contents = []
    for msg in history:
        gemini_role = "model" if msg.role == "assistant" else "user"
        contents.append(
            types.Content(role=gemini_role, parts=[types.Part.from_text(text=msg.content)])
        )
        
    client = get_gemini_client()
    ai_content = None
    last_error = None

    for model_name in MODELS_TO_TRY:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_INSTRUCTION,
                    temperature=0.3,
                    tools=[{"google_search": {}}]
                )
            )
            if response and response.text:
                ai_content = response.text
                break
        except Exception as e:
            print(f"Gemini API Error with model {model_name}: {e}")
            last_error = str(e)
            continue

    if not ai_content:
        if "429" in str(last_error) or "RESOURCE_EXHAUSTED" in str(last_error):
            ai_content = "⚠️ API Rate Limit / Quota Exceeded. The free tier quota for this Gemini API key has been exhausted. Please wait a few minutes or provide an API key with available quota."
        else:
            ai_content = f"⚠️ Unable to generate response from AI service ({last_error or 'Unknown error'}). Please check your configuration."

    is_emergency = False
    if ai_content.strip().startswith("[EMERGENCY]"):
        is_emergency = True
        ai_content = ai_content.replace("[EMERGENCY]", "", 1).strip()
    
    ai_msg = models.Message(conversation_id=conversation_id, role="assistant", content=ai_content, is_emergency=is_emergency)
    db.add(ai_msg)
    db.commit()
    db.refresh(ai_msg)
    return ai_msg

@router.post("/conversations/{conversation_id}/file", response_model=schemas.MessageResponse)
async def upload_and_analyze_file(conversation_id: int, file: UploadFile = File(...), db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    conv = db.query(models.Conversation).filter(models.Conversation.id == conversation_id, models.Conversation.user_id == current_user.id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    allowed_types = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only images (JPEG/PNG/WEBP) and PDFs are supported.")

    file_bytes = await file.read()
    
    user_msg_content = f"*[User uploaded medical report: {file.filename}]*\n\nPlease analyze this medical report and provide clinical insights, highlighting any abnormal values or areas of concern."
    user_msg = models.Message(conversation_id=conversation_id, role="user", content=user_msg_content)
    db.add(user_msg)
    db.commit()

    history = db.query(models.Message).filter(models.Message.conversation_id == conversation_id).order_by(models.Message.id.desc()).limit(10).all()
    history.reverse()

    contents = []
    for msg in history:
        gemini_role = "model" if msg.role == "assistant" else "user"
        if msg.id == user_msg.id:
            contents.append(
                types.Content(
                    role=gemini_role, 
                    parts=[
                        types.Part.from_bytes(data=file_bytes, mime_type=file.content_type),
                        types.Part.from_text(text=msg.content)
                    ]
                )
            )
        else:
            contents.append(
                types.Content(role=gemini_role, parts=[types.Part.from_text(text=msg.content)])
            )

    client = get_gemini_client()
    ai_content = None
    last_error = None

    for model_name in MODELS_TO_TRY:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_INSTRUCTION,
                    temperature=0.3,
                    tools=[{"google_search": {}}]
                )
            )
            if response and response.text:
                ai_content = response.text
                break
        except Exception as e:
            print(f"Gemini API Error with model {model_name}: {e}")
            last_error = str(e)
            continue

    if not ai_content:
        if "429" in str(last_error) or "RESOURCE_EXHAUSTED" in str(last_error):
            ai_content = "⚠️ API Rate Limit / Quota Exceeded. The free tier quota for this Gemini API key has been exhausted. Please wait a few minutes or provide an API key with available quota."
        else:
            ai_content = f"⚠️ Unable to analyze report ({last_error or 'Unknown error'})."

    is_emergency = False
    if ai_content.strip().startswith("[EMERGENCY]"):
        is_emergency = True
        ai_content = ai_content.replace("[EMERGENCY]", "", 1).strip()
    
    ai_msg = models.Message(conversation_id=conversation_id, role="assistant", content=ai_content, is_emergency=is_emergency)
    db.add(ai_msg)
    db.commit()
    db.refresh(ai_msg)
    return ai_msg
