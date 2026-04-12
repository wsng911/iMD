import { reactive, watch } from 'vue'

const DEFAULTS = {
  fontSize: 15,
  theme: 'dark',       // dark | light
  accent: 'purple',    // purple | teal | blue | rose
}

// 后端接入
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
function authHeaders() {
  const token = localStorage.getItem('imk_token')
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
}
async function fetchSettings() {
  try {
    const res = await fetch(`${BASE}/settings`, { headers: authHeaders() })
    return res.ok ? res.json() : null
  } catch { return null }
}
async function saveSettings(data) {
  try {
    await fetch(`${BASE}/settings`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) })
  } catch {}
}

export const settings = reactive({ ...DEFAULTS })

export async function loadSettings() {
  const saved = await fetchSettings()
  if (saved) Object.assign(settings, saved)
  applyCSS()
}

export async function persistSettings() {
  await saveSettings({ ...settings })
  applyCSS()
}

const ACCENTS = {
  purple: '#cba6f7',
  teal:   '#94e2d5',
  blue:   '#89b4fa',
  rose:   '#f38ba8',
}

function applyCSS() {
  const root = document.documentElement
  root.style.setProperty('--font-size', settings.fontSize + 'px')
  // 支持预设 key 或直接 hex
  const color = ACCENTS[settings.accent] || settings.accent
  root.style.setProperty('--accent', color)
  root.dataset.theme = settings.theme
}
