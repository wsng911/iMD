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
    <main class="main" :class="{ 'mobile-page-hidden': mobilePage !== 'main' }">
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
const mobilePage = ref('sidebar')
const sidebarRef = ref(null)

// ─── 手机端导航（两页）────────────────────────────────────
function navTo(page) {
  history.pushState({ page }, '')
  mobilePage.value = page
  localStorage.setItem('imk_mobile_page', page)
}

function onPopState(e) {
  const page = e.state?.page
  if (page === 'sidebar' || page === 'main') {
    mobilePage.value = page
    localStorage.setItem('imk_mobile_page', page)
  } else {
    history.pushState({ page: mobilePage.value }, '')
  }
}

// ─── 生命周期 ─────────────────────────────────────────────
onMounted(async () => {
  history.replaceState({ page: 'sidebar' }, '')
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
  if (window.innerWidth <= 768 && current.value) {
    const saved = localStorage.getItem('imk_mobile_page')
    if (saved === 'main') mobilePage.value = 'main'
  }
})
onUnmounted(() => window.removeEventListener('popstate', onPopState))

// ─── 文档交互 ─────────────────────────────────────────────
function onSelect(doc) {
  current.value = doc
  mode.value = 'view'
  localStorage.setItem('imk_last_doc', doc.id)
  if (window.innerWidth <= 768) navTo('main')
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

function scrollTo(id) {
  const heading = headings.value.find(h => h.id === id)
  if (!heading) return
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
function logout() { localStorage.removeItem('imk_token'); router.push('/login') }
async function importMd() {
  const input = document.createElement('input')
  input.type = 'file'; input.accept = '.md,.zip'
  input.onchange = async e => {
    const file = e.target.files[0]; if (!file) return
    const res = await api.importFile(file)
    if (res?.docs) docs.value = res.docs
  }
  input.click()
}
async function exportMd() {
  const zip = new JSZip()
  docs.value.forEach(g => { const f = zip.folder(g.title); g.children?.forEach(d => f.file(`${d.title}.md`, d.content || '')) })
  const blob = await zip.generateAsync({ type: 'blob' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `iMD-导出-${new Date().toISOString().slice(0, 10)}.zip`
  a.click(); URL.revokeObjectURL(a.href)
}
</script>
