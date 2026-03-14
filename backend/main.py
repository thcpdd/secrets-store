from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List
import base64
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from database import get_db, init_db
from models import User, Secret
from schemas import (
    UserRegister, UserLogin, UserResponse, Token,
    SecretCreate, SecretUpdate, SecretResponse, SecretDetail, SecretReveal
)
from auth import get_current_user, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from crypto import (
    generate_salt, derive_key, encrypt_data, decrypt_data,
    hash_password, verify_password
)

# Initialize FastAPI app
app = FastAPI(title="Secret Store API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
def startup_event():
    init_db()

# Auth Routes
@app.post("/api/auth/register", response_model=UserResponse)
def register(user: UserRegister, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user exists
    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )

    # Hash password for authentication
    password_hash = hash_password(user.password)

    # Generate salt for encryption key derivation
    salt = generate_salt()
    salt_b64 = salt.hex()

    # Create user
    db_user = User(
        username=user.username,
        password_hash=password_hash,
        salt=salt_b64
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user

@app.post("/api/auth/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    """Login user and return JWT token"""
    # Find user
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    # Verify password
    if not verify_password(user.password, db_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.username, "user_id": db_user.id},
        expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}

# Secret Routes
@app.get("/api/secrets", response_model=List[SecretResponse])
def get_secrets(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all secrets for current user (without decrypted content)"""
    secrets = db.query(Secret).filter(Secret.user_id == current_user.id).all()
    return secrets

@app.post("/api/secrets", response_model=SecretResponse)
def create_secret(
    secret: SecretCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new secret"""
    # Verify password first
    if not verify_password(secret.password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password"
        )

    # Derive encryption key from user's password and salt
    salt = bytes.fromhex(current_user.salt)
    encryption_key = derive_key(secret.password, salt)

    # Generate nonce once for this secret (used for both content and note)
    from crypto import AES_NONCE_LENGTH
    import os
    nonce_bytes = os.urandom(AES_NONCE_LENGTH)

    # Encrypt content with the shared nonce
    encrypted_content, _ = encrypt_data(secret.content, encryption_key, nonce_bytes)

    # Encrypt note if provided with the same nonce
    encrypted_note = None
    if secret.note:
        encrypted_note, _ = encrypt_data(secret.note, encryption_key, nonce_bytes)

    # Save nonce as base64 string in database
    nonce_b64 = base64.b64encode(nonce_bytes).decode('utf-8')

    # Create secret
    db_secret = Secret(
        user_id=current_user.id,
        name=secret.name,
        encrypted_content=encrypted_content,
        encrypted_note=encrypted_note,
        nonce=nonce_b64
    )
    db.add(db_secret)
    db.commit()
    db.refresh(db_secret)

    return db_secret

@app.post("/api/secrets/{secret_id}/reveal", response_model=SecretDetail)
def reveal_secret(
    secret_id: int,
    reveal_data: SecretReveal,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reveal secret content (requires password verification)"""
    # Get secret
    secret = db.query(Secret).filter(
        Secret.id == secret_id,
        Secret.user_id == current_user.id
    ).first()

    if not secret:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Secret not found"
        )

    # Verify password
    if not verify_password(reveal_data.password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password"
        )

    # Derive encryption key from user's password and salt
    salt = bytes.fromhex(current_user.salt)
    encryption_key = derive_key(reveal_data.password, salt)

    # Decode nonce from base64 string to bytes
    nonce_bytes = base64.b64decode(secret.nonce)

    # Decrypt content
    try:
        content = decrypt_data(secret.encrypted_content, nonce_bytes, encryption_key)

        # Decrypt note if exists
        note = None
        if secret.encrypted_note:
            note = decrypt_data(secret.encrypted_note, nonce_bytes, encryption_key)

        return SecretDetail(
            id=secret.id,
            name=secret.name,
            content=content,
            note=note,
            created_at=secret.created_at,
            updated_at=secret.updated_at
        )
    except Exception as e:
        import logging
        logging.error(f"Decryption failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to decrypt secret: {str(e)}"
        )

@app.put("/api/secrets/{secret_id}", response_model=SecretResponse)
def update_secret(
    secret_id: int,
    secret_update: SecretUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an existing secret"""
    # Get secret
    secret = db.query(Secret).filter(
        Secret.id == secret_id,
        Secret.user_id == current_user.id
    ).first()

    if not secret:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Secret not found"
        )

    # Verify password
    if not verify_password(secret_update.password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password"
        )

    # Derive encryption key from user's password and salt
    salt = bytes.fromhex(current_user.salt)
    encryption_key = derive_key(secret_update.password, salt)

    # Update fields
    if secret_update.name:
        secret.name = secret_update.name

    # If updating content or note, we need to re-encrypt with a new nonce
    if secret_update.content or secret_update.note is not None:
        # Generate new nonce
        from crypto import AES_NONCE_LENGTH
        import os
        nonce_bytes = os.urandom(AES_NONCE_LENGTH)
        nonce_b64 = base64.b64encode(nonce_bytes).decode('utf-8')

        # Re-encrypt content if provided
        if secret_update.content:
            encrypted_content, _ = encrypt_data(secret_update.content, encryption_key, nonce_bytes)
            secret.encrypted_content = encrypted_content
        else:
            # Keep existing content but need to re-encrypt with new nonce
            old_nonce = base64.b64decode(secret.nonce)
            old_content = decrypt_data(secret.encrypted_content, old_nonce, encryption_key)
            encrypted_content, _ = encrypt_data(old_content, encryption_key, nonce_bytes)
            secret.encrypted_content = encrypted_content

        # Handle note update
        if secret_update.note is not None:
            if secret_update.note:
                encrypted_note, _ = encrypt_data(secret_update.note, encryption_key, nonce_bytes)
                secret.encrypted_note = encrypted_note
            else:
                secret.encrypted_note = None

        # Update nonce
        secret.nonce = nonce_b64

    db.commit()
    db.refresh(secret)

    return secret

@app.delete("/api/secrets/{secret_id}")
def delete_secret(
    secret_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a secret"""
    # Get secret
    secret = db.query(Secret).filter(
        Secret.id == secret_id,
        Secret.user_id == current_user.id
    ).first()

    if not secret:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Secret not found"
        )

    db.delete(secret)
    db.commit()

    return {"message": "Secret deleted successfully"}

@app.get("/api/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return current_user

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
