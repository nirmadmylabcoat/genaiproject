import type { RuntimeState } from '../types'

export type ExtensionMessage =
  | { type: 'GENACCESS_ENABLE'; payload: boolean }
  | { type: 'GENACCESS_MODE'; payload: 'generative' | 'rules' }
  | { type: 'GENACCESS_PROFILE'; payload: string }
  | { type: 'GENACCESS_STATE'; payload: RuntimeState }
  | { type: 'GENACCESS_SUMMARY'; payload: { nodeId: string; summary: string } }
  | { type: 'GENACCESS_DETECTIONS_REQUEST'; payload: unknown }
  | { type: 'GENACCESS_DETECTIONS_RESPONSE'; payload: unknown }

export function sendMessageToTab<T extends ExtensionMessage> (tabId: number, message: T): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      const error = chrome.runtime.lastError
      if (error != null) {
        reject(error)
        return
      }
      resolve(response)
    })
  })
}

export function broadcastMessage<T extends ExtensionMessage> (message: T): void {
  void chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      if (tab.id != null) {
        void chrome.tabs.sendMessage(tab.id, message)
      }
    }
  })
}

