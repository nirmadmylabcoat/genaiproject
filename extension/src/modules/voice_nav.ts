type SpeechRecognitionConstructor = new () => SpeechRecognition

const SpeechRecognitionImpl = (window.SpeechRecognition ?? window.webkitSpeechRecognition) as SpeechRecognitionConstructor | undefined

export interface VoiceOptions {
  enabled: boolean
  language?: string
  rate?: number
}

export class VoiceNavigator {
  private observer: MutationObserver | null = null
  private recognition: SpeechRecognition | null = null
  private hoveringElement: HTMLElement | null = null
  private options: VoiceOptions

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

    this.recognition = new SpeechRecognitionImpl()
    this.recognition.lang = this.options.language ?? 'en-US'
    this.recognition.continuous = true
    this.recognition.interimResults = false
    this.recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim()
      this.handleCommand(transcript.toLowerCase())
    }
    this.recognition.onerror = (event) => {
      console.warn('Voice recognition error', event.error)
    }

    try {
      this.recognition.start()
    } catch (error) {
      console.warn('Unable to start voice recognition', error)
    }
  }

  private handleMouseOver = (event: MouseEvent): void => {
    const target = event.target as HTMLElement
    if (target == null) return
    this.hoveringElement = target
    this.speakElement(target)
  }

  private handleFocus = (event: FocusEvent): void => {
    const target = event.target as HTMLElement
    if (target == null) return
    this.hoveringElement = target
    this.speakElement(target)
  }

  private speakElement (element: HTMLElement): void {
    const label = element.getAttribute('aria-label') ?? element.innerText ?? element.getAttribute('title') ?? element.tagName
    const utterance = new SpeechSynthesisUtterance(label)
    utterance.lang = this.options.language ?? 'en-US'
    utterance.rate = this.options.rate ?? 1
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
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

