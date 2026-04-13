<template>
  <aside :class="['sidebar', { collapsed }]" ref="sidebarRef">
    <div class="sidebar-header">
      <button class="toggle-btn" @click="$emit('toggle')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
      <div class="header-actions" v-if="!collapsed">
        <button class="icon-btn" title="新建文件夹" @click="newGroup">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
        </button>
      </div>
    </div>

    <div v-if="!collapsed" class="sidebar-middle">
      <!-- 大纲次页（桌面端） -->
      <div v-if="sideView === 'outline'" class="outline-page">
        <div class="outline-page-header" @click="sideView = 'tree'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          <input v-if="renaming === activeDoc?.id" ref="renameRef" v-model="renameVal" class="rename-input"
            @keyup.enter="confirmRename(activeDoc)" @keyup.esc="renaming=null" @blur="confirmRename(activeDoc)" @click.stop />
          <span v-else @dblclick.stop="startRename(activeDoc)">{{ activeDoc?.title }}</span>
        </div>
        <div class="outline-page-list">
          <div v-for="h in headings" :key="h.id" :class="['outline-page-item', `lv${h.level}`]" @click="$emit('jump', h.id)">{{ h.text }}</div>
          <div v-if="!headings.length" class="outline-empty">无大纲</div>
        </div>
      </div>

      <!-- 文件树 -->
      <div v-else class="tree" ref="treeRef">
        <div v-if="newGroupInput" class="inline-input-row">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          <input ref="groupInputRef" v-model="newGroupName" placeholder="文件夹名称"
            @keyup.enter="confirmNewGroup" @keyup.esc="newGroupInput=false" @blur="confirmNewGroup" />
        </div>
        <div v-for="group in sortedDocs" :key="group.id" class="group" :data-id="group.id"
          draggable="true" @dragstart="e => e.dataTransfer.setData('groupId', group.id)">
          <div :class="['group-title', { selected: selectedId === group.id }]" @click="selectItem(group.id); toggleGroup(group.id)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            <input v-if="renaming === group.id" ref="renameRef" v-model="renameVal" class="rename-input"
              @keyup.enter="confirmRename(group)" @keyup.esc="renaming=null" @blur="confirmRename(group)" @click.stop />
            <span v-else @dblclick.stop="startRename(group)">{{ group.title }}</span>
            <span v-if="group.pinned" class="pin-badge">📌</span>
            <div v-if="selectedId === group.id" class="group-actions">
              <button class="icon-btn" title="新建文档" @click.stop="newDocForGroup(group.id)">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
              <button class="del-btn" @click.stop="deleteItem(group.id)">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
              </button>
            </div>
          </div>
          <div v-if="openGroups.has(group.id)" class="group-items" :ref="el => setItemsRef(el, group.id)">
            <template v-for="doc in group.children" :key="doc.id">
              <div :class="['item', { active: active === doc.id, selected: selectedId === doc.id }]" :data-id="doc.id"
                @click="onDocClick(doc)" @dblclick.stop="onDocDblClick(doc)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <input v-if="renaming === doc.id" ref="renameRef" v-model="renameVal" class="rename-input"
                  @keyup.enter="confirmRename(doc)" @keyup.esc="renaming=null" @blur="confirmRename(doc)" @click.stop />
                <span v-else>{{ doc.title }}</span>
                <button class="del-btn item-del" @click.stop="deleteItem(doc.id)" style="margin-left:auto;flex-shrink:0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                </button>
              </div>
              <template v-if="openDocOutlines.has(doc.id) && active === doc.id">
                <div v-for="h in headings" :key="h.id" :class="['doc-outline-item', `lv${h.level}`]" @click="$emit('jump', h.id)">
                  <span class="outline-dot"></span>{{ h.text }}
                </div>
              </template>
            </template>
            <div v-if="newDocInput === group.id" class="inline-input-row sub">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <input ref="docInputRef" v-model="newDocName" placeholder="文档名称"
                @keyup.enter="confirmNewDoc(group.id)" @keyup.esc="newDocInput=null" @blur="confirmNewDoc(group.id)" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部信息 -->
    <div v-if="!collapsed" class="sidebar-footer">
      <div class="footer-row">
        <span class="footer-label">时间</span>
        <span class="footer-info">{{ time }}</span>
      </div>
      <div class="footer-row">
        <span class="footer-label">大小</span>
        <span class="footer-info">{{ dataSize }}</span>
      </div>
      <div class="footer-actions">
        <button class="footer-icon-btn" @click="$emit('import')" title="导入">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        </button>
        <button class="footer-icon-btn" @click="$emit('export')" title="导出">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </button>
        <span class="version-tag">v1.2</span>
        <button class="logout-btn" @click="$emit('logout')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          退出
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import Sortable from 'sortablejs'

const props = defineProps({ docs: Array, active: Number, collapsed: Boolean, outlineTree: { type: Array, default: () => [] }, headings: { type: Array, default: () => [] } })
const emit = defineEmits(['select', 'toggle', 'logout', 'update:docs', 'new-doc', 'jump', 'import', 'export'])

const sortedDocs = computed(() => props.docs.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)))

