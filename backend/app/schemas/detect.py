from typing import List

from pydantic import BaseModel

from .common import Detection, DomNode


class DetectRequest(BaseModel):
    dom: DomNode


class DetectResponse(BaseModel):
    detections: List[Detection]
    source: str

