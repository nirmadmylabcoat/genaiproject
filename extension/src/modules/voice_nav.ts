// Minimal SpeechRecognition typing to satisfy TS in browsers without built-in types
interface MinimalSpeechRecognition {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: (event: any) => void
  onerror: (event: any) => void
  start: () => void
  stop: () => void
}

type SpeechRecognitionConstructor = new () => MinimalSpeechRecognition

const SpeechRecognitionImpl = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition as SpeechRecognitionConstructor | undefined

export interface VoiceOptions {
  enabled: boolean
  language?: string
  rate?: number
}

export class VoiceNavigator {
  private observer: MutationObserver | null = null
  private recognition: MinimalSpeechRecognition | null = null
  private hoveringElement: HTMLElement | null = null
  private options: VoiceOptions
  private lastSpokenText: string | null = null
  private lastSpokenAt = 0
  private speakTimer: number | null = null
  private useChromeTts = typeof chrome !== 'undefined' && (chrome as any).tts != null

  constructor (options: VoiceOptions) {
    this.options = {
      enabled: options.enabled,
      language: options.language ?? 'en-US',
      rate: options.rate ?? 1
    }
  }

  public init (): void {
    if (!this.options.enabled) return

    this.attachHoverListeners()
    this.bootstrapRecognition()
  }

  public destroy (): void {
    document.removeEventListener('mouseover', this.handleMouseOver)
    document.removeEventListener('focusin', this.handleFocus)

    if (this.observer != null) {
      this.observer.disconnect()
      this.observer = null
    }

    if (this.recognition != null) {
      this.recognition.stop()
    }
  }

  private attachHoverListeners (): void {
    document.addEventListener('mouseover', this.handleMouseOver)
    document.addEventListener('focusin', this.handleFocus)

    this.observer = new MutationObserver(() => {
      document.querySelectorAll<HTMLElement>('a, button, input, [role]')
        .forEach((el) => {
          if (!el.hasAttribute('data-genaccess-hover-bound')) {
            el.setAttribute('data-genaccess-hover-bound', 'true')
          }
        })
    })

    this.observer.observe(document.body, { childList: true, subtree: true })
  }

  private bootstrapRecognition (): void {
    if (SpeechRecognitionImpl == null) {
      console.info('Speech recognition API not available')
      return
    }

    const rec = new SpeechRecognitionImpl()
    rec.lang = this.options.language ?? 'en-US'
    rec.continuous = true
    rec.interimResults = false
    rec.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim()
      this.handleCommand(transcript.toLowerCase())
    }
    rec.onerror = (event: any) => {
      console.warn('Voice recognition error', event.error)
    }
    this.recognition = rec

    try {
      rec.start()
    } catch (error) {
      console.warn('Unable to start voice recognition', error)
    }
  }

  private handleMouseOver = (event: MouseEvent): void => {
    const target = event.target as HTMLElement
    if (target == null) return
    const speakable = this.getSpeakableElement(target)
    if (speakable == null || speakable === this.hoveringElement) return
    this.hoveringElement = speakable
    this.queueSpeak(speakable)
  }

  private handleFocus = (event: FocusEvent): void => {
    const target = event.target as HTMLElement
    if (target == null) return
    const speakable = this.getSpeakableElement(target)
    if (speakable == null) return
    this.hoveringElement = speakable
    this.queueSpeak(speakable)
  }

  private queueSpeak (element: HTMLElement): void {
    if (this.speakTimer != null) window.clearTimeout(this.speakTimer)
    this.speakTimer = window.setTimeout(() => this.speakElement(element), 120)
  }

  private speakElement (element: HTMLElement): void {
    const label = this.getElementLabel(element)
    if (label == null) return

    const now = Date.now()
    if (this.lastSpokenText === label && now - this.lastSpokenAt < 800) return
    this.lastSpokenText = label
    this.lastSpokenAt = now

    const rate = this.options.rate ?? 1
    if (this.useChromeTts) {
      // Route through background for reliable TTS in MV3
      chrome.runtime.sendMessage({
        type: 'TTS_SPEAK',
        payload: { text: label, lang: this.options.language ?? 'en-US', rate }
      }).catch(() => {
        this.localSpeak(label, rate)
      })
      return
    }
    this.localSpeak(label, rate)
  }

  private localSpeak (label: string, rate: number): void {
    try {
      const utterance = new SpeechSynthesisUtterance(label)
      utterance.lang = this.options.language ?? 'en-US'
      utterance.rate = rate
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utterance)
    } catch {
      // ignore
    }
  }

  private getElementLabel (element: HTMLElement): string | null {
    const candidates = [
      element.getAttribute('aria-label'),
      element.getAttribute('title'),
      element.innerText?.trim()
    ].filter(Boolean) as string[]
    if (candidates.length === 0) return null
    const text = candidates[0].replace(/\s+/g, ' ').trim()
    if (text.length < 2) return null
    if (text.length > 280) return text.slice(0, 280)
    return text
  }

  private getSpeakableElement (start: HTMLElement): HTMLElement | null {
    let el: HTMLElement | null = start
    const isInteractive = (e: HTMLElement) => e.matches('a, button, input, select, textarea, [role], [tabindex]')
    while (el != null && el !== document.body && el !== document.documentElement) {
      const label = this.getElementLabel(el)
      if (label != null && (isInteractive(el) || label.length >= 4)) return el
      el = el.parentElement
    }
    return null
  }

  private handleCommand (command: string): void {
    if (command.includes('scroll down')) {
      window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' })
      return
    }
    if (command.includes('scroll up')) {
      window.scrollBy({ top: -window.innerHeight * 0.8, behavior: 'smooth' })
      return
    }
    if (command.includes('focus next')) {
      this.focusNextElement()
      return
    }
    if (command.includes('open link')) {
      this.activateCurrentElement()
    }
  }

  private focusNextElement (): void {
    const focusables = Array.from(document.querySelectorAll<HTMLElement>('a, button, input, select, textarea, [tabindex]'))
      .filter((el) => !el.hasAttribute('disabled'))
    const currentIndex = this.hoveringElement != null ? focusables.indexOf(this.hoveringElement) : document.activeElement != null ? focusables.indexOf(document.activeElement as HTMLElement) : -1
    const next = focusables[(currentIndex + 1) % focusables.length]
    if (next != null) {
      next.focus()
      this.speakElement(next)
      this.hoveringElement = next
    }
  }

  private activateCurrentElement (): void {
    const element = this.hoveringElement ?? document.activeElement
    if (element instanceof HTMLAnchorElement) {
      element.click()
    } else if (element instanceof HTMLButtonElement || element instanceof HTMLInputElement) {
      element.click()
    }
  }
}

export function initVoiceNavigator (options: VoiceOptions): VoiceNavigator {
  const navigator = new VoiceNavigator(options)
  navigator.init()
  return navigator
}

