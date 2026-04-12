<template>
  <div class="layout">
    <!-- 左栏：移动端第一页 / 桌面端左侧 -->
    <Sidebar
      :docs="docs" :active="current?.id" :collapsed="sidebarCollapsed" :outlineTree="outlineTree" :headings="headings"
      :class="{ 'mobile-hidden': isMobile && mobilePage === 'main' }"
      @select="selectDoc" @toggle="sidebarCollapsed = !sidebarCollapsed"
      @update:docs="d => { docs = d; api.saveDocs(d).catch(()=>{}) }" @logout="logout"
      @new-doc="doc => { current = doc; mode = 'edit' }"
      @jump="scrollTo"
      @import="importMd"
      @export="exportMd"
    />

    <!-- 右栏：移动端第二页 / 桌面端右侧 -->
    <main class="main" :class="{ 'mobile-hidden': isMobile && mobilePage === 'sidebar' }">
      <div class="topbar">
        <!-- 移动端返回按钮 -->
        <button v-if="isMobile" class="tb-btn" @click="mobilePage = 'sidebar'" style="flex-shrink:0;margin-right:4px">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span class="doc-title">{{ current?.title || '' }}</span>
        <div class="topbar-right">
          <button class="tb-btn font-btn" @click="settings.fontSize = Math.max(12, settings.fontSize - 1); persistSettings()">A-</button>
          <button class="tb-btn font-btn" @click="settings.fontSize = 15; persistSettings()">A</button>
          <button class="tb-btn font-btn" @click="settings.fontSize = Math.min(22, settings.fontSize + 1); persistSettings()">A+</button>
          <input type="color" :value="customColor" @input="setCustomColor" title="配色" class="color-picker-round" />
          <input ref="importRef" type="file" accept=".md,.zip" style="display:none" @change="onImportFile" />
          <button class="tb-btn" @click="toggleTheme" :title="settings.theme === 'dark' ? '切换亮色' : '切换暗色'">
            <svg v-if="settings.theme === 'dark'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          </button>
          <button class="tb-btn" @click="showPwd = !showPwd" title="修改密码">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </button>
        </div>
      </div>

      <div v-if="showPwd" class="pwd-bar">
        <div class="pwd-fields">
          <input v-model="pwd.old" type="password" placeholder="当前密码" />
          <input v-model="pwd.new1" type="password" placeholder="新密码" />
          <input v-model="pwd.new2" type="password" placeholder="确认新密码" />
          <button @click="changePwd">确认</button>
          <span v-if="pwdMsg" :class="['pwd-msg', pwdMsg.ok ? 'ok' : 'err']">{{ pwdMsg.text }}</span>
        </div>
      </div>

      <template v-if="current">
        <Viewer v-if="mode === 'view'" :content="current.content" :title="current.title" @edit="mode = 'edit'" />
        <Editor v-else :content="current.content" @save="onSave" @cancel="mode = 'view'" @update:content="v => current.content = v" />
      </template>
      <div v-else class="empty">← 选择文档</div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import JSZip from 'jszip'
import { useRouter } from 'vue-router'
import Sidebar from '../components/Sidebar.vue'
import Viewer from '../components/Viewer.vue'
import Editor from '../components/Editor.vue'
import { settings, loadSettings, persistSettings } from '../useSettings.js'
import { api } from '../api.js'

const router = useRouter()

onMounted(async () => {
  loadSettings()
  docs.value = await api.getDocs()
  const lastId = parseInt(localStorage.getItem('imk_last_doc'))
  if (lastId) {
    for (const g of docs.value) {
      const doc = g.children?.find(d => d.id === lastId)
      if (doc) { current.value = doc; break }
    }
  }
})

const importRef = ref(null)
const docs = ref([])
const current = ref(null)
const mode = ref('view')
const isMobile = ref(window.innerWidth <= 768)
const mobilePage = ref('sidebar') // 'sidebar' | 'main'
const onResize = () => { isMobile.value = window.innerWidth <= 768 }
window.addEventListener('resize', onResize)
onUnmounted(() => window.removeEventListener('resize', onResize))
const sidebarCollapsed = ref(false)
const showPwd = ref(false)
const pwd = ref({ old: '', new1: '', new2: '' })
const pwdMsg = ref(null)

