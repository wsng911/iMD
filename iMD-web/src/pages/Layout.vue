<template>
  <div class="layout">
    <Sidebar ref="sidebarRef"
      :docs="docs" :active="current?.id" :collapsed="sidebarCollapsed" :outlineTree="outlineTree" :headings="headings"
      :class="{ 'mobile-page-hidden': mobilePage !== 'sidebar' }"
      @select="onSelect" @toggle="sidebarCollapsed = !sidebarCollapsed"
      @update:docs="d => { docs = d; api.saveDocs(d).catch(()=>{}) }" @logout="logout"
      @new-doc="doc => { current = doc; mode = 'edit' }"
      @jump="scrollTo" @import="importMd" @export="exportMd"
    />

    <!-- 第2页：大纲（仅手机端） -->
    <div class="mobile-outline-page" :class="{ 'mobile-page-hidden': mobilePage !== 'outline' }">
      <div class="mobile-topbar" @click="history.back()">
        <div class="mobile-topbar-back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </div>
        <span class="mobile-topbar-title">{{ current?.title || '' }}</span>
      </div>
      <div class="mobile-outline-list">
        <div v-if="!headings.length" class="outline-empty" style="padding:24px;color:var(--text3)">无大纲，直接阅读</div>
        <div v-for="h in headings" :key="h.id" :class="['mobile-outline-item', `lv${h.level}`]" @click="onOutlineClick(h)">{{ h.text }}</div>
        <div class="mobile-outline-read" @click="navTo('main')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          直接阅读全文
        </div>
      </div>
    </div>

    <!-- 第3页：内容 -->
    <main class="main" :class="{ 'mobile-page-hidden': mobilePage !== 'main' }">
      <div class="mobile-topbar" @click="history.back()">
        <div class="mobile-topbar-back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </div>
        <span class="mobile-topbar-title">{{ current?.title || '' }}</span>
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
import { loadSettings } from '../useSettings.js'
import { api } from '../api.js'

const router = useRouter()
const docs = ref([])
const current = ref(null)
const mode = ref('view')
const sidebarCollapsed = ref(false)
const mobilePage = ref('sidebar') // sidebar | outline | main
const sidebarRef = ref(null)

// ─── 手机端导航 ───────────────────────────────────────────
// 每次页面切换都 push 一条 history，系统返回键通过 popstate 恢复页面

function navTo(page) {
  history.pushState({ page }, '')
  mobilePage.value = page
  localStorage.setItem('imk_mobile_page', page)
}

function onPopState(e) {
  // 桌面端：交给 sideView 处理
  if (window.innerWidth > 768) {
    sidebarRef.value?.handleBack()
    return
  }
  const page = e.state?.page
  if (page === 'sidebar' || page === 'outline' || page === 'main') {
    // 正常后退到已知页面
    mobilePage.value = page
    localStorage.setItem('imk_mobile_page', page)
  } else {
    // 退到了应用外（无 page state），补回 sidebar 防止退出
    history.pushState({ page: 'sidebar' }, '')
    mobilePage.value = 'sidebar'
    localStorage.setItem('imk_mobile_page', 'sidebar')
  }
}

// ─── 生命周期 ─────────────────────────────────────────────

onMounted(async () => {
  // 用 replaceState 标记当前记录为 sidebar，不增加 history 条目
  history.replaceState({ page: 'sidebar' }, '')
  window.addEventListener('popstate', onPopState)

  loadSettings()
  docs.value = await api.getDocs()

  // 恢复上次打开的文档
  const lastId = parseInt(localStorage.getItem('imk_last_doc'))
  if (lastId) {
    for (const g of docs.value) {
      const doc = g.children?.find(d => d.id === lastId)
      if (doc) { current.value = doc; break }
    }
  }

  // 手机端恢复上次所在页面
  if (window.innerWidth <= 768 && current.value) {
    const saved = localStorage.getItem('imk_mobile_page')
    if (saved && ['sidebar', 'outline', 'main'].includes(saved)) {
      mobilePage.value = saved
    }
  }
})

onUnmounted(() => window.removeEventListener('popstate', onPopState))

// ─── 文档选择 ─────────────────────────────────────────────

function onSelect(doc) {
  current.value = doc
  mode.value = 'view'
  localStorage.setItem('imk_last_doc', doc.id)
  // 手机端：进入第2页大纲
  if (window.innerWidth <= 768) navTo('outline')
}

function onOutlineClick(h) {
  navTo('main')
  setTimeout(() => scrollTo(h.id), 100)
}

// ─── 计算属性 ─────────────────────────────────────────────

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

// ─── 工具函数 ─────────────────────────────────────────────

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
  current.value.content = content
  mode.value = 'view'
  await api.updateDoc(current.value.id, { content }).catch(() => {})
}

function logout() {
  localStorage.removeItem('imk_token')
  router.push('/login')
}

async function importMd() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.md,.zip'
  input.onchange = async e => {
    const file = e.target.files[0]
    if (!file) return
    const res = await api.importFile(file)
    if (res?.docs) docs.value = res.docs
  }
  input.click()
}

async function exportMd() {
  const zip = new JSZip()
  docs.value.forEach(g => {
    const f = zip.folder(g.title)
    g.children?.forEach(d => f.file(`${d.title}.md`, d.content || ''))
  })
  const blob = await zip.generateAsync({ type: 'blob' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `iMD-导出-${new Date().toISOString().slice(0, 10)}.zip`
  a.click()
  URL.revokeObjectURL(a.href)
}
</script>
