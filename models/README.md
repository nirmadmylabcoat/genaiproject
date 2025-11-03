# Model Artifacts

This directory stores pretrained weights required by the GenAccess system:

- `yolov8-ui.onnx` – UI element detector converted to ONNX for browser-side inference.
- `yolov8-ui.pt` – Original PyTorch weights (used by the backend fallbacks).
- `cvae-accessibility.pt` – Conditional VAE for layout generation.

For security, model files are gitignored by default. Copy the weights to this folder before running the backend services or packaging the extension.

