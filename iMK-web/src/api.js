const BASE = import.meta.env.VITE_API_URL || ''

function headers() {
  const token = localStorage.getItem('imk_token')
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
}

function toast(msg, ok = false) {
  const el = document.createElement('div')
  el.textContent = msg
  el.style.cssText = `position:fixed;bottom:24px;right:24px;padding:8px 16px;border-radius:8px;font-size:13px;z-index:9999;background:${ok ? '#a6e3a1' : '#f38ba8'};color:#1e1e2e`
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 2500)
}

async function req(method, path, body) {
  const res = await fetch(BASE + path, { method, headers: headers(), body: body ? JSON.stringify(body) : undefined })
  if (res.status === 401) { toast('登录已过期，请重新登录'); throw { error: 'Unauthorized' } }
  if (!res.ok) { const e = await res.json(); toast('保存失败：' + (e.error || res.status)); throw e }
  return res.json()
}

export const api = {
  login:          (data)    => req('POST', '/auth/login', data),
  changePassword:    (data) => req('POST', '/auth/change-password', data),
  privateVerify:     (pwd)  => req('POST', '/auth/private-verify', { password: pwd }),
  setPrivatePassword:(data) => req('POST', '/auth/private-password', data),
  getDocs:        ()        => req('GET',  '/docs'),
  saveDocs:       (docs)    => req('PUT',  '/docs', docs),
  importFromData: ()        => req('POST', '/docs/import'),
  importFile:     (file)    => {
    const form = new FormData(); form.append('file', file)
    const token = localStorage.getItem('imk_token')
    return fetch(BASE + '/docs/import', { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: form }).then(r => r.json())
  },
  createDoc:      (data)    => req('POST', '/docs', data),
  updateDoc:      (id, data)=> req('PUT',  `/docs/${id}`, data),
  deleteDoc:      (id)      => req('DELETE',`/docs/${id}`),
  getSettings:    ()        => req('GET',  '/settings'),
  saveSettings:   (data)    => req('POST', '/settings', data),
}
