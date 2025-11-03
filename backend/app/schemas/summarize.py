from typing import Optional

from pydantic import BaseModel, Field


class SummarizeRequest(BaseModel):
    text: str
    max_sentences: int = Field(default=3, alias="max_sentences")


class SummarizeResponse(BaseModel):
    summary: str
    method: str
    truncated: Optional[bool] = None

