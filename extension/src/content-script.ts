import { collectDomTree } from './modules/dom_parser'
import { ensureDetector } from './modules/yolo_detector'
import { applyGenerativeLayout, applyRuleBasedAdjustments, clearRuleBasedAdjustments, resetTransformations } from './modules/transformer'
import { initVoiceNavigator, VoiceNavigator } from './modules/voice_nav'
import { summarizeText } from './modules/summarizer'
import { DEFAULT_RUNTIME_STATE } from './core/config'
import type { DetectionResult, DomNode, LayoutResponse, RuntimeState } from './types'
import './styles/content.css'

const SUMMARY_CLASS = 'genaccess-summary'

interface DetectApiResponse {
  detections: DetectionResult[]
  source: string
}

let runtimeState: RuntimeState | null = null
let voiceNavigator: VoiceNavigator | null = null
let enhancementInFlight = false
let selectionTtsBound = false
let selectionSpeakTimer: number | null = null
let lastSelectionText: string | null = null
let lastSelectionAt = 0

void bootstrap()

async function bootstrap (): Promise<void> {
  console.log('GenAccess: Content script loaded')
  runtimeState = await getRuntimeState()
  console.log('GenAccess: Runtime state:', runtimeState)
  
  if (runtimeState.enabled) {
    console.log('GenAccess: Extension enabled, running enhancements')
    await runEnhancements()
  } else {
    console.log('GenAccess: Extension disabled')
    teardownEnhancements()
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === 'GENACCESS_STATE') {
      runtimeState = message.payload as RuntimeState
      if (runtimeState.enabled) {
        void runEnhancements()
      } else {
        teardownEnhancements()
      }
    }

    if (message?.type === 'GENACCESS_ENABLE' && runtimeState != null) {
      runtimeState.enabled = message.payload
      if (runtimeState.enabled) {
        void runEnhancements()
      } else {
        teardownEnhancements()
      }
    }

    if (message?.type === 'GENACCESS_MODE' && runtimeState != null) {
      runtimeState.mode = message.payload
      void runEnhancements()
    }
    if (message?.type === 'GENACCESS_PROFILE' && runtimeState != null) {
      // TODO: fetch profile details from storage when message is received
      void runEnhancements()
    }
  })

  // Removed selection-based popup/summary. Narration happens on hover via VoiceNavigator.
}

async function getRuntimeState (): Promise<RuntimeState> {
  try {
    return await chrome.runtime.sendMessage({ type: 'GET_RUNTIME_STATE' }) as RuntimeState
  } catch (error) {
    console.warn('Failed to get runtime state, using default', error)
    return DEFAULT_RUNTIME_STATE
  }
}

async function runEnhancements (): Promise<void> {
  if (runtimeState == null || enhancementInFlight) return
  if (!runtimeState.enabled) {
    teardownEnhancements()
    return
  }
  enhancementInFlight = true

  console.log('GenAccess: Running enhancements, mode:', runtimeState.mode, 'profile:', runtimeState.activeProfile.label)

  clearSummaries()
  resetTransformations()
  clearRuleBasedAdjustments()

  const domTree = collectDomTree()

  try {
    if (runtimeState.mode === 'generative') {
      console.log('GenAccess: Running generative pipeline')
      await runGenerativePipeline(domTree)
    } else {
      console.log('GenAccess: Applying rule-based adjustments')
      applyRuleBasedAdjustments(runtimeState.activeProfile)
      console.log('GenAccess: Rule-based adjustments applied')
    }

    // Use selection-based narration instead of hover
    attachSelectionTts()
  } catch (error) {
    console.error('GenAccess enhancement failed', error)
  } finally {
    enhancementInFlight = false
  }
}

async function runGenerativePipeline (domTree: DomNode): Promise<void> {
  if (runtimeState == null) return

  const screenshotDataUrl = await captureViewport()
  const screenshotBlob = await dataUrlToBlob(screenshotDataUrl)

  let detections: DetectionResult[] = []
  let imageBitmap: ImageBitmap | null = null

  try {
    const detector = await ensureDetector()
    imageBitmap = await createImageBitmap(screenshotBlob)
    detections = await detector.detectFromImageBitmap(imageBitmap)
  } catch (error) {
    console.warn('Local detection failed, attempting backend fallback', error)
  } finally {
    imageBitmap?.close()
  }

  let mappedDetections: DetectionResult[] = detections.length > 0 ? matchDetectionsToDom(domTree, detections) : []

  if (mappedDetections.length === 0) {
    const backendDetections = await requestBackendDetections(domTree, screenshotBlob)
    if ((backendDetections?.length ?? 0) > 0) {
      mappedDetections = matchDetectionsToDom(domTree, backendDetections as DetectionResult[])
    }
  }

  const layout = await requestLayoutGeneration(domTree, mappedDetections)
  if (layout != null) {
    applyGenerativeLayout(layout)
  } else {
    applyRuleBasedAdjustments(runtimeState.activeProfile)
  }
}

async function captureViewport (): Promise<string> {
  const response = await chrome.runtime.sendMessage({ type: 'CAPTURE_VIEWPORT' }) as { dataUrl?: string, error?: string }
  if (response.error != null || response.dataUrl == null) {
    throw new Error(response.error ?? 'Unable to capture viewport')
  }
  return response.dataUrl
}

async function dataUrlToBlob (dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl)
  return await response.blob()
}

async function requestLayoutGeneration (domTree: DomNode, detections: DetectionResult[]): Promise<LayoutResponse | null> {
  if (runtimeState == null) return null

  try {
    const response = await fetch(`${runtimeState.backend.baseUrl}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dom: domTree,
        detections,
        profile: runtimeState.activeProfile
      })
    })

    if (!response.ok) {
      console.warn('Layout generation failed', response.status)
      return null
    }

    const data = (await response.json()) as LayoutResponse
    return data
  } catch (error) {
    console.warn('Layout generation error', error)
    return null
  }
}

async function requestBackendDetections (domTree: DomNode, screenshotBlob: Blob): Promise<DetectionResult[] | null> {
  if (runtimeState == null) return null

  try {
    const form = new FormData()
    form.append('dom', JSON.stringify(domTree))
    form.append('screenshot', screenshotBlob, 'viewport.png')

    const response = await fetch(`${runtimeState.backend.baseUrl}/detect`, {
      method: 'POST',
      body: form
    })

    if (!response.ok) {
      console.warn('Remote detection failed', response.status)
      return null
    }

    const data = (await response.json()) as DetectApiResponse
    return data.detections
  } catch (error) {
    console.warn('Remote detection error', error)
    return null
  }
}

function matchDetectionsToDom (domTree: DomNode, detections: DetectionResult[]): DetectionResult[] {
  const nodes = flattenDom(domTree)
  return detections.map((detection) => {
    const best = nodes.reduce<{ node: DomNode | null, overlap: number }>((bestMatch, node) => {
      if (node.bbox == null) return bestMatch
      const overlap = computeIoU(node.bbox, detection.bbox)
      if (overlap > bestMatch.overlap) {
        return { node, overlap }
      }
      return bestMatch
    }, { node: null, overlap: 0 })

    return best.node != null
      ? { ...detection, elementId: best.node.nodeId }
      : detection
  })
}

function computeIoU (a: [number, number, number, number], b: [number, number, number, number]): number {
  const [ax1, ay1, ax2, ay2] = a
  const [bx1, by1, bx2, by2] = b

  const x1 = Math.max(ax1, bx1)
  const y1 = Math.max(ay1, by1)
  const x2 = Math.min(ax2, bx2)
  const y2 = Math.min(ay2, by2)

  const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1)
  const areaA = Math.max(0, ax2 - ax1) * Math.max(0, ay2 - ay1)
  const areaB = Math.max(0, bx2 - bx1) * Math.max(0, by2 - by1)

  const union = areaA + areaB - intersection
  if (union === 0) return 0
  return intersection / union
}

function flattenDom (root: DomNode): DomNode[] {
  const nodes: DomNode[] = [root]
  root.children.forEach((child) => {
    nodes.push(...flattenDom(child))
  })
  return nodes
}

function attachVoiceNavigator (): void {
  detachVoiceNavigator()
  if (runtimeState == null || !runtimeState.enabled) return

  voiceNavigator = initVoiceNavigator({
    enabled: true,
    rate: Math.max(0.85, Math.min(1.2, runtimeState.activeProfile.preferences.fontScale))
  })
}

async function annotateLongParagraphs (domTree: DomNode): Promise<void> {
  const candidates = flattenDom(domTree).filter((node) => {
    return (node.text?.length ?? 0) > 600
  })

  for (const node of candidates) {
    if (node.text == null) continue
    const summary = await summarizeText({ nodeId: node.nodeId, text: node.text, maxSentences: 3 }, runtimeState?.backend.baseUrl)
    const element = document.querySelector(`[data-genaccess-id="${node.nodeId}"]`)
    if (element != null) {
      if (element.querySelector(`.${SUMMARY_CLASS}`) != null) continue
      const summaryEl = document.createElement('div')
      summaryEl.className = SUMMARY_CLASS
      summaryEl.textContent = summary.summary
      element.prepend(summaryEl)
    }
  }
}

// summarizeElement removed to avoid selection popups

function clearSummaries (): void {
  document.querySelectorAll<HTMLElement>(`.${SUMMARY_CLASS}`).forEach((el) => {
    el.remove()
  })
}

function detachVoiceNavigator (): void {
  if (voiceNavigator != null) {
    voiceNavigator.destroy()
    voiceNavigator = null
  }
}

function attachSelectionTts (): void {
  if (selectionTtsBound) return
  const handler = (): void => {
    if (selectionSpeakTimer != null) window.clearTimeout(selectionSpeakTimer)
    selectionSpeakTimer = window.setTimeout(() => {
      const raw = window.getSelection()?.toString() ?? ''
      const text = raw.replace(/\s+/g, ' ').trim()
      if (text.length < 2) return
      const now = Date.now()
      if (text === lastSelectionText && now - lastSelectionAt < 800) return
      lastSelectionText = text
      lastSelectionAt = now
      const rate = Math.max(0.85, Math.min(1.2, runtimeState?.activeProfile.preferences.fontScale ?? 1))
      chrome.runtime.sendMessage({ type: 'TTS_SPEAK', payload: { text, lang: 'en-US', rate } }).catch(() => {
        try {
          const utterance = new SpeechSynthesisUtterance(text)
          utterance.lang = 'en-US'
          utterance.rate = rate
          window.speechSynthesis.cancel()
          window.speechSynthesis.speak(utterance)
        } catch {}
      })
    }, 150)
  }
  document.addEventListener('selectionchange', handler)
  document.addEventListener('mouseup', handler)
  document.addEventListener('keyup', handler)
  ;(attachSelectionTts as any)._handler = handler
  selectionTtsBound = true
}

function detachSelectionTts (): void {
  if (!selectionTtsBound) return
  const handler = (attachSelectionTts as any)._handler as EventListener | undefined
  if (handler != null) {
    document.removeEventListener('selectionchange', handler)
    document.removeEventListener('mouseup', handler)
    document.removeEventListener('keyup', handler)
  }
  selectionTtsBound = false
  chrome.runtime.sendMessage({ type: 'TTS_STOP' }).catch(() => {})
}

function teardownEnhancements (): void {
  detachVoiceNavigator()
  detachSelectionTts()
  resetTransformations()
  clearRuleBasedAdjustments()
  clearSummaries()
  enhancementInFlight = false
}

