<template>
  <div class="layout-gmail">
    <div class="gmail-sidebar">
      <div class="gmail-header">
        <button class="compose-btn" @click="newDoc">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          新建文档
        </button>
      </div>
      <div class="gmail-nav">
        <div v-for="group in docs" :key="group.id">
          <div class="nav-item" @click="toggleGroup(group.id)">
            <span>📁</span>
            <span class="nav-label">{{ group.title }}</span>
            <span>{{ openGroups.has(group.id) ? '▾' : '›' }}</span>
          </div>
          <template v-if="openGroups.has(group.id)">
            <div v-for="doc in group.children" :key="doc.id">
              <div :class="['nav-item nav-sub', { active: current?.id === doc.id }]" @click="selectDoc(doc)">
                <span>📄</span>
                <span class="nav-label">{{ doc.title }}</span>
              </div>
              <template v-if="current?.id === doc.id">
                <div v-for="h in headings" :key="h.id" :class="['nav-outline-item', `lv${h.level}`]" @click="scrollTo(h.id)">
                  <span class="dot"></span>{{ h.text }}
                </div>
              </template>
            </div>
          </template>
        </div>
      </div>
      <div class="gmail-footer">
        <button class="footer-btn" @click="logout">退出</button>
      </div>
    </div>

    <main class="gmail-main">
      <div class="gmail-topbar">
        <span class="doc-title">{{ current?.title || 'iMD' }}</span>
        <div class="topbar-right">
          <button class="tb-btn" @click="settings.fontSize = Math.max(12, settings.fontSize - 1); persistSettings()">A-</button>
          <button class="tb-btn" @click="settings.fontSize = 15; persistSettings()">A</button>
          <button class="tb-btn" @click="settings.fontSize = Math.min(22, settings.fontSize + 1); persistSettings()">A+</button>
          <input type="color" :value="customColor" @input="setCustomColor" class="color-picker-round" />
          <button class="tb-btn" @click="importMd">↑</button>
          <input ref="importRef" type="file" accept=".md" style="display:none" @change="onImportFile" />
          <button class="tb-btn" @click="exportMd">↓</button>
          <button class="tb-btn" @click="toggleTheme">
            <svg v-if="settings.theme==='dark'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          </button>
        </div>
      </div>

      <div class="gmail-content">
        <template v-if="current">
          <Viewer v-if="mode==='view'" :content="current.content" :title="current.title" @edit="mode='edit'" />
          <Editor v-else :content="current.content" @save="onSave" @cancel="mode='view'" @update:content="v => current.content = v" />
        </template>
        <div v-else class="empty">← 选择文档</div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import JSZip from 'jszip'
import Viewer from '../components/Viewer.vue'
import Editor from '../components/Editor.vue'
import { settings, loadSettings, persistSettings } from '../useSettings.js'
import { api } from '../api.js'

const router = useRouter()
const importRef = ref(null)
const docs = ref([])
const current = ref(null)
const mode = ref('view')
const openGroups = ref(new Set())

onMounted(async () => {
  loadSettings()
  docs.value = await api.getDocs()
  const lastId = parseInt(localStorage.getItem('imk_last_doc'))
  if (lastId) {
    for (const g of docs.value) {
      const doc = g.children?.find(d => d.id === lastId)
      if (doc) { current.value = doc; openGroups.value.add(g.id); break }
    }
  }
})

function toggleGroup(id) {
  if (openGroups.value.has(id)) openGroups.value.delete(id)
  else openGroups.value.add(id)
  openGroups.value = new Set(openGroups.value)
}

function selectDoc(doc) {
  current.value = doc
  mode.value = 'view'
  localStorage.setItem('imk_last_doc', doc.id)
}

function newDoc() {
  const title = prompt('文档标题：')
  if (!title) return
  const group = docs.value[0]
  if (!group) return
  const doc = { id: Date.now(), title, content: `# ${title}\n\n` }
  group.children = [...(group.children || []), doc]
  api.saveDocs(docs.value)
  selectDoc(doc)
  mode.value = 'edit'
}

const headings = computed(() => {
  if (!current.value?.content) return []
  return [...current.value.content.matchAll(/^(#{1,3})\s+(.+)$/gm)].map(m => ({
    level: m[1].length, text: m[2].trim(),
    id: m[2].trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
  }))
})

