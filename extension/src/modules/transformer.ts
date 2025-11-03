import type { LayoutResponse, ProfileSettings, TransformationDirective } from '../types'

const DYSLEXIA_FONT_STACK = '"OpenDyslexic", "Atkinson Hyperlegible", "Arial", sans-serif'
const ORIGINAL_STYLE_ATTR = 'data-genaccess-original-style'
const MOTION_ATTR = 'data-genaccess-motion'
const FOCUS_ATTR = 'data-genaccess-focus'
const TEMP_TAB_INDEX_ATTR = 'data-genaccess-temp-tabindex'

export function applyTransformationDirectives (directives: TransformationDirective[]): void {
  for (const directive of directives) {
    const element = document.querySelector(`[data-genaccess-id="${directive.elementId}"]`) as HTMLElement | null
    if (element == null) continue

    if (!element.hasAttribute(ORIGINAL_STYLE_ATTR)) {
      const originalStyle = element.getAttribute('style')
      element.setAttribute(ORIGINAL_STYLE_ATTR, originalStyle ?? '')
    }

    if (directive.css != null) {
      Object.assign(element.style, directive.css)
    }

    if (directive.position != null) {
      const { top, left, width, height } = directive.position
      element.style.position = 'absolute'
      element.style.top = `${top}px`
      element.style.left = `${left}px`
      element.style.width = `${width}px`
      element.style.height = `${height}px`
    }
  }
}

export function applyRuleBasedAdjustments (profile: ProfileSettings): void {
  const root = document.documentElement
  const body = document.body

  // Apply CSS variables
  root.style.setProperty('--genaccess-font-scale', profile.preferences.fontScale.toString())
  root.style.setProperty('--genaccess-line-spacing', profile.preferences.lineSpacing.toString())

  // Apply font scaling to body
  const currentFontSize = window.getComputedStyle(body).fontSize
  const baseFontSize = parseFloat(currentFontSize) || 16
  body.style.fontSize = `${baseFontSize * profile.preferences.fontScale}px`
  body.style.lineHeight = profile.preferences.lineSpacing.toString()

  // Apply high contrast mode
  if (profile.preferences.contrast === 'high') {
    body.style.backgroundColor = '#000000 !important'
    body.style.color = '#ffffff !important'
    root.style.backgroundColor = '#000000'
    root.style.color = '#ffffff'
    
    // Apply to all elements for maximum effect
    injectHighContrastStyles()
  } else {
    removeHighContrastStyles()
  }

  // Apply dyslexia-friendly font
  if (profile.preferences.dyslexiaFont) {
    body.style.fontFamily = DYSLEXIA_FONT_STACK
    body.style.letterSpacing = '0.05em'
    root.style.fontFamily = DYSLEXIA_FONT_STACK
    root.style.letterSpacing = '0.05em'
  } else {
    body.style.removeProperty('font-family')
    body.style.removeProperty('letter-spacing')
    root.style.removeProperty('font-family')
    root.style.removeProperty('letter-spacing')
  }

  // Reduce motion
  if (profile.preferences.reduceMotion) {
    root.style.setProperty('scroll-behavior', 'auto')
    void document.querySelectorAll<HTMLElement>('*').forEach((el) => {
      el.setAttribute(MOTION_ATTR, 'true')
      el.style.transitionDuration = '0s'
      el.style.animationDuration = '0s'
    })
  } else {
    clearReduceMotion()
  }

  // Apply focus mode
  if (profile.preferences.focusMode !== 'off') {
    enableFocusMode(profile.preferences.focusMode)
  } else {
    disableFocusMode()
  }
}

function enableFocusMode (mode: 'guided' | 'high'): void {
  disableFocusMode()

  const focusable = Array.from(document.querySelectorAll<HTMLElement>('a, button, input, select, textarea, [tabindex]'))
  focusable.forEach((el, index) => {
    el.setAttribute(FOCUS_ATTR, 'true')
    el.style.outline = '3px solid #5B21B6'
    el.style.outlineOffset = '2px'
    el.style.removeProperty('box-shadow')
    el.style.removeProperty('z-index')

    if (mode === 'high') {
      el.style.boxShadow = '0 0 0 4px rgba(91, 33, 182, 0.35)'
      el.style.zIndex = '9999'
    }

    if (!el.hasAttribute('tabindex')) {
      el.setAttribute('tabindex', String(1000 + index))
      el.setAttribute(TEMP_TAB_INDEX_ATTR, 'true')
    }
  })
}

