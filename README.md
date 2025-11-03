# GenAccess

GenAccess is a full-stack, generative accessibility assistant that rewrites web UIs on the fly to better support vision-impaired and neurodivergent users. The system combines a Manifest V3 Chrome extension (for DOM capture, local inference, and interaction) with a FastAPI backend (for heavy ML workloads, profile sync, and summarization).

## Project Layout

- `extension/` – Manifest V3 codebase built with Vite + TypeScript.
- `backend/` – FastAPI application exposing detection, generation, summarization, and profile APIs.
- `models/` – Directory for YOLOv8 and CVAE weights (see `models/README.md`).
- `docs/` – Architecture notes and design references.

## Prerequisites

- Node.js 18+ (for the extension toolchain).
- Python 3.10+ (for the backend service).
- Chrome 128+ (Manifest V3 support and Speech APIs).
- YOLOv8 UI detector weights (`yolov8-ui.onnx`, `yolov8-ui.pt`) and CVAE weights (`cvae-accessibility.pt`) placed under `models/`.

## Backend Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
```

Optional environment variables (via `.env`):

```
GENACCESS_MODELS_DIR=../models
GENACCESS_DATABASE_URL=sqlite+aiosqlite:///./genaccess.db
GENACCESS_SUMMARIZER_MODEL=sshleifer/distilbart-cnn-12-6
```

Start the API server:

```bash
uvicorn app.main:app --reload
```

The OpenAPI docs are served at `http://localhost:8000/api/docs`, and a simple health probe is exposed on `/health`.

## Extension Setup

```bash
cd extension
npm install
npm run build
```

The build emits `dist/` with the background service worker, content script, popup bundle, and packaged ONNX artifacts.

### Load in Chrome

1. Open `chrome://extensions` and enable **Developer mode**.
2. Click **Load unpacked** and select the `extension/dist` folder.
3. Pin the *GenAccess* action for quick access.
4. In the popup, set the backend URL (default `http://localhost:8000/api`) and choose an accessibility profile.

## Feature Guide

- **Generative mode**: Captures DOM + screenshot, runs local YOLOv8 (with backend fallback), and requests CVAE layout deltas. If the backend is unreachable, the extension falls back to rule-based adjustments.
- **Rule mode**: Applies deterministic CSS tokens (font scale, contrast, spacing, motion reduction) and focus guidance without backend calls.
- **Voice navigation**: Hover or focus elements to hear SpeechSynthesis narration. Commands like “scroll down”, “scroll up”, “focus next”, and “open link” are supported.
- **Summaries**: Long paragraphs are condensed automatically. Press `Alt+S` while highlighting any section to trigger an on-demand summary.
- **Profiles**: Stored in `chrome.storage` and synced to the backend’s `/api/profiles` endpoints for multi-device continuity.

## Testing Scenarios

1. **IRCTC-style booking flow**
   - Load the mock page.
   - Toggle between *Generative* and *Rules* modes and confirm layout simplification occurs within ~7 seconds.
   - Validate that voice narration announces important controls (search, passenger details, payment buttons).

2. **Online banking dashboard**
   - Confirm high-contrast profiles darken backgrounds and enlarge typography.
   - Use voice commands to navigate through transaction lists (`focus next`), then trigger summaries on paragraph-heavy sections.

3. **Latency + Fallback checks**
   - Temporarily rename `extension/public/models/yolov8-ui.onnx` and reload the extension to force backend detection. Observe that layout generation still completes using the `/api/detect` endpoint.
   - Disable the backend service; ensure the extension gracefully continues in rule-based mode.

Capture timings from the popup (latency chip) or Chrome DevTools network panel to verify the <7s budget for detect + generate.

## Troubleshooting

- **No detections**: Confirm the ONNX weight exists under `extension/public/models/` and matches the filename in `yolo_detector.ts`. If missing, the extension automatically falls back to the backend.
- **Backend 422 errors**: Ensure the DOM JSON payload is not truncated. Reload the page and retry; the content script now resets injected overlays before each capture.
- **Speech issues**: Chrome may prompt for audio permissions the first time the SpeechSynthesis API is used. Refresh the page after granting permission.
- **Database persistence**: The backend uses SQLite by default. Set `GENACCESS_DATABASE_URL` to Postgres for production deployments.

## Next Steps

- Finish training/tuning the CVAE with a larger paired layout corpus.
- Extend profile management UI for create/update flows and add analytics for measuring accessibility improvements across sessions.


