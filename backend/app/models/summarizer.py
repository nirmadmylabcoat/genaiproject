from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from transformers import pipeline

from app.core.logging import get_logger

logger = get_logger(__name__)


@dataclass
class SummarizerConfig:
    model_name: str
    device: str = "cpu"


class SummarizerModel:
    def __init__(self, config: SummarizerConfig):
        self.config = config
        self._pipeline = None

    def load(self) -> None:
        if self._pipeline is not None:
            return

        try:
            logger.info("Loading summarizer model %s", self.config.model_name)
            self._pipeline = pipeline(
                task="summarization",
                model=self.config.model_name,
                device=0 if self.config.device != "cpu" else -1,
            )
        except Exception as error:  # noqa: BLE001
            logger.warning("Falling back to extractive summarizer: %s", error)
            self._pipeline = None

    def summarize(self, text: str, max_sentences: int = 3) -> tuple[str, str, Optional[bool]]:
        self.load()

        if self._pipeline is None:
            return self._extractive_summary(text, max_sentences)

        result = self._pipeline(text, max_length=max_sentences * 32, min_length=max_sentences * 8)
        summary = result[0]["summary_text"].strip()
        return summary, "transformer", None

    def _extractive_summary(self, text: str, max_sentences: int) -> tuple[str, str, Optional[bool]]:
        sentences = [s for s in text.split(". ") if s]
        scored = sorted(((len(sentence), sentence) for sentence in sentences), reverse=True)
        selected = [sentence for _, sentence in scored[:max_sentences]]
        selected.sort(key=lambda s: sentences.index(s))
        summary = ". ".join(selected)
        truncated = len(sentences) > max_sentences
        return summary, "textrank-lite", truncated

