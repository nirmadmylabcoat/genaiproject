# GenAccess Backend

FastAPI service that powers the generative layout, detection, summarization, and profile APIs for the GenAccess browser extension.

## Features

- `/api/detect`: YOLOv8-based UI element detection using screenshots and DOM metadata.
- `/api/generate`: Conditional VAE inference for accessibility-optimized layouts.
- `/api/summarize`: Transformer-backed summarization with TextRank fallback.
- `/api/profiles`: Persisting user accessibility profiles for multi-device sync.

## Quickstart

```bash
python3.11 -m venv .venv
source .venv/bin/activate
pip install -e .
uvicorn app.main:app --reload
```

Environment variables can be configured via `.env`:

```bash
GENACCESS_MODELS_DIR=../models
GENACCESS_DATABASE_URL=sqlite+aiosqlite:///./genaccess.db
GENACCESS_SUMMARIZER_MODEL=sshleifer/distilbart-cnn-12-6
```

## Project Structure

```
backend/
  app/
    api/
      __init__.py
      routes_detect.py
      routes_generate.py
      routes_profiles.py
      routes_summarize.py
    core/
      __init__.py
      config.py
      logging.py
    models/
      __init__.py
      detectors.py
      cvae.py
      summarizer.py
    schemas/
      __init__.py
      detect.py
      generate.py
      profiles.py
      summarize.py
    services/
      __init__.py
      detector_service.py
      generator_service.py
      summarizer_service.py
      profile_service.py
    main.py
  tests/
    test_detect.py
    test_generate.py
    test_summarize.py
```

## Sample Requests

Use the `/docs` Swagger UI to manually upload screenshots and DOM JSON payloads. CLI cURL examples are included in `tests/fixtures/http/` for quick smoke tests.

