## GenAccess Architecture Overview

GenAccess is a full-stack browser extension system that enhances web accessibility in real time by combining on-device perception, generative layout transformation, and multimodal feedback. The platform is organized into three primary layers: a Manifest V3 Chrome extension, a FastAPI-based backend, and a shared models package.

### High-Level Workflow

1. **DOM + Visual Capture**
   - `dom_parser.js` enumerates DOM nodes, extracting semantic metadata (tag, ARIA roles, text content, bounding boxes) and serializes the structure into JSON.
   - A lightweight content script collects viewport screenshots (via `chrome.tabs.captureVisibleTab`) to supply pixel data for detection.
2. **UI Element Detection**
   - `yolo_detector.js` loads an ONNX-converted YOLOv8 model through `onnxruntime-web` to detect actionable UI elements directly in the browser.
   - Detection results are cross-referenced with DOM nodes to produce a rich element graph.
   - If the local model is disabled or unavailable, the extension invokes the backend `/detect` API for server-side inference.
3. **Generative Layout Transformation**
   - Detected elements and DOM metadata form the input to the CVAE pipeline.
   - In **generative mode**, `transformer.js` sends the canonicalized element graph to the backend `/generate` endpoint, which runs the accessibility-optimized CVAE and returns CSS/layout patches.
   - In **rule-based mode**, a local rules engine injects CSS variables (font scaling, contrast, spacing) without backend calls.
4. **Voice Navigation & Feedback**
   - `voice_nav.js` hooks into hover and focus events, using the Chrome Speech Synthesis API to narrate element labels.
   - Keyword commands (`"scroll down"`, `"focus next"`) are parsed locally and dispatched via the runtime message bus to trigger DOM actions.
5. **Summarization Services**
   - `summarizer.js` performs extractive summarization by default using a TextRank-based algorithm.
   - Complex passages can be forwarded to the backend `/summarize` endpoint for neural summarization.
6. **Profile Management**
   - `popup.html`/`popup.tsx` expose profile controls (e.g., High Contrast, Dyslexia-Friendly, ADHD Focus).
   - Profiles persist via Chrome `storage.sync` and sync with the backend’s `/profiles` endpoints for multi-device continuity.

### Extension Component Map

| Component | Type | Responsibilities |
| --- | --- | --- |
| `manifest.json` | Manifest V3 | Declares permissions, background service worker, content scripts, and action popup |
| `background.js` | Service worker | Coordinates tab capture, communicates with backend, caches model artifacts |
| `content_script.js` | Content script | Injects DOM parser, applies layout transforms, listens for voice commands |
| `dom_parser.ts` | Module | Builds DOM tree representation with accessibility metadata |
| `yolo_detector.ts` | Module | Runs ONNX YOLOv8 inference (local or remote fallback) |
| `transformer.ts` | Module | Applies CVAE-generated CSS/layout patches |
| `voice_nav.ts` | Module | Speech synthesis, speech command parsing, focus management |
| `summarizer.ts` | Module | TextRank summarization + backend fallback |
| `popup.html / popup.tsx` | UI | Profile editor, toggles, latency stats |
| `styles/tailwind.css` | Styling | Tailwind utility bundle for popup |

### Backend Services

- **Framework**: FastAPI with Uvicorn ASGI server.
- **Inference Pipelines**:
  - `/detect`: Accepts multipart form (screenshot image + DOM JSON). Utilizes Ultralytics YOLOv8 via PyTorch or ONNX Runtime (GPU optional) and returns a consolidated list of detected elements.
  - `/generate`: Receives detected element graph, runs CVAE (PyTorch) to synthesize layout deltas (positions, sizes, typography tokens) before returning transformation directives.
  - `/summarize`: Applies transformer-based abstractive summarization or TextRank fallback for large text blocks.
  - `/profiles`: CRUD endpoints for storing user accessibility preferences in a Postgres (or SQLite fallback) datastore.
- **Supporting Services**:
  - `models/` contains serialized YOLOv8 `.onnx` and CVAE `.pt` weights.
  - `schemas/` define Pydantic models for requests/responses, ensuring strong typing across the stack.
  - `services/` wrap model loading, caching, and inference logic.

### Data Contracts

- **DOM Graph** (`DomNode`):
  ```json
  {
    "nodeId": "node-42",
    "tag": "button",
    "role": "button",
    "text": "Continue",
    "bbox": [120, 340, 220, 380],
    "attributes": { "aria-label": "Continue" },
    "children": [...]
  }
  ```
- **Detection Response**:
  ```json
  {
    "elementId": "node-42",
    "label": "button",
    "confidence": 0.94,
    "bbox": [118, 338, 222, 382],
    "category": "actionable"
  }
  ```
- **Layout Transformation**:
  ```json
  {
    "elementId": "node-42",
    "css": {
      "fontSize": "18px",
      "backgroundColor": "#000",
      "color": "#fff"
    },
    "position": {
      "top": 320,
      "left": 110,
      "width": 240,
      "height": 60
    }
  }
  ```

### Accessibility Profiles

- **High Contrast Mode**: Increases luminosity contrast, replaces low-contrast backgrounds, enforces minimum font weights.
- **Dyslexia-Friendly Mode**: Applies OpenDyslexic or similar font, increases letter spacing and line height, reduces animations.
- **ADHD Focus Mode**: Highlights interactive elements sequentially, introduces focus timer overlays, collapses non-essential content.

Profiles define both rule-based adjustments (CSS tokens) and generative hints (CVAE conditioning vectors) so that the backend can tailor layouts appropriately.

### Deployment & Testing

- **Extension**: Built with Vite + TypeScript, bundled to `dist/` with esbuild. YOLO ONNX weights are hosted locally within `extension/models/` or fetched once and cached via IndexedDB.
- **Backend**: Dockerized FastAPI app with a `docker-compose` option for Postgres and model caching. Provides health checks for models and profiling endpoints.
- **Testing Targets**:
  - IRCTC-like booking site mock.
  - Online banking dashboard mock.
- **Performance Budget**: End-to-end transformation (< 7s) including detection + generation. Voice narration latency (< 300 ms) after hover events.

### Next Steps

1. Scaffold the extension (Manifest V3, content scripts, popup UI) with TypeScript tooling.
2. Implement backend FastAPI service skeleton with inference stubs.
3. Integrate ONNX Runtime for YOLOv8 and load CVAE weights server-side.
4. Wire up runtime messaging between popup, background, and content scripts.
5. Add real-world evaluation harnesses for the two target sample sites.