function disableFocusMode (): void {
  const nodes = document.querySelectorAll<HTMLElement>(`[${FOCUS_ATTR}]`)
  nodes.forEach((el) => {
    el.style.removeProperty('outline')
    el.style.removeProperty('outline-offset')
    el.style.removeProperty('box-shadow')
    el.style.removeProperty('z-index')
    if (el.getAttribute(TEMP_TAB_INDEX_ATTR) === 'true') {
      el.removeAttribute('tabindex')
    }
    el.removeAttribute(TEMP_TAB_INDEX_ATTR)
    el.removeAttribute(FOCUS_ATTR)
  })
}

function clearReduceMotion (): void {
  const root = document.documentElement
  root.style.removeProperty('scroll-behavior')
  const nodes = document.querySelectorAll<HTMLElement>(`[${MOTION_ATTR}]`)
  nodes.forEach((el) => {
    el.style.removeProperty('transition-duration')
    el.style.removeProperty('animation-duration')
    el.removeAttribute(MOTION_ATTR)
  })
}

const HIGH_CONTRAST_STYLE_ID = 'genaccess-high-contrast-styles'

function injectHighContrastStyles (): void {
  // Remove existing style if present
  const existing = document.getElementById(HIGH_CONTRAST_STYLE_ID)
  if (existing != null) return

  const style = document.createElement('style')
  style.id = HIGH_CONTRAST_STYLE_ID
  style.textContent = `
    html, body {
      background-color: #000000 !important;
      color: #ffffff !important;
    }
    
    * {
      background-color: inherit !important;
      color: inherit !important;
      border-color: #ffffff !important;
    }
    
    a, a:link, a:visited {
      color: #00ffff !important;
    }
    
    a:hover, a:active {
      color: #ffff00 !important;
    }
    
    button, input, select, textarea {
      background-color: #333333 !important;
      color: #ffffff !important;
      border: 2px solid #ffffff !important;
    }
    
    img, video {
      opacity: 0.9;
      filter: contrast(1.2) brightness(0.9);
    }
  `
  document.head.appendChild(style)
}

function removeHighContrastStyles (): void {
  const style = document.getElementById(HIGH_CONTRAST_STYLE_ID)
  if (style != null) {
    style.remove()
  }
  
  const root = document.documentElement
  const body = document.body
  body.style.removeProperty('background-color')
  body.style.removeProperty('color')
  root.style.removeProperty('background-color')
  root.style.removeProperty('color')
}

export function clearRuleBasedAdjustments (): void {
  const root = document.documentElement
  const body = document.body
  
  // Remove CSS variables
  root.style.removeProperty('--genaccess-font-scale')
  root.style.removeProperty('--genaccess-line-spacing')
  
  // Remove root styles
  root.style.removeProperty('filter')
  root.style.removeProperty('background-color')
  root.style.removeProperty('color')
  root.style.removeProperty('font-family')
  root.style.removeProperty('letter-spacing')
  
  // Remove body styles
  body.style.removeProperty('font-size')
  body.style.removeProperty('line-height')
  body.style.removeProperty('background-color')
  body.style.removeProperty('color')
  body.style.removeProperty('font-family')
  body.style.removeProperty('letter-spacing')
  
  // Remove injected styles
  removeHighContrastStyles()
  clearReduceMotion()
  disableFocusMode()
}

export function resetTransformations (): void {
  const nodes = document.querySelectorAll<HTMLElement>(`[${ORIGINAL_STYLE_ATTR}]`)
  nodes.forEach((el) => {
    const original = el.getAttribute(ORIGINAL_STYLE_ATTR)
    if (original != null && original.length > 0) {
      el.setAttribute('style', original)
    } else {
      el.removeAttribute('style')
    }
    el.removeAttribute(ORIGINAL_STYLE_ATTR)
  })
}

export function applyGenerativeLayout (layout: LayoutResponse): void {
  applyTransformationDirectives(layout.directives)
}

