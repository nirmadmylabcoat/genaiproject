from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import List

import torch

from app.core.logging import get_logger
from app.schemas import Detection, DomNode, TransformationDirective
from app.schemas.profiles import Profile

logger = get_logger(__name__)


@dataclass
class CVAEConfig:
    weights: Path
    device: str = "cpu"


class CVAELayoutGenerator:
    def __init__(self, config: CVAEConfig):
        self.config = config
        self.model: torch.nn.Module | None = None

    def load(self) -> None:
        if self.model is not None:
            return

        if not self.config.weights.exists():
            logger.warning("CVAE weights not found at %s; falling back to rule-based generator", self.config.weights)
            return

        logger.info("Loading CVAE model from %s", self.config.weights)
        self.model = torch.jit.load(str(self.config.weights), map_location=self.config.device)
        self.model.eval()

    @torch.inference_mode()
    def generate(self, dom: DomNode, detections: List[Detection], profile: Profile) -> List[TransformationDirective]:
        self.load()

        if self.model is None:
            return self._rule_based_generation(dom, profile)

        layout_vector = self._encode_dom(dom)
        det_tensor = torch.tensor([[d.confidence for d in detections]], device=self.config.device)
        profile_vector = torch.tensor(list(profile.generativeHints.values()), device=self.config.device)
        inputs = torch.cat([layout_vector, det_tensor, profile_vector.unsqueeze(0)], dim=1)
        outputs = self.model(inputs)

        directives: List[TransformationDirective] = []
        for detection, row in zip(detections, outputs.tolist()):
            directives.append(
                TransformationDirective(
                    elementId=detection.elementId,
                    css={
                        "fontSize": f"{16 + row[0] * 4:.0f}px",
                        "lineHeight": f"{1.2 + row[1] * 0.3:.2f}",
                    },
                    position={
                        "top": detection.bbox[1] + row[2] * 24,
                        "left": detection.bbox[0] + row[3] * 24,
                        "width": max(120.0, (detection.bbox[2] - detection.bbox[0]) * (1 + row[4] * 0.1)),
                        "height": max(44.0, (detection.bbox[3] - detection.bbox[1]) * (1 + row[5] * 0.1)),
                    },
                )
            )

        return directives

    def _encode_dom(self, dom: DomNode) -> torch.Tensor:
        queue = [dom]
        depth = 0
        node_count = 0

        while queue:
            node = queue.pop(0)
            node_count += 1
            depth = max(depth, len(queue))
            queue.extend(node.children)

        encoded = torch.tensor([[node_count / 500.0, depth / 200.0]], device=self.config.device)
        return encoded

    def _rule_based_generation(self, dom: DomNode, profile: Profile) -> List[TransformationDirective]:
        directives: List[TransformationDirective] = []

        def traverse(node: DomNode) -> None:
            if node.text and len(node.text) > 20:
                directives.append(
                    TransformationDirective(
                        elementId=node.nodeId,
                        css={
                            "fontSize": f"{profile.preferences.fontScale * 16:.0f}px",
                            "lineHeight": f"{profile.preferences.lineSpacing:.2f}",
                        },
                    )
                )
            for child in node.children:
                traverse(child)

        traverse(dom)
        return directives

