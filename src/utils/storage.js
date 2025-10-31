// Simple Chrome storage helpers

export async function getActiveAlert() {
  const result = await chrome.storage.local.get('activeAlert');
  return result.activeAlert || null;
}

export async function setActiveAlert(alert) {
  await chrome.storage.local.set({ activeAlert: alert });
}

export async function clearActiveAlert() {
  await chrome.storage.local.remove('activeAlert');
}

export async function getWatcherSettings() {
  const result = await chrome.storage.local.get('settings');
  return result.settings || {
    checkInterval: 3, // minutes
    enabled: false
  };
}

export async function setWatcherSettings(settings) {
  await chrome.storage.local.set({ settings });
}
