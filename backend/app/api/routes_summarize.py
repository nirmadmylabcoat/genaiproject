from fastapi import APIRouter

from app.schemas.summarize import SummarizeRequest, SummarizeResponse
from app.services.summarizer_service import summarizer_service


router = APIRouter()


@router.post("", response_model=SummarizeResponse)
async def summarize_text(payload: SummarizeRequest) -> SummarizeResponse:
    summary, method, truncated = summarizer_service.summarize(payload.text, payload.max_sentences)
    return SummarizeResponse(summary=summary, method=method, truncated=truncated)


