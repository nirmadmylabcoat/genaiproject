import { D as DEFAULT_PROFILES } from "./chunks/config-Pt77BZmv.js";
(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const STORAGE_KEYS = {
  profiles: "genaccess_profiles",
  runtime: "genaccess_runtime"
};
async function loadProfiles() {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.profiles);
  return result[STORAGE_KEYS.profiles] ?? [];
}
async function saveProfiles(profiles) {
  await chrome.storage.sync.set({
    [STORAGE_KEYS.profiles]: profiles
  });
}
async function loadRuntimeState() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.runtime);
  return result[STORAGE_KEYS.runtime] ?? null;
}
async function saveRuntimeState(state) {
  await chrome.storage.local.set({
    [STORAGE_KEYS.runtime]: state
  });
}
async function syncProfileToBackend(profile, baseUrl) {
  try {
    const response = await fetch(`${baseUrl}/profiles/${profile.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(profile)
    });
    if (!response.ok) {
      console.warn("Failed to sync profile", profile.id, response.status);
    }
  } catch (error) {
    console.warn("Profile sync error", error);
  }
}
async function initPopup() {
  const app = document.getElementById("app");
  if (app == null) return;
  let runtime = await loadRuntimeState();
  if (runtime == null) {
    runtime = await chrome.runtime.sendMessage({ type: "GET_RUNTIME_STATE" });
    await saveRuntimeState(runtime);
  }
  let profiles = await loadProfiles();
  if (profiles.length === 0) {
    profiles = DEFAULT_PROFILES;
    await saveProfiles(profiles);
    void Promise.all(profiles.map(async (profile) => {
      await syncProfileToBackend(profile, runtime.backend.baseUrl);
    }));
  }
  render(app, runtime, profiles);
}
function render(root, runtime, profiles) {
  root.innerHTML = "";
  const title = document.createElement("h1");
  title.className = "text-lg font-semibold mb-2";
  title.textContent = "GenAccess";
  const description = document.createElement("p");
  description.className = "text-sm text-white/70 mb-4";
  description.textContent = "Generative accessibility assistant";
  const enableToggle = document.createElement("label");
  enableToggle.className = "flex items-center gap-2 mb-4";
  enableToggle.innerHTML = `
    <input type="checkbox" class="accent-brand" ${runtime.enabled ? "checked" : ""} />
    <span>Enable on this browser</span>
  `;
  const modeSelector = document.createElement("div");
  modeSelector.className = "flex gap-2 mb-4";
  modeSelector.innerHTML = `
    <button data-mode="generative" class="px-3 py-2 rounded ${runtime.mode === "generative" ? "bg-brand text-white" : "bg-white/10"}">Generative</button>
    <button data-mode="rules" class="px-3 py-2 rounded ${runtime.mode === "rules" ? "bg-brand text-white" : "bg-white/10"}">Rules</button>
  `;
  const profileSelect = document.createElement("div");
  profileSelect.className = "profile-card";
  profileSelect.innerHTML = `
    <label class="block text-sm font-semibold mb-2">Profile</label>
    <select class="w-full bg-black/20 rounded px-2 py-2">
      ${profiles.map((profile) => `<option value="${profile.id}" ${profile.id === runtime.activeProfile.id ? "selected" : ""}>${profile.label}</option>`).join("")}
    </select>
    <p class="text-xs text-white/60 mt-2" id="profile-description">${runtime.activeProfile.description}</p>
  `;
  const backendField = document.createElement("div");
  backendField.className = "profile-card mt-4";
  backendField.innerHTML = `
    <label class="block text-sm font-semibold mb-2">Backend URL</label>
    <input type="text" value="${runtime.backend.baseUrl}" class="w-full rounded bg-black/20 px-2 py-2 text-sm" />
  `;
  const latencyChip = document.createElement("div");
  latencyChip.className = "mt-4 text-xs text-white/60";
  latencyChip.textContent = "Latency target: < 7s (det + gen)";
  root.append(title, description, enableToggle, modeSelector, profileSelect, backendField, latencyChip);
  const enableInput = enableToggle.querySelector("input");
  enableInput.addEventListener("change", async () => {
    runtime.enabled = enableInput.checked;
    await persistRuntime(runtime);
  });
  modeSelector.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", async () => {
      const mode = button.getAttribute("data-mode");
      runtime.mode = mode;
      await persistRuntime(runtime);
      render(root, runtime, profiles);
    });
  });
  const selectEl = profileSelect.querySelector("select");
  const descriptionEl = profileSelect.querySelector("#profile-description");
  selectEl.addEventListener("change", async () => {
    const profile = profiles.find((p) => p.id === selectEl.value);
    if (profile == null) return;
    runtime.activeProfile = profile;
    descriptionEl.textContent = profile.description;
    await persistRuntime(runtime);
    void syncProfileToBackend(profile, runtime.backend.baseUrl);
  });
  const backendInput = backendField.querySelector("input");
  backendInput.addEventListener("change", async () => {
    runtime.backend.baseUrl = backendInput.value;
    await persistRuntime(runtime);
  });
}
async function persistRuntime(runtime) {
  await saveRuntimeState(runtime);
  await chrome.runtime.sendMessage({ type: "SET_RUNTIME_STATE", payload: runtime });
}
void initPopup();
//# sourceMappingURL=popup.js.map
