from fastapi import APIRouter

from .routes_detect import router as detect_router
from .routes_generate import router as generate_router
from .routes_profiles import router as profiles_router
from .routes_summarize import router as summarize_router

api_router = APIRouter()
api_router.include_router(detect_router, prefix="/detect", tags=["detect"])
api_router.include_router(generate_router, prefix="/generate", tags=["generate"])
api_router.include_router(summarize_router, prefix="/summarize", tags=["summarize"])
api_router.include_router(profiles_router, prefix="/profiles", tags=["profiles"])

