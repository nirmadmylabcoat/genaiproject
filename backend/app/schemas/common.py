from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float


class DomNode(BaseModel):
    nodeId: str = Field(alias="nodeId")
    tag: str
    role: Optional[str] = None
    text: Optional[str] = None
    bbox: Optional[List[float]] = None
    attributes: Dict[str, Any] = Field(default_factory=dict)
    children: List["DomNode"] = Field(default_factory=list)


DomNode.model_rebuild()


class Detection(BaseModel):
    elementId: str
    label: str
    confidence: float
    bbox: List[float]
    category: str


class TransformationDirective(BaseModel):
    elementId: str
    css: Dict[str, str] = Field(default_factory=dict)
    position: Optional[Dict[str, float]] = None

