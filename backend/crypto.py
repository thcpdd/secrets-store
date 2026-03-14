import os
import hashlib
from Crypto.Protocol.KDF import PBKDF2
from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
from Crypto.Util.Padding import pad, unpad
from base64 import b64encode, b64decode

# Constants for PBKDF2
SALT_LENGTH = 32
KEY_LENGTH = 32  # 256 bits for AES-256
ITERATIONS = 100000
AES_NONCE_LENGTH = 12  # For GCM mode

def generate_salt():
    """Generate a random salt for key derivation"""
    return os.urandom(SALT_LENGTH)

def derive_key(password: str, salt: bytes) -> bytes:
    """
    Derive a cryptographic key from password using PBKDF2-HMAC-SHA256
    """
    password_bytes = password.encode('utf-8')
    from Crypto.Hash import SHA256
    key = PBKDF2(password_bytes, salt, dkLen=KEY_LENGTH, count=ITERATIONS, hmac_hash_module=SHA256)
    return key

def encrypt_data(plaintext: str, key: bytes, nonce: bytes = None) -> tuple[str, bytes]:
    """
    Encrypt data using AES-256-GCM
    Args:
        plaintext: Text to encrypt
        key: Encryption key
        nonce: Optional nonce (if not provided, generates random one)
    Returns: (encrypted_content_b64, nonce_bytes)
    """
    # Generate random nonce for GCM mode if not provided
    if nonce is None:
        nonce = get_random_bytes(AES_NONCE_LENGTH)

    # Create cipher
    cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)

    # Encrypt data
    plaintext_bytes = plaintext.encode('utf-8')
    ciphertext, tag = cipher.encrypt_and_digest(plaintext_bytes)

    # Combine ciphertext and tag
    encrypted_data = ciphertext + tag

    # Return base64 encrypted content and nonce bytes
    encrypted_b64 = b64encode(encrypted_data).decode('utf-8')

    return encrypted_b64, nonce

def decrypt_data(encrypted_content_b64: str, nonce: bytes, key: bytes) -> str:
    """
    Decrypt data using AES-256-GCM
    Args:
        encrypted_content_b64: Base64 encoded encrypted data (ciphertext + tag)
        nonce: Nonce bytes (not base64 encoded)
        key: Decryption key
    """
    # Decode base64
    encrypted_data = b64decode(encrypted_content_b64)

    # Split ciphertext and tag (tag is last 16 bytes)
    ciphertext = encrypted_data[:-16]
    tag = encrypted_data[-16:]

    # Create cipher
    cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)

    # Decrypt and verify
    plaintext_bytes = cipher.decrypt_and_verify(ciphertext, tag)

    return plaintext_bytes.decode('utf-8')

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    import bcrypt
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against bcrypt hash"""
    import bcrypt
    password_bytes = password.encode('utf-8')
    hashed_bytes = hashed.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)
