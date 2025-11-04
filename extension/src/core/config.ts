import type { ProfileSettings, RuntimeState } from '../types'

const DEFAULT_PROFILE: ProfileSettings = {
  id: 'high-contrast',
  label: 'High Contrast',
  description: 'Increases contrast and font sizes for low-vision support.',
  preferences: {
    fontScale: 1.3,
    contrast: 'high',
    lineSpacing: 1.4,
    dyslexiaFont: false,
    reduceMotion: true,
    focusMode: 'guided'
  },
  generativeHints: {
    contrast_ratio: 0.9,
    whitespace_bias: 0.6
  }
}

export const DEFAULT_PROFILES: ProfileSettings[] = [
  DEFAULT_PROFILE,
  {
    id: 'dyslexia-friendly',
    label: 'Dyslexia Friendly',
    description: 'Applies dyslexia-friendly typefaces and spacing.',
    preferences: {
      fontScale: 1.2,
      contrast: 'default',
      lineSpacing: 1.6,
      dyslexiaFont: true,
      reduceMotion: true,
      focusMode: 'off'
    },
    generativeHints: {
      font_family: 0.8,
      line_height: 0.7
    }
  },
  {
    id: 'adhd-focus',
    label: 'ADHD Focus',
    description: 'Reduces distractions and guides sequential focus.',
    preferences: {
      fontScale: 1,
      contrast: 'default',
      lineSpacing: 1.3,
      dyslexiaFont: false,
      reduceMotion: false,
      focusMode: 'high'
    },
    generativeHints: {
      focus_path: 0.9,
      collapse_density: 0.8
    }
  }
]

export const DEFAULT_RUNTIME_STATE: RuntimeState = {
  backend: {
    baseUrl: 'http://localhost:8000/api'
  },
  activeProfile: DEFAULT_PROFILE,
  enabled: false,
  mode: 'rules'
}

