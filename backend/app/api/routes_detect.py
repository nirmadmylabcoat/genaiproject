from fastapi import APIRouter, File, Form, UploadFile

from app.schemas.detect import DetectRequest, DetectResponse
from app.services.detector_service import detector_service

router = APIRouter()


@router.post("", response_model=DetectResponse)
async def detect(dom: str = Form(...), screenshot: UploadFile = File(...)) -> DetectResponse:
    payload = DetectRequest.model_validate_json(dom)
    image_bytes = await screenshot.read()
    detections = detector_service.run(image_bytes)
    return DetectResponse(detections=detections, source="yolo")

