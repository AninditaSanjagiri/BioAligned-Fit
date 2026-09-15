# api/auth.py
import os
from pathlib import Path
import firebase_admin
from firebase_admin import credentials, auth
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Locate credentials in the project root
BASE_DIR = Path(__file__).resolve().parent.parent
CRED_PATH = BASE_DIR / "firebase_credentials.json"

# Initialize Firebase Admin once
if not firebase_admin._apps:
    if CRED_PATH.exists():
        cred = credentials.Certificate(str(CRED_PATH))
        firebase_admin.initialize_app(cred)
    else:
        # Fallback to default credentials if running in a cloud environment
        firebase_admin.initialize_app()

security = HTTPBearer()

async def verify_firebase_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Extracts and verifies the Firebase JWT token from the Authorization header."""
    token = credentials.credentials
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired authentication token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )