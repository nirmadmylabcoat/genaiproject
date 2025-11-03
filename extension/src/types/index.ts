export type BoundingBox = [number, number, number, number]

export interface DomNode {
  nodeId: string
  tag: string
  role?: string
  text?: string
  bbox?: BoundingBox
  attributes: Record<string, string>
  children: DomNode[]
}

export interface DetectionResult {
  elementId: string
  label: string
  confidence: number
  bbox: BoundingBox
  category: 'actionable' | 'text' | 'media' | 'container'
}

export interface TransformationDirective {
  elementId: string
  css: Record<string, string>
  position?: {
    top: number
    left: number
    width: number
    height: number
  }
}

export interface LayoutResponse {
  directives: TransformationDirective[]
  metadata?: Record<string, unknown>
}

export interface ProfileSettings {
  id: string
  label: string
  description: string
  preferences: {
    fontScale: number
    contrast: 'default' | 'high'
    lineSpacing: number
    dyslexiaFont: boolean
    reduceMotion: boolean
    focusMode: 'off' | 'guided' | 'high'
  }
  generativeHints: Record<string, number>
}

export interface SummarizeRequest {
  nodeId: string
  text: string
  maxSentences?: number
}

export interface SummarizeResponse {
  nodeId: string
  summary: string
  method: 'local' | 'api'
}

export interface BackendConfig {
  baseUrl: string
  apiKey?: string
}

export interface RuntimeState {
  backend: BackendConfig
  activeProfile: ProfileSettings
  enabled: boolean
  mode: 'generative' | 'rules'
}

