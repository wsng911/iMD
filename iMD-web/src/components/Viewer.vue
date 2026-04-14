<template>
  <div class="viewer">
    <div class="viewer-toolbar">
      <span class="doc-name">{{ title }}</span>
      <button @click="$emit('edit')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        编辑
      </button>
    </div>
    <div class="viewer-body">
      <div class="viewer-scroll">
        <div class="md-wrap" ref="mdWrap" @click="handleClick" @dblclick="handleDblClick">
          <MdPreview :modelValue="content" :theme="settings.theme" :showCodeRowNumber="true" />
        </div>
      </div>
      <template v-if="headings.length">
        <!-- fab 固定在右侧 -->
        <button class="outline-fab" :class="{ open: drawerOpen }" @click="drawerOpen = !drawerOpen">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="12" y2="18"/></svg>
        </button>
        <!-- 抽屉从右侧向左弹出 -->
        <div class="outline-drawer" :class="{ open: drawerOpen }">
          <div class="outline-drawer-title">大纲</div>
          <div v-for="h in headings" :key="h.id" :class="['outline-drawer-item', `lv${h.level}`]" @click="jumpTo(h); drawerOpen = false">{{ h.text }}</div>
        </div>
        <div class="outline-drawer-mask" v-if="drawerOpen" @click="drawerOpen = false" />
      </template>
    </div>
  </div>
</template>

<script setup>
import { MdPreview } from 'md-editor-v3'
import 'md-editor-v3/lib/preview.css'
import { settings } from '../useSettings.js'
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps({ content: String, title: String })
defineEmits(['edit'])

const mdWrap = ref(null)
const drawerOpen = ref(false)

const headings = computed(() => {
  if (!props.content) return []
  return [...props.content.matchAll(/^(#{1,3})\s+(.+)$/gm)].map(m => ({
    level: m[1].length, text: m[2].trim(),
    id: m[2].trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
  }))
})

function jumpTo(h) {
  const el = [...(mdWrap.value?.querySelectorAll('h1,h2,h3') || [])].find(e => e.textContent.trim() === h.text)
  if (!el) return
  mdWrap.value.querySelectorAll('details').forEach(d => { d.open = false })
  let next = el.nextElementSibling
  while (next) { if (next.tagName === 'DETAILS') next.open = true; if (/^H[1-3]$/.test(next.tagName)) break; next = next.nextElementSibling }
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// 渲染后默认折叠所有代码块
watch(() => props.content, () => {
  nextTick(() => setTimeout(() => {
    mdWrap.value?.querySelectorAll('details').forEach(d => { d.open = false })
  }, 100))
}, { immediate: true })

function getEl(e) {
  const inlineCode = e.target.closest(':not(pre) > code')
  if (inlineCode) return inlineCode

  const pre = e.target.closest('pre')
  if (pre) {
    const code = pre.querySelector('code') || pre
    const lines = code.innerText.split('\n')
    if (lines.length <= 1) return code

    // 用 caret API 找点击位置在整个 code 文本中的字符偏移
    let charOffset = null
    if (document.caretRangeFromPoint) {
      const range = document.caretRangeFromPoint(e.clientX, e.clientY)
      if (range) {
        const walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT)
        let offset = 0
        while (walker.nextNode()) {
          if (walker.currentNode === range.startContainer) { charOffset = offset + range.startOffset; break }
          offset += walker.currentNode.textContent.length
        }
      }
    } else if (document.caretPositionFromPoint) {
      const pos = document.caretPositionFromPoint(e.clientX, e.clientY)
      if (pos) {
        const walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT)
        let offset = 0
        while (walker.nextNode()) {
          if (walker.currentNode === pos.offsetNode) { charOffset = offset + pos.offset; break }
          offset += walker.currentNode.textContent.length
        }
      }
    }

    if (charOffset !== null) {
      // 用 innerText（保留换行）定位行号
      const lineIndex = code.innerText.slice(0, charOffset).split('\n').length - 1
      const line = lines[Math.max(0, Math.min(lineIndex, lines.length - 1))]
      if (line.trim()) return { innerText: line, textContent: line }
    }

    return code
  }

  return e.target.closest('p, li, td, th')
}

function copyText(el) {
  const text = (el.innerText || el.textContent).trim()
  const showTip = () => {
    const tip = document.createElement('span')
    tip.textContent = '已复制'
    tip.className = 'copy-tip'
    document.body.appendChild(tip)
    setTimeout(() => tip.remove(), 1500)
  }
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(showTip).catch(() => fallbackCopy(text, showTip))
  } else {
    fallbackCopy(text, showTip)
  }
}

function fallbackCopy(text, cb) {
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.cssText = 'position:fixed;opacity:0'
  document.body.appendChild(ta)
  ta.focus(); ta.select()
  try { document.execCommand('copy'); cb?.() } catch {}
  document.body.removeChild(ta)
}

function handleClick(e) {
  const a = e.target.closest('a')
  if (a && (a.href.startsWith('mailto:') || a.dataset.autolink)) {
    e.preventDefault()
    copyText({ innerText: a.textContent.trim() })
    return
  }
  const el = getEl(e)
  if (el) { e.preventDefault(); copyText(el) }
}

function handleDblClick(e) {
  const pre = e.target.closest('pre')
  if (pre) {
    const code = pre.querySelector('code') || pre
    copyText(code)
  }
}
</script>
