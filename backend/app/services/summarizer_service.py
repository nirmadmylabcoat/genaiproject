from __future__ import annotations

from dataclasses import dataclass

from app.core.config import settings
from app.models.summarizer import SummarizerConfig, SummarizerModel


@dataclass
class SummarizerService:
    summarizer: SummarizerModel

    def summarize(self, text: str, max_sentences: int = 3):
        return self.summarizer.summarize(text, max_sentences)


summarizer_service = SummarizerService(
    summarizer=SummarizerModel(
        SummarizerConfig(
            model_name=settings.summarizer_model,
            device=settings.device,
        )
    )
)

