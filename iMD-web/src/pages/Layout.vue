<template>
  <div class="layout">
    <!-- 第1页：文件树 -->
    <Sidebar
      :docs="docs" :active="current?.id" :collapsed="sidebarCollapsed" :outlineTree="outlineTree" :headings="headings"
      :class="{ 'mobile-page-hidden': mobilePage !== 'sidebar' }"
      @select="onMobileSelect" @toggle="sidebarCollapsed = !sidebarCollapsed"
      @update:docs="d => { docs = d; api.saveDocs(d).catch(()=>{}) }" @logout="logout"
      @new-doc="doc => { current = doc; mode = 'edit' }"
      @jump="scrollTo" @import="importMd" @export="exportMd"
    />

    <!-- 第2页：大纲（仅手机端） -->
    <div class="mobile-outline-page" :class="{ 'mobile-page-hidden': mobilePage !== 'outline' }">
      <div class="topbar">
        <button class="mobile-back-btn tb-btn" @click="goBack" style="flex-shrink:0;margin-right:4px">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span class="doc-title">{{ current?.title || '' }}</span>
      </div>
      <div class="mobile-outline-list">
        <div v-if="!headings.length" class="outline-empty" style="padding:24px;color:var(--text3)">无大纲，直接阅读</div>
        <div v-for="h in headings" :key="h.id"
          :class="['mobile-outline-item', `lv${h.level}`]"
          @click="onOutlineClick(h)">
          {{ h.text }}
        </div>
        <div class="mobile-outline-read" @click="goMain">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          直接阅读全文
        </div>
      </div>
    </div>

    <!-- 第3页：内容 -->
    <main class="main" :class="{ 'mobile-page-hidden': mobilePage !== 'main' }">
      <div class="topbar">
        <button class="mobile-back-btn tb-btn" @click="goBack" style="flex-shrink:0;margin-right:4px">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span class="doc-title">{{ current?.title || '' }}</span>
        <div class="topbar-right">
          <button class="tb-btn font-btn" @click="settings.fontSize = Math.max(12, settings.fontSize - 1); persistSettings()">A-</button>
          <button class="tb-btn font-btn" @click="settings.fontSize = 15; persistSettings()">A</button>
          <button class="tb-btn font-btn" @click="settings.fontSize = Math.min(22, settings.fontSize + 1); persistSettings()">A+</button>
          <input type="color" :value="customColor" @input="setCustomColor" title="配色" class="color-picker-round" />
          <input ref="importRef" type="file" accept=".md,.zip" style="display:none" @change="onImportFile" />
          <button class="tb-btn" @click="toggleTheme">
            <svg v-if="settings.theme === 'dark'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          </button>
          <button class="tb-btn" @click="showPwd = !showPwd">
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
const importRef = ref(null)
const docs = ref([])
const current = ref(null)
const mode = ref('view')
const sidebarCollapsed = ref(false)
const showPwd = ref(false)
const pwd = ref({ old: '', new1: '', new2: '' })
const pwdMsg = ref(null)
const mobilePage = ref('sidebar') // sidebar | outline | main

function pushPage(page) {
  history.pushState({ page }, '')
  mobilePage.value = page
  localStorage.setItem('imk_mobile_page', page)
}
function goBack() {
  if (mobilePage.value === 'main') { pushPage('outline'); return }
  if (mobilePage.value === 'outline') { pushPage('sidebar'); return }
}
function goMain() { pushPage('main') }

function onPopState() {
  if (window.innerWidth > 768) return
  const page = history.state?.page || 'sidebar'
  mobilePage.value = page
  localStorage.setItem('imk_mobile_page', page)
}

onMounted(async () => {
  window.addEventListener('popstate', onPopState)
  loadSettings()
  docs.value = await api.getDocs()
  const lastId = parseInt(localStorage.getItem('imk_last_doc'))
  if (lastId) {
    for (const g of docs.value) {
      const doc = g.children?.find(d => d.id === lastId)
      if (doc) { current.value = doc; break }
    }
  }
  // 刷新后恢复手机端页面状态
  if (window.innerWidth <= 768) {
    const savedPage = localStorage.getItem('imk_mobile_page')
    if (savedPage && current.value) mobilePage.value = savedPage
  }
})
onUnmounted(() => window.removeEventListener('popstate', onPopState))