function scrollTo(id) {
  const h = headings.value.find(h => h.id === id)
  if (!h) return
  const el = [...document.querySelectorAll('.md-wrap h1,.md-wrap h2,.md-wrap h3')].find(e => e.textContent.trim() === h.text)
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function onSave(content) {
  current.value.content = content
  mode.value = 'view'
  await api.updateDoc(current.value.id, { content }).catch(() => {})
}

function logout() { localStorage.removeItem('imk_token'); router.push('/login') }
function importMd() { importRef.value?.click() }
function onImportFile(e) {
  const file = e.target.files[0]
  if (!file || !current.value) return
  const reader = new FileReader()
  reader.onload = ev => { current.value.content = ev.target.result; api.updateDoc(current.value.id, { content: ev.target.result }).catch(() => {}) }
  reader.readAsText(file)
  e.target.value = ''
}
async function exportMd() {
  const zip = new JSZip()
  docs.value.forEach(g => { const f = zip.folder(g.title); g.children?.forEach(d => f.file(`${d.title}.md`, d.content || '')) })
  const blob = await zip.generateAsync({ type: 'blob' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `iMD-${new Date().toISOString().slice(0,10)}.zip`
  a.click(); URL.revokeObjectURL(a.href)
}
function toggleTheme() { settings.theme = settings.theme === 'dark' ? 'light' : 'dark'; persistSettings() }
function setCustomColor(e) { document.documentElement.style.setProperty('--accent', e.target.value); settings.accent = e.target.value; persistSettings() }
const customColor = computed(() => ({ purple: '#cba6f7', teal: '#94e2d5', blue: '#89b4fa', rose: '#f38ba8' })[settings.accent] || settings.accent)
</script>

<style scoped>
.layout-gmail { display: flex; height: 100vh; }
.gmail-sidebar { width: 280px; background: var(--bg2); border-right: 1px solid var(--border); display: flex; flex-direction: column; }
.gmail-header { padding: 16px; }
.compose-btn { width: 100%; padding: 10px; background: var(--accent); color: white; border: none; border-radius: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 14px; }
.gmail-nav { flex: 1; overflow-y: auto; padding: 8px 0; }
.nav-item { padding: 9px 16px; margin: 1px 8px; border-radius: 0 24px 24px 0; cursor: pointer; display: flex; align-items: center; gap: 10px; font-size: 14px; color: var(--text); }
.nav-item:hover { background: var(--bg3); }
.nav-item.active { background: var(--accent-bg, #e8f0fe); color: var(--accent); font-weight: 600; }
.nav-sub { padding-left: 36px; }
.nav-label { flex: 1; }
.nav-outline-item { padding: 5px 16px 5px 56px; cursor: pointer; font-size: 13px; color: var(--text3); display: flex; align-items: center; gap: 8px; }
.nav-outline-item.lv3 { padding-left: 68px; }
.nav-outline-item:hover { color: var(--text); }
.dot { width: 4px; height: 4px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
.gmail-footer { padding: 12px 16px; border-top: 1px solid var(--border); }
.footer-btn { width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: 8px; background: transparent; color: var(--text3); cursor: pointer; }
.footer-btn:hover { background: var(--bg3); }
.gmail-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.gmail-topbar { height: 52px; background: var(--bg2); border-bottom: 1px solid var(--border); display: flex; align-items: center; padding: 0 20px; gap: 8px; flex-shrink: 0; }
.doc-title { flex: 1; font-weight: 600; font-size: 15px; }
.topbar-right { display: flex; align-items: center; gap: 6px; }
.tb-btn { padding: 5px 10px; border: none; background: var(--bg3); color: var(--text); border-radius: 6px; cursor: pointer; font-size: 13px; display: flex; align-items: center; }
.tb-btn:hover { background: var(--bg4); }
.color-picker-round { width: 24px; height: 24px; border-radius: 50%; border: none; padding: 0; cursor: pointer; }
.gmail-content { flex: 1; overflow-y: auto; padding: 32px; }
.empty { text-align: center; padding: 100px; color: var(--text3); font-size: 16px; }
</style>
