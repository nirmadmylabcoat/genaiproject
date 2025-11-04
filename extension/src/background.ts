import type { RuntimeState } from './types'
import { DEFAULT_RUNTIME_STATE } from './core/config'
import { broadcastMessage } from './utils/messaging'

type BackgroundMessage =
  | { type: 'GET_RUNTIME_STATE' }
  | { type: 'SET_RUNTIME_STATE'; payload: RuntimeState }
  | { type: 'CAPTURE_VIEWPORT' }

chrome.runtime.onInstalled.addListener(() => {
  void chrome.storage.local.get('genaccess_runtime', (result) => {
    if (result.genaccess_runtime == null) {
      void chrome.storage.local.set({ genaccess_runtime: DEFAULT_RUNTIME_STATE })
    }
  })
})

chrome.runtime.onMessage.addListener((message: BackgroundMessage, sender, sendResponse) => {
  void (async () => {
    if (message.type === 'GET_RUNTIME_STATE') {
      const { genaccess_runtime: runtime } = await chrome.storage.local.get('genaccess_runtime')
      sendResponse(runtime ?? DEFAULT_RUNTIME_STATE)
      return
    }

    if (message.type === 'SET_RUNTIME_STATE') {
      await chrome.storage.local.set({ genaccess_runtime: message.payload })
      broadcastMessage({ type: 'GENACCESS_STATE', payload: message.payload })
      sendResponse({ success: true })
      return
    }

    if (message.type === 'CAPTURE_VIEWPORT') {
      try {
        const dataUrl = sender.tab?.windowId != null
          ? await chrome.tabs.captureVisibleTab(sender.tab.windowId, { format: 'png' })
          : await chrome.tabs.captureVisibleTab({ format: 'png' })
        sendResponse({ dataUrl })
      } catch (error) {
        console.warn('Failed to capture tab', error)
        sendResponse({ error: String(error) })
      }
    }
  })().catch((error) => {
    console.error('Background error', error)
    sendResponse({ error: String(error) })
  })

  return true
})

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local' || changes.genaccess_runtime == null) return
  const newValue = changes.genaccess_runtime.newValue as RuntimeState | undefined
  if (newValue != null) {
    broadcastMessage({ type: 'GENACCESS_STATE', payload: newValue })
  }
})


