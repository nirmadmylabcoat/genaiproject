from fastapi import APIRouter

from app.schemas.generate import GenerateRequest, LayoutResponse
from app.services.generator_service import generator_service


router = APIRouter()


@router.post("", response_model=LayoutResponse)
async def generate_layout(payload: GenerateRequest) -> LayoutResponse:
    """Run the CVAE (or rule-based fallback) to produce layout transformations."""

    return generator_service.generate(payload.dom, payload.detections, payload.profile)


