from pydantic import BaseModel, Field, field_serializer
from typing import Optional
from datetime import datetime

class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    created_at: datetime

    @field_serializer('created_at')
    def serialize_created_at(self, dt: datetime) -> str:
        return dt.isoformat()

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class SecretCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    content: str = Field(..., min_length=1)
    note: Optional[str] = None
    password: str = Field(..., description="User password for encryption")

class SecretUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    content: Optional[str] = None
    note: Optional[str] = None
    password: str = Field(..., description="User password for encryption")

class SecretResponse(BaseModel):
    id: int
    name: str
    note: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    @field_serializer('created_at', 'updated_at')
    def serialize_datetime(self, dt: Optional[datetime]) -> Optional[str]:
        if dt is None:
            return None
        return dt.isoformat()

    class Config:
        from_attributes = True

class SecretDetail(BaseModel):
    id: int
    name: str
    content: str
    note: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    @field_serializer('created_at', 'updated_at')
    def serialize_datetime(self, dt: Optional[datetime]) -> Optional[str]:
        if dt is None:
            return None
        return dt.isoformat()

class SecretReveal(BaseModel):
    password: str