function selectDoc(doc) {
  current.value = doc
  mode.value = 'view'
  localStorage.setItem('imk_last_doc', doc.id)
  if (isMobile.value) mobilePage.value = 'main'
}

const headings = computed(() => {
  if (!current.value?.content) return []
  return [...current.value.content.matchAll(/^(#{1,3})\s+(.+)$/gm)].map(m => ({
    level: m[1].length,
    text: m[2].trim(),
    id: m[2].trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
  }))
})

const outlineTree = computed(() => {
  const list = headings.value
  const root = []
  const stack = []
  list.forEach(h => {
    const node = { ...h, children: [] }
    while (stack.length && stack[stack.length - 1].level >= h.level) stack.pop()
    if (stack.length) stack[stack.length - 1].children.push(node)
    else root.push(node)
    stack.push(node)
  })
  return root
})

function scrollTo(id) {
  const heading = headings.value.find(h => h.id === id)
  if (!heading) return
  if (mode.value === 'edit') {
    const editorEl = document.querySelector('.md-editor .cm-scroller, .md-editor textarea')
    if (!editorEl) return
    const lines = (current.value?.content || '').split('\n')
    const lineIdx = lines.findIndex(l => l.replace(/^#+\s*/, '').trim() === heading.text)
    if (lineIdx >= 0) editorEl.scrollTop = lineIdx * 20
    return
  }
  const el = [...document.querySelectorAll('.md-wrap h1,.md-wrap h2,.md-wrap h3')].find(h => h.textContent.trim() === heading.text)
  if (!el) return
  document.querySelectorAll('.md-wrap details').forEach(d => { d.open = false })
  let next = el.nextElementSibling
  while (next) {
    if (next.tagName === 'DETAILS') next.open = true
    if (/^H[1-3]$/.test(next.tagName)) break
    next = next.nextElementSibling
  }
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function onSave(content) {
  current.value.content = content
  mode.value = 'view'
  await api.updateDoc(current.value.id, { content }).catch(() => {})
}

function logout() { localStorage.removeItem('imk_token'); router.push('/login') }

async function importMd() { importRef.value?.click() }

async function onImportFile(e) {
  const file = e.target.files[0]
  if (!file) return
  const res = await api.importFile(file)
  if (res?.docs) docs.value = res.docs
  e.target.value = ''
}

async function exportMd() {
  const zip = new JSZip()
  docs.value.forEach(group => {
    const folder = zip.folder(group.title)
    group.children?.forEach(doc => { folder.file(`${doc.title}.md`, doc.content || '') })
  })
  const blob = await zip.generateAsync({ type: 'blob' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `iMD-导出-${new Date().toISOString().slice(0,10)}.zip`
  a.click()
  URL.revokeObjectURL(a.href)
}

function toggleTheme() { settings.theme = settings.theme === 'dark' ? 'light' : 'dark'; persistSettings() }

function setCustomColor(e) {
  document.documentElement.style.setProperty('--accent', e.target.value)
  settings.accent = e.target.value
  persistSettings()
}

const customColor = computed(() => {
  const presets = { purple: '#cba6f7', teal: '#94e2d5', blue: '#89b4fa', rose: '#f38ba8' }
  return presets[settings.accent] || settings.accent
})

async function changePwd() {
  if (pwd.value.new1 !== pwd.value.new2) { pwdMsg.value = { ok: false, text: '两次密码不一致' }; return }
  try {
    await api.changePassword({ oldPassword: pwd.value.old, newPassword: pwd.value.new1 })
    pwdMsg.value = { ok: true, text: '修改成功' }
    pwd.value = { old: '', new1: '', new2: '' }
  } catch (e) {
    pwdMsg.value = { ok: false, text: e?.error || '修改失败' }
  }
}
</script>
