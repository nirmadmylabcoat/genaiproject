import type { ProfileSettings, RuntimeState } from '../types'

const STORAGE_KEYS = {
  profiles: 'genaccess_profiles',
  runtime: 'genaccess_runtime'
} as const

export async function loadProfiles (): Promise<ProfileSettings[]> {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.profiles)
  return (result[STORAGE_KEYS.profiles] as ProfileSettings[] | undefined) ?? []
}

export async function saveProfiles (profiles: ProfileSettings[]): Promise<void> {
  await chrome.storage.sync.set({
    [STORAGE_KEYS.profiles]: profiles
  })
}

export async function loadRuntimeState (): Promise<RuntimeState | null> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.runtime)
  return (result[STORAGE_KEYS.runtime] as RuntimeState | undefined) ?? null
}

export async function saveRuntimeState (state: RuntimeState): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_KEYS.runtime]: state
  })
}

export async function syncProfileToBackend (profile: ProfileSettings, baseUrl: string): Promise<void> {
  try {
    const response = await fetch(`${baseUrl}/profiles/${profile.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profile)
    })

    if (!response.ok) {
      console.warn('Failed to sync profile', profile.id, response.status)
    }
  } catch (error) {
    console.warn('Profile sync error', error)
  }
}

