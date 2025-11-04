import { a as DEFAULT_RUNTIME_STATE } from "./chunks/config-A9U9s7UZ.js";
function broadcastMessage(message) {
  void chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      if (tab.id != null) {
        void chrome.tabs.sendMessage(tab.id, message);
      }
    }
  });
}
chrome.runtime.onInstalled.addListener(() => {
  void chrome.storage.local.get("genaccess_runtime", (result) => {
    if (result.genaccess_runtime == null) {
      void chrome.storage.local.set({ genaccess_runtime: DEFAULT_RUNTIME_STATE });
    }
  });
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  void (async () => {
    var _a;
    if (message.type === "GET_RUNTIME_STATE") {
      const { genaccess_runtime: runtime } = await chrome.storage.local.get("genaccess_runtime");
      sendResponse(runtime ?? DEFAULT_RUNTIME_STATE);
      return;
    }
    if (message.type === "SET_RUNTIME_STATE") {
      await chrome.storage.local.set({ genaccess_runtime: message.payload });
      broadcastMessage({ type: "GENACCESS_STATE", payload: message.payload });
      sendResponse({ success: true });
      return;
    }
    if (message.type === "CAPTURE_VIEWPORT") {
      try {
        const dataUrl = ((_a = sender.tab) == null ? void 0 : _a.windowId) != null ? await chrome.tabs.captureVisibleTab(sender.tab.windowId, { format: "png" }) : await chrome.tabs.captureVisibleTab({ format: "png" });
        sendResponse({ dataUrl });
      } catch (error) {
        console.warn("Failed to capture tab", error);
        sendResponse({ error: String(error) });
      }
    }
  })().catch((error) => {
    console.error("Background error", error);
    sendResponse({ error: String(error) });
  });
  return true;
});
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local" || changes.genaccess_runtime == null) return;
  const newValue = changes.genaccess_runtime.newValue;
  if (newValue != null) {
    broadcastMessage({ type: "GENACCESS_STATE", payload: newValue });
  }
});
//# sourceMappingURL=background.js.map
