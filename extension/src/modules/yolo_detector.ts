import * as ort from 'onnxruntime-web'
import type { DetectionResult } from '../types'

export interface DetectorOptions {
  modelPath?: string
  scoreThreshold?: number
  maxDetections?: number
}

const DEFAULT_MODEL = 'models/yolov8-ui.onnx'
const INPUT_SIZE = 640

export class YoloDetector {
  private session: ort.InferenceSession | null = null
  private readonly options: Required<DetectorOptions>

  constructor (options: DetectorOptions = {}) {
    this.options = {
      modelPath: options.modelPath ?? DEFAULT_MODEL,
      scoreThreshold: options.scoreThreshold ?? 0.35,
      maxDetections: options.maxDetections ?? 64
    }
  }

  public async load (): Promise<void> {
    if (this.session !== null) return

    const modelUrl = chrome.runtime.getURL(this.options.modelPath)
    try {
      this.session = await ort.InferenceSession.create(modelUrl, {
        executionProviders: ['wasm']
      })
    } catch (error) {
      this.session = null
      console.warn('Failed to initialize ONNX session', error)
      throw error
    }
  }

  public async detectFromImageBitmap (image: ImageBitmap): Promise<DetectionResult[]> {
    if (this.session == null) {
      await this.load()
    }

    if (this.session == null) {
      return []
    }

    const inputTensor = await this.preprocess(image)
    const outputs = await this.session.run({ images: inputTensor })
    const raw = outputs[this.session.outputNames[0]]

    if (!(raw instanceof ort.Tensor)) {
      return []
    }

    return this.postprocess(raw)
  }

  private async preprocess (image: ImageBitmap): Promise<ort.Tensor> {
    const canvas = createWorkingCanvas(INPUT_SIZE)
    const ctx = canvas.getContext('2d') as (CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null)
    if (ctx == null) {
      throw new Error('Unable to create canvas context for preprocessing')
    }

    ctx.drawImage(image, 0, 0, INPUT_SIZE, INPUT_SIZE)
    const imageData = ctx.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE)
    const { data } = imageData

    const tensorData = new Float32Array(INPUT_SIZE * INPUT_SIZE * 3)
    let tensorIndex = 0
    for (let i = 0; i < data.length; i += 4) {
      // Normalize to 0-1 and channel-first
      const r = data[i] / 255
      const g = data[i + 1] / 255
      const b = data[i + 2] / 255
      tensorData[tensorIndex] = r
      tensorData[tensorIndex + INPUT_SIZE * INPUT_SIZE] = g
      tensorData[tensorIndex + 2 * INPUT_SIZE * INPUT_SIZE] = b
      tensorIndex += 1
    }

    return new ort.Tensor('float32', tensorData, [1, 3, INPUT_SIZE, INPUT_SIZE])
  }

  private postprocess (tensor: ort.Tensor): DetectionResult[] {
    const [batch, maxBoxes, values] = tensor.dims
    if (batch !== 1 || values < 6) {
      return []
    }

    const detections: DetectionResult[] = []
    const data = tensor.data as Float32Array
    const scoreThreshold = this.options.scoreThreshold

    for (let boxIndex = 0; boxIndex < maxBoxes; boxIndex++) {
      const offset = boxIndex * values
      const score = data[offset + 4]
      if (score < scoreThreshold) continue

      const x = data[offset]
      const y = data[offset + 1]
      const w = data[offset + 2]
      const h = data[offset + 3]
      const classId = data[offset + 5]

      detections.push({
        elementId: `det-${boxIndex}`,
        label: this.mapClassToLabel(classId),
        confidence: score,
        bbox: [x, y, x + w, y + h],
        category: this.mapClassToCategory(classId)
      })

      if (detections.length >= this.options.maxDetections) break
    }

    return detections
  }

  private mapClassToLabel (classId: number): string {
    switch (Math.round(classId)) {
      case 0: return 'button'
      case 1: return 'input'
      case 2: return 'link'
      case 3: return 'text-block'
      default: return 'element'
    }
  }

  private mapClassToCategory (classId: number): DetectionResult['category'] {
    switch (Math.round(classId)) {
      case 0:
      case 1:
      case 2:
        return 'actionable'
      case 3:
        return 'text'
      default:
        return 'container'
    }
  }
}

function createWorkingCanvas (size: number): OffscreenCanvas | HTMLCanvasElement {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(size, size)
  }
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  return canvas
}

let sharedDetector: YoloDetector | null = null

export async function ensureDetector (): Promise<YoloDetector> {
  if (sharedDetector == null) {
    sharedDetector = new YoloDetector()
  }

  try {
    await sharedDetector.load()
  } catch (error) {
    sharedDetector = null
    throw error
  }

  return sharedDetector
}

