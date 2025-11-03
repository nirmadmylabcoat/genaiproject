from __future__ import annotations

from dataclasses import dataclass
from typing import List

from app.core.config import settings
from app.models.cvae import CVAEConfig, CVAELayoutGenerator
from app.schemas import Detection, DomNode, TransformationDirective
from app.schemas.generate import LayoutResponse
from app.schemas.profiles import Profile


@dataclass
class GeneratorService:
    generator: CVAELayoutGenerator

    def generate(self, dom: DomNode, detections: List[Detection], profile: Profile) -> LayoutResponse:
        directives = self.generator.generate(dom, detections, profile)
        return LayoutResponse(directives=directives, metadata={"engine": "cvae" if self.generator.model else "rule"})


generator_service = GeneratorService(
    generator=CVAELayoutGenerator(
        CVAEConfig(
            weights=settings.models_dir / "cvae-accessibility.pt",
            device=settings.device,
        )
    )
)

