from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class ProfilePreferences(BaseModel):
    fontScale: float = Field(alias="fontScale")
    contrast: str
    lineSpacing: float = Field(alias="lineSpacing")
    dyslexiaFont: bool = Field(alias="dyslexiaFont")
    reduceMotion: bool = Field(alias="reduceMotion")
    focusMode: str = Field(alias="focusMode")


class Profile(BaseModel):
    id: str
    label: str
    description: str
    preferences: ProfilePreferences
    generativeHints: Dict[str, float] = Field(alias="generativeHints")


class ProfileList(BaseModel):
    items: List[Profile]


class ProfileUpdate(BaseModel):
    label: Optional[str] = None
    description: Optional[str] = None
    preferences: Optional[ProfilePreferences] = None
    generativeHints: Optional[Dict[str, float]] = Field(default=None, alias="generativeHints")