// 手机端点文档 → 进大纲页；桌面端直接进内容
function onMobileSelect(doc) {
  current.value = doc
  mode.value = 'view'
  localStorage.setItem('imk_last_doc', doc.id)
  // 手机端才走多页逻辑（CSS 媒体查询 768px）
  if (window.innerWidth <= 768) pushPage('outline')
}

function onOutlineClick(h) {
  pushPage('main')
  // 等内容页渲染后跳转
  setTimeout(() => scrollTo(h.id), 100)
}

const headings = computed(() => {
  if (!current.value?.content) return []
  return [...current.value.content.matchAll(/^(#{1,3})\s+(.+)$/gm)].map(m => ({
    level: m[1].length, text: m[2].trim(),
    id: m[2].trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
  }))
})

const outlineTree = computed(() => {
  const root = [], stack = []
  headings.value.forEach(h => {
    const node = { ...h, children: [] }
    while (stack.length && stack[stack.length-1].level >= h.level) stack.pop()
    if (stack.length) stack[stack.length-1].children.push(node)
    else root.push(node)
    stack.push(node)
  })
  return root
})

function scrollTo(id) {
  const heading = headings.value.find(h => h.id === id)
  if (!heading) return
  if (mode.value === 'edit') {
    const el = document.querySelector('.md-editor .cm-scroller, .md-editor textarea')
    if (!el) return
    const idx = (current.value?.content||'').split('\n').findIndex(l => l.replace(/^#+\s*/,'').trim() === heading.text)
    if (idx >= 0) el.scrollTop = idx * 20
    return
  }
  const el = [...document.querySelectorAll('.md-wrap h1,.md-wrap h2,.md-wrap h3')].find(h => h.textContent.trim() === heading.text)
  if (!el) return
  document.querySelectorAll('.md-wrap details').forEach(d => { d.open = false })
  let next = el.nextElementSibling
  while (next) { if (next.tagName==='DETAILS') next.open=true; if (/^H[1-3]$/.test(next.tagName)) break; next=next.nextElementSibling }
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function onSave(content) {
  current.value.content = content; mode.value = 'view'
  await api.updateDoc(current.value.id, { content }).catch(()=>{})
}
function logout() { localStorage.removeItem('imk_token'); router.push('/login') }
async function importMd() { importRef.value?.click() }
async function onImportFile(e) {
  const file = e.target.files[0]; if (!file) return
  const res = await api.importFile(file)
  if (res?.docs) docs.value = res.docs
  e.target.value = ''
}
async function exportMd() {
  const zip = new JSZip()
  docs.value.forEach(g => { const f=zip.folder(g.title); g.children?.forEach(d=>f.file(`${d.title}.md`,d.content||'')) })
  const blob = await zip.generateAsync({ type: 'blob' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `iMD-导出-${new Date().toISOString().slice(0,10)}.zip`
  a.click(); URL.revokeObjectURL(a.href)
}
function toggleTheme() { settings.theme = settings.theme==='dark'?'light':'dark'; persistSettings() }
function setCustomColor(e) { document.documentElement.style.setProperty('--accent',e.target.value); settings.accent=e.target.value; persistSettings() }
const customColor = computed(() => ({ purple:'#cba6f7',teal:'#94e2d5',blue:'#89b4fa',rose:'#f38ba8' })[settings.accent] || settings.accent)
async function changePwd() {
  if (pwd.value.new1!==pwd.value.new2) { pwdMsg.value={ok:false,text:'两次密码不一致'}; return }
  try { await api.changePassword({oldPassword:pwd.value.old,newPassword:pwd.value.new1}); pwdMsg.value={ok:true,text:'修改成功'}; pwd.value={old:'',new1:'',new2:''} }
  catch(e) { pwdMsg.value={ok:false,text:e?.error||'修改失败'} }
}
</script>