const openGroups = ref(new Set(props.docs.map(g => g.id)))
const openDocOutlines = ref(new Set())
const sideView = ref('tree')
const activeDoc = ref(null)
const sidebarRef = ref(null)

// 恢复 activeDoc（刷新后 docs 加载完且 active 有值时）
watch(() => [props.active, props.docs], ([id]) => {
  if (!id || !props.docs.length) return
  for (const g of props.docs) {
    const doc = g.children?.find(d => d.id === id)
    if (doc) { activeDoc.value = doc; break }
  }
}, { immediate: true })

const headings = computed(() => {
  if (!activeDoc.value) return []
  let content = activeDoc.value.content
  for (const g of props.docs) {
    const d = g.children?.find(d => d.id === activeDoc.value.id)
    if (d) { content = d.content; break }
  }
  if (!content) return []
  return [...content.matchAll(/^(#{1,3})\s+(.+)$/gm)].map(m => ({
    level: m[1].length, text: m[2].trim(),
    id: m[2].trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
  }))
})

function toggleGroup(id) {
  openGroups.value.has(id) ? openGroups.value.delete(id) : openGroups.value.add(id)
}

let clickTimer = null
function onDocClick(doc) {
  if (clickTimer) return
  clickTimer = setTimeout(() => {
    clickTimer = null
    selectItem(doc.id)
    emit('select', doc)
    sideView.value = 'outline'
    activeDoc.value = doc
  }, window.innerWidth <= 768 ? 0 : 220)
}
function onDocDblClick(doc) {
  clearTimeout(clickTimer); clickTimer = null
  startRename(doc)
}

const treeRef = ref(null)
let groupSortable = null
onMounted(() => {
  groupSortable = Sortable.create(treeRef.value, {
    animation: 150, handle: '.group-title',
    onEnd(e) {
      const list = [...sortedDocs.value]
      const [moved] = list.splice(e.oldIndex, 1)
      list.splice(e.newIndex, 0, moved)
      emit('update:docs', list)
    }
  })
})
onUnmounted(() => groupSortable?.destroy())

const itemsSortables = {}
function setItemsRef(el, groupId) {
  if (!el) return
  if (itemsSortables[groupId]) { itemsSortables[groupId].destroy(); delete itemsSortables[groupId] }
  itemsSortables[groupId] = Sortable.create(el, {
    animation: 150, filter: '.doc-outline-item', draggable: '.item',
    onEnd(e) {
      const group = props.docs.find(g => g.id === groupId)
      if (!group) return
      const children = [...group.children]
      const [moved] = children.splice(e.oldIndex, 1)
      children.splice(e.newIndex, 0, moved)
      emit('update:docs', props.docs.map(g => g.id === groupId ? { ...g, children } : g))
    }
  })
}

const selectedId = ref(null)
const renaming = ref(null)
const renameVal = ref('')
const renameRef = ref(null)

function selectItem(id) { selectedId.value = id }
function startRename(item) {
  renaming.value = item.id; renameVal.value = item.title
  nextTick(() => { const el = Array.isArray(renameRef.value) ? renameRef.value[0] : renameRef.value; el?.focus(); el?.select() })
}
function confirmRename(item) {
  const title = renameVal.value.trim(); renaming.value = null
  if (!title || title === item.title) return
  emit('update:docs', props.docs.map(g => g.id === item.id ? { ...g, title } : { ...g, children: g.children.map(d => d.id === item.id ? { ...d, title } : d) }))
}
function deleteItem(id) {
  let docs = props.docs.filter(g => g.id !== id)
  docs = docs.map(g => ({ ...g, children: g.children.filter(d => d.id !== id) }))
  emit('update:docs', docs); selectedId.value = null
}

const newGroupInput = ref(false)
const newGroupName = ref('')
const groupInputRef = ref(null)
const newDocInput = ref(null)
const newDocName = ref('')
const docInputRef = ref(null)

function newGroup() { newGroupInput.value = true; newGroupName.value = ''; nextTick(() => groupInputRef.value?.focus()) }
function confirmNewGroup() {
  if (!newGroupInput.value) return
  const title = newGroupName.value.trim(); newGroupInput.value = false
  if (!title) return
  const id = Date.now()
  emit('update:docs', [...props.docs, { id, title, pinned: false, private: false, children: [] }])
  openGroups.value.add(id)
}
function newDocForGroup(gid) { newDocInput.value = gid; newDocName.value = ''; openGroups.value.add(gid); nextTick(() => docInputRef.value?.focus()) }
function confirmNewDoc(gid) {
  if (newDocInput.value !== gid) return
  const title = newDocName.value.trim(); newDocInput.value = null
  if (!title) return
  const id = Date.now()
  emit('update:docs', props.docs.map(g => g.id === gid ? { ...g, children: [...g.children, { id, title, content: '' }] } : g))
  emit('new-doc', { id, title, content: '' })
}

const time = ref('')
let timer = null
function updateTime() { time.value = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }
onMounted(() => { updateTime(); timer = setInterval(updateTime, 1000) })
onUnmounted(() => clearInterval(timer))

const dataSize = computed(() => {
  const bytes = new Blob([JSON.stringify(props.docs)]).size
  return bytes < 1024 ? bytes + ' B' : (bytes / 1024).toFixed(1) + ' KB'
})
</script>
