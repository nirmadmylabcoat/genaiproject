from __future__ import annotations

from dataclasses import dataclass
from typing import List

from app.core.config import settings
from app.core.logging import get_logger
from app.models.detectors import YoloConfig, YoloUIDetector, load_image
from app.schemas import Detection

logger = get_logger(__name__)


@dataclass
class DetectorService:
    detector: YoloUIDetector

    def run(self, screenshot_bytes: bytes) -> List[Detection]:
        image = load_image(screenshot_bytes)
        detections = self.detector.predict(image)
        logger.debug("Detector returned %d results", len(detections))
        return detections


detector_service = DetectorService(
    detector=YoloUIDetector(
        YoloConfig(
            weights=settings.models_dir / "yolov8-ui.pt",
            device=settings.device,
        )
    )
)

