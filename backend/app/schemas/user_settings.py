from pydantic import BaseModel
from datetime import datetime


class UserSettingsBase(BaseModel):
    ai_text_model: str | None = None
    ai_vision_model: str | None = None


class UserSettingsCreate(UserSettingsBase):
    pass


class UserSettingsUpdate(UserSettingsBase):
    pass


class UserSettingsResponse(UserSettingsBase):
    id: int
    user_email: str
    created_at: datetime
    updated_at: datetime | None

    class Config:
        from_attributes = True
