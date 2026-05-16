from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional


class SenderMetadata(BaseModel):
    name: Optional[str] = None
    email: EmailStr
    customer_id: Optional[str] = None
    ip: Optional[str] = None


class Attachment(BaseModel):
    filename: str
    content_type: Optional[str] = None
    url: Optional[str] = None


class EmailIn(BaseModel):
    subject: str = Field(..., min_length=1)
    body: str = Field(..., min_length=1)
    sender: SenderMetadata
    attachments: Optional[List[Attachment]] = []
