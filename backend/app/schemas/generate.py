from typing import List, Optional

from pydantic import BaseModel

from .common import Detection, DomNode, TransformationDirective
from .profiles import Profile


class GenerateRequest(BaseModel):
    dom: DomNode
    detections: List[Detection]
    profile: Profile


class LayoutResponse(BaseModel):
    directives: List[TransformationDirective]
    metadata: Optional[dict] = None

