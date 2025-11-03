from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import List

import numpy as np
from ultralytics import YOLO

from app.core.logging import get_logger
from app.schemas import Detection

logger = get_logger(__name__)


@dataclass
class YoloConfig:
    weights: Path
    device: str = "cpu"
    confidence: float = 0.35


class YoloUIDetector:
    def __init__(self, config: YoloConfig):
        self.config = config
        self.model: YOLO | None = None

    def load(self) -> None:
        if self.model is not None:
            return

        if not self.config.weights.exists():
            logger.warning("YOLO weights not found at %s; falling back to heuristic detector", self.config.weights)
            return

        logger.info("Loading YOLOv8 model from %s", self.config.weights)
        self.model = YOLO(str(self.config.weights))

    def predict(self, image: np.ndarray) -> List[Detection]:
        self.load()

        if self.model is None:
            return self._heuristic_detection(image)

        results = self.model.predict(image, conf=self.config.confidence, verbose=False, device=self.config.device)
        detections: List[Detection] = []

        for result in results:
            for box in result.boxes:
                bbox = box.xyxy.cpu().numpy().astype(float).tolist()[0]
                cls = int(box.cls.item()) if box.cls is not None else -1
                confidence = float(box.conf.item()) if box.conf is not None else 0.0
                detections.append(
                    Detection(
                        elementId=f"det-{len(detections)}",
                        label=self._map_class(cls),
                        confidence=confidence,
                        bbox=bbox,
                        category=self._map_category(cls),
                    )
                )

        return detections

    def _heuristic_detection(self, image: np.ndarray) -> List[Detection]:
        height, width = image.shape[:2]
        detections = [
            Detection(
                elementId="heuristic-body",
                label="text-block",
                confidence=0.3,
                bbox=[width * 0.05, height * 0.1, width * 0.95, height * 0.85],
                category="text",
            )
        ]
        logger.debug("Generated %d heuristic detections", len(detections))
        return detections

    @staticmethod
    def _map_class(class_id: int) -> str:
        mapping = {0: "button", 1: "input", 2: "link", 3: "text-block"}
        return mapping.get(class_id, "element")

    @staticmethod
    def _map_category(class_id: int) -> str:
        if class_id in {0, 1, 2}:
            return "actionable"
        if class_id == 3:
            return "text"
        return "container"


def load_image(bytes_data: bytes) -> np.ndarray:
    import cv2

    array = np.frombuffer(bytes_data, dtype=np.uint8)
    image = cv2.imdecode(array, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Unable to decode screenshot")
    return image

